// Delt liste over norske byer/bydeler for Google Places-søk. Flyttet ut av
// fetch-restaurant-leads.js 2026-09-23 for å unngå at fetch-places-leads.js
// fikk sin egen drivende kopi av samme 180-liste.
// Byer/tettsteder etter befolkning, størst først, for å prioritere volum.
// Oslo/Bergen/Trondheim/Stavanger er delt opp i bydeler (se BYDELER) i stedet for
// ett samlesøk, siden Google Places Text Search har et hardt tak på ~60 treff per
// søkestreng uansett paginering - de fire storbyene har garantert langt flere
// restauranter med nettside enn det ene søket noensinne kunne fange opp.
const BYDELER = {
  Oslo: ['Gamle Oslo', 'Grünerløkka', 'Sagene', 'St. Hanshaugen', 'Frogner', 'Ullern',
    'Vestre Aker', 'Nordre Aker', 'Bjerke', 'Grorud', 'Stovner', 'Alna', 'Østensjø',
    'Nordstrand', 'Søndre Nordstrand'],
  Bergen: ['Arna', 'Årstad', 'Åsane', 'Bergenhus', 'Fana', 'Fyllingsdalen', 'Laksevåg', 'Ytrebygda'],
  Trondheim: ['Midtbyen', 'Østbyen', 'Lerkendal', 'Heimdal'],
  Stavanger: ['Eiganes og Våland', 'Hinna', 'Madla', 'Hillevåg', 'Storhaug', 'Tasta', 'Hundvåg'],
  // Utvidelse (12.09.2026): disse mellomstore byene har ligget som ett enkelt søk siden
  // 03.08-batchen og er derfor mettet på samme ~60-treffs-cap som storbyene hadde -
  // splittes nå opp på samme måte for å låse opp mer volum.
  Bærum: ['Sandvika', 'Bekkestua', 'Fornebu', 'Rykkinn', 'Bærums Verk', 'Høvik', 'Stabekk'],
  Kristiansand: ['Kvadraturen', 'Vågsbygd', 'Lund', 'Randesund', 'Grim', 'Søm'],
  Fredrikstad: ['Gamlebyen', 'Cicignon', 'Trosvik', 'Lisleby', 'Kråkerøy', 'Rolvsøy', 'Onsøy'],
  Sandnes: ['Sandnes sentrum', 'Ganddal', 'Hana', 'Bogafjell', 'Lura'],
  Tromsø: ['Tromsø sentrum', 'Kvaløysletta', 'Tromsdalen'],
  Sarpsborg: ['Sarpsborg sentrum', 'Grålum', 'Hafslund', 'Tune', 'Skjeberg'],
  Skien: ['Skien sentrum', 'Herkules', 'Gulset', 'Klosterskogen', 'Falkum'],
  Drammen: ['Bragernes', 'Strømsø', 'Fjell', 'Konnerud', 'Åssiden', 'Gulskogen'],
  Lillestrøm: ['Lillestrøm sentrum', 'Kjeller', 'Strømmen', 'Skjetten'],
  // Utvidelse 2 (12.09.2026): samme mettet-cap-problem, neste tier byer.
  Tønsberg: ['Tønsberg sentrum', 'Eik', 'Kilen', 'Sem', 'Husøy'],
  Moss: ['Moss sentrum', 'Kambo', 'Jeløy', 'Melløs'],
  Haugesund: ['Haugesund sentrum', 'Risøy', 'Hasseløy', 'Rossabø'],
  Arendal: ['Arendal sentrum', 'Tromøy', 'Hisøy', 'Saltrød', 'Stoa'],
};
const BYDEL_QUERIES = Object.entries(BYDELER).flatMap(([by, bydeler]) =>
  bydeler.map((b) => `${b}, ${by}`)
);

const CITIES = [
  ...BYDEL_QUERIES,
  'Ålesund', 'Sandefjord',
  'Porsgrunn', 'Bodø', 'Hamar', 'Larvik', 'Halden',
  'Lillehammer', 'Molde', 'Harstad', 'Kongsberg', 'Gjøvik', 'Askøy', 'Ringerike',
  'Horten', 'Askim', 'Kongsvinger', 'Steinkjer', 'Narvik', 'Levanger', 'Elverum',
  'Jessheim', 'Ski', 'Kristiansund', 'Mo i Rana',
  'Alta', 'Egersund', 'Grimstad', 'Mandal', 'Flekkefjord', 'Farsund', 'Notodden',
  'Rjukan', 'Voss', 'Førde', 'Florø', 'Stryn', 'Volda', 'Sogndal', 'Otta',
  'Lillesand', 'Risør', 'Kragerø', 'Bamble', 'Nøtterøy', 'Stokke', 'Hokksund',
  'Vennesla', 'Søgne', 'Eigersund', 'Bryne', 'Klepp', 'Jørpeland', 'Karmøy',
  'Kopervik', 'Odda', 'Vossevangen', 'Nesbyen', 'Gol', 'Hønefoss', 'Jevnaker',
  'Hurdal', 'Nannestad', 'Eidsvoll', 'Raufoss', 'Fagernes', 'Otta', 'Vinstra',
  'Tynset', 'Røros', 'Namsos', 'Grong', 'Brønnøysund', 'Sandnessjøen', 'Mosjøen',
  'Fauske', 'Sortland', 'Stokmarknes', 'Finnsnes', 'Hammerfest', 'Kirkenes',
  'Vadsø', 'Honningsvåg',
  // Utvidelse (04.09.2026): flere norske tettsteder/kommunesentre for å unngå at
  // bylista går tom. Kilde: Wikipedia fylkesartikler (no.wikipedia.org), kryssjekket
  // mot kjent geografi der artiklene motsa hverandre. Noen av de minste kan gi 0
  // treff - lavt tap siden scriptet bare går videre til neste by uansett.
  // Rogaland
  'Hauge', 'Moi', 'Vikeså', 'Varhaug', 'Kleppe', 'Ålgård', 'Sola', 'Randaberg',
  'Hjelmelandsvågen', 'Sand', 'Sauda', 'Aksdal', 'Ølensjøen',
  // Møre og Romsdal
  'Fiskåbygd', 'Larsnes', 'Fosnavåg', 'Ulsteinvik', 'Hareid', 'Ørsta', 'Stranda',
  'Langevåg', 'Giske', 'Vestnes', 'Åndalsnes', 'Aukra', 'Bruhagen', 'Batnfjordsøra',
  'Tingvoll', 'Sunndalsøra', 'Surnadal', 'Aure', 'Elnesvågen', 'Brattvåg',
  // Agder
  'Gjerstad', 'Myra', 'Tvedestrand', 'Osedalen', 'Birkeland', 'Åmli', 'Birketveit',
  'Evje', 'Bygland', 'Valle', 'Lyngdal', 'Liknes', 'Tonstad',
  // Innlandet
  'Brumunddal', 'Løten', 'Stange', 'Skarnes', 'Skotterud', 'Kirkenær', 'Flisa',
  'Trysil', 'Rena', 'Koppang', 'Tolga', 'Alvdal', 'Folldal', 'Dovre', 'Lesja',
  'Bismo', 'Lom', 'Vågå', 'Vålebru', 'Øyer', 'Gausdal', 'Lena', 'Jaren', 'Hov',
  'Dokka', 'Bagn', 'Slidre', 'Heggenes',
  // Akershus
  'Asker', 'Nesoddtangen', 'Drøbak', 'Vestby', 'Ås', 'Kirkebygda', 'Lørenskog',
  'Fjerdingby', 'Bjørkelangen', 'Årnes', 'Ask', 'Rotnes', 'Roa',
  // Østfold
  'Skjærhalden', 'Karlshus', 'Skiptvet', 'Rakkestad', 'Ørje',
  // Buskerud
  'Lierbyen', 'Vikersund', 'Flå', 'Hemsedal', 'Ål', 'Prestfoss', 'Lampeland', 'Rødberg',
  // Vestfold
  'Holmestrand', 'Borgheim',
  // Telemark
  'Ulefoss', 'Bø', 'Seljord', 'Dalen', 'Vinje',
  // Trøndelag
  'Sistranda', 'Oppdal', 'Berkåk', 'Ålen', 'Støren', 'Melhus', 'Børsa', 'Hommelvik',
  'Selbu', 'Meråker', 'Stjørdalshalsen', 'Verdalsøra', 'Brekstad', 'Åfjord', 'Fillan',
  'Rissa', 'Kolvereid', 'Malm', 'Inderøy', 'Lauvsnes',
  // Vestland
  'Måløy', 'Etnesjøen', 'Sveio', 'Svortland', 'Leirvik', 'Fitjar', 'Uggdal',
  'Rosendal', 'Eidfjord', 'Ulvik', 'Norheimsund', 'Tysse', 'Osøyro', 'Storebø',
  'Straume', 'Dale', 'Lonevåg', 'Knarvik', 'Austrheim', 'Fedje', 'Svelgen',
  'Nordfjordeid', 'Sandane', 'Askvoll', 'Aurland', 'Lærdal', 'Årdalstangen',
  'Gaupne', 'Høyanger', 'Vik', 'Eivindvik', 'Hardbakke',
];

module.exports = { CITIES };
