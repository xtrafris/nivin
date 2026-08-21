// Vercel serverless function. Runs op de server, nooit in de browser.
// Combineert twee stappen voor het toevoegen van een wijn via foto:
//
// 1. OpenAI (OPENAI_API_KEY) genereert een volledige, professionele packshot
//    op basis van je foto — met dezelfde prompt die je zelf handmatig gebruikt
//    en waarvan je hebt gezien dat die goede, correcte resultaten geeft. Deze
//    packshot (inclusief zijn eigen nette witte achtergrond) wordt direct als
//    foto op de kaart getoond — er wordt dus NIET geprobeerd om de achtergrond
//    achteraf transparant te maken of uit te knippen. Dat bleek keer op keer
//    problemen te geven (rare overgangen, verminkte/gedraaide foto's); door de
//    packshot gewoon als volwaardige foto te tonen (met object-fit: cover in
//    een vaste kaart-kolom) is er niets meer om mis te laten gaan.
// 2. Claude (ANTHROPIC_API_KEY) leest het etiket op de ORIGINELE foto en zoekt
//    via web-search de wijn op: naam, producent, jaargang, streek, druiven,
//    scores, prijs en proefnotities.
//
// Beide sleutels worden hier server-side gebruikt en nooit naar de browser
// gestuurd. Zet ze in je Vercel-projectinstellingen (Environment Variables).
// Zonder OPENAI_API_KEY werkt alles nog gewoon, dan blijft de kaart zonder foto.

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // ruimte voor een foto in base64
  },
  maxDuration: 60, // standaard is 10s op Vercel's gratis plan — te kort voor deze aanroepen
};

const RATING_SOURCES_HINT =
  "Vivino, CellarTracker, Wine Advocate, Wine Spectator, Decanter, Vinous, James Suckling, Hamersma";

async function generatePackshot(photoBase64, mimeType, openaiKey) {
  if (!openaiKey) return null;

  const prompt =
    "Professionele studio packshot van deze wijnfles, perfect gecentreerd, op een vlekkeloze, " +
    "heldere witte achtergrond en ondergrond. Zachte, diffuse belichting om reflecties te " +
    "minimaliseren en het etiket scherp weer te geven. 8k resolutie, fotorealistisch. " +
    "Neem de vorm en verhoudingen van de fles exact over zoals op de originele foto, en het " +
    "etiket exact zoals het is — zelfde formaat, zelfde positie op de fles, zelfde tekst en " +
    "ontwerp. Verander niets aan de vorm of grootte van de fles of het etiket.";

  const buffer = Buffer.from(photoBase64, "base64");
  const mt = (mimeType || "image/jpeg").toLowerCase();
  const extMap = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/heic": "heic", "image/heif": "heic" };
  const ext = extMap[mt] || "jpg";
  const blob = new Blob([buffer], { type: mt });

  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("image", blob, `bottle.${ext}`);
  form.append("prompt", prompt);
  form.append("quality", "high");
  form.append("size", "1024x1536"); // staand formaat — past van nature beter bij een fles dan vierkant

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  const data = await res.json();
  if (data.error) {
    // Volledige foutmelding tonen (niet alleen .message), zodat we bij een volgende
    // fout precies zien wat OpenAI afkeurt in plaats van een te vage samenvatting.
    throw new Error(`OpenAI-fout: ${JSON.stringify(data.error)}`);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI gaf geen afbeelding terug.");

  return { base64: b64, mimeType: "image/png" };
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

  const openaiKey = process.env.OPENAI_API_KEY; // optioneel — zonder deze sleutel blijft de kaart zonder foto
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
      packshot: packshot ? `data:${packshot.mimeType};base64,${packshot.base64}` : null,
    });
  } catch (err) {
    res.status(500).json({ error: { message: String((err && err.message) || err) } });
  }
}
