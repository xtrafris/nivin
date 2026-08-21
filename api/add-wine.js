// Vercel serverless function. Runs op de server, nooit in de browser.
// Combineert drie stappen voor het toevoegen van een wijn via foto:
//
// 1. De foto wordt geanalyseerd om de fles van de achtergrond te scheiden
//    (sharp + eigen segmentatie, geen AI).
// 2. OpenAI (OPENAI_API_KEY) krijgt de ORIGINELE foto plus een "masker" mee:
//    dat masker zegt letterlijk "raak de fles en het etiket niet aan, maak
//    alleen de achtergrond mooi en professioneel". Zo krijg je consistente,
//    professionele belichting/achtergrond bij elke wijn, terwijl het etiket
//    zoveel mogelijk intact blijft — al is dit masker bij dit AI-model een
//    sterke aanwijzing, geen 100% harde garantie (zie ons gesprek hierover).
//    Lukt deze stap niet (geen sleutel, API-fout, etc.), dan valt de app terug
//    op optie 1: pure achtergrond-verwijdering zonder AI, met gegarandeerd
//    ongewijzigd etiket.
// 3. Claude (ANTHROPIC_API_KEY) leest het etiket op de foto en zoekt via
//    web-search de wijn op: naam, producent, jaargang, streek, druiven,
//    scores, prijs en proefnotities.
//
// Beide sleutels worden hier server-side gebruikt en nooit naar de browser
// gestuurd. Zet ze in je Vercel-projectinstellingen (Environment Variables).

import sharp from "sharp";

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // ruimte voor een foto in base64
  },
  maxDuration: 60, // standaard is 10s op Vercel's gratis plan — te kort voor deze aanroepen
};

const RATING_SOURCES_HINT =
  "Vivino, CellarTracker, Wine Advocate, Wine Spectator, Decanter, Vinous, James Suckling, Hamersma";

// Bepaalt per pixel of hij "achtergrond" is: ofwel dicht bij de daadwerkelijke
// hoekkleur van de foto, ofwel zowel LICHT als NEUTRAAL GRIJS (weinig
// kleurverzadiging) — dat vangt een egale achtergrond én een zachte schaduw,
// terwijl de veel donkerdere en/of kleurrijkere fles en het etiket met rust
// blijven. Vloed-vult daarna vanaf de randen, zodat een wit etiket (omsloten
// door de fles) nooit meegepakt wordt, ook al is het zelf licht van kleur.
async function segmentBackground(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const total = width * height;

  const sampleCorner = (x, y) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [sampleCorner(2, 2), sampleCorner(width - 3, 2), sampleCorner(2, height - 3), sampleCorner(width - 3, height - 3)];
  const refColor = [0, 1, 2].map(c => corners.reduce((s, p) => s + p[c], 0) / corners.length);

  const bgLike = new Uint8Array(total);
  const refDistThreshold = 40;
  const minBrightness = 120;
  const maxChroma = 34;
  for (let p = 0, i = 0; p < total; p++, i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const refDist = Math.sqrt((r - refColor[0]) ** 2 + (g - refColor[1]) ** 2 + (b - refColor[2]) ** 2);
    const brightness = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    bgLike[p] = (refDist < refDistThreshold || (brightness > minBrightness && chroma < maxChroma)) ? 1 : 0;
  }

  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qLen = 0;
  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p] || !bgLike[p]) return;
    visited[p] = 1;
    queue[qLen++] = p;
  };
  for (let x = 0; x < width; x++) { tryPush(x, 0); tryPush(x, height - 1); }
  for (let y = 0; y < height; y++) { tryPush(0, y); tryPush(width - 1, y); }
  let head = 0;
  while (head < qLen) {
    const p = queue[head++];
    const x = p % width, y = (p - x) / width;
    tryPush(x + 1, y); tryPush(x - 1, y); tryPush(x, y + 1); tryPush(x, y - 1);
  }

  return { data, width, height, channels, visited };
}

// Maakt de achtergrond van de foto transparant, met behoud van élke pixel van
// de fles en het etiket zelf. Geen AI, dus 100% garantie dat het etiket klopt.
async function extractBottlePhoto(buffer) {
  const { data, width, height, channels, visited } = await segmentBackground(buffer);
  const total = width * height;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let p = 0, i = 0; p < total; p++, i += channels) {
    if (visited[p]) {
      data[i + 3] = 0; // doorzichtig
    } else {
      const x = p % width, y = (p - x) / width;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }

  const result = sharp(data, { raw: { width, height, channels } });
  if (maxX > minX && maxY > minY) {
    const pad = 6;
    const left = Math.max(0, minX - pad);
    const top = Math.max(0, minY - pad);
    const w = Math.min(width, maxX + pad) - left;
    const h = Math.min(height, maxY + pad) - top;
    return result.extract({ left, top, width: w, height: h }).png().toBuffer();
  }
  return result.png().toBuffer();
}

// Bouwt een masker-PNG voor OpenAI: doorzichtig (alfa 0) = "hier mag je de
// achtergrond opnieuw genereren", ondoorzichtig (alfa 255) = "dit — de fles
// en het etiket — met rust laten". Er zit een kleine bufferzone (paar pixels)
// rondom de fles die óók bewerkbaar is, zodat de AI een vloeiende overgang
// kan maken in plaats van tegen een haarscherpe rand aan te lopen.
async function buildEditMask(buffer, bufferPx = 10) {
  const { width, height, visited } = await segmentBackground(buffer);
  const total = width * height;

  const dist = new Int16Array(total).fill(-1);
  const queue = new Int32Array(total);
  let qLen = 0;
  for (let p = 0; p < total; p++) {
    if (visited[p]) { dist[p] = 0; queue[qLen++] = p; }
  }
  const editable = Uint8Array.from(visited);
  let head = 0;
  while (head < qLen) {
    const p = queue[head++];
    if (dist[p] >= bufferPx) continue;
    const x = p % width, y = (p - x) / width;
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = ny * width + nx;
      if (dist[np] === -1) {
        dist[np] = dist[p] + 1;
        editable[np] = 1;
        queue[qLen++] = np;
      }
    }
  }

  // Rechtstreeks een RGBA-buffer opbouwen (kleur is irrelevant, alleen alfa
  // telt voor OpenAI) — geen colourspace-omzettingen die weer mis kunnen gaan.
  const maskRgba = Buffer.alloc(total * 4, 255); // wit, alfa nog te zetten
  for (let p = 0; p < total; p++) {
    maskRgba[p * 4 + 3] = editable[p] ? 0 : 255;
  }
  return sharp(maskRgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function generateStyledPackshot(photoBase64, mimeType, openaiKey) {
  const buffer = Buffer.from(photoBase64, "base64");
  const mask = await buildEditMask(buffer);

  const ext = (mimeType || "image/jpeg").includes("png") ? "png" : "jpg";
  const imageBlob = new Blob([buffer], { type: mimeType || "image/jpeg" });
  const maskBlob = new Blob([mask], { type: "image/png" });

  const prompt =
    "Vervang alleen de achtergrond door een professionele, vlekkeloze witte studio-achtergrond " +
    "en -ondergrond, met zachte diffuse belichting en een subtiele contactschaduw, zoals bij " +
    "high-end e-commerce productfotografie. Laat de fles en het etiket exact zoals ze zijn.";

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image", imageBlob, `bottle.${ext}`);
  form.append("mask", maskBlob, "mask.png");
  form.append("prompt", prompt);
  form.append("quality", "high");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  const data = await res.json();
  if (data.error) throw new Error(`OpenAI-fout: ${data.error.message || JSON.stringify(data.error)}`);

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI gaf geen afbeelding terug.");

  // De AI-achtergrond nu ook weer transparant maken, voor naadloze weergave op de kaart.
  const styledBuffer = Buffer.from(b64, "base64");
  return extractBottlePhoto(styledBuffer);
}

async function generatePackshot(photoBase64, mimeType, openaiKey) {
  if (openaiKey) {
    try {
      const finalBuffer = await generateStyledPackshot(photoBase64, mimeType, openaiKey);
      return { base64: finalBuffer.toString("base64"), mimeType: "image/png" };
    } catch {
      // AI-herstyling mislukt? Val terug op de veilige, garandeerd-correcte weg hieronder.
    }
  }
  const buffer = Buffer.from(photoBase64, "base64");
  try {
    const finalBuffer = await extractBottlePhoto(buffer);
    return { base64: finalBuffer.toString("base64"), mimeType: "image/png" };
  } catch {
    return { base64: photoBase64, mimeType: mimeType || "image/jpeg" };
  }
}

async function identifyAndEnrichWine(photoBase64, mimeType, anthropicKey) {
  const currentYear = new Date().getFullYear();
  const prompt = `Je bent een wijnexpert met toegang tot actuele webzoekresultaten. Op de bijgevoegde foto staat een wijnetiket. Het huidige jaar is ${currentYear}.

Stap 1: Lees het etiket nauwkeurig en identificeer de wijn: naam, producent/wijnhuis, jaargang, land, streek, druivenras(sen), type (red/white/rose/sparkling/orange).
Stap 2: Zoek op internet naar scores van deze bronnen (alleen invullen als je een score écht hebt gevonden, nooit verzinnen): ${RATING_SOURCES_HINT}. Vivino als getal 1-5 met 1 decimaal, andere bronnen als score op 100.
Stap 3: Zoek de huidige winkelprijs, bij voorkeur bij een Nederlandse of Belgische wijnhandel.
Stap 4: Schrijf een korte, feitelijke omschrijving van het wijnhuis (2-3 zinnen) en beknopte proefnotities (max. 5 regels), in het Nederlands.
Stap 5: Schat een realistisch drinkvenster in — vanaf welk jaar tot welk jaar deze wijn goed te drinken is, en de piekperiode daarbinnen. Baseer dit op het type wijn, de jaargang, de druif(ven) en de stijl/kwaliteit (bijv. een lichte, jonge witte wijn heeft een korter venster dan een geconcentreerde rode bewaarwijn of een Grosses Gewächs). Vul dit altijd in, ook als je het moet inschatten op basis van algemene kennis over dit type wijn — laat dit nooit leeg.

Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat (gebruik null voor velden die je niet kunt vaststellen, verzin nooit scores of prijzen — het drinkvenster in stap 5 mag wel een onderbouwde inschatting zijn):
{"wine": "...", "producer": "...", "vintage": "...", "country": "...", "region": "...", "grapes": "...", "type": "red", "ratings": {"vivino": 4.2}, "priceValue": "€ 18 - 22", "priceNote": "...", "description": "...", "tastingNotes": "...", "drinkFrom": 2025, "drinkUntil": 2032, "peakFrom": 2027, "peakUntil": 2030}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: photoBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Claude-fout: ${data.error.type || ""} ${data.error.message || ""}`.trim());

  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  let clean = text.replace(/```json|```/g, "").trim();
  // Als Claude toch wat uitleg vóór of na het JSON-blok zet, pak alleen het stuk
  // tussen de eerste { en de laatste } — dat is veel robuuster dan alleen
  // markdown-backticks strippen.
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error(`Kon het antwoord niet als JSON lezen: ${String(e.message || e)}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method not allowed" } });
    return;
  }

  const openaiKey = process.env.OPENAI_API_KEY; // optioneel — zonder deze sleutel valt de app terug op pure achtergrond-verwijdering
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    res.status(500).json({
      error: { message: "ANTHROPIC_API_KEY is niet ingesteld op de server." },
    });
    return;
  }

  const { photoBase64, mimeType } = req.body || {};
  if (!photoBase64) {
    res.status(400).json({ error: { message: "Geen foto meegestuurd." } });
    return;
  }

  try {
    // Beide stappen mogen gelijktijdig lopen, ze zijn onafhankelijk van elkaar.
    const [packshot, wineInfo] = await Promise.all([
      generatePackshot(photoBase64, mimeType || "image/jpeg", openaiKey),
      identifyAndEnrichWine(photoBase64, mimeType || "image/jpeg", anthropicKey),
    ]);

    res.status(200).json({
      wine: wineInfo,
      packshot: `data:${packshot.mimeType};base64,${packshot.base64}`,
    });
  } catch (err) {
    res.status(500).json({ error: { message: String((err && err.message) || err) } });
  }
}
