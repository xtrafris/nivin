import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { Search, Plus, X, Minus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Grape, Utensils, RefreshCw, SlidersHorizontal, Camera, Pencil, Wine, Tag, Leaf } from "lucide-react";
import { supabase, CELLAR_ROW_ID } from "./supabaseClient.js";

const SEED_DATA = [{"id": "w1", "wine": "Apostelhoeve Riesling 2022", "producer": "Apostelhoeve", "vintage": "2022", "region": "Limburg", "country": "Nederland", "grapes": "Riesling", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2028", "peakFrom": "2024", "peakUntil": "2027", "score": 8, "body": 2, "sweetness": 2, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 4.0}, "priceValue": "€ 17 - 21", "priceNote": "Bovino €17-21", "description": "", "tastingNotes": "Fris en fruitig, met rijpe appel, limoen en abrikoos. Licht zoetje en een lange, lekkere nasmaak.", "notes": "", "added": "2026-05-03"}, {"id": "w2", "wine": "Arzuaga Crianza 2022", "producer": "Bodegas Arzuaga Navarro", "vintage": "2022", "region": "Ribera del Duero", "country": "Spanje", "grapes": "Tempranillo; Cabernet Sauvignon; Merlot", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2030", "peakFrom": "2025", "peakUntil": "2029", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 4.2, "jamesSuckling": 91}, "priceValue": "€ 23 - 26", "priceNote": "Mundi Vinum €23-26", "description": "", "tastingNotes": "Rijp rood en zwart fruit met een vleugje chocolade en vanille. Zacht van smaak, kruidige nasmaak.", "notes": "", "added": "2026-05-03"}, {"id": "w3", "wine": "Benefizio Castello Pomino Riserva", "producer": "Frescobaldi", "vintage": "2024", "region": "Toscane", "country": "Italië", "grapes": "Chardonnay", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2025", "drinkUntil": "2032", "peakFrom": "2026", "peakUntil": "2030", "score": 9, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 34 - 38", "priceNote": "Vinello.eu €34,38", "description": "", "tastingNotes": "Peer, exotisch fruit en citrus. Fris en sappig, met een afdronk die lang blijft hangen.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w4", "wine": "Castelfeder Doss Chardonnay", "producer": "Castelfeder", "vintage": "2024", "region": "Alto Adige", "country": "Italië", "grapes": "Chardonnay", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2025", "drinkUntil": "2029", "peakFrom": "2026", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.7}, "priceValue": "€ 13 - 15", "priceNote": "Vinello.eu €12,98, Weindiele.com €14,90", "description": "", "tastingNotes": "Rijpe appel en banaan, met exotisch fruit en een vleugje rook.", "notes": "", "added": "2026-05-03"}, {"id": "w5", "wine": "Chateau Barrail du Blanc 2004", "producer": "Chateau Barrail du Blanc", "vintage": "2004", "region": "Saint-Émilion, Bordeaux", "country": "Frankrijk", "grapes": "Merlot; Cabernet Franc", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2010", "drinkUntil": "2024", "peakFrom": "2012", "peakUntil": "2020", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "description": "", "tastingNotes": "Fris rood en zwart fruit, met een vleugje aarde en tabak. Lange, verfijnde nasmaak.", "ratings": {}, "priceValue": "€ 15 - 17", "priceNote": "Wijngro €15-17", "notes": "", "added": "2026-05-03"}, {"id": "w6", "wine": "Chateau d'Arcins", "producer": "Chateau d'Arcins", "vintage": "2021", "region": "Haut-Médoc, Bordeaux", "country": "Frankrijk", "grapes": "Cabernet Sauvignon; Merlot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2033", "peakFrom": "2026", "peakUntil": "2031", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 3.9, "wineSpectator": 85}, "priceValue": "€ 12 - 14", "priceNote": "Nevejan.eu €12-14", "description": "", "tastingNotes": "Rijp rood fruit met een vleugje sinaasappelschil. Zacht van smaak en mooi in balans.", "notes": "", "added": "2026-05-03"}, {"id": "w7", "wine": "Chateau de Tourteyron Medoc", "producer": "Chateau de Tourteyron", "vintage": "2009", "region": "Médoc, Bordeaux", "country": "Frankrijk", "grapes": "Cabernet Sauvignon; Merlot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2015", "drinkUntil": "2025", "peakFrom": "2018", "peakUntil": "2022", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 3.8}, "priceValue": "€ 14 - 16", "priceNote": "", "description": "", "tastingNotes": "Rijpe pruim, cassis en aarde, met stevige tannines. Let op: deze 2009 is over zijn hoogtepunt heen, dus reken op een wat vermoeide fles.", "notes": "", "added": "2026-05-03"}, {"id": "w8", "wine": "Château Giscours 2014", "producer": "Château Giscours", "vintage": "2014", "region": "Margaux, Bordeaux", "country": "Frankrijk", "grapes": "Cabernet Sauvignon; Merlot; Cabernet Franc; Petit Verdot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2020", "drinkUntil": "2034", "peakFrom": "2022", "peakUntil": "2030", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"parker": 92, "wineSpectator": 91, "jamesSuckling": 95}, "priceValue": "€ 71 - 73", "priceNote": "Okhuysen €71-73", "description": "", "tastingNotes": "Rood en zwart fruit met een vleugje hout en tabak. Zacht van smaak, kruidige nasmaak.", "notes": "", "added": "2026-05-03"}, {"id": "w9", "wine": "Château La Peyre Burdigala", "producer": "Château La Peyre", "vintage": "2023", "region": "Bordeaux", "country": "Frankrijk", "grapes": "Merlot; Cabernet Sauvignon", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2033", "peakFrom": "2026", "peakUntil": "2031", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "description": "", "tastingNotes": "Puur rood fruit en specerijen, zonder sterke houtsmaak. Krachtig maar toch rond en sappig.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03", "priceNote": ""}, {"id": "w10", "wine": "Château Le Vieux Pressoir Saint-Émilion Grand Cru", "producer": "Château Le Vieux Pressoir", "vintage": "2008", "region": "Saint-Émilion, Bordeaux", "country": "Frankrijk", "grapes": "Merlot; Cabernet Franc; Cabernet Sauvignon", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2012", "drinkUntil": "2022", "peakFrom": "2014", "peakUntil": "2018", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 3.8}, "priceValue": "€ 17 - 18", "priceNote": "Wijnvoordeel.nl €17-18", "description": "", "tastingNotes": "Zwarte kers, bosbes en vanille. Let op: deze 2008 is ruim over zijn hoogtepunt heen, dus reken op een vermoeide fles.", "notes": "", "added": "2026-05-03"}, {"id": "w11", "wine": "Chateau Lynch-Moussas", "producer": "Chateau Lynch-Moussas", "vintage": "2017", "region": "Pauillac, Bordeaux", "country": "Frankrijk", "grapes": "Cabernet Sauvignon; Merlot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2022", "drinkUntil": "2035", "peakFrom": "2025", "peakUntil": "2032", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 4.1, "parker": 90, "decanter": 90, "wineSpectator": 89, "jamesSuckling": 93}, "priceValue": "€ 48 - 64", "priceNote": "Millesima.nl €48-49, Bovino.nl €64", "description": "", "tastingNotes": "Kruidig, met zwarte bes en een vleugje hout. Stevig van smaak, kruidige nasmaak.", "notes": "", "added": "2026-05-03"}, {"id": "w12", "wine": "Chateau Meynard", "producer": "Earl Vignobles Mallet Audubert", "vintage": "2001", "region": "Bordeaux", "country": "Frankrijk", "grapes": "Merlot; Cabernet Sauvignon; Cabernet Franc", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2005", "drinkUntil": "2010", "peakFrom": "2006", "peakUntil": "2008", "score": 6, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "description": "", "tastingNotes": "Een makkelijke, klassieke Bordeaux. Medium van lichaam, met milde tannines.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03", "priceNote": ""}, {"id": "w13", "wine": "Chateau Moulin de Chano Haut-Medoc 2002", "producer": "Chateau Moulin de Chano", "vintage": "2002", "region": "Haut-Médoc, Bordeaux", "country": "Frankrijk", "grapes": "Cabernet Sauvignon; Merlot; Cabernet Franc", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2010", "drinkUntil": "2022", "peakFrom": "2012", "peakUntil": "2018", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 12 - 15", "priceNote": "", "description": "", "tastingNotes": "Zwart fruit met een vleugje hout. Vol van lichaam en met stevige tannines.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w14", "wine": "Château Roquettes Saint-Émilion Grand Cru", "producer": "S.C.E.A. Château Tour Baladoz", "vintage": "2007", "region": "Saint-Émilion, Bordeaux", "country": "Frankrijk", "grapes": "Merlot; Cabernet Franc; Cabernet Sauvignon", "type": "red", "quantity": 3, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2012", "drinkUntil": "2022", "peakFrom": "2014", "peakUntil": "2019", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 25 - 29", "priceNote": "", "description": "", "tastingNotes": "Nog wat ingetogen, met rood fruit. Stevig van smaak, de afdronk opent zich langzaam.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w15", "wine": "Chateau Seguin", "producer": "Chateau Seguin", "vintage": "2018", "region": "Pessac-Léognan, Bordeaux", "country": "Frankrijk", "grapes": "Cabernet Sauvignon; Merlot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2022", "drinkUntil": "2033", "peakFrom": "2024", "peakUntil": "2030", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 37 - 40", "priceNote": "Rob-Brussels.be €36,95", "description": "", "tastingNotes": "Sappige bessen met een vleugje tabak. Fijne tannines en een levendige, frisse smaak.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w16", "wine": "Cuvée Remus Chardonnay", "producer": "Jean-Jacques Bardin", "vintage": "2021", "region": "Loire-vallei", "country": "Frankrijk", "grapes": "Chardonnay", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2029", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 4.3}, "priceValue": "€ 15 - 20", "priceNote": "", "description": "", "tastingNotes": "Karamel, vanille en exotisch fruit zoals lychee. Rijk van smaak.", "notes": "", "added": "2026-05-03"}, {"id": "w17", "wine": "Domaine Philippe Raimbault Apud Sariacum Sancerre", "producer": "Domaine Philippe Raimbault", "vintage": "2023", "region": "Sancerre, Loire-vallei", "country": "Frankrijk", "grapes": "Sauvignon Blanc", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2029", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 2, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 20 - 25", "priceNote": "", "description": "", "tastingNotes": "Fris, met citrus en kruisbes. Levendige zuren en een schone, frisse afdronk.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w18", "wine": "Domaine Philippe Raimbault Pouilly-Fumé Les Lumeaux", "producer": "Domaine Philippe Raimbault", "vintage": "2023", "region": "Pouilly-Fumé, Loire-vallei", "country": "Frankrijk", "grapes": "Sauvignon Blanc", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2029", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 20 - 26", "priceNote": "", "description": "", "tastingNotes": "Citrus en witte bloemen, met een vleugje rook. Fris en vol — iets rijker dan de Sancerre hiernaast.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w19", "wine": "En Números Vermells Carinyena planted in 1919", "producer": "En Números Vermells", "vintage": "2023", "region": "Priorat", "country": "Spanje", "grapes": "Carinyena", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2026", "drinkUntil": "2045", "peakFrom": "2029", "peakUntil": "2040", "score": 9, "body": 5, "sweetness": 1, "tannin": 5, "acidity": 3, "alcohol": null, "priceValue": "€ 28 - 45", "priceNote": "vino-vi.com €28-45", "description": "", "tastingNotes": "Krachtig, met donker fruit en kruiden. Stevige structuur — een echte bewaarwijn.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w20", "wine": "En Números Vermells... Etiqueta Negra", "producer": "En Números Vermells", "vintage": "2022", "region": "Priorat", "country": "Spanje", "grapes": "Garnacha; Cariñena", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2025", "drinkUntil": "2037", "peakFrom": "2028", "peakUntil": "2034", "score": 9, "body": 5, "sweetness": 1, "tannin": 5, "acidity": 3, "alcohol": null, "priceValue": "€ 28 - 32", "priceNote": "vino-vi.com €27,90", "description": "", "tastingNotes": "Rood fruit met zoethout en specerijen, en een fris kruidig tintje van venkel.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w21", "wine": "En Números Vermells... Garnatxa Peluda", "producer": "En Números Vermells", "vintage": "2022", "region": "Priorat", "country": "Spanje", "grapes": "Garnatxa Peluda", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2034", "peakFrom": "2026", "peakUntil": "2032", "score": 9, "body": 4, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 40 - 46", "priceNote": "vino-vi.com €46", "description": "", "tastingNotes": "Zacht en fluweelachtig, met rijp rood fruit en een kruidig accent.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w22", "wine": "Errazuriz Don Maximiano Founder's Reserve 2016", "producer": "Viña Errazuriz", "vintage": "2016", "region": "Aconcaguavallei", "country": "Chili", "grapes": "Cabernet Sauvignon; Malbec; Carmenere; Petit Verdot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2020", "drinkUntil": "2036", "peakFrom": "2024", "peakUntil": "2032", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 60 - 85", "priceNote": "", "description": "", "tastingNotes": "Koffie en cacao, gecombineerd met cassis, veenbes en kersen.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w23", "wine": "Fattoria Selvapiana Vigneto Bucerchiale Chianti Rufina Riserva 2020", "producer": "Fattoria Selvapiana", "vintage": "2020", "region": "Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2024", "drinkUntil": "2040", "peakFrom": "2027", "peakUntil": "2038", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"jamesSuckling": 93}, "priceValue": "€ 27 - 40", "priceNote": "Wijn vd Natuur €27,50", "description": "", "tastingNotes": "Rijpe pruimen met een vleugje sinaasappelschil, leer en kruiden. Sappig, met veel tannine.", "notes": "", "added": "2026-05-03"}, {"id": "w24", "wine": "Fattoria Selvapiana Vigneto Bucerchiale Chianti Rufina Riserva 2022", "producer": "Fattoria Selvapiana", "vintage": "2022", "region": "Chianti Rufina, Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2026", "drinkUntil": "2042", "peakFrom": "2029", "peakUntil": "2038", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "priceValue": "€ 27 - 40", "priceNote": "Wijn vd Natuur €27,50", "description": "", "tastingNotes": "Stevig en kruidig, met een levendige, pittige afdronk. Nog jong — kan nog wel wat jaren liggen.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w25", "wine": "Faustino V Reserva", "producer": "Bodegas Faustino", "vintage": "1996", "region": "Rioja", "country": "Spanje", "grapes": "Tempranillo; Mazuelo", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2000", "drinkUntil": "2015", "peakFrom": "2002", "peakUntil": "2010", "score": 7, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "ratings": {"vivino": 3.8, "cellarTracker": 88}, "priceValue": "€ 13 - 14", "priceNote": "Gall & Gall €13-14", "description": "", "tastingNotes": "Peper en vanille, met rijp fruit en zachte tannines.", "notes": "", "added": "2026-05-03"}, {"id": "w26", "wine": "Frescobaldi Vigna Montesodi Chianti Rufina Riserva 2022", "producer": "Frescobaldi", "vintage": "2022", "region": "Chianti Rufina, Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2026", "drinkUntil": "2042", "peakFrom": "2029", "peakUntil": "2038", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"jamesSuckling": 94, "vinous": 93}, "priceValue": "€ 45 - 60", "priceNote": "", "description": "", "tastingNotes": "Cassis, framboos en braam, met een bloemig accent van roos.", "notes": "", "added": "2026-05-03"}, {"id": "w27", "wine": "Crozes-Hermitage", "producer": "Domaine Garon", "vintage": "2022", "region": "Noordelijke Rhône", "country": "Frankrijk", "grapes": "Syrah", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2032", "peakFrom": "2026", "peakUntil": "2030", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 4.1}, "priceValue": "€ 26 - 27", "priceNote": "Wijnopdronk.nl €26,50", "description": "", "tastingNotes": "Rijp fruit met zoethout en zwarte peper — typisch voor een Syrah. Zachte tannines.", "notes": "", "added": "2026-05-03"}, {"id": "w28", "wine": "Gruber Röschitz St. Laurent", "producer": "Gruber Röschitz", "vintage": "2018", "region": "Weinviertel", "country": "Oostenrijk", "grapes": "St. Laurent", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2020", "drinkUntil": "2028", "peakFrom": "2022", "peakUntil": "2026", "score": 8, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 4, "alcohol": null, "priceValue": "€ 25 - 30", "priceNote": "", "description": "", "tastingNotes": "Bosfruit en kersen, met een vleugje hout en vanille. Fris van stijl.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w29", "wine": "Guado al Melo Bolgheri Superiore 2008", "producer": "Guado al Melo", "vintage": "2008", "region": "Bolgheri, Toscane", "country": "Italië", "grapes": "Cabernet Sauvignon; Merlot; Cabernet Franc", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "declining", "drinkFrom": "2015", "drinkUntil": "2028", "peakFrom": "2018", "peakUntil": "2025", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "description": "", "tastingNotes": "Donker fruit met een vleugje tabak en hout. Stevige maar gladde tannines.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03", "priceNote": ""}, {"id": "w30", "wine": "Isabelle et Pierre Clément Clos des Treilles Menetou-Salon Blanc", "producer": "Isabelle et Pierre Clément", "vintage": "2022", "region": "Menetou-Salon, Loire-vallei", "country": "Frankrijk", "grapes": "Sauvignon Blanc", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2028", "peakFrom": "2024", "peakUntil": "2027", "score": 8, "body": 2, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 16 - 19", "priceNote": "Wijnenwereld.nl €16-19", "description": "", "tastingNotes": "Fris en puur, met citrus en een kruidig accent. Typisch voor een Sauvignon Blanc.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w31", "wine": "Isabelle et Pierre Clément Menetou-Salon Pierre Alexandre", "producer": "Domaine de Châtenoy", "vintage": "2023", "region": "Menetou-Salon, Loire-vallei", "country": "Frankrijk", "grapes": "Sauvignon Blanc", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2028", "peakFrom": "2025", "peakUntil": "2027", "score": 8, "body": 2, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 18 - 22", "priceNote": "Wijnenwereld.nl €16-19", "description": "", "tastingNotes": "Citrus en een kruidige frisheid, iets geconcentreerder dan de andere Sauvignon Blanc.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w32", "wine": "I Veroni I Dòmi Chianti Rufina", "producer": "Fattoria I Veroni", "vintage": "2024", "region": "Chianti Rufina, Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2025", "drinkUntil": "2029", "peakFrom": "2026", "peakUntil": "2028", "score": 7, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.8}, "priceValue": "€ 18 - 24", "priceNote": "", "description": "", "tastingNotes": "Fris en fruitig, met kersen en rode bessen. Licht kruidig en soepel van tannine.", "notes": "", "added": "2026-05-03"}, {"id": "w33", "wine": "I Veroni Vigneto Quona Terraelectae Chianti Rufina Riserva 2022", "producer": "I Veroni", "vintage": "2022", "region": "Chianti Rufina, Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2026", "drinkUntil": "2038", "peakFrom": "2028", "peakUntil": "2035", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"vivino": 4.1}, "priceValue": "€ 24 - 28", "priceNote": "", "description": "", "tastingNotes": "Rode bessen en frambozenjam, met specerijen en witte peper. Stevig — nog jong.", "notes": "", "added": "2026-05-03"}, {"id": "w34", "wine": "Kaltern Saleit Chardonnay", "producer": "Kellerei Kaltern", "vintage": "2023", "region": "Alto Adige", "country": "Italië", "grapes": "Chardonnay", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2030", "peakFrom": "2025", "peakUntil": "2029", "score": 8, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.9, "jamesSuckling": 91}, "priceValue": "€ 14 - 16", "priceNote": "Vinello.eu €14,56", "description": "", "tastingNotes": "Wit steenfruit en rijpe citrus, met een bloemig accent. Levendige, frisse zuren.", "notes": "", "added": "2026-05-03"}, {"id": "w35", "wine": "Kellerei Cantina Terlan Gries Lagrein Riserva 2022", "producer": "Kellerei Cantina Terlan", "vintage": "2022", "region": "Alto Adige", "country": "Italië", "grapes": "Lagrein", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2032", "peakFrom": "2026", "peakUntil": "2030", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vinous": 93, "wineSpectator": 90, "jamesSuckling": 92}, "priceValue": "€ 30 - 44", "priceNote": "Vinello-wijn.nl €30-44", "description": "", "tastingNotes": "Donkere chocolade en koffie, met zwarte peper, pruimen en cassis.", "notes": "", "added": "2026-05-03"}, {"id": "w36", "wine": "La Magdelaine Grés de Montpellier", "producer": "Château d'Exindre (Villa Exindrio)", "vintage": "2023", "region": "Grés de Montpellier, Languedoc", "country": "Frankrijk", "grapes": "Syrah; Grenache noir", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2025", "drinkUntil": "2035", "peakFrom": "2027", "peakUntil": "2033", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 15 - 20", "priceNote": "Boutique Languedoc €15-20", "description": "", "tastingNotes": "Rood fruit met peperige kruiden en een vleugje leer. Diep en geconcentreerd.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w37", "wine": "Le Cinciole Aluigi Campo ai Peri Chianti Classico Gran Selezione", "producer": "Le Cinciole", "vintage": "2021", "region": "Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2025", "drinkUntil": "2041", "peakFrom": "2028", "peakUntil": "2038", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"parker": 94, "vinous": 97}, "priceValue": "€ 55 - 65", "priceNote": "", "description": "", "tastingNotes": "Levendig, met bloedsinaasappel, munt en specerijen. Puur fruit met een vleugje tabak.", "notes": "", "added": "2026-05-03"}, {"id": "w38", "wine": "Le Cinciole Camalaione 2019", "producer": "Le Cinciole", "vintage": "2019", "region": "Toscane", "country": "Italië", "grapes": "Cabernet Sauvignon; Syrah; Merlot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2039", "peakFrom": "2026", "peakUntil": "2034", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"vivino": 4.2, "vinous": 97}, "priceValue": "€ 45 - 55", "priceNote": "Christiaens Wijnhuis €45-55", "description": "", "tastingNotes": "Donker fruit, diep en geconcentreerd, met een vleugje exotische kruiden.", "notes": "", "added": "2026-05-03"}, {"id": "w39", "wine": "Le Cinciole Chianti Classico 2022", "producer": "Le Cinciole", "vintage": "2022", "region": "Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2032", "peakFrom": "2026", "peakUntil": "2030", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"jamesSuckling": 92, "vinous": 92}, "priceValue": "€ 24 - 32", "priceNote": "", "description": "", "tastingNotes": "Rood fruit met sinaasappelschil, rode drop en chocolade. Sappig en zacht van tannine.", "notes": "", "added": "2026-05-03"}, {"id": "w40", "wine": "Moillard-Thomas Bourgogne Chardonnay", "producer": "Moillard-Thomas", "vintage": "2024", "region": "Bourgogne", "country": "Frankrijk", "grapes": "Chardonnay", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2025", "drinkUntil": "2029", "peakFrom": "2026", "peakUntil": "2028", "score": 7, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.9}, "priceValue": "€ 15 - 20", "priceNote": "", "description": "", "tastingNotes": "Sappig geel fruit, met een subtiele frisheid. Klassieke, ronde witte Bourgogne.", "notes": "", "added": "2026-05-03"}, {"id": "w41", "wine": "Nipozzano Riserva 2022", "producer": "Frescobaldi", "vintage": "2022", "region": "Chianti Rufina, Toscane", "country": "Italië", "grapes": "Sangiovese; Cabernet Sauvignon; Merlot; Cabernet Franc; Colorino", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2032", "peakFrom": "2026", "peakUntil": "2030", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"jamesSuckling": 92, "wineSpectator": 90, "vinous": 90}, "priceValue": "€ 18 - 19", "priceNote": "Gall & Gall €19,29, Perfectewijn.nl €18,95", "description": "", "tastingNotes": "Bramen en donkere kersen, met kruidnagel en rozemarijn. Fijne tannines.", "notes": "", "added": "2026-05-03"}, {"id": "w42", "wine": "Pasal de Esile Godello Sobre Lías Finas", "producer": "Bodegas Gallegas", "vintage": "2024", "region": "Valdeorras", "country": "Spanje", "grapes": "Godello", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2025", "drinkUntil": "2030", "peakFrom": "2026", "peakUntil": "2029", "score": 8, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 15 - 20", "priceNote": "Van Hende Wijnimport €15-20", "description": "", "tastingNotes": "Appel en peer, fris en zacht, met een mooie, milde zuurgraad.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-09"}, {"id": "w43", "wine": "Pass Chardonnay", "producer": "Weingut Pass GmbH", "vintage": "2025", "region": "Weinviertel", "country": "Oostenrijk", "grapes": "Chardonnay", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2025", "drinkUntil": "2028", "peakFrom": "2025", "peakUntil": "2027", "score": 7, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 3, "alcohol": null, "priceValue": "€ 12 - 15", "priceNote": "", "description": "", "tastingNotes": "Fris en fruitig, met rijp appel- en perenfruit en een romige toets.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w44", "wine": "Pass Gemischter Satz", "producer": "Weingut Pass", "vintage": "2025", "region": "Weinviertel", "country": "Oostenrijk", "grapes": "Field Blend", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2026", "drinkUntil": "2029", "peakFrom": "2026", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 13 - 16", "priceNote": "Drinks&Co €13-16", "description": "", "tastingNotes": "Kruidig en levendig, bloemig en fruitig — fris van smaak.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w45", "wine": "Pass Zweigelt Ried Hohenrain Reserve 2023", "producer": "Weingut Pass GmbH", "vintage": "2023", "region": "Weinviertel", "country": "Oostenrijk", "grapes": "Zweigelt", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2030", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 18 - 22", "priceNote": "", "description": "", "tastingNotes": "Rijp donker fruit met peperige kruiden. Zachte maar geconcentreerde tannines — een serieuze wijn.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w46", "wine": "Petresco", "producer": "Le Cinciole", "vintage": "2021", "region": "Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2025", "drinkUntil": "2041", "peakFrom": "2028", "peakUntil": "2038", "score": 9, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "ratings": {"jamesSuckling": 93}, "priceValue": "€ 60 - 68", "priceNote": "", "description": "", "tastingNotes": "Rode en zwarte kersen, met drop, cacao en een vleugje thee en peper.", "notes": "", "added": "2026-05-03"}, {"id": "w47", "wine": "Pitnauer Bienenfresser Zweigelt", "producer": "Weingut Familie Pitnauer", "vintage": "2022", "region": "Carnuntum", "country": "Oostenrijk", "grapes": "Zweigelt", "type": "red", "quantity": 4, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2030", "peakFrom": "2025", "peakUntil": "2029", "score": 8, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 20 - 25", "priceNote": "De Wijn Genoten Maarssen €20-25", "description": "", "tastingNotes": "Kersen, chocolade en nougat. Romig van textuur, sappig met stevige tannines.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w48", "wine": "Pitnauer Bienenfresser Zweigelt", "producer": "Weingut Familie Pitnauer", "vintage": "2023", "region": "Carnuntum", "country": "Oostenrijk", "grapes": "Zweigelt", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2029", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 20 - 25", "priceNote": "De Wijn Genoten Maarssen €20-25", "description": "", "tastingNotes": "Kersen, chocolade en nougat. Romig van textuur, sappig met stevige tannines.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w49", "wine": "Réserve des Chapelains Châteauneuf-du-Pape", "producer": "Alexis Establet", "vintage": "2001", "region": "Châteauneuf-du-Pape, Rhônevallei", "country": "Frankrijk", "grapes": "Grenache; Syrah; Mourvèdre", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2005", "drinkUntil": "2022", "peakFrom": "2008", "peakUntil": "2015", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 25 - 30", "priceNote": "", "description": "", "tastingNotes": "Rijp donker fruit met mediterrane kruiden. Een klassieke, kruidige Châteauneuf-du-Pape.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w50", "wine": "Saint Maurice Poujol Lacoste", "producer": "Cave Saint Maurice", "vintage": null, "region": "Cévennes, Languedoc", "country": "Frankrijk", "grapes": "Grenache; Syrah; Carignan", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2027", "peakFrom": "2024", "peakUntil": "2026", "score": 7, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 10 - 13", "priceNote": "", "description": "", "tastingNotes": "Rijp, zongerijpt fruit met kruidige tonen. Vol en fruitig, typisch voor de Languedoc.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w51", "wine": "Sankt Laurent", "producer": "Weingut Rosi Schuster", "vintage": "2022", "region": "Burgenland", "country": "Oostenrijk", "grapes": "Sankt Laurent", "type": "red", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2030", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.7}, "priceValue": "€ 24 - 32", "priceNote": "Bovino.nl €24-32", "description": "", "tastingNotes": "Kers en rode bessen, met aardse tonen. Zachte tannines en een lange nasmaak.", "notes": "", "added": "2026-05-03"}, {"id": "w52", "wine": "Tenuta Albrizzi Salento Rosso", "producer": "Cantine Due Palme", "vintage": null, "region": "Salento, Apulië", "country": "Italië", "grapes": "Negroamaro; Cabernet Sauvignon", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2028", "peakFrom": "2025", "peakUntil": "2027", "score": 7, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "ratings": {"vivino": 3.9}, "priceValue": "€ 10 - 14", "priceNote": "", "description": "", "tastingNotes": "Rijp fruit met specerijen en een rokerig accent. Warm en vol van smaak.", "notes": "", "added": "2026-05-03"}, {"id": "w53", "wine": "Tiefenbrunner Turmhof Blauburgunder Pinot Noir 2023", "producer": "Tiefenbrunner", "vintage": "2023", "region": "Alto Adige", "country": "Italië", "grapes": "Pinot Noir", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2029", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 3, "sweetness": 1, "tannin": 2, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.9}, "priceValue": "€ 20 - 25", "priceNote": "PerfecteWijn.nl €24,95", "description": "", "tastingNotes": "Rode bessen en zure kers, met gedroogde kruiden en een geroosterd accent.", "notes": "", "added": "2026-05-03"}, {"id": "w54", "wine": "Umathum Gelber & Roter Traminer", "producer": "Weingut Umathum", "vintage": "2016", "region": "Burgenland", "country": "Oostenrijk", "grapes": "Gelber Traminer; Roter Traminer", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "declining", "drinkFrom": "2018", "drinkUntil": "2026", "peakFrom": "2020", "peakUntil": "2024", "score": 8, "body": 4, "sweetness": 2, "tannin": 1, "acidity": 3, "alcohol": null, "ratings": {"vivino": 4.0}, "priceValue": "€ 19 - 23", "priceNote": "oostenrijksewijn.nl €19-23", "description": "", "tastingNotes": "Honing en witte bloemen, kruidig en aromatisch. Toch fris en droog van smaak.", "notes": "", "added": "2026-05-03"}, {"id": "w55", "wine": "Ursa Maior Reserva Rioja 2008", "producer": "Bodegas Undarri", "vintage": "2008", "region": "Rioja", "country": "Spanje", "grapes": "Tempranillo; Garnacha; Mazuelo", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2015", "drinkUntil": "2025", "peakFrom": "2018", "peakUntil": "2023", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "description": "", "tastingNotes": "Kersen en zwart fruit, met vanille en een vleugje hout. Een klassieke Rioja met een lange nasmaak.", "notes": "", "added": "2026-05-03", "priceNote": ""}, {"id": "w56", "wine": "Valdifalco Morellino di Scansano 2004", "producer": "Tenuta Valdifalco", "vintage": "2004", "region": "Maremma, Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "past_prime", "drinkFrom": "2006", "drinkUntil": "2012", "peakFrom": "2007", "peakUntil": "2010", "score": 7, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 15 - 20", "priceNote": "", "description": "", "tastingNotes": "Rood fruit en kers, met een aards accent. Fris en jong van stijl.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w57", "wine": "Vigna Colonneto Terraelectae Chianti Rufina Riserva", "producer": "Villa Travignoli", "vintage": "2022", "region": "Chianti Rufina, Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2026", "drinkUntil": "2038", "peakFrom": "2028", "peakUntil": "2035", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "priceValue": "€ 40 - 45", "priceNote": "Travino.it €45", "description": "", "tastingNotes": "Veenbes en framboos, met een vleugje hout. Ontwikkelt zich richting bosvruchten en kruiden.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w58", "wine": "Villa Exindrio Grain de Nuit", "producer": "Villa Exindrio", "vintage": "2023", "region": "Languedoc-Roussillon", "country": "Frankrijk", "grapes": "Syrah; Grenache", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2025", "drinkUntil": "2035", "peakFrom": "2027", "peakUntil": "2032", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 3, "alcohol": null, "priceValue": "€ 15 - 22", "priceNote": "", "description": "", "tastingNotes": "Rijp donker fruit met mediterrane kruiden en zwarte peper. Een gulle, zuiderse wijn.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w59", "wine": "Villa Travignoli Vigna Colonneto Chianti Rùfina Riserva", "producer": "Villa Travignoli", "vintage": "2022", "region": "Toscane", "country": "Italië", "grapes": "Sangiovese", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2025", "drinkUntil": "2035", "peakFrom": "2027", "peakUntil": "2033", "score": 8, "body": 4, "sweetness": 1, "tannin": 4, "acidity": 4, "alcohol": null, "priceValue": "€ 40 - 45", "priceNote": "Travino.it €40-45", "description": "", "tastingNotes": "Dezelfde 2022 Riserva als de andere fles van dit wijnhuis.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w60", "wine": "Vincent Grall Sancerre Le Grall", "producer": "Vincent Grall", "vintage": "2023", "region": "Sancerre, Loire-vallei", "country": "Frankrijk", "grapes": "Sauvignon Blanc", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2030", "peakFrom": "2025", "peakUntil": "2029", "score": 8, "body": 2, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 3.9}, "priceValue": "€ 22 - 32", "priceNote": "Wijn op Dronk €22-32", "description": "", "tastingNotes": "Citrus met een kruidig, fris accent en krokante zuren.", "notes": "", "added": "2026-05-03"}, {"id": "w61", "wine": "Vincent Grall Sancerre Le Manoir", "producer": "Vincent Grall", "vintage": "2023", "region": "Sancerre, Loire-vallei", "country": "Frankrijk", "grapes": "Sauvignon Blanc", "type": "white", "quantity": 2, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2029", "peakFrom": "2025", "peakUntil": "2028", "score": 8, "body": 2, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 4.0}, "priceValue": "€ 22 - 32", "priceNote": "Wijn op Dronk €31,69", "description": "", "tastingNotes": "Exotisch fruit met een vleugje eikenhout en vanille. Vol van smaak, lekker bij eten.", "notes": "", "added": "2026-05-03"}, {"id": "w62", "wine": "Weingut Familie Pitnauer Carnuntum Rot Classic Cuvée", "producer": "Weingut Familie Pitnauer", "vintage": "2022", "region": "Carnuntum", "country": "Oostenrijk", "grapes": "Zweigelt; Blaufränkisch; Merlot", "type": "red", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2027", "peakFrom": "2024", "peakUntil": "2026", "score": 8, "body": 3, "sweetness": 1, "tannin": 3, "acidity": 3, "alcohol": null, "priceValue": "€ 12 - 15", "priceNote": "", "description": "", "tastingNotes": "Donkere bessen en sappige kersen, met een kruidig vleugje hout.", "ratings": {}, "currentPrice": null, "notes": "", "added": "2026-05-03"}, {"id": "w63", "wine": "Xión Albariño", "producer": "Attis Bodega & Viñedos", "vintage": "2023", "region": "Rías Baixas", "country": "Spanje", "grapes": "Albariño", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2024", "drinkUntil": "2027", "peakFrom": "2024", "peakUntil": "2026", "score": 8, "body": 2, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "priceValue": "€ 15 - 22", "priceNote": "Vinissimus €14,50-15,10", "description": "", "tastingNotes": "Fris wit fruit en citrus. Volle smaak met heerlijke, frisse zuren.", "notes": "", "added": "2026-05-03"}, {"id": "w64", "wine": "Zillinger Hirschenreyn Grüner Veltliner", "producer": "Herbert Zillinger", "vintage": "2021", "region": "Weinviertel", "country": "Oostenrijk", "grapes": "Grüner Veltliner", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "USD", "bottleSize": null, "storage": "assumed_ideal", "drinkingWindowStatus": "prime", "drinkFrom": "2023", "drinkUntil": "2031", "peakFrom": "2025", "peakUntil": "2029", "score": 9, "body": 3, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": null, "ratings": {"vivino": 4.1}, "priceValue": "€ 17 - 20", "priceNote": "PerfecteWijn.nl €17-20", "description": "", "tastingNotes": "Rijp geel fruit met kruidige, zomerse tonen. Fris en levendig.", "notes": "", "added": "2026-05-03"}, {"id": "w66", "wine": "Kiedrich Gräfenberg Riesling Trocken GG", "producer": "Weingut Robert Weil", "vintage": "2023", "region": "Kiedrich, Rheingau", "country": "Duitsland", "grapes": "Riesling", "type": "white", "quantity": 1, "purchasePrice": null, "currency": "EUR", "bottleSize": "750ml", "storage": "assumed_ideal", "drinkingWindowStatus": "approaching", "drinkFrom": "2026", "drinkUntil": "2050", "peakFrom": "2030", "peakUntil": "2045", "score": 9, "body": 4, "sweetness": 1, "tannin": 1, "acidity": 4, "alcohol": 13, "ratings": {"parker": 97, "decanter": 95, "vinous": 98, "jamesSuckling": 97}, "priceValue": "€ 59", "priceNote": "Vonk & Brandt €59", "description": "", "tastingNotes": "Mandarijn, citrus en abrikoos, met een bloemig accent. Romig en krachtig van smaak.", "notes": "", "added": "2026-08-17", "bottlePhoto": "data:image/png;base64,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"}];

const STORAGE_KEY = "cellar-wines";
const CURRENT_YEAR = 2026;

const TYPE_META = {
  red: { label: "Rood", color: "#B0123F", dot: "#B0123F", tintText: "#A6392E", tintBg: "rgba(166,57,46,0.14)" },
  white: { label: "Wit", color: "#D4A72C", dot: "#E9CE72", tintText: "#9A7A1E", tintBg: "rgba(212,167,44,0.15)" },
  rose: { label: "Rosé", color: "#E0577E", dot: "#F2A9C1", tintText: "#C24E72", tintBg: "rgba(224,87,126,0.14)" },
  sparkling: { label: "Mousserend", color: "#D4A72C", dot: "#F0DA8E", tintText: "#9A7A1E", tintBg: "rgba(212,167,44,0.15)" },
  orange: { label: "Oranje", color: "#DB7B32", dot: "#F1B278", tintText: "#B4611F", tintBg: "rgba(219,123,50,0.15)" },
};

const STATUS_META = {
  approaching: { label: "Laten liggen", color: "#4C7EB0", tintBg: "rgba(76,126,176,0.14)" },
  prime: { label: "Op zijn best", color: "#2F9B62", tintBg: "rgba(47,155,98,0.14)" },
  declining: { label: "Snel opdrinken", color: "#D19A2E", tintBg: "rgba(209,154,46,0.16)" },
  past_prime: { label: "Over de top", color: "#A6392E", tintBg: "rgba(166,57,46,0.14)" },
};

function computeStatus(w) {
  if (w.drinkingWindowStatus) return w.drinkingWindowStatus;
  const from = parseInt(w.peakFrom || w.drinkFrom);
  const until = parseInt(w.peakUntil || w.drinkUntil);
  const end = parseInt(w.drinkUntil);
  if (CURRENT_YEAR < from) return "approaching";
  if (CURRENT_YEAR <= until) return "prime";
  if (CURRENT_YEAR <= end) return "declining";
  return "past_prime";
}

function formatGrapes(grapes) {
  if (!grapes) return "";
  return grapes.split(/\s*;\s*/).filter(Boolean).join(" • ");
}

const TASTE_CATEGORIES = {
  white_light: { group: "Witte wijn", label: "Fris & licht" },
  white_fruity: { group: "Witte wijn", label: "Droog & fruitig" },
  white_rich: { group: "Witte wijn", label: "Vol & rijk" },
  red_light: { group: "Rode wijn", label: "Licht & zacht" },
  red_round: { group: "Rode wijn", label: "Soepel & rond" },
  red_firm: { group: "Rode wijn", label: "Stevig & vol" },
  rose: { group: "Overig", label: "Rosé" },
  sparkling: { group: "Overig", label: "Mousserend" },
  orange: { group: "Overig", label: "Oranje" },
};
// Gebruikt dezelfde onderliggende velden (lichaam, tannine, zuur) als de
// bestaande smaakprofiel-pilletjes op de kaart, maar dan ingedeeld volgens de
// categorieën die je ook bij Grapedistrict/Gall & Gall tegenkomt: per
// wijnkleur een eigen, herkenbare indeling in plaats van één generieke schaal.
function tasteCategory(w) {
  const body = w.body || 3, tannin = w.tannin || 1;
  if (w.type === "white") {
    if (body <= 2) return "white_light";
    if (body >= 4) return "white_rich";
    return "white_fruity";
  }
  if (w.type === "red") {
    if (body <= 2) return "red_light";
    if (tannin >= 4) return "red_firm";
    return "red_round";
  }
  if (w.type === "rose") return "rose";
  if (w.type === "sparkling") return "sparkling";
  if (w.type === "orange") return "orange";
  return "red_round";
}

function tasteProfile(w) {
  const body = w.body || 3, tannin = w.tannin || 1, acid = w.acidity || 3, sweet = w.sweetness || 1;
  const tags = [];
  // body
  if (body <= 2) tags.push("Licht");
  else if (body >= 4) tags.push("Vol");
  else tags.push("Medium body");
  // fruit / character by type
  if (w.type === "red") {
    tags.push(body >= 4 ? "Donker fruit" : "Rood fruit");
    if (tannin >= 4) tags.push("Stevige tannines");
    else if (tannin <= 2) tags.push("Zachte tannines");
    else tags.push("Ronde tannines");
  } else if (w.type === "white") {
    tags.push(acid >= 4 ? "Citrus" : "Steenfruit");
    tags.push(acid >= 4 ? "Fris" : "Zacht zuur");
  } else if (w.type === "rose") {
    tags.push("Rood fruit"); tags.push("Fris");
  } else if (w.type === "sparkling") {
    tags.push("Citrus"); tags.push("Mousserend");
  } else if (w.type === "orange") {
    tags.push("Gedroogd fruit"); tags.push("Kruidig");
  }
  // sweetness
  if (sweet >= 3) tags.push("Zoet");
  else if (sweet === 2) tags.push("Halfdroog");
  else tags.push("Droog");
  // acidity for reds/orange
  if ((w.type === "red" || w.type === "orange") && acid >= 4) tags.push("Levendig zuur");
  return tags.slice(0, 4);
}

const RATING_SOURCES = {
  vivino: "Vivino",
  cellarTracker: "CellarTracker",
  parker: "Wine Advocate",
  wineSpectator: "Wine Spectator",
  decanter: "Decanter",
  vinous: "Vinous",
  jamesSuckling: "James Suckling",
  hamersma: "Hamersma",
};

const VIVINO_TABLE = [
  [3.5, 80], [3.6, 82], [3.7, 84], [3.8, 86], [3.9, 88], [4.0, 90],
  [4.1, 91], [4.2, 92], [4.3, 93], [4.4, 94], [4.5, 95], [4.6, 96], [4.7, 97],
];
const JS_TABLE = [
  [90, 88], [91, 89], [92, 90], [93, 91], [94, 92], [95, 93],
  [96, 94], [97, 95], [98, 96], [99, 98], [100, 100],
];

function interpolateTable(table, x) {
  if (x <= table[0][0]) {
    const [x0, y0] = table[0], [x1, y1] = table[1];
    return y0 + ((y1 - y0) / (x1 - x0)) * (x - x0);
  }
  if (x >= table[table.length - 1][0]) {
    const [x0, y0] = table[table.length - 2], [x1, y1] = table[table.length - 1];
    return y1 + ((y1 - y0) / (x1 - x0)) * (x - x1);
  }
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i], [x1, y1] = table[i + 1];
    if (x >= x0 && x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return x;
}

function parseAiJson(text) {
  let clean = text.replace(/```json|```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const firstBracket = clean.indexOf("[");
  // Bepaal of het antwoord een object ({...}) of een lijst ([...]) is, en pak
  // het bijpassende haakjespaar. Anders knipt een op-objecten-gerichte extractie
  // per ongeluk de buitenste [ ] van een lijst-antwoord weg (zoals bij
  // gerechtsuggesties, die als JSON-array terugkomen).
  const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
  if (isArray) {
    const lastBracket = clean.lastIndexOf("]");
    if (lastBracket > firstBracket) clean = clean.slice(firstBracket, lastBracket + 1);
  } else {
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }
  }
  return JSON.parse(clean);
}

// Leest een fetch-response veilig als JSON. Bij een niet-JSON-antwoord (zoals
// een Vercel-tijdslimiet-foutpagina) geeft dit een leesbare fout terug in plaats
// van dat response.json() een cryptische Safari-fout gooit ("The string did not
// match the expected pattern") die de échte oorzaak verbergt.
async function safeJsonResponse(response) {
  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(
      `Onverwacht antwoord van de server (status ${response.status}). ` +
      `Dit gebeurt meestal bij een timeout op Vercel. Details: ${rawText.slice(0, 300) || "(leeg antwoord)"}`
    );
  }
}

function normalizeRating(key, val) {
  if (typeof val !== "number" || isNaN(val)) return null;
  if (key === "vivino") return interpolateTable(VIVINO_TABLE, val);
  if (key === "jamesSuckling") return interpolateTable(JS_TABLE, val);
  return val; // CellarTracker, Decanter, Wine Spectator, Wine Advocate, Vinous, Hamersma: 1-op-1
}

function avgRating(w) {
  if (!w.ratings) return null;
  const vals = Object.entries(w.ratings).map(([k, v]) => normalizeRating(k, v)).filter(v => v !== null);
  if (vals.length === 0) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { avg: Math.round(avg), count: vals.length };
}

function scoreValue(w) {
  const ar = avgRating(w);
  return ar ? ar.avg : null;
}

function ratingLabel(score) {
  if (score >= 95) return "Uitzonderlijk";
  if (score >= 92) return "Uitstekend";
  if (score >= 89) return "Zeer goed";
  if (score >= 86) return "Erg goed";
  if (score >= 83) return "Goed";
  if (score >= 80) return "Alledaags";
  return "Matig";
}

function scoreColor(score) {
  if (score >= 95) return "#146B33";
  if (score >= 92) return "#2E8A3A";
  if (score >= 89) return "#5C9A34";
  if (score >= 86) return "#8A9A2E";
  if (score >= 83) return "#B08A2E";
  if (score >= 80) return "#C07A2E";
  return "#B0123F";
}

function scoreColorSet(score) {
  if (score >= 95) return { text: "#146B33", bg: "rgba(20,107,51,0.12)" };
  if (score >= 92) return { text: "#2E8A3A", bg: "rgba(46,138,58,0.12)" };
  if (score >= 89) return { text: "#5C9A34", bg: "rgba(92,154,52,0.12)" };
  if (score >= 86) return { text: "#8A9A2E", bg: "rgba(138,154,46,0.12)" };
  if (score >= 83) return { text: "#B08A2E", bg: "rgba(176,138,46,0.12)" };
  if (score >= 80) return { text: "#C07A2E", bg: "rgba(192,122,46,0.12)" };
  return { text: "#A6392E", bg: "rgba(166,57,46,0.1)" };
}

function CardScore({ w }) {
  const ar = avgRating(w);
  if (!ar) return null;
  const c = scoreColor(ar.avg);
  return <span className="card-score"><span className="card-score-num" style={{ color: c }}>{ar.avg}</span><span className="card-score-max">/100</span> <span className="card-score-label" style={{ color: c }}>{ratingLabel(ar.avg)}</span></span>;
}

function VivinoStars({ w }) {
  const v = w.ratings && w.ratings.vivino;
  if (typeof v !== "number") return null;
  const full = Math.round(v * 2) / 2;
  return (
    <span className="vivino-stars" title={`Vivino: ${v.toFixed(1)}/5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className="star-char">{i <= full ? "★" : (i - 0.5 === full ? "⯨" : "☆")}</span>
      ))}
      <span className="vivino-num">{v.toFixed(1)}</span>
    </span>
  );
}

const COUNTRY_FLAGS = {
  "France": "🇫🇷", "Italy": "🇮🇹", "Spain": "🇪🇸", "Germany": "🇩🇪", "Austria": "🇦🇹",
  "Netherlands": "🇳🇱", "Chile": "🇨🇱", "Portugal": "🇵🇹", "Greece": "🇬🇷", "USA": "🇺🇸",
  "United States": "🇺🇸", "Argentina": "🇦🇷", "South Africa": "🇿🇦", "Australia": "🇦🇺",
  "New Zealand": "🇳🇿", "Hungary": "🇭🇺", "Slovenia": "🇸🇮", "Croatia": "🇭🇷", "Georgia": "🇬🇪",
};
function flagFor(country) {
  return COUNTRY_FLAGS[country] || "";
}

function luminance(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function contrastText(hex) {
  return luminance(hex) > 140 ? "#2A231D" : "#F3EDE1";
}

function WineGlassLoader() {
  const grapes = [
    { cx: 20, cy: 12 },
    { cx: 14, cy: 20 }, { cx: 26, cy: 20 },
    { cx: 8, cy: 28 }, { cx: 20, cy: 28 }, { cx: 32, cy: 28 },
  ];
  return (
    <svg width="36" height="36" viewBox="0 0 40 34" className="grape-loader">
      <path className="grape-stem" d="M20,1 C22,1 22,4 20,7" fill="none" strokeLinecap="round" />
      {grapes.map((g, i) => (
        <circle key={i} cx={g.cx} cy={g.cy} r="4.3" className="grape-dot" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </svg>
  );
}

function CorkscrewIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="5" rx="2.5" />
      <path d="M12 7v2" />
      <path d="M12 9c2 0.6 2 1.8 0 2.4c-2 0.6 -2 1.8 0 2.4c2 0.6 2 1.8 0 2.4c-2 0.6 -2 1.8 0 2.4c2 0.6 2 1.8 0 2.4v1.6" />
    </svg>
  );
}

function displayName(w) {
  let name = w.wine;
  if (w.vintage) name = name.replace(new RegExp(`\\s*\\b${w.vintage}\\b\\s*`, "g"), " ");
  if (w.producer) {
    const esc = w.producer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    name = name.replace(new RegExp(`\\s*\\b${esc}\\b\\s*`, "gi"), " ");
  }
  return name.replace(/^[\s\-–,]+|[\s\-–,]+$/g, "").trim() || w.wine;
}

function WineCard({ w, onOpen, onExpand, expanded, onMatchDish, onSetQuantity, onUpdateWine, onDelete, onCardCamera }) {
  const cardRef = useRef(null);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [tempQty, setTempQty] = useState(w.quantity);
  const [showZeroConfirm, setShowZeroConfirm] = useState(false);
  const [pendingZeroAction, setPendingZeroAction] = useState(null); // "open" | "setQty"
  const [refreshStatus, setRefreshStatus] = useState("idle"); // idle | loading | error
  const [refreshErrorDetail, setRefreshErrorDetail] = useState("");
  const [priceRefreshStatus, setPriceRefreshStatus] = useState("idle"); // idle | loading | error
  const [priceRefreshErrorDetail, setPriceRefreshErrorDetail] = useState("");

  function handleOpenClick(e) {
    e.stopPropagation();
    if (w.quantity === 1) {
      setPendingZeroAction("open");
      setShowZeroConfirm(true);
    } else {
      onOpen(w.id);
    }
  }

  function handleQtySave() {
    if (tempQty === 0) {
      setShowQtyModal(false);
      setPendingZeroAction("setQty");
      setShowZeroConfirm(true);
    } else {
      onSetQuantity(w.id, tempQty);
      setShowQtyModal(false);
    }
  }

  function confirmKeepAtZero() {
    if (pendingZeroAction === "open") onOpen(w.id);
    else if (pendingZeroAction === "setQty") onSetQuantity(w.id, 0);
    setShowZeroConfirm(false);
    setPendingZeroAction(null);
  }

  function confirmDeleteWine() {
    onDelete(w.id);
    setShowZeroConfirm(false);
    setPendingZeroAction(null);
  }

  async function refreshScores() {
    if (refreshStatus === "loading") return;
    setRefreshStatus("loading");
    const wineInfo = {
      naam: w.wine,
      producent: w.producer,
      jaargang: w.vintage,
      land: w.country,
      streek: w.region,
      druiven: w.grapes,
    };
    const bronnen = Object.values(RATING_SOURCES).join(", ");
    const prompt = `Je bent een wijnexpert met toegang tot actuele webzoekresultaten. Zoek de meest recente en actuele scores op voor deze specifieke wijn:
${JSON.stringify(wineInfo)}

Zoek naar scores van deze bronnen (alleen invullen als je een score écht hebt gevonden, nooit verzinnen): ${bronnen}. Vivino als getal 1-5 met 1 decimaal, alle andere bronnen als score op 100.

Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat (laat een bron weg als je niets vindt, verzin nooit scores):
{"ratings": {"vivino": 4.2}}`;

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await safeJsonResponse(response);
      if (data.error) throw new Error(`API-fout: ${data.error.type || ""} ${data.error.message || ""}`.trim());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const parsed = parseAiJson(text);
      const updates = {};
      if (parsed.ratings && typeof parsed.ratings === "object") updates.ratings = { ...w.ratings, ...parsed.ratings };
      onUpdateWine(w.id, updates);
      setRefreshStatus("idle");
    } catch (e) {
      setRefreshErrorDetail(String((e && e.message) || e || "onbekende fout"));
      setRefreshStatus("error");
      setTimeout(() => setRefreshStatus("idle"), 6000);
    }
  }

  async function refreshPrice() {
    if (priceRefreshStatus === "loading") return;
    setPriceRefreshStatus("loading");
    const wineInfo = {
      naam: w.wine,
      producent: w.producer,
      jaargang: w.vintage,
      land: w.country,
      streek: w.region,
    };
    const prompt = `Je bent een wijnexpert met toegang tot actuele webzoekresultaten. Zoek de meest actuele winkelprijs op voor deze specifieke wijn, uitsluitend bij winkels in Nederland of de EU:
${JSON.stringify(wineInfo)}

Geef in "priceValue" een afgeronde prijs(range) zonder cijfers achter de komma, bijvoorbeeld "€ 56 - 65" of "€ 24" — nooit decimalen.
Geef in "priceNote" ALLEEN de naam van de winkel gevolgd door de (eveneens afgeronde) prijs bij die winkel, bijvoorbeeld "Wijnvoordeel.nl € 24" — geen verdere toelichting, geen extra zinnen. Vind je meerdere winkels, scheid ze dan met een komma. Vind je geen winkel in NL of de EU maar wel een algemene prijsindicatie, laat "priceNote" dan leeg.

Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat (gebruik null als je niets vindt, verzin nooit een prijs):
{"priceValue": "€ 56 - 65", "priceNote": "Wijnvoordeel.nl € 60"}`;

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await safeJsonResponse(response);
      if (data.error) throw new Error(`API-fout: ${data.error.type || ""} ${data.error.message || ""}`.trim());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const parsed = parseAiJson(text);
      const updates = {};
      if (parsed.priceValue) updates.priceValue = parsed.priceValue;
      updates.priceNote = parsed.priceNote || "";
      onUpdateWine(w.id, updates);
      setPriceRefreshStatus("idle");
    } catch (e) {
      setPriceRefreshErrorDetail(String((e && e.message) || e || "onbekende fout"));
      setPriceRefreshStatus("error");
      setTimeout(() => setPriceRefreshStatus("idle"), 6000);
    }
  }

  useEffect(() => {
    if (expanded && cardRef.current) {
      const stickyBar = document.querySelector(".cellar-header");
      const stickyHeight = stickyBar ? stickyBar.offsetHeight : 0;
      const rect = cardRef.current.getBoundingClientRect();
      const targetTop = window.scrollY + rect.top - stickyHeight;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }, [expanded]);

  const status = computeStatus(w);
  const sm = STATUS_META[status] || STATUS_META.prime;
  const tm = TYPE_META[w.type] || TYPE_META.red;
  const empty = w.quantity <= 0;
  const ar = avgRating(w);
  const hasPhoto = Boolean(w.bottlePhoto);
  const origin = [w.region, w.country].filter(Boolean).join(", ");

  return (
    <>
    <div ref={cardRef} className="card-scene" onClick={() => onExpand(w.id)}>
      <div className="card-perspective">
      <div className={"card-flip" + (expanded ? " is-flipped" : "")}>
        {/* ---------- FRONT — poster: bottle photo only if available ---------- */}
        <div className={"card-face card-front" + (empty ? " is-empty" : "")}>
          <span className="front-status-pill" style={{ color: sm.color, borderColor: sm.color }}>{sm.label}</span>

          <div className={"front-text-col" + (hasPhoto ? "" : " no-photo")}>
            {w.vintage && <span className="front-vintage">{w.vintage}</span>}
            <h1 className="front-title">{displayName(w)}</h1>
            <div className="front-producer">{w.producer}</div>
            {origin && <div className="front-origin">{origin}</div>}

            {ar ? (
              <div className="front-score" style={{ color: scoreColorSet(ar.avg).text }}>
                <span className="front-score-num">{ar.avg}<span className="front-score-max">/100</span></span>
                <span className="front-score-label">{ratingLabel(ar.avg)}</span>
              </div>
            ) : (
              <div className="front-score">
                <span className="front-score-label front-score-label-muted">Nog geen score</span>
              </div>
            )}
          </div>

          {hasPhoto && (
            <div className="front-bottle-col">
              <img src={w.bottlePhoto} alt={w.wine} className="bottle-photo" />
            </div>
          )}

          {!hasPhoto && onCardCamera && (
            <button
              className="front-camera-btn-secondary"
              onClick={(e) => { e.stopPropagation(); onCardCamera(w.id); }}
              title="Foto maken voor deze wijn"
            >
              <Camera size={16} />
            </button>
          )}

        </div>

        {/* ---------- BACK — detail sheet ---------- */}
        <div className="card-face card-back">
          <div className="card-back-inner">
            <div className="back-scroll-area">
            <div className="back-header">
              <div className="back-title">{displayName(w)}</div>
              <div className="back-sub"><span className="back-producer-bold">{w.producer}</span>{origin ? ` · ${origin}` : ""}</div>
            </div>

            <div className="taste-tags-wrap">
              <div className="taste-tags">
                {tasteProfile(w).map((t, i) => (
                  <span key={i} className="taste-tag" style={{ color: tm.tintText, background: tm.tintBg }}>{t}</span>
                ))}
              </div>
            </div>

            {/* ---- Drinkvenster ---- */}
            <div className="back-row">
              <div className="back-row-icon" style={{ background: sm.tintBg, color: sm.color }}><Wine size={18} /></div>
              <div className="back-row-body">
                <div className="back-row-title" style={{ color: sm.color }}>{sm.label}</div>
                {w.peakFrom && w.peakUntil && (
                  <div className="back-row-sub">Piek: {w.peakFrom}–{w.peakUntil}</div>
                )}
              </div>
            </div>

            {/* ---- Druiven + proefnotities (samengevoegd) ---- */}
            {(w.grapes || w.tastingNotes) && (
              <div className="back-row">
                <div className="back-row-icon" style={{ background: tm.tintBg, color: tm.tintText }}><Grape size={18} /></div>
                <div className="back-row-body">
                  {w.grapes && (
                    <div className="back-row-title back-row-title-with-badge">
                      {formatGrapes(w.grapes)}
                      {w.organic && (
                        <span className="organic-badge" title={w.organic === "biodynamic" ? "Biodynamisch" : "Biologisch"}>
                          <Leaf size={11} />
                        </span>
                      )}
                    </div>
                  )}
                  {w.tastingNotes && (
                    <p className="back-row-sub back-notes-text tasting-notes-clamp">{w.tastingNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* ---- Score ---- */}
            <div className="back-row">
              {ar ? (
                <>
                  <div className="back-row-icon back-score-circle" style={{ background: scoreColorSet(ar.avg).bg, color: scoreColorSet(ar.avg).text }}>
                    {ar.avg}
                  </div>
                  <div className="back-row-body">
                    <div className="back-row-title" style={{ color: scoreColorSet(ar.avg).text }}>{ratingLabel(ar.avg)}</div>
                    {w.ratings && Object.entries(RATING_SOURCES).some(([key]) => typeof w.ratings[key] === "number") && (
                      <div className="back-row-sub">
                        {Object.entries(RATING_SOURCES).filter(([key]) => typeof w.ratings[key] === "number").map(([key, label], i, arr) => {
                          const val = w.ratings[key];
                          const display = key === "vivino" ? `${val.toFixed(1)}/5` : `${val}/100`;
                          return <span key={key}>{label} {display}{i < arr.length - 1 ? " · " : ""}</span>;
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="back-row-icon"><Wine size={18} /></div>
                  <div className="back-row-body">
                    <div className="back-row-sub">Nog geen ratings gevonden.</div>
                  </div>
                </>
              )}
              <button
                className={"refresh-btn" + (refreshStatus === "loading" ? " refresh-btn-spinning" : "")}
                onClick={(e) => { e.stopPropagation(); refreshScores(); }}
                disabled={refreshStatus === "loading"}
                title="Zoek actuele scores en prijzen opnieuw op"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {refreshStatus === "error" && (
              <div className="back-plain-text" style={{ color: "var(--wine)", marginTop: -8, marginBottom: 8 }}>Kon scores niet verversen ({refreshErrorDetail || "onbekende fout"}), probeer het nog eens.</div>
            )}

            {/* ---- Prijs ---- */}
            <div className="back-row">
              <div className="back-row-icon back-row-icon-price"><Tag size={18} /></div>
              <div className="back-row-body">
                {w.priceValue || w.currentPrice ? (
                  <>
                    <div className="back-row-title">{w.priceValue || w.currentPrice}</div>
                    <div className="back-row-sub">{w.priceNote || "Prijsindicatie"}</div>
                  </>
                ) : (
                  <div className="back-row-sub">Nog geen prijsinfo gevonden voor deze wijn.</div>
                )}
              </div>
              <button
                className={"refresh-btn" + (priceRefreshStatus === "loading" ? " refresh-btn-spinning" : "")}
                onClick={(e) => { e.stopPropagation(); refreshPrice(); }}
                disabled={priceRefreshStatus === "loading"}
                title="Zoek actuele prijzen in NL/EU opnieuw op"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {priceRefreshStatus === "error" && (
              <div className="back-plain-text" style={{ color: "var(--wine)", marginTop: -8, marginBottom: 8 }}>Kon prijs niet verversen ({priceRefreshErrorDetail || "onbekende fout"}), probeer het nog eens.</div>
            )}

            {w.notes && (
              <>
                <span className="back-section-label">Notities</span>
                <p className="tasting-notes">{w.notes}</p>
              </>
            )}
            </div>

            <div className="back-footer">
              <div className="back-actions">
                <button className="btn-open" disabled={empty} onClick={handleOpenClick}>
                  <CorkscrewIcon size={14} /> Opentrekken
                </button>
                {onMatchDish && (
                  <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); onMatchDish(w.id); }}>
                    <Utensils size={14} /> Matchen
                  </button>
                )}
              </div>
              <span
                className="stock-label stock-label-clickable"
                onClick={(e) => { e.stopPropagation(); setTempQty(w.quantity); setShowQtyModal(true); }}
              >
                {empty ? "Geen flessen op voorraad" : `${w.quantity} fles${w.quantity === 1 ? "" : "sen"} op voorraad`}
              </span>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>

      {showQtyModal && (
        <div className="modal-overlay modal-overlay-center" onClick={() => setShowQtyModal(false)}>
          <div className="modal qty-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Voorraad aanpassen</span>
              <X size={18} className="modal-close" onClick={() => setShowQtyModal(false)} />
            </div>
            <p className="modal-hint">{displayName(w)}</p>
            <div className="qty-stepper">
              <button className="qty-step-btn" onClick={() => setTempQty(q => Math.max(0, q - 1))}>
                <Minus size={16} />
              </button>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                className="qty-input"
                value={tempQty}
                onChange={e => setTempQty(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <button className="qty-step-btn" onClick={() => setTempQty(q => q + 1)}>
                <Plus size={16} />
              </button>
            </div>
            <button
              className="btn-open"
              style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
              onClick={handleQtySave}
            >
              Opslaan
            </button>
          </div>
        </div>
      )}

      {showZeroConfirm && (
        <div className="modal-overlay modal-overlay-center" onClick={(e) => { e.stopPropagation(); setShowZeroConfirm(false); }}>
          <div className="modal qty-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Laatste fles</span>
              <X size={20} className="modal-close" onClick={() => setShowZeroConfirm(false)} />
            </div>
            <p className="modal-hint">
              {displayName(w)} staat nu op 0 flessen. Wil je 'm bewaren in je kelder (voor als je 'm later weer koopt), of definitief verwijderen?
            </p>
            <div className="zero-confirm-actions">
              <button className="btn-open" onClick={confirmKeepAtZero}>Bewaren</button>
              <button className="btn-danger" onClick={confirmDeleteWine}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PairingView({ wines, onOpen, onSetQuantity, onUpdateWine, onDelete, onCardCamera, seedWineId, onClearSeed }) {
  const [dish, setDish] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [matches, setMatches] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [dishStatus, setDishStatus] = useState("idle");
  const [errorDetail, setErrorDetail] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const lastSeedRef = useRef(null);

  const seedWine = seedWineId ? wines.find(w => w.id === seedWineId) : null;

  async function runPairing() {
    if (!dish.trim()) return;
    setStatus("loading");
    setMatches([]);
    const available = wines.filter(w => w.quantity > 0);
    const wineSummary = available.map(w => ({
      id: w.id,
      naam: displayName(w),
      producent: w.producer,
      type: w.type,
      druiven: w.grapes,
      smaakprofiel: tasteProfile(w),
      land: w.country,
      streek: w.region,
    }));
    const prompt = `Je bent een ervaren sommelier. Hier is een lijst wijnen die iemand op voorraad heeft, als JSON-array:
${JSON.stringify(wineSummary)}

De persoon gaat dit eten of koken: "${dish.trim()}"

Kies uit BOVENSTAANDE LIJST de 3 tot 5 best passende wijnen (gebruik uitsluitend de gegeven id's, verzin geen nieuwe wijnen of id's). Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat:
[{"id": "w12", "reason": "Korte, concrete reden in het Nederlands, max 2 zinnen, waarom deze wijn hierbij past."}]`;

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await safeJsonResponse(response);
      if (data.error) throw new Error(`API-fout: ${data.error.type || ""} ${data.error.message || ""}`.trim());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const parsed = parseAiJson(text);
      const byId = Object.fromEntries(available.map(w => [w.id, w]));
      const resolved = parsed
        .filter(p => byId[p.id])
        .map(p => ({ id: p.id, reason: p.reason }));
      setMatches(resolved);
      setStatus(resolved.length > 0 ? "done" : "error");
    } catch (e) {
      setErrorDetail(String((e && e.message) || e || "onbekende fout"));
      setStatus("error");
    }
  }

  async function runDishSuggestions(wine) {
    setDishStatus("loading");
    setDishSuggestions([]);
    const wineInfo = {
      naam: displayName(wine),
      producent: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      druiven: wine.grapes,
      smaakprofiel: tasteProfile(wine),
      land: wine.country,
      streek: wine.region,
    };
    const prompt = `Je bent een ervaren sommelier. Hier zijn de gegevens van een specifieke wijn, als JSON:
${JSON.stringify(wineInfo)}

Geef 3 tot 5 concrete gerechten of maaltijden die uitstekend passen bij deze wijn. Antwoord ALLEEN met geldige JSON, geen andere tekst, geen markdown-backticks, in exact dit formaat:
[{"title": "Korte naam van het gerecht in het Nederlands", "description": "1-2 zinnen: wat het gerecht inhoudt en waarom het goed bij deze wijn past."}]`;

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await safeJsonResponse(response);
      if (data.error) throw new Error(`API-fout: ${data.error.type || ""} ${data.error.message || ""}`.trim());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const parsed = parseAiJson(text);
      setDishSuggestions(parsed);
      setDishStatus(parsed.length > 0 ? "done" : "error");
    } catch (e) {
      setErrorDetail(String((e && e.message) || e || "onbekende fout"));
      setDishStatus("error");
    }
  }

  useEffect(() => {
    if (seedWineId && seedWineId !== lastSeedRef.current && seedWine) {
      lastSeedRef.current = seedWineId;
      runDishSuggestions(seedWine);
    }
  }, [seedWineId, seedWine]);

  if (seedWineId && seedWine) {
    return (
      <>
        <div className="cellar-header">
          <div className="header-top-row">
            <div className="header-title-slot">
              <div className="cellar-title">
                <span className="h1-text">Wijn &amp; spijs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pairing-view">
        <div className="seed-wine-banner">
          <div className="seed-wine-text">
            <div className="seed-wine-name">{displayName(seedWine)}</div>
            <div className="seed-wine-sub">{seedWine.producer}{seedWine.vintage ? ` · ${seedWine.vintage}` : ""}</div>
            {avgRating(seedWine) && (
              <span className="seed-wine-score" style={{ color: scoreColorSet(avgRating(seedWine).avg).text, background: scoreColorSet(avgRating(seedWine).avg).bg }}>
                {avgRating(seedWine).avg}<span className="seed-wine-score-max">/100</span> {ratingLabel(avgRating(seedWine).avg)}
              </span>
            )}
          </div>
          {seedWine.bottlePhoto && (
            <img src={seedWine.bottlePhoto} alt={seedWine.wine} className="seed-wine-photo" />
          )}
        </div>

        {dishStatus === "loading" && (
          <div className="pairing-loading">
            <WineGlassLoader />
            <div className="pairing-loading-text">Ik denk na over gerechten die hierbij passen…</div>
          </div>
        )}

        {dishStatus === "error" && (
          <div className="pairing-error">Kon geen suggesties ophalen ({errorDetail || "onbekende fout"}). Probeer het nog eens.</div>
        )}

        {dishStatus === "done" && dishSuggestions.length > 0 && (
          <div className="pairing-results">
            <div className="pairing-results-label">Past goed bij:</div>
            {dishSuggestions.map((d, i) => (
              <div key={i} className="dish-card">
                <div className="dish-title">{d.title}</div>
                <div className="dish-description">{d.description}</div>
              </div>
            ))}
          </div>
        )}

        <button className="btn-secondary seed-clear" onClick={() => { onClearSeed(); setDishStatus("idle"); lastSeedRef.current = null; }}>
          Zoek in plaats daarvan een wijn bij een gerecht
        </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="cellar-header">
        <div className="header-top-row">
          <div className="header-title-slot">
            <div className="cellar-title">
              <span className="h1-text">Wijn &amp; spijs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pairing-view">
      <div className="pairing-input-block">
        <textarea
          className="pairing-textarea"
          placeholder="Wat ga je eten of koken? Bv. 'gegrilde ribeye met chimichurri' of 'pittige thaise curry met garnalen'"
          value={dish}
          onChange={e => setDish(e.target.value)}
        />
        <button className="btn-open pairing-submit" onClick={runPairing} disabled={status === "loading" || !dish.trim()}>
          {status === "loading" ? "Aan het zoeken…" : "Geef wijnadvies"}
        </button>
      </div>

      {status === "loading" && (
        <div className="pairing-loading">
          <WineGlassLoader />
          <div className="pairing-loading-text">Ik kijk in je kelder naar de beste match…</div>
        </div>
      )}

      {status === "error" && (
        <div className="pairing-error">
          Kon geen passende match vinden of er ging iets mis bij het ophalen van advies ({errorDetail || "onbekende fout"}). Probeer het opnieuw, of formuleer het gerecht iets specifieker.
        </div>
      )}

      {status === "done" && matches.length > 0 && (
        <div className="pairing-results">
          <div className="pairing-results-label">Beste match uit je kelder:</div>
          {matches.map(({ id, reason }) => {
            const wine = wines.find(w => w.id === id);
            if (!wine) return null;
            return (
              <div key={id} className="pairing-result-block">
                <p className="pairing-reason">{reason}</p>
                <WineCard
                  w={wine}
                  expanded={expandedId === id}
                  onExpand={eid => setExpandedId(expandedId === eid ? null : eid)}
                  onOpen={onOpen}
                  onSetQuantity={onSetQuantity}
                  onUpdateWine={onUpdateWine}
                  onDelete={onDelete}
                  onCardCamera={onCardCamera}
                />
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}

export default function CellarApp() {
  const [view, setView] = useState("list");
  const [pairingSeedId, setPairingSeedId] = useState(null);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [saveErrorDetail, setSaveErrorDetail] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tasteFilter, setTasteFilter] = useState("all");
  const [organicFilter, setOrganicFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("available");
  const [sortBy, setSortBy] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterScreen, setFilterScreen] = useState(null); // null = topniveau, of "sort"|"stock"|"type"|"window"
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualDescription, setManualDescription] = useState("");
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [photoAddStatus, setPhotoAddStatus] = useState("idle");
  const [photoAddError, setPhotoAddError] = useState("");
  const [photoAddResult, setPhotoAddResult] = useState(null);
  const [cardPhotoTargetId, setCardPhotoTargetId] = useState(null); // wijn-id als de camera een bestaande kaart moet bijwerken
  const cameraInputRef = useRef(null);

  function startCardPhotoCapture(id) {
    setCardPhotoTargetId(id);
    cameraInputRef.current && cameraInputRef.current.click();
  }

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(false), 5000);
    return () => clearTimeout(t);
  }, [saveError]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("cellar")
          .select("data")
          .eq("id", CELLAR_ROW_ID)
          .maybeSingle();
        if (error) throw error;
        if (data && data.data) {
          setWines(data.data);
        } else {
          setWines(SEED_DATA);
          await supabase.from("cellar").upsert({ id: CELLAR_ROW_ID, data: SEED_DATA, updated_at: new Date().toISOString() });
        }
      } catch {
        setWines(SEED_DATA);
      }
      setLoading(false);
    })();
  }, []);

  async function persist(next) {
    setWines(next);
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { error } = await supabase
          .from("cellar")
          .upsert({ id: CELLAR_ROW_ID, data: next, updated_at: new Date().toISOString() });
        if (error) throw error;
        setSaveError(false);
        return;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      }
    }
    setSaveErrorDetail(String((lastErr && lastErr.message) || lastErr || "onbekende fout"));
    setSaveError(true);
  }

  function openBottle(id) {
    const next = wines.map(w => w.id === id ? { ...w, quantity: Math.max(0, w.quantity - 1), openedCount: (w.openedCount || 0) + 1 } : w);
    persist(next);
  }

  function updateWine(id, updates) {
    const next = wines.map(w => w.id === id ? { ...w, ...updates } : w);
    persist(next);
  }

  function setQuantity(id, qty) {
    const next = wines.map(w => {
      if (w.id !== id) return w;
      const newQty = Math.max(0, qty);
      const newOpenedCount = newQty <= 0 ? Math.max(1, w.openedCount || 0) : (w.openedCount || 0);
      return { ...w, quantity: newQty, openedCount: newOpenedCount };
    });
    persist(next);
  }

  function deleteWine(id) {
    const next = wines.filter(w => w.id !== id);
    persist(next);
  }

  function nextId() {
    const nums = wines.map(w => parseInt((w.id || "w0").replace("w", "")) || 0);
    return "w" + (Math.max(0, ...nums) + 1);
  }

  function normalizeMatch(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[®™©]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nameOverlapScore(a, b) {
    const wordsA = new Set(normalizeMatch(a).split(" ").filter(Boolean));
    const wordsB = new Set(normalizeMatch(b).split(" ").filter(Boolean));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    let shared = 0;
    wordsA.forEach(w => { if (wordsB.has(w)) shared++; });
    return shared / Math.min(wordsA.size, wordsB.size);
  }

  function findExistingWine(info) {
    return wines.find(w => {
      if (String(w.vintage || "") !== String(info.vintage || "")) return false;
      return nameOverlapScore(w.wine, info.wine) >= 0.7 && nameOverlapScore(w.producer, info.producer) >= 0.5;
    });
  }

  async function handlePhotoCapture(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setPhotoAddStatus("processing");
    setPhotoAddError("");
    setPhotoAddResult(null);

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const [, mimeType, base64] = dataUrl.match(/^data:(.*?);base64,(.*)$/) || [];
      if (!base64) throw new Error("Kon de foto niet lezen.");
      if (/hei[cf]/i.test(mimeType || "")) {
        throw new Error(
          "Deze foto staat in HEIC-formaat, dat wordt niet ondersteund. Zet op je iPhone onder " +
          "Instellingen → Camera → Formaten de optie \"Meest compatibel\" aan, en probeer het opnieuw."
        );
      }

      const response = await fetch("/api/add-wine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoBase64: base64, mimeType }),
      });
      const data = await safeJsonResponse(response);
      if (data.error) throw new Error(data.error.message || "Onbekende fout");

      const info = data.wine || {};

      if (cardPhotoTargetId) {
        // Foto gemaakt via het camera-icoontje op een bestaande kaart: die ene
        // wijn bijwerken, geen fuzzy-matching of nieuwe kaart nodig — we weten
        // al precies om welke wijn het gaat.
        const targetId = cardPhotoTargetId;
        const next = wines.map(w => w.id === targetId
          ? {
              ...w,
              bottlePhoto: data.packshot || w.bottlePhoto,
              region: info.region || w.region,
              country: info.country || w.country,
              grapes: info.grapes || w.grapes,
              type: info.type || w.type,
              ratings: { ...w.ratings, ...(info.ratings || {}) },
              priceValue: info.priceValue || w.priceValue,
              priceNote: info.priceNote || w.priceNote,
              description: info.description || w.description,
              tastingNotes: info.tastingNotes || w.tastingNotes,
              drinkFrom: info.drinkFrom || w.drinkFrom,
              drinkUntil: info.drinkUntil || w.drinkUntil,
              peakFrom: info.peakFrom || w.peakFrom,
              peakUntil: info.peakUntil || w.peakUntil,
              organic: info.organic || w.organic,
            }
          : w);
        const updated = next.find(w => w.id === targetId);
        await persist(next);
        setCardPhotoTargetId(null);
        setPhotoAddResult({ mode: "photoUpdated", wineName: displayName(updated) });
        setPhotoAddStatus("idle");
        return;
      }

      const existing = findExistingWine(info);

      if (existing) {
        const next = wines.map(w => w.id === existing.id
          ? {
              ...w,
              quantity: (w.quantity || 0) + 1,
              bottlePhoto: data.packshot || w.bottlePhoto,
              region: info.region || w.region,
              country: info.country || w.country,
              grapes: info.grapes || w.grapes,
              type: info.type || w.type,
              ratings: { ...w.ratings, ...(info.ratings || {}) },
              priceValue: info.priceValue || w.priceValue,
              priceNote: info.priceNote || w.priceNote,
              description: info.description || w.description,
              tastingNotes: info.tastingNotes || w.tastingNotes,
              drinkFrom: info.drinkFrom || w.drinkFrom,
              drinkUntil: info.drinkUntil || w.drinkUntil,
              peakFrom: info.peakFrom || w.peakFrom,
              peakUntil: info.peakUntil || w.peakUntil,
              organic: info.organic || w.organic,
            }
          : w);
        await persist(next);
        setPhotoAddResult({ mode: "matched", wineName: displayName(existing) });
      } else {
        const id = nextId();
        const newWine = {
          id,
          wine: info.wine || "Onbekende wijn",
          producer: info.producer || "",
          vintage: info.vintage || null,
          region: info.region || "",
          country: info.country || "",
          grapes: info.grapes || "",
          type: info.type || "red",
          quantity: 1,
          purchasePrice: null, currency: "EUR", bottleSize: null, storage: "assumed_ideal",
          drinkingWindowStatus: null,
          drinkFrom: info.drinkFrom || null, drinkUntil: info.drinkUntil || null,
          peakFrom: info.peakFrom || null, peakUntil: info.peakUntil || null, organic: info.organic || null,
          score: null, body: null, sweetness: null, tannin: null, acidity: null, alcohol: null,
          ratings: info.ratings || {}, priceValue: info.priceValue || null, priceNote: info.priceNote || "",
          description: info.description || "", tastingNotes: info.tastingNotes || "",
          currentPrice: null, notes: "",
          added: new Date().toISOString().slice(0, 10), openedCount: 0,
          bottlePhoto: data.packshot || null,
        };
        await persist([...wines, newWine]);
        setPhotoAddResult({ mode: "new", wineName: displayName(newWine) });
      }
      setPhotoAddStatus("idle");
    } catch (err) {
      setCardPhotoTargetId(null);
      setPhotoAddError(String((err && err.message) || err || "onbekende fout"));
      setPhotoAddStatus("error");
    }
  }

  async function handleManualAdd() {
    const description = manualDescription.trim();
    if (!description) return;

    setShowManualAdd(false);
    setPhotoAddStatus("processing");
    setPhotoAddError("");
    setPhotoAddResult(null);

    try {
      const response = await fetch("/api/add-wine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await safeJsonResponse(response);
      if (data.error) throw new Error(data.error.message || "Onbekende fout");

      const info = data.wine || {};
      const existing = findExistingWine(info);

      if (existing) {
        const next = wines.map(w => w.id === existing.id
          ? {
              ...w,
              quantity: (w.quantity || 0) + 1,
              region: info.region || w.region,
              country: info.country || w.country,
              grapes: info.grapes || w.grapes,
              type: info.type || w.type,
              ratings: { ...w.ratings, ...(info.ratings || {}) },
              priceValue: info.priceValue || w.priceValue,
              priceNote: info.priceNote || w.priceNote,
              description: info.description || w.description,
              tastingNotes: info.tastingNotes || w.tastingNotes,
              drinkFrom: info.drinkFrom || w.drinkFrom,
              drinkUntil: info.drinkUntil || w.drinkUntil,
              peakFrom: info.peakFrom || w.peakFrom,
              peakUntil: info.peakUntil || w.peakUntil,
              organic: info.organic || w.organic,
            }
          : w);
        await persist(next);
        setPhotoAddResult({ mode: "matched", wineName: displayName(existing) });
      } else {
        const id = nextId();
        const newWine = {
          id,
          wine: info.wine || "Onbekende wijn",
          producer: info.producer || "",
          vintage: info.vintage || null,
          region: info.region || "",
          country: info.country || "",
          grapes: info.grapes || "",
          type: info.type || "red",
          quantity: 1,
          purchasePrice: null, currency: "EUR", bottleSize: null, storage: "assumed_ideal",
          drinkingWindowStatus: null,
          drinkFrom: info.drinkFrom || null, drinkUntil: info.drinkUntil || null,
          peakFrom: info.peakFrom || null, peakUntil: info.peakUntil || null, organic: info.organic || null,
          score: null, body: null, sweetness: null, tannin: null, acidity: null, alcohol: null,
          ratings: info.ratings || {}, priceValue: info.priceValue || null, priceNote: info.priceNote || "",
          description: info.description || "", tastingNotes: info.tastingNotes || "",
          currentPrice: null, notes: "",
          added: new Date().toISOString().slice(0, 10), openedCount: 0,
          bottlePhoto: null, // geen foto bij handmatig toevoegen
        };
        await persist([...wines, newWine]);
        setPhotoAddResult({ mode: "new", wineName: displayName(newWine) });
      }
      setManualDescription("");
      setPhotoAddStatus("idle");
    } catch (err) {
      setPhotoAddError(String((err && err.message) || err || "onbekende fout"));
      setPhotoAddStatus("error");
    }
  }

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const filtered = useMemo(() => {
    let list = wines.filter(w => {
      if (stockFilter === "available" && w.quantity <= 0) return false;
      if (stockFilter === "opened" && !(w.openedCount > 0)) return false;
      if (typeFilter !== "all" && w.type !== typeFilter) return false;
      if (statusFilter !== "all" && computeStatus(w) !== statusFilter) return false;
      if (tasteFilter !== "all" && tasteCategory(w) !== tasteFilter) return false;
      if (organicFilter !== "all" && w.organic !== organicFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${w.wine} ${w.producer} ${w.region} ${w.country} ${w.grapes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const urgencyRank = { past_prime: 0, declining: 1, prime: 2, approaching: 3 };
    let cmp;
    if (sortBy === "window") {
      cmp = (a, b) => urgencyRank[computeStatus(a)] - urgencyRank[computeStatus(b)] || (parseInt(a.peakUntil || a.drinkUntil) - parseInt(b.peakUntil || b.drinkUntil));
    } else if (sortBy === "name") {
      cmp = (a, b) => a.wine.localeCompare(b.wine);
    } else if (sortBy === "score") {
      cmp = (a, b) => (scoreValue(a) ?? -1) - (scoreValue(b) ?? -1);
    } else if (sortBy === "vintage") {
      cmp = (a, b) => (parseInt(a.vintage) || 0) - (parseInt(b.vintage) || 0);
    }
    list = [...list].sort(cmp);
    if (sortDir === "desc") list.reverse();
    return list;
  }, [wines, query, typeFilter, statusFilter, tasteFilter, organicFilter, stockFilter, sortBy, sortDir]);

  const hasActiveFilters = stockFilter !== "available" || typeFilter !== "all" || statusFilter !== "all" || tasteFilter !== "all" || organicFilter !== "all" || sortBy !== "score" || sortDir !== "desc";

  // Aantallen per filteroptie, tellen tegen de volledige wijnenlijst (niet
  // gecombineerd met andere actieve filters) — simpel en snel te lezen.
  const stockCount = {
    available: wines.filter(w => w.quantity > 0).length,
    all: wines.length,
    opened: wines.filter(w => w.openedCount > 0).length,
  };
  const typeCountAll = wines.length;
  const typeCount = {};
  Object.keys(TYPE_META).forEach(k => { typeCount[k] = wines.filter(w => w.type === k).length; });
  const tasteCountAll = wines.length;
  const tasteCount = {};
  Object.keys(TASTE_CATEGORIES).forEach(k => { tasteCount[k] = wines.filter(w => tasteCategory(w) === k).length; });
  const organicCountAll = wines.length;
  const organicCount = {
    organic: wines.filter(w => w.organic === "organic").length,
    biodynamic: wines.filter(w => w.organic === "biodynamic").length,
  };
  const windowCountAll = wines.length;
  const windowCount = {};
  Object.keys(STATUS_META).forEach(k => { windowCount[k] = wines.filter(w => computeStatus(w) === k).length; });

  const SORT_OPTIONS = [["score", "Score"], ["window", "Drinkvenster"], ["vintage", "Jaargang"]];
  function sortOptionLabel(key) {
    const base = SORT_OPTIONS.find(([k]) => k === key)[1];
    if (sortBy !== key) return base;
    return `${base} ${sortDir === "desc" ? "hoog-laag" : "laag-hoog"}`;
  }
  const sortSummary = sortOptionLabel(sortBy);
  const stockSummaryMap = { available: "Op voorraad", all: "Alle wijnen", opened: "Al opengetrokken" };
  const stockSummary = stockSummaryMap[stockFilter];
  const typeSummary = typeFilter === "all" ? "Alle types" : (TYPE_META[typeFilter]?.label || "Alle types");
  const windowSummary = statusFilter === "all" ? "Elk drinkvenster" : (STATUS_META[statusFilter]?.label || "Elk drinkvenster");
  const tasteSummary = tasteFilter === "all" ? "Elk smaakprofiel" : (TASTE_CATEGORIES[tasteFilter]?.label || "Elk smaakprofiel");
  const organicSummaryMap = { all: "Alle wijnen", organic: "Biologisch", biodynamic: "Biodynamisch" };
  const organicSummary = organicSummaryMap[organicFilter];



  return (
    <div className="cellar-app">
      {saveError && (
        <div className="save-toast">
          <span>Wijziging kon niet worden opgeslagen ({saveErrorDetail || "onbekende fout"}).</span>
          <button className="save-toast-retry" onClick={() => persist(wines)}>Opnieuw</button>
          <X size={15} className="save-toast-close" onClick={() => setSaveError(false)} />
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap');

        html, body {
          background: #F8F3E8;
          margin: 0;
        }

        .cellar-app {
          --ink: #241E14;
          --bg: #F8F3E8;
          --bg-2: #F8F3E8;
          --surface: rgba(255,255,255,0.6);
          --surface-solid: #FFFFFF;
          --wine: #8C4A3A;
          --wine-2: #6B3529;
          --wine-light: #B06848;
          --bronze: #9A7A4A;
          --bronze-2: #6E5730;
          --gold: #C9A227;
          --gold-light: #D4AF37;
          --line: rgba(80,64,32,0.14);
          --muted: #8C7F68;
          --text-soft: #5B4E3A;
          font-family: -apple-system, 'SF Pro Text', system-ui, sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          padding: 0 0 78px 0;
          position: relative;
        }
        .cellar-app * { box-sizing: border-box; }
        .cellar-app::before, .cellar-app::after {
          content: none;
        }
        .cellar-app > * { position: relative; z-index: 1; }

        .cellar-header {
          background: rgba(248,243,232,0.92);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          color: var(--ink);
          padding: 22px 20px 16px 16px;
          position: sticky; top: 0; z-index: 25;
        }
        .cellar-title {
          display: flex; flex-direction: column;
          font-size: 27px; letter-spacing: -0.01em; font-weight: 400;
          font-family: 'Playfair Display', Georgia, serif;
        }
        .h1-text { line-height: 1; font-weight: 700; }
        .cellar-title .sub {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--bronze); margin-top: 8px; font-weight: 700;
        }
        .result-count {
          padding: 12px 20px 2px; font-size: 12px; font-weight: 700;
          color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em;
        }

        .header-top-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .header-title-slot {
          position: relative; flex: 1; min-width: 0; height: 36px;
        }
        .cellar-title, .header-search-form {
          position: absolute; inset: 0;
          display: flex; align-items: center;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .cellar-title { transform: translateX(0); opacity: 1; align-items: flex-start; }
        .cellar-title.header-slot-out { transform: translateX(-14px); opacity: 0; pointer-events: none; }
        .header-search-form {
          gap: 9px; transform: translateX(16px); opacity: 0; pointer-events: none;
          border-bottom: 1.5px solid var(--wine); padding-bottom: 6px;
        }
        .header-search-form.header-slot-in { transform: translateX(0); opacity: 1; pointer-events: auto; }
        .header-search-form input {
          flex: 1; min-width: 0; background: transparent; border: none; outline: none;
          color: var(--ink); font-size: 16px;
        }
        .header-search-form input::placeholder { color: var(--muted); }

        .header-icons { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
        .header-icon-btn {
          position: relative; flex-shrink: 0;
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--surface-solid); border: 1px solid var(--line);
          color: var(--ink); display: flex; align-items: center; justify-content: center;
          box-shadow: none; cursor: pointer;
        }
        .header-icon-btn-active { color: var(--wine); border-color: var(--wine); }
        .filter-btn-dot {
          position: absolute; top: 7px; right: 8px; width: 7px; height: 7px;
          border-radius: 50%; background: var(--gold-light); border: 1.5px solid var(--surface-solid);
        }

        .filter-fullscreen {
          position: fixed; inset: 0; z-index: 60;
          background: #FFFFFF;
          transform: translateY(100%);
          -webkit-transform: translateY(100%);
          transition: transform 0.38s cubic-bezier(0.32, 0.72, 0, 1);
          pointer-events: none;
        }
        .filter-fullscreen.is-open {
          transform: translateY(0); -webkit-transform: translateY(0);
          pointer-events: auto;
        }
        .filter-fullscreen-inner { height: 100%; display: flex; flex-direction: column; }
        .filter-scroll-area { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 22px 8px; }
        .filter-footer {
          flex-shrink: 0; padding: 14px 22px calc(14px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid var(--line);
        }
        .filter-modal-done { width: 100%; justify-content: center; margin-top: 0; }

        .filter-nav-header {
          position: relative; display: flex; align-items: center; justify-content: center;
          padding: 4px 0 20px;
        }
        .filter-nav-btn {
          position: absolute; left: 0; top: -4px;
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--surface-solid); border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink); cursor: pointer;
        }
        .filter-nav-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px; font-weight: 700; color: var(--ink);
        }
        .filter-nav-list { display: flex; flex-direction: column; }
        .filter-nav-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          width: 100%; text-align: left; background: none; border: none; cursor: pointer;
          padding: 16px 2px; border-bottom: 1px solid var(--line);
        }
        .filter-nav-row-title { display: block; font-size: 15.5px; font-weight: 500; color: var(--ink); }
        .filter-nav-row-sub { display: block; font-size: 12.5px; color: var(--muted); margin-top: 3px; }
        .filter-nav-group-label {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--muted); padding: 14px 2px 4px;
        }
        .filter-nav-check { font-size: 15px; font-weight: 700; color: var(--ink); }
        .filter-nav-count { font-size: 12.5px; font-weight: 500; color: var(--bronze); margin-left: 6px; }
        .filter-nav-row-title-wrap { display: flex; align-items: center; }

        .wine-list { padding: 14px 16px 0; display: flex; flex-direction: column; gap: 10px; }

        .card-scene {
          height: 480px;
          cursor: pointer;
          scroll-margin-top: 80px;
        }
        .card-perspective {
          height: 100%;
          perspective: 1600px;
          -webkit-perspective: 1600px;
        }
        .card-flip {
          position: relative; width: 100%; height: 100%;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0.1, 0.2, 1);
        }
        .card-flip.is-flipped { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }

        .card-face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: none;
          border: 1px solid var(--line);
          visibility: visible;
          transition: visibility 0s linear 0s;
        }
        .card-front { z-index: 2; position: relative; }
        .card-back {
          transform: rotateY(180deg); -webkit-transform: rotateY(180deg);
          visibility: hidden;
          z-index: 1;
        }
        .card-flip.is-flipped .card-front { visibility: hidden; transition-delay: 0.3s; }
        .card-flip.is-flipped .card-back { visibility: visible; transition-delay: 0.3s; }

        /* ---- Front: poster ---- */
        .card-front {
          background: #FFFFFF;
          font-family: 'Playfair Display', Georgia, serif;
          height: 100%;
        }
        .card-front.is-empty { opacity: 0.55; }
        .front-status-pill {
          position: absolute; top: 16px; left: 18px; z-index: 4;
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 10.5px; font-weight: 700;
          border: 1px solid; border-radius: 999px; padding: 3px 10px; background: rgba(255,255,255,0.7);
        }
        .front-text-col {
          position: relative; z-index: 3;
          width: 58%; height: 100%;
          padding: 52px 0 22px 20px;
          display: flex; flex-direction: column;
        }
        .front-text-col.no-photo { width: 100%; padding-right: 20px; }
        .front-vintage {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 12px; font-weight: 500; color: #4A4235; letter-spacing: 0.02em;
        }
        .front-title {
          font-size: 21px; font-weight: 700; letter-spacing: -0.01em;
          line-height: 1.12; margin: 6px 0 0; color: #241E14;
        }
        .front-producer {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 12.5px; font-weight: 500; margin-top: 10px; color: #52483A;
        }
        .front-origin {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 11.5px; font-weight: 500; margin-top: 3px; color: #7A6E4A;
        }
        .front-score { margin-top: auto; }
        .front-score-num { font-family: -apple-system, system-ui, sans-serif; display: block; font-size: 32px; font-weight: 700; line-height: 1; }
        .front-score-max {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 15px; font-weight: 500; opacity: 0.55;
        }
        .front-score-label {
          font-family: -apple-system, system-ui, sans-serif;
          display: block; font-size: 12px; font-weight: 500; margin-top: 3px;
        }
        .front-score-label-muted { color: var(--muted); }

        .front-bottle-col {
          position: absolute; top: 0; right: 0; bottom: 0; left: 58%;
          z-index: 1; overflow: hidden; border-radius: 0 24px 24px 0;
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 30px);
          mask-image: linear-gradient(to right, transparent 0, #000 30px);
        }
        .bottle-photo {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .front-camera-btn-secondary {
          position: absolute; right: 18px; bottom: 22px; z-index: 4;
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--surface-solid); border: 1px solid var(--line); color: var(--ink);
          box-shadow: none; cursor: pointer;
        }

        /* ---- Back: detail sheet ---- */
        .card-back-inner {
          background: #FFFFFF;
          height: 100%; padding: 22px 20px 18px; color: var(--ink);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .back-scroll-area { flex: 1; min-height: 0; overflow-y: auto; }
        .back-footer {
          flex-shrink: 0; padding-top: 14px; margin-top: 6px;
          border-top: 1px solid var(--line);
        }
        .back-header { margin-bottom: 14px; }
        .back-title { font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; }
        .back-sub { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
        .back-producer-bold { font-weight: 700; color: var(--ink); }
        .back-section-label {
          font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--muted); font-weight: 700; margin-top: 18px; display: block;
        }
        .back-plain-text { font-size: 12.5px; line-height: 1.4; margin: 6px 0 0; }

        .taste-tags-wrap {
          padding: 16px 0;
        }
        .taste-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .taste-tag {
          font-size: 11px; font-weight: 600;
          border-radius: 999px; padding: 4px 11px;
        }

        .tasting-notes { font-size: 12.5px; line-height: 1.45; margin: 6px 0 0; color: var(--text-soft); }
        .tasting-notes-clamp {
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ---- Nieuwe rij-structuur op de achterkant: icoon-bol + titel + subtekst ---- */
        .back-row {
          display: flex; align-items: flex-start; gap: 13px;
          padding: 16px 0; border-top: 1px solid var(--line);
        }
        .back-row-icon {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: var(--surface-solid); color: var(--ink);
          display: flex; align-items: center; justify-content: center;
        }
        .back-row-icon-price { background: var(--bg); }
        .back-score-circle {
          font-family: -apple-system, system-ui, sans-serif; font-size: 18px; font-weight: 700;
          line-height: 1; text-align: center;
        }
        .back-row-body { flex: 1; min-width: 0; }
        .back-row-title { font-size: 14.5px; font-weight: 700; color: var(--ink); line-height: 1.3; }
        .back-row-title-with-badge { display: flex; align-items: center; gap: 6px; }
        .organic-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
          background: rgba(47,155,98,0.14); color: #2F9B62;
        }
        .back-row-sub { font-size: 12px; color: var(--muted); margin-top: 3px; line-height: 1.4; }
        .back-notes-text { color: var(--text-soft); margin: 4px 0 0; }

        .refresh-btn {
          background: none; border: none; padding: 2px; margin: 0; display: flex; align-items: center;
          justify-content: center; color: var(--muted); cursor: pointer; flex-shrink: 0; align-self: center;
        }
        .refresh-btn:hover { color: var(--wine); }
        .refresh-btn:disabled { cursor: default; }
        .refresh-btn-spinning { animation: spin 1s linear infinite; color: var(--wine); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .add-choice-btn { width: 100%; margin-top: 12px; justify-content: center; }
        .photo-processing-modal {
          max-width: 300px; border-radius: 24px; padding: 32px 24px;
          display: flex; flex-direction: column; align-items: center;
        }
        .photo-processing-spinner {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid var(--line); border-top-color: var(--bronze);
          animation: spin 0.9s linear infinite;
        }

        .price-value { font-size: 15px; font-weight: 800; color: var(--ink); display: block; }
        .price-note { display: block; font-size: 11px; color: var(--muted); margin-top: 3px; line-height: 1.4; }

        .back-actions {
          display: flex; align-items: center; gap: 10px;
        }
        .btn-open {
          display: flex; align-items: center; justify-content: center; gap: 6px; flex: 1;
          background: var(--ink); color: #FFF;
          border: 1px solid var(--ink); border-radius: 999px; padding: 12px 14px; font-size: 12.5px; font-weight: 700;
          cursor: pointer; box-shadow: none; height: 44px; box-sizing: border-box; line-height: 1;
        }
        .btn-open:disabled { background: #EADFC7; border-color: #EADFC7; color: #A89A78; box-shadow: none; cursor: not-allowed; }
        .btn-secondary {
          display: flex; align-items: center; justify-content: center; gap: 6px; flex: 1;
          background: var(--surface); color: var(--ink); border: 1px solid var(--ink); border-radius: 999px;
          padding: 12px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          height: 44px; box-sizing: border-box; line-height: 1;
        }
        .btn-danger {
          display: flex; align-items: center; justify-content: center; gap: 6px; flex: 1;
          background: var(--surface); color: var(--wine); border: 1px solid var(--wine); border-radius: 999px;
          padding: 12px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          height: 44px; box-sizing: border-box; line-height: 1;
        }
        .zero-confirm-actions { display: flex; gap: 10px; margin-top: 18px; }
        .seed-clear { width: 100%; margin-top: 20px; }
        .stock-label { display: block; font-size: 11.5px; color: var(--muted); margin-top: 8px; }
        .stock-label-clickable {
          cursor: pointer; text-decoration: underline; text-decoration-style: dotted;
          text-underline-offset: 2px;
        }
        .qty-stepper {
          display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 18px;
        }
        .qty-step-btn {
          width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--wine);
          background: rgba(140,74,58,0.06); color: var(--wine); display: flex; align-items: center;
          justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .qty-input {
          width: 64px; text-align: center; font-size: 22px; font-weight: 800;
          border: 1px solid var(--line); border-radius: 12px; padding: 8px 4px;
          background: var(--surface-solid); color: var(--ink);
        }
        .qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button {
          -webkit-appearance: none; margin: 0;
        }

        .save-toast {
          position: fixed; top: 16px; left: 14px; right: 14px; z-index: 100;
          display: flex; align-items: center; gap: 10px;
          background: var(--wine); color: #FFF; font-size: 13px; font-weight: 700;
          padding: 12px 12px 12px 16px; border-radius: 16px; box-shadow: 0 12px 30px rgba(140,74,58,0.4);
          animation: toastIn 0.25s ease-out;
        }
        .save-toast span { flex: 1; line-height: 1.35; }
        .save-toast-retry {
          flex-shrink: 0; background: rgba(255,255,255,0.2); border: none; color: #FFF;
          font-size: 12px; font-weight: 800; padding: 7px 12px; border-radius: 999px; cursor: pointer;
        }
        .save-toast-close { flex-shrink: 0; opacity: 0.85; cursor: pointer; }
        @keyframes toastIn {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .empty-state {
          text-align: center; padding: 60px 20px; color: var(--muted);
          font-size: 13px;
        }

        .bottom-nav {
          position: fixed; bottom: calc(10px + env(safe-area-inset-bottom, 0px)); left: 10px; right: 10px; z-index: 30;
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.7);
          border-radius: 999px;
          display: flex; align-items: center; justify-content: space-around;
          padding: 10px 14px;
          box-shadow: 0 10px 30px rgba(36,30,20,0.16);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .nav-item {
          background: none; border: none; display: flex; flex-direction: column; align-items: center;
          gap: 1px; padding: 5px 14px; cursor: pointer; flex: 1;
          font-size: 10px; font-weight: 700;
          color: var(--muted);
        }
        .nav-item-active { color: var(--ink); }
        .nav-label { white-space: nowrap; }
        .nav-plus {
          width: 42px; height: 42px; border-radius: 50%;
          background: var(--ink); color: #FFF;
          border: none; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 16px rgba(36,30,20,0.3); cursor: pointer; flex-shrink: 0;
        }

        .pairing-view { padding: 14px 16px 20px; }
        .pairing-input-block { display: flex; flex-direction: column; gap: 10px; }
        .pairing-textarea {
          width: 100%; min-height: 90px; border: 1px solid var(--line); border-radius: 16px;
          padding: 12px 14px; font-size: 16px;
          background: var(--surface-solid); color: var(--ink); resize: vertical;
        }
        .pairing-submit { justify-content: center; }
        .pairing-submit:disabled { background: #EADFC7; border-color: #EADFC7; color: #A89A78; box-shadow: none; cursor: not-allowed; }
        .pairing-loading {
          margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .pairing-loading-text {
          font-size: 13px; color: var(--muted); text-align: center;
        }
        .grape-stem { stroke: var(--gold); stroke-width: 1.6; }
        .grape-dot {
          fill: var(--wine);
          stroke: var(--wine);
          stroke-width: 1.4;
          opacity: 0.18;
          animation: grapePop 1.6s ease-in-out infinite;
        }
        @keyframes grapePop {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 1; }
        }
        .pairing-error {
          margin-top: 18px; font-size: 13px;
          color: var(--wine); background: rgba(140,74,58,0.08); border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px;
          line-height: 1.4;
        }
        .pairing-results { margin-top: 22px; }
        .pairing-results-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 10px;
        }
        .pairing-result-block { margin-bottom: 16px; }
        .pairing-reason {
          font-size: 13px; color: var(--text-soft);
          background: rgba(212,167,44,0.14); border-radius: 16px 16px 4px 16px; padding: 11px 14px; margin: 0 0 8px;
          line-height: 1.4;
        }
        .seed-wine-banner {
          background: #FFFFFF; border: 1px solid var(--line); color: var(--ink);
          border-radius: 24px; padding: 18px; margin-bottom: 4px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .seed-wine-text { min-width: 0; }
        .seed-wine-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.15;
        }
        .seed-wine-sub {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 12.5px; color: var(--muted); margin-top: 5px;
        }
        .seed-wine-score {
          display: inline-block; margin-top: 10px; font-size: 12px; font-weight: 800;
          border-radius: 999px; padding: 4px 11px;
        }
        .seed-wine-score-max { font-weight: 500; opacity: 0.6; }
        .seed-wine-photo {
          height: 92px; width: auto; max-width: 90px; object-fit: contain; flex-shrink: 0;
          filter: drop-shadow(0 8px 10px rgba(36,30,20,0.14));
        }
        .dish-card {
          background: #FFFFFF; border: 1px solid var(--line); border-radius: 20px; padding: 16px 18px;
          margin-bottom: 10px;
        }
        .dish-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); margin-bottom: 5px;
        }
        .dish-description {
          font-family: -apple-system, system-ui, sans-serif;
          font-size: 12.5px; color: var(--muted); line-height: 1.45;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(36,30,20,0.45); z-index: 40;
          display: flex; align-items: flex-end; justify-content: center;
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        }
        .modal-overlay-center { align-items: center; padding: 0 16px; }
        .modal {
          background: #FFFFFF; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
          border: 1px solid var(--line);
          border-radius: 24px 24px 0 0; padding: 20px 18px 26px;
          box-shadow: 0 -10px 40px rgba(36,30,20,0.14);
        }
        .qty-modal { max-width: 340px; border-radius: 24px; box-shadow: 0 20px 50px rgba(36,30,20,0.18); }
        .add-choice-modal { max-width: 380px; border-radius: 24px; box-shadow: 0 20px 50px rgba(36,30,20,0.18); }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 17px; font-weight: 700; margin-bottom: 6px;
        }
        .modal-close { cursor: pointer; color: var(--muted); }
        .modal-hint { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin: 4px 0 14px; }
        .modal-section-label {
          font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
          color: var(--muted); margin-bottom: 6px;
        }
        .modal-textarea {
          width: 100%; min-height: 80px; border: 1px solid var(--line); border-radius: 14px;
          padding: 10px 12px; font-size: 16px;
          margin-bottom: 10px; resize: vertical; background: var(--surface-solid);
        }
        .modal-divider {
          text-align: center; font-size: 11px; color: var(--muted); margin: 16px 0 10px;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .modal-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;
        }
        .modal-form-grid input, .modal-form-grid select {
          border: 1px solid var(--line); border-radius: 12px; padding: 9px 11px; font-size: 16px;
          background: var(--surface-solid); color: var(--ink);
        }
        .modal-error { color: var(--wine); font-size: 12px; margin: 6px 0; }
      `}</style>


      {view === "list" && (
        <>
          <div className="cellar-header">
            <div className="header-top-row">
              <div className="header-title-slot">
                <div
                  className={"cellar-title" + (searchOpen ? " header-slot-out" : "")}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <span className="h1-text">Mijn wijn</span>
                </div>
                <form
                  className={"header-search-form" + (searchOpen ? " header-slot-in" : "")}
                  onSubmit={(e) => { e.preventDefault(); setSearchOpen(false); }}
                >
                  <Search size={15} color="var(--muted)" />
                  <input
                    ref={searchInputRef}
                    placeholder="Zoek op naam, wijnhuis, druif, streek…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </form>
              </div>
              <div className="header-icons">
                <button
                  className={"header-icon-btn" + (searchOpen ? " header-icon-btn-active" : "")}
                  onClick={() => { if (searchOpen) setQuery(""); setSearchOpen(o => !o); }}
                  title="Zoeken"
                >
                  {searchOpen ? <X size={16} /> : <Search size={16} />}
                </button>
                <button
                  className={"header-icon-btn" + (hasActiveFilters ? " header-icon-btn-active" : "")}
                  onClick={() => { setFilterScreen(null); setShowFilterPanel(true); }}
                  title="Filteren en sorteren"
                >
                  <SlidersHorizontal size={16} />
                  {hasActiveFilters && <span className="filter-btn-dot" />}
                </button>
              </div>
            </div>
          </div>

          <div className="result-count">{filtered.length} wijn{filtered.length === 1 ? "" : "en"}</div>

          <div className={"filter-fullscreen" + (showFilterPanel ? " is-open" : "")}>
            <div className="filter-fullscreen-inner">
              <div className="filter-scroll-area">
                <div className="filter-nav-header">
                  {filterScreen === null ? (
                    <button className="filter-nav-btn" onClick={() => setShowFilterPanel(false)}><X size={20} /></button>
                  ) : (
                    <button className="filter-nav-btn" onClick={() => setFilterScreen(null)}><ChevronLeft size={20} /></button>
                  )}
                  <span className="filter-nav-title">
                    {filterScreen === null ? "Filteren"
                      : filterScreen === "sort" ? "Sorteren"
                      : filterScreen === "stock" ? "Voorraad"
                      : filterScreen === "type" ? "Type"
                      : filterScreen === "taste" ? "Smaakprofiel"
                      : filterScreen === "organic" ? "Kenmerk"
                      : "Drinkvenster"}
                  </span>
                </div>

                {filterScreen === null && (
                  <div className="filter-nav-list">
                    <button className="filter-nav-row" onClick={() => setFilterScreen("sort")}>
                      <span>
                        <span className="filter-nav-row-title">Sorteren</span>
                        <span className="filter-nav-row-sub">{sortSummary}</span>
                      </span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </button>
                    <button className="filter-nav-row" onClick={() => setFilterScreen("stock")}>
                      <span>
                        <span className="filter-nav-row-title">Voorraad</span>
                        <span className="filter-nav-row-sub">{stockSummary}</span>
                      </span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </button>
                    <button className="filter-nav-row" onClick={() => setFilterScreen("type")}>
                      <span>
                        <span className="filter-nav-row-title">Type</span>
                        <span className="filter-nav-row-sub">{typeSummary}</span>
                      </span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </button>
                    <button className="filter-nav-row" onClick={() => setFilterScreen("taste")}>
                      <span>
                        <span className="filter-nav-row-title">Smaakprofiel</span>
                        <span className="filter-nav-row-sub">{tasteSummary}</span>
                      </span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </button>
                    <button className="filter-nav-row" onClick={() => setFilterScreen("organic")}>
                      <span>
                        <span className="filter-nav-row-title">Kenmerk</span>
                        <span className="filter-nav-row-sub">{organicSummary}</span>
                      </span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </button>
                    <button className="filter-nav-row" onClick={() => setFilterScreen("window")}>
                      <span>
                        <span className="filter-nav-row-title">Drinkvenster</span>
                        <span className="filter-nav-row-sub">{windowSummary}</span>
                      </span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </button>
                  </div>
                )}

                {filterScreen === "sort" && (
                  <div className="filter-nav-list">
                    {SORT_OPTIONS.map(([k]) => (
                      <button
                        key={k}
                        className="filter-nav-row"
                        onClick={() => sortBy === k ? setSortDir(d => d === "asc" ? "desc" : "asc") : setSortBy(k)}
                      >
                        <span className="filter-nav-row-title">{sortOptionLabel(k)}</span>
                        {sortBy === k && <span className="filter-nav-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {filterScreen === "stock" && (
                  <div className="filter-nav-list">
                    {[["available", "Op voorraad"], ["all", "Alle wijnen"], ["opened", "Al opengetrokken"]].map(([k, label]) => (
                      <button key={k} className="filter-nav-row" onClick={() => setStockFilter(k)}>
                        <span className="filter-nav-row-title-wrap">
                          <span className="filter-nav-row-title">{label}</span>
                          <span className="filter-nav-count">({stockCount[k]})</span>
                        </span>
                        {stockFilter === k && <span className="filter-nav-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {filterScreen === "type" && (
                  <div className="filter-nav-list">
                    <button className="filter-nav-row" onClick={() => setTypeFilter("all")}>
                      <span className="filter-nav-row-title-wrap">
                        <span className="filter-nav-row-title">Alle types</span>
                        <span className="filter-nav-count">({typeCountAll})</span>
                      </span>
                      {typeFilter === "all" && <span className="filter-nav-check">✓</span>}
                    </button>
                    {Object.entries(TYPE_META).map(([k, v]) => (
                      <button key={k} className="filter-nav-row" onClick={() => setTypeFilter(k)}>
                        <span className="filter-nav-row-title-wrap">
                          <span className="filter-nav-row-title">{v.label}</span>
                          <span className="filter-nav-count">({typeCount[k] || 0})</span>
                        </span>
                        {typeFilter === k && <span className="filter-nav-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {filterScreen === "taste" && (
                  <div className="filter-nav-list">
                    <button className="filter-nav-row" onClick={() => setTasteFilter("all")}>
                      <span className="filter-nav-row-title-wrap">
                        <span className="filter-nav-row-title">Elk smaakprofiel</span>
                        <span className="filter-nav-count">({tasteCountAll})</span>
                      </span>
                      {tasteFilter === "all" && <span className="filter-nav-check">✓</span>}
                    </button>
                    {(() => {
                      let lastGroup = null;
                      return Object.entries(TASTE_CATEGORIES).map(([k, v]) => {
                        const showGroupLabel = v.group !== lastGroup;
                        lastGroup = v.group;
                        return (
                          <Fragment key={k}>
                            {showGroupLabel && <div className="filter-nav-group-label">{v.group}</div>}
                            <button className="filter-nav-row" onClick={() => setTasteFilter(k)}>
                              <span className="filter-nav-row-title-wrap">
                                <span className="filter-nav-row-title">{v.label}</span>
                                <span className="filter-nav-count">({tasteCount[k] || 0})</span>
                              </span>
                              {tasteFilter === k && <span className="filter-nav-check">✓</span>}
                            </button>
                          </Fragment>
                        );
                      });
                    })()}
                  </div>
                )}

                {filterScreen === "organic" && (
                  <div className="filter-nav-list">
                    <button className="filter-nav-row" onClick={() => setOrganicFilter("all")}>
                      <span className="filter-nav-row-title-wrap">
                        <span className="filter-nav-row-title">Alle wijnen</span>
                        <span className="filter-nav-count">({organicCountAll})</span>
                      </span>
                      {organicFilter === "all" && <span className="filter-nav-check">✓</span>}
                    </button>
                    <button className="filter-nav-row" onClick={() => setOrganicFilter("organic")}>
                      <span className="filter-nav-row-title-wrap">
                        <span className="filter-nav-row-title">Biologisch</span>
                        <span className="filter-nav-count">({organicCount.organic})</span>
                      </span>
                      {organicFilter === "organic" && <span className="filter-nav-check">✓</span>}
                    </button>
                    <button className="filter-nav-row" onClick={() => setOrganicFilter("biodynamic")}>
                      <span className="filter-nav-row-title-wrap">
                        <span className="filter-nav-row-title">Biodynamisch</span>
                        <span className="filter-nav-count">({organicCount.biodynamic})</span>
                      </span>
                      {organicFilter === "biodynamic" && <span className="filter-nav-check">✓</span>}
                    </button>
                  </div>
                )}

                {filterScreen === "window" && (
                  <div className="filter-nav-list">
                    <button className="filter-nav-row" onClick={() => setStatusFilter("all")}>
                      <span className="filter-nav-row-title-wrap">
                        <span className="filter-nav-row-title">Elk drinkvenster</span>
                        <span className="filter-nav-count">({windowCountAll})</span>
                      </span>
                      {statusFilter === "all" && <span className="filter-nav-check">✓</span>}
                    </button>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <button key={k} className="filter-nav-row" onClick={() => setStatusFilter(k)}>
                        <span className="filter-nav-row-title-wrap">
                          <span className="filter-nav-row-title">{v.label}</span>
                          <span className="filter-nav-count">({windowCount[k] || 0})</span>
                        </span>
                        {statusFilter === k && <span className="filter-nav-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-footer">
                <button className="btn-open filter-modal-done" onClick={() => setShowFilterPanel(false)}>
                  Toon {filtered.length} wijn{filtered.length === 1 ? "" : "en"}
                </button>
              </div>
            </div>
          </div>

          <div className="wine-list">
            {loading && <div className="empty-state">Kelder laden…</div>}
            {!loading && filtered.length === 0 && <div className="empty-state">Geen wijnen gevonden voor deze filters.</div>}
            {!loading && filtered.map(w => (
              <WineCard
                key={w.id}
                w={w}
                expanded={expandedId === w.id}
                onExpand={id => setExpandedId(expandedId === id ? null : id)}
                onOpen={openBottle}
                onSetQuantity={setQuantity}
                onMatchDish={id => { setPairingSeedId(id); setView("pairing"); }}
                onUpdateWine={updateWine}
                onDelete={deleteWine}
                onCardCamera={startCardPhotoCapture}
              />
            ))}
          </div>
        </>
      )}

      {view === "pairing" && (
        <PairingView
          wines={wines}
          onOpen={openBottle}
          onSetQuantity={setQuantity}
          onUpdateWine={updateWine}
          onDelete={deleteWine}
          onCardCamera={startCardPhotoCapture}
          seedWineId={pairingSeedId}
          onClearSeed={() => setPairingSeedId(null)}
        />
      )}

      <div className="bottom-nav">
        <button className={"nav-item" + (view === "list" ? " nav-item-active" : "")} onClick={() => { setView("list"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <Grape size={18} />
          <span className="nav-label">Mijn wijn</span>
        </button>
        <button className="nav-plus" onClick={() => setShowAddChoice(true)}>
          <Plus size={18} />
        </button>
        <button className={"nav-item" + (view === "pairing" ? " nav-item-active" : "")} onClick={() => { setPairingSeedId(null); setView("pairing"); }}>
          <Utensils size={18} />
          <span className="nav-label">Wijn &amp; spijs</span>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handlePhotoCapture}
      />

      {showAddChoice && (
        <div className="modal-overlay modal-overlay-center" onClick={() => setShowAddChoice(false)}>
          <div className="modal add-choice-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Wijn toevoegen</span>
              <X size={20} className="modal-close" onClick={() => setShowAddChoice(false)} />
            </div>
            <button
              className="btn-open add-choice-btn"
              onClick={() => { setShowAddChoice(false); cameraInputRef.current && cameraInputRef.current.click(); }}
            >
              <Camera size={16} /> Foto maken
            </button>
            <button
              className="btn-secondary add-choice-btn"
              onClick={() => { setShowAddChoice(false); setShowManualAdd(true); }}
            >
              <Pencil size={16} /> Handmatig invoeren
            </button>
          </div>
        </div>
      )}

      {photoAddStatus === "processing" && (
        <div className="modal-overlay modal-overlay-center">
          <div className="modal photo-processing-modal">
            <div className="photo-processing-spinner" />
            <p className="modal-hint" style={{ marginTop: 14, textAlign: "center" }}>
              Wijn herkennen en gegevens opzoeken…
              <br />Dit kan zo'n 20-30 seconden duren.
            </p>
          </div>
        </div>
      )}

      {photoAddStatus === "error" && (
        <div className="modal-overlay modal-overlay-center" onClick={() => setPhotoAddStatus("idle")}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Kon de wijn niet verwerken</span>
              <X size={20} className="modal-close" onClick={() => setPhotoAddStatus("idle")} />
            </div>
            <p className="modal-hint">{photoAddError}</p>
            <button className="btn-open" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPhotoAddStatus("idle")}>
              Sluiten
            </button>
          </div>
        </div>
      )}

      {photoAddResult && (
        <div className="modal-overlay modal-overlay-center" onClick={() => setPhotoAddResult(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>
                {photoAddResult.mode === "matched" ? "Voorraad bijgewerkt"
                  : photoAddResult.mode === "photoUpdated" ? "Foto bijgewerkt"
                  : "Wijn toegevoegd"}
              </span>
              <X size={20} className="modal-close" onClick={() => setPhotoAddResult(null)} />
            </div>
            <p className="modal-hint">
              {photoAddResult.mode === "matched"
                ? `"${photoAddResult.wineName}" stond al in je kelder — het aantal is met 1 opgehoogd, en de gegevens zijn ververst.`
                : photoAddResult.mode === "photoUpdated"
                ? `De foto (en gegevens) van "${photoAddResult.wineName}" zijn bijgewerkt.`
                : `"${photoAddResult.wineName}" is toegevoegd aan je kelder, inclusief productfoto en gevonden gegevens.`}
            </p>
            <button className="btn-open" style={{ width: "100%", justifyContent: "center" }} onClick={() => setPhotoAddResult(null)}>
              Mooi zo
            </button>
          </div>
        </div>
      )}

      {showManualAdd && (
        <div className="modal-overlay modal-overlay-center" onClick={() => setShowManualAdd(false)}>
          <div className="modal add-choice-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Wijn toevoegen</span>
              <X size={20} className="modal-close" onClick={() => setShowManualAdd(false)} />
            </div>
            <p className="modal-hint">
              Omschrijf de wijn — bijvoorbeeld naam, jaargang en/of wijnhuis. De app zoekt de rest zelf op.
            </p>
            <textarea
              className="modal-textarea"
              placeholder="Bijv. Château Giscours 2014"
              value={manualDescription}
              onChange={e => setManualDescription(e.target.value)}
              autoFocus
            />
            <button
              className="btn-open"
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
              disabled={!manualDescription.trim()}
              onClick={handleManualAdd}
            >
              Toevoegen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
