// Vercel serverless function. Runs op de server, nooit in de browser.
// Combineert twee AI-stappen voor het toevoegen van een wijn via foto:
//
// 1. OpenAI (OPENAI_API_KEY) zet de ruwe foto om in een professionele packshot
//    (vrijstaande fles, neutrale achtergrond) — met behoud van het exacte etiket.
//    De foto wordt daarna server-side strak bijgesneden (sharp), zodat de fles
//    de kaart op dezelfde manier vult als elke andere wijnfoto in de app.
// 2. Claude (ANTHROPIC_API_KEY) leest het etiket op de ORIGINELE foto en zoekt
//    via web-search de wijn op: naam, producent, jaargang, streek, druiven,
//    scores, prijs en proefnotities.
//
// Beide sleutels worden hier server-side gebruikt en nooit naar de browser
// gestuurd. Zet ze in je Vercel-projectinstellingen (Environment Variables).

import sharp from "sharp";

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // ruimte voor een foto in base64
  },
  maxDuration: 60, // standaard is 10s op Vercel's gratis plan — te kort voor twee AI-aanroepen
};

const RATING_SOURCES_HINT =
  "Vivino, CellarTracker, Wine Advocate, Wine Spectator, Decanter, Vinous, James Suckling, Hamersma";

// Verwijdert de witte studio-achtergrond ECHT (maakt 'm transparant), in plaats
// van 'm alleen bij te snijden. Gebruikt dezelfde vloed-vul-techniek als eerder
// handmatig toegepast: alleen de achtergrond die vanaf de randen bereikbaar is
// wordt transparant gemaakt, zodat een wit etiket (dat omsloten wordt door de
// fles) intact blijft in plaats van ook doorzichtig te worden.
async function removeWhiteBackground(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const total = width * height;

  const bgLike = new Uint8Array(total);
  const threshold = 32;
  for (let p = 0, i = 0; p < total; p++, i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
    bgLike[p] = dist < threshold ? 1 : 0;
  }

  // Vloed-vullen vanaf alle randpixels, alleen door achtergrond-achtige pixels heen
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

  // Alfa-masker opbouwen: 0 = doorzichtig (achtergrond), 255 = ondoorzichtig (fles/etiket)
  const alphaMask = Buffer.alloc(total);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let p = 0; p < total; p++) {
    const opaque = !visited[p];
    alphaMask[p] = opaque ? 255 : 0;
    if (opaque) {
      const x = p % width, y = (p - x) / width;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }

  // Randen van het masker licht vervagen, voor een zachte in plaats van kartelige rand
  const softMask = await sharp(alphaMask, { raw: { width, height, channels: 1 } })
    .blur(1.1)
    .toBuffer();

  const rgb = await sharp(buffer).ensureAlpha().removeAlpha().toBuffer();
  const transparent = await sharp(rgb)
    .joinChannel(softMask, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // Strak bijsnijden op de daadwerkelijke inhoud (geen lege transparante randen)
  if (maxX > minX && maxY > minY) {
    const pad = 6;
    const left = Math.max(0, minX - pad);
    const top = Math.max(0, minY - pad);
    const w = Math.min(width, maxX + pad) - left;
    const h = Math.min(height, maxY + pad) - top;
    return sharp(transparent).extract({ left, top, width: w, height: h }).png().toBuffer();
  }
  return transparent;
}

async function generatePackshot(photoBase64, mimeType, openaiKey) {
  const prompt =
    "Professionele studio packshot van deze wijnfles: perfect gecentreerd, rechtop, op een " +
    "vlekkeloze, heldere witte achtergrond en ondergrond. Zachte, diffuse belichting om " +
    "reflecties op het glas te minimaliseren en het etiket scherp en volledig leesbaar weer " +
    "te geven. 8k resolutie, fotorealistisch, zoals bij high-end e-commerce productfotografie. " +
    "Behoud de fles exact zoals op de foto — dezelfde vorm, dezelfde kleur glas, en het etiket " +
    "met exact dezelfde tekst, logo's en ontwerp. Verander geen letter van de tekst op het etiket.";

  const buffer = Buffer.from(photoBase64, "base64");
  const ext = (mimeType || "image/jpeg").includes("png") ? "png" : "jpg";
  const blob = new Blob([buffer], { type: mimeType || "image/jpeg" });

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image", blob, `bottle.${ext}`);
  form.append("prompt", prompt);
  form.append("quality", "high"); // laag gaf onleesbare, verhaspelde etiketten — dit kost meer tegoed maar is nodig voor een correct etiket
  form.append("size", "1024x1536"); // staand formaat — past van nature beter bij een fles dan vierkant

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  const data = await res.json();
  if (data.error) throw new Error(`OpenAI-fout: ${data.error.message || JSON.stringify(data.error)}`);

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI gaf geen afbeelding terug.");

  const rawBuffer = Buffer.from(b64, "base64");
  let finalBuffer;
  try {
    finalBuffer = await removeWhiteBackground(rawBuffer);
  } catch {
    finalBuffer = rawBuffer; // achtergrond-verwijdering mislukt? gebruik dan gewoon de originele foto
  }

  return { base64: finalBuffer.toString("base64"), mimeType: "image/png" };
}

async function identifyAndEnrichWine(photoBase64, mimeType, anthropicKey) {
  const prompt = `Je bent een wijnexpert met toegang tot actuele webzoekresultaten. Op de bijgevoegde foto staat een wijnetiket.

Stap 1: Lees het etiket nauwkeurig en identificeer de wijn: naam, producent/wijnhuis, jaargang, land, streek, druivenras(sen), type (red/white/rose/sparkling/orange).
Stap 2: Zoek op internet naar scores van deze bronnen (alleen invullen als je een score écht hebt gevonden, nooit verzinnen): ${RATING_SOURCES_HINT}. Vivino als getal 1-5 met 1 decimaal, andere bronnen als score op 100.
Stap 3: Zoek de huidige winkelprijs, bij voorkeur bij een Nederlandse of Belgische wijnhandel.
Stap 4: Schrijf een korte, feitelijke omschrijving van het wijnhuis (2-3 zinnen) en beknopte proefnotities (max. 5 regels), in het Nederlands.

Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat (gebruik null voor velden die je niet kunt vaststellen, verzin nooit scores of prijzen):
{"wine": "...", "producer": "...", "vintage": "...", "country": "...", "region": "...", "grapes": "...", "type": "red", "ratings": {"vivino": 4.2}, "priceValue": "€ 18 - 22", "priceNote": "...", "description": "...", "tastingNotes": "..."}`;

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

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!openaiKey || !anthropicKey) {
    res.status(500).json({
      error: { message: "OPENAI_API_KEY en/of ANTHROPIC_API_KEY zijn niet ingesteld op de server." },
    });
    return;
  }

  const { photoBase64, mimeType } = req.body || {};
  if (!photoBase64) {
    res.status(400).json({ error: { message: "Geen foto meegestuurd." } });
    return;
  }

  try {
    // Beide AI-stappen mogen gelijktijdig lopen, ze zijn onafhankelijk van elkaar.
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
