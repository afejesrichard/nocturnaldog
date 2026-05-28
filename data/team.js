// SNAPSHOT, SINGLE SOURCE. Unlike films/games there is no live Apps Script
// endpoint for the team — the homepage "03 — Csapat" section renders straight
// from this array, so it can never blank. If a live endpoint is added later,
// mirror the films/games fetch-with-fallback and keep this file as the fallback.
//
// Bio copy is DRAFT (written by the design assistant from each role) — shipped
// as a first pass, to be replaced with the leaders' own words.
//
// `photo` paths keep their ?v= cache-buster. Each entry carries the portrait's
// intrinsic w/h so the renderer can reserve space (no layout shift / collapse).
window.TEAM_DATA = [
  {
    id: "adam", idx: "01",
    given: "Ádám", family: "László",
    role: "Drámapedagógus · mentálhigiénés szakember",
    since: "Alapító · 2015 óta",
    photo: "assets/team/adam.jpg?v=4", w: 1200, h: 1200,
    lead: "A műhely érzelmi iránytűje — aki a játékból rendszert, a rendszerből pedig biztonságos teret épít.",
    bio: [
      "Ádám drámapedagógusként és mentálhigiénés szakemberként azt a kérdést tartja a kezében, ami minden Nocturnal Dog-alkotás alatt ott dobog: mi történik valójában a kamera mögött álló kamasszal? Az ő munkája teremti meg azt a légkört, amelyben egy tizenéves merni kezd kockáztatni egy szerepben.",
      "A próbafolyamatokat és a nyári tábort úgy vezeti, hogy a film sosem önmagáért készül — hanem azért az emberért, aki közben formálódik. „Néha a folyamat jobb, mint maga az eredmény” — ez a mondat tőle ered, és a műhely egyik alaptétele lett."
    ],
    focus: ["Drámajáték", "Csoportdinamika", "Tábor", "Rendezés", "Színészvezetés"],
    works: [ { t: "Kiterítenek úgy is…", y: "2024" }, { t: "How to Make a Remake", y: "2018" } ]
  },
  {
    id: "richard", idx: "02",
    given: "Ricsi", family: "Fejes",
    role: "Narratológus kutató · Játékproducer",
    since: "Műhelyvezető · 2015 óta",
    photo: "assets/team/richard-web.jpg?v=1", w: 1200, h: 921,
    lead: "A történet anatómusa — aki szétszedi, majd a kamaszok kezébe adva újra összerakja a mesét.",
    bio: [
      "Ricsi narratológus kutatóként a történetmesélés szerkezetét hozza a műhelybe: miért működik egy fordulat, hol lakik egy karakter vágya, és mitől lesz egy etűdből valódi mű. A forgatókönyv-szobákban az ő kérdései feszítik szét a kézenfekvő ötleteket.",
      "Számára a film „az élet és a kultúra kódrendszere” — és a műhely tudástárát, a tíz év alatt gyűjtött drámajáték-adatbázist is ez a rendszerező, kutatói szemlélet tartja össze."
    ],
    focus: ["Dramaturgia", "Forgatókönyv", "Narratológia", "Tudástár", "Kutatás"],
    works: []
  },
  {
    id: "marton", idx: "03",
    given: "Marci", family: "Váradi",
    role: "Közösségszervező · orvostanhallgató",
    since: "Műhelyvezető · 2015 óta",
    photo: "assets/team/marton-web2.jpg?v=2", w: 1200, h: 1183,
    lead: "A láthatatlan állvány — aki nélkül a tábor, a stáb és a logisztika nem állna lábra.",
    bio: [
      "Marci közösségszervezőként és orvostanhallgatóként a műhely gyakorlati gerince: az ottalvós tábor, a forgatási napok és a stáb körüli rengeteg mozgó alkatrész az ő kezében áll össze működő egésszé. Ahol mások a képet látják, ott ő a feltételeket teremti meg hozzá.",
      "A csapatot összetartó energia nagy része tőle ered — figyel arra, hogy egy hét „mindentől elzárva” ne kimerítő legyen, hanem közösségi élmény, ahonnan film és barátságok egyaránt hazatérnek."
    ],
    focus: ["Szervezés", "Tábor", "Produkció", "Logisztika", "Közösség"],
    works: []
  }
];
