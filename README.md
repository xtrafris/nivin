# Mijn wijn — eigen webapp (Vercel + Supabase)

Dit is je wijnkelder-app, omgebouwd tot een losstaande webapp met een echte database
(Supabase), zodat je voorraad en wijzigingen automatisch synchroniseren tussen je
telefoon, laptop en elk ander apparaat.

## Wat is er veranderd t.o.v. de Claude-artifact?

1. **Opslag**: `window.storage` is vervangen door [Supabase](https://supabase.com) —
   een gratis, echte database in de cloud. Je hele kelder staat in één tabel (`cellar`)
   en wordt automatisch bijgewerkt zodra je iets wijzigt, op elk apparaat.
2. **AI-functies** (ververs-knop, Wijn & spijs): deze roepen je eigen serverfunctie
   (`/api/claude.js`) aan, die je Anthropic API-sleutel veilig verstopt.
3. **Wijn toevoegen via foto** (nieuw): tik op "+" → "Foto maken" → de camera opent,
   je maakt een foto van het etiket. Op de achtergrond (`/api/add-wine.js`) gebeurt dan
   automatisch:
   - **OpenAI (GPT Image)** zet de foto om in een professionele productfoto (vrijstaande
     fles, neutrale achtergrond), met het etiket exact zoals gefotografeerd.
   - **Claude** leest het etiket, zoekt de wijn op (scores, prijs, proefnotities) via
     web-search.
   - Staat dezelfde wijn (naam + producent + jaargang, exact) al in je kelder, dan
     wordt alleen het aantal opgehoogd in plaats van een nieuwe kaart aan te maken.
     Een andere jaargang telt als een nieuwe wijn.

## Wat je nodig hebt

- Een gratis GitHub-account (github.com)
- Een gratis Vercel-account (vercel.com, inloggen met GitHub)
- Een gratis Supabase-account (supabase.com)
- Een Anthropic API-sleutel via console.anthropic.com (Settings → API Keys) —
  let op: dit is een *betaalde* sleutel, los van je Claude.ai-abonnement, met lage
  kosten per gebruik voor persoonlijk gebruik.
- Een OpenAI API-sleutel via platform.openai.com (Settings → API keys) — nieuwe
  accounts krijgen $5 gratis tegoed, geen creditcard nodig om te starten.

## Stap voor stap

### 1. Zet je Supabase-database klaar
1. Maak op supabase.com/dashboard een nieuw, gratis project aan.
2. Ga naar **SQL Editor** → **New query**, plak de inhoud van `supabase-schema.sql`
   (zit in deze map) erin, en klik op **Run**. Dit maakt de tabel aan waar je hele
   kelder in komt te staan.
3. Ga naar **Settings → API**. Daar vind je twee dingen die je zo nodig hebt:
   - **Project URL** (bijv. https://abcdefgh.supabase.co)
   - **anon public key** (een lange sleutel die met "eyJ..." begint)

### 2. Zet de code op GitHub
1. Maak op github.com/new een nieuwe, lege repository (bijv. `mijn-wijn`).
2. Download deze map (via de link die Claude je geeft) en pak 'm uit.
3. Open Terminal in de uitgepakte map en voer uit:
   ```
   git init
   git add .
   git commit -m "Eerste versie"
   git branch -M main
   git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/mijn-wijn.git
   git push -u origin main
   ```

### 3. Importeer in Vercel
1. Ga naar vercel.com/new en log in met GitHub.
2. Kies "Import" bij je `mijn-wijn`-repository.
3. Klik nog niet op Deploy — eerst de omgevingsvariabelen instellen (stap 4).

### 4. Zet je sleutels veilig neer
Bij het import-scherm (of later via Project → Settings → Environment Variables),
voeg deze drie variabelen toe:

| Naam | Waarde |
|---|---|
| VITE_SUPABASE_URL | je Supabase Project URL |
| VITE_SUPABASE_ANON_KEY | je Supabase anon public key |
| ANTHROPIC_API_KEY | je Anthropic API-sleutel |
| OPENAI_API_KEY | je OpenAI API-sleutel |

Klik daarna op **Deploy**. Na een minuutje krijg je een live URL, bijvoorbeeld
`mijn-wijn.vercel.app`.

### 5. Zet 'm op je beginscherm
Open je nieuwe `mijn-wijn.vercel.app`-link in **Safari** op je iPhone, tik op het
deel-icoontje, en kies "Zet op beginscherm".

## Lokaal testen (optioneel)

Als je Node.js hebt geïnstalleerd:
```
npm install
cp .env.example .env.local
# vul .env.local in met je eigen sleutels
npm run dev
```
Let op: de AI-functies (`/api/claude`) werken lokaal alleen met `vercel dev`
(i.p.v. `npm run dev`), omdat Vite de `/api`-map zelf niet meeneemt.

## Een kanttekening over beveiliging

De Supabase-tabel is momenteel voor iedereen met je publieke anon-sleutel te
lezen/schrijven (die sleutel staat toch al zichtbaar in de browser-code van elke
webapp — dat is normaal en veilig zolang je geen gevoelige data deelt). Voor een
puur persoonlijke wijnkelder-app is dat een acceptabele afweging. Wil je dit later
steviger afschermen (bijv. als je de link ooit deelt), dan voegen we een simpel
inlogscherm toe via Supabase Auth — zeg het gerust als je dat op een later moment wil.

## Vragen of problemen?

Kom terug naar dit Claude-gesprek — ik heb de volledige geschiedenis van hoe deze
app is opgebouwd en kan je verder helpen met aanpassingen, bugs, of de volgende stap.
