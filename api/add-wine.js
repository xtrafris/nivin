// Vercel serverless function. Runs op de server, nooit in de browser.
// Combineert twee AI-stappen voor het toevoegen van een wijn via foto:
//
// 1. OpenAI (OPENAI_API_KEY) zet de ruwe foto om in een professionele packshot
//    (vrijstaande fles, neutrale achtergrond) — met behoud van het exacte etiket.
// 2. Claude (ANTHROPIC_API_KEY) leest het etiket op de ORIGINELE foto en zoekt
//    via web-search de wijn op: naam, producent, jaargang, streek, druiven,
//    scores, prijs en proefnotities.
//
// Beide sleutels worden hier server-side gebruikt en nooit naar de browser
// gestuurd. Zet ze in je Vercel-projectinstellingen (Environment Variables).

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // ruimte voor een foto in base64
  },
};

const RATING_SOURCES_HINT =
  "Vivino, CellarTracker, Wine Advocate, Wine Spectator, Decanter, Vinous, James Suckling, Hamersma";

async function generatePackshot(photoBase64, mimeType, openaiKey) {
  const prompt =
    "Maak van deze foto van een wijnfles een professionele productfoto (packshot): " +
    "de fles vrijstaand, rechtop, scherp gefotografeerd tegen een neutrale, lichte " +
    "studio-achtergrond met een zachte schaduw eronder, zoals bij high-end e-commerce " +
    "productfotografie. Behoud de fles, de vorm, de kleur van het glas en het etiket " +
    "exact zoals op de foto — verander geen tekst, logo's of ontwerp van het etiket.";

  const buffer = Buffer.from(photoBase64, "base64");
  const ext = (mimeType || "image/jpeg").includes("png") ? "png" : "jpg";
  const blob = new Blob([buffer], { type: mimeType || "image/jpeg" });

  const form = new FormData();
  form.append("model", "gpt-image-1-mini");
  form.append("image", blob, `bottle.${ext}`);
  form.append("prompt", prompt);
  form.append("quality", "low"); // ruim voldoende voor een kaartfoto, en spaart tegoed

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  const data = await res.json();
  if (data.error) throw new Error(`OpenAI-fout: ${data.error.message || JSON.stringify(data.error)}`);

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI gaf geen afbeelding terug.");
  return { base64: b64, mimeType: "image/png" };
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
