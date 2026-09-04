// Vercel serverless function. Runs op de server, nooit in de browser.
// Verwerkt twee manieren om een wijn toe te voegen:
//
// A) Via foto (photoBase64): OpenAI genereert een packshot, Claude leest het
//    etiket en zoekt de wijn op.
// B) Via tekst (description): geen foto, dus geen packshot — Claude zoekt de
//    wijn op basis van de getypte omschrijving (bv. alleen naam + jaargang).
//
// Beide sleutels worden hier server-side gebruikt en nooit naar de browser
// gestuurd. Zet ze in je Vercel-projectinstellingen (Environment Variables).
// Zonder OPENAI_API_KEY werkt route A nog gewoon, dan blijft de kaart zonder foto.
//
// De gegenereerde packshot wordt geüpload naar Supabase Storage (bucket
// "wine-photos") en er komt alleen een link terug — niet de hele foto als
// tekst. Dat houdt elke opslag-actie in de app klein en snel, ook als de
// kelder groeit. Zonder Storage-bucket (nog niet aangemaakt, of tijdelijk
// niet bereikbaar) valt dit automatisch terug op de oude werkwijze
// (foto als data-URI meesturen), dus niets breekt zonder die bucket — hij
// werkt dan alleen nog niet optimaal.

import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" }, // ruimte voor een foto in base64
  },
  maxDuration: 60, // standaard is 10s op Vercel's gratis plan — te kort voor deze aanroepen
};

const RATING_SOURCES_HINT =
  "Vivino, CellarTracker, Wine Advocate, Wine Spectator, Decanter, Vinous, James Suckling, Hamersma";

const PHOTO_BUCKET = "wine-photos";

async function uploadPackshotToStorage(base64, mimeType) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const buffer = Buffer.from(base64, "base64");
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const path = `packshots/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) {
      console.error("Supabase Storage upload mislukt, val terug op data-URI:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.error("Supabase Storage upload gaf een fout, val terug op data-URI:", e);
    return null;
  }
}

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
  form.append("quality", "medium"); // "high" liep soms tegen Vercel's 60s-tijdslimiet aan (FUNCTION_INVOCATION_TIMEOUT)
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

Stap 1: Lees het etiket nauwkeurig en identificeer de wijn: naam, producent/wijnhuis, jaargang, land, streek, druivenras(sen) — bij een blend alleen de druivensoorten zelf, gescheiden door ";", zonder percentages —, type (red/white/rose/sparkling/orange). Geef land en streek in het Nederlands (bv. "Italië" niet "Italy", "Toscane" niet "Tuscany", "Loire" niet "Loire Valley").
Stap 2: Zoek op internet naar scores van deze bronnen (alleen invullen als je een score écht hebt gevonden, nooit verzinnen): ${RATING_SOURCES_HINT}. Vivino als getal 1-5 met 1 decimaal, andere bronnen als score op 100.
Stap 3: Zoek de huidige winkelprijs, bij voorkeur bij een winkel in Nederland of de EU. Geef in "priceValue" een afgeronde prijs(range) zonder cijfers achter de komma, bijvoorbeeld "€18 - 22" of "€24" — nooit decimalen. Geef in "priceNote" ALLEEN de naam van de winkel gevolgd door de (eveneens afgeronde) prijs bij die winkel, bijvoorbeeld "Wijnvoordeel.nl €24" — geen verdere toelichting, geen extra zinnen, geen achtergrondinfo. Vind je meerdere winkels, scheid ze dan met een komma. Vind je geen winkel in NL of de EU maar wel een algemene prijsindicatie, laat "priceNote" dan leeg.
Stap 4: Schrijf een korte, feitelijke omschrijving van het wijnhuis in "description" (2-3 zinnen), in het Nederlands.
Stap 5: Schrijf in "tastingNotes" een korte proefnotitie van MAXIMAAL 25 WOORDEN (dat is een harde grens, dus tel mee en kort desnoods in) — dat komt neer op maximaal 3 regels, zonder dat je zinnen midden in een woord afbreekt. Simpele, alledaagse taal — geen wijnjargon zoals "mineraliteit", "gestructureerd" of "garrigue", gewoon herkenbare smaken en geuren zoals een leek ze zou noemen, kort en bondig. Dit veld mag nooit leeg blijven: baseer de proefnotitie desnoods op de druif, het type en de streek als je geen specifieke recensie vindt.
Stap 6: Schat een realistisch drinkvenster in — vanaf welk jaar tot welk jaar deze wijn goed te drinken is, en de piekperiode daarbinnen. Baseer dit op het type wijn, de jaargang, de druif(ven) en de stijl/kwaliteit (bijv. een lichte, jonge witte wijn heeft een korter venster dan een geconcentreerde rode bewaarwijn of een Grosses Gewächs). Vul dit altijd in, ook als je het moet inschatten op basis van algemene kennis over dit type wijn — laat dit nooit leeg.
Stap 7: Zoek uit of het wijnhuis/deze wijn een biologisch of biodynamisch certificaat heeft (bv. EU-biologisch, Demeter, Ecocert, Biodyvin). Vul "organic" alleen in als je dit ergens expliciet bevestigd ziet — laat het op null staan als je het niet zeker weet, verzin dit nooit.

Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat (gebruik null voor velden die je niet kunt vaststellen, verzin nooit scores of prijzen — het drinkvenster in stap 5 mag wel een onderbouwde inschatting zijn):
{"wine": "...", "producer": "...", "vintage": "...", "country": "...", "region": "...", "grapes": "...", "type": "red", "ratings": {"vivino": 4.2}, "priceValue": "€18 - 22", "priceNote": "...", "description": "...", "tastingNotes": "...", "drinkFrom": 2025, "drinkUntil": 2032, "peakFrom": 2027, "peakUntil": 2030, "organic": null}`;

  const data = await callClaudeForWineJson(
    [
      { type: "image", source: { type: "base64", media_type: mimeType, data: photoBase64 } },
      { type: "text", text: prompt },
    ],
    anthropicKey
  );
  return data;
}

async function identifyAndEnrichWineFromText(description, anthropicKey) {
  const currentYear = new Date().getFullYear();
  const prompt = `Je bent een wijnexpert met toegang tot actuele webzoekresultaten. Het huidige jaar is ${currentYear}.

Een gebruiker heeft de volgende, mogelijk beknopte of losse omschrijving van een wijn gegeven — bijvoorbeeld alleen een naam, jaargang en/of wijnhuis:
"${description}"

Stap 1: Zoek op internet uit om welke specifieke wijn het gaat, en identificeer: volledige naam, producent/wijnhuis, jaargang, land, streek, druivenras(sen) — bij een blend alleen de druivensoorten zelf, gescheiden door ";", zonder percentages —, type (red/white/rose/sparkling/orange). Als de jaargang niet genoemd is, gebruik dan de meest recente courante jaargang die je kunt vinden. Geef land en streek in het Nederlands (bv. "Italië" niet "Italy", "Toscane" niet "Tuscany", "Loire" niet "Loire Valley").
Stap 2: Zoek op internet naar scores van deze bronnen (alleen invullen als je een score écht hebt gevonden, nooit verzinnen): ${RATING_SOURCES_HINT}. Vivino als getal 1-5 met 1 decimaal, andere bronnen als score op 100.
Stap 3: Zoek de huidige winkelprijs, bij voorkeur bij een winkel in Nederland of de EU. Geef in "priceValue" een afgeronde prijs(range) zonder cijfers achter de komma, bijvoorbeeld "€18 - 22" of "€24" — nooit decimalen. Geef in "priceNote" ALLEEN de naam van de winkel gevolgd door de (eveneens afgeronde) prijs bij die winkel, bijvoorbeeld "Wijnvoordeel.nl €24" — geen verdere toelichting, geen extra zinnen, geen achtergrondinfo. Vind je meerdere winkels, scheid ze dan met een komma. Vind je geen winkel in NL of de EU maar wel een algemene prijsindicatie, laat "priceNote" dan leeg.
Stap 4: Schrijf een korte, feitelijke omschrijving van het wijnhuis in "description" (2-3 zinnen), in het Nederlands.
Stap 5: Schrijf in "tastingNotes" een korte proefnotitie van MAXIMAAL 25 WOORDEN (dat is een harde grens, dus tel mee en kort desnoods in) — dat komt neer op maximaal 3 regels, zonder dat je zinnen midden in een woord afbreekt. Simpele, alledaagse taal — geen wijnjargon zoals "mineraliteit", "gestructureerd" of "garrigue", gewoon herkenbare smaken en geuren zoals een leek ze zou noemen, kort en bondig. Dit veld mag nooit leeg blijven: baseer de proefnotitie desnoods op de druif, het type en de streek als je geen specifieke recensie vindt.
Stap 6: Schat een realistisch drinkvenster in — vanaf welk jaar tot welk jaar deze wijn goed te drinken is, en de piekperiode daarbinnen. Baseer dit op het type wijn, de jaargang, de druif(ven) en de stijl/kwaliteit. Vul dit altijd in, ook als inschatting — laat dit nooit leeg.
Stap 7: Zoek uit of het wijnhuis/deze wijn een biologisch of biodynamisch certificaat heeft (bv. EU-biologisch, Demeter, Ecocert, Biodyvin). Vul "organic" alleen in als je dit ergens expliciet bevestigd ziet — laat het op null staan als je het niet zeker weet, verzin dit nooit.

Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat (gebruik null voor velden die je niet kunt vaststellen, verzin nooit scores of prijzen — het drinkvenster in stap 5 mag wel een onderbouwde inschatting zijn):
{"wine": "...", "producer": "...", "vintage": "...", "country": "...", "region": "...", "grapes": "...", "type": "red", "ratings": {"vivino": 4.2}, "priceValue": "€18 - 22", "priceNote": "...", "description": "...", "tastingNotes": "...", "drinkFrom": 2025, "drinkUntil": 2032, "peakFrom": 2027, "peakUntil": 2030, "organic": null}`;

  return callClaudeForWineJson([{ type: "text", text: prompt }], anthropicKey);
}

async function callClaudeForWineJson(content, anthropicKey) {
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
      messages: [{ role: "user", content }],
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

  const { photoBase64, mimeType, description } = req.body || {};
  if (!photoBase64 && !description) {
    res.status(400).json({ error: { message: "Geen foto of omschrijving meegestuurd." } });
    return;
  }

  try {
    if (description) {
      // Tekst-gebaseerd: geen foto om een packshot van te maken, dus alleen de gegevens opzoeken.
      const wineInfo = await identifyAndEnrichWineFromText(description, anthropicKey);
      res.status(200).json({ wine: wineInfo, packshot: null });
      return;
    }

    // Beide stappen mogen gelijktijdig lopen, ze zijn onafhankelijk van elkaar.
    const [packshotRaw, wineInfo] = await Promise.all([
      generatePackshot(photoBase64, mimeType || "image/jpeg", openaiKey),
      identifyAndEnrichWine(photoBase64, mimeType || "image/jpeg", anthropicKey),
    ]);

    let packshotUrl = null;
    if (packshotRaw) {
      const uploadedUrl = await uploadPackshotToStorage(packshotRaw.base64, packshotRaw.mimeType);
      // Val terug op de oude data-URI als de Storage-upload (nog) niet lukt,
      // bijvoorbeeld omdat de bucket "wine-photos" nog niet is aangemaakt.
      packshotUrl = uploadedUrl || `data:${packshotRaw.mimeType};base64,${packshotRaw.base64}`;
    }

    res.status(200).json({
      wine: wineInfo,
      packshot: packshotUrl,
    });
  } catch (err) {
    res.status(500).json({ error: { message: String((err && err.message) || err) } });
  }
}
