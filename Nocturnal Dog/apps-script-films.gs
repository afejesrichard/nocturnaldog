/**
 * Nocturnal Dog — Filmadatbázis importáló (Google Apps Script)
 * ────────────────────────────────────────────────────────────
 * Ez a szkript a weboldal adatszerkezetével tölti fel a "filmek" lapot,
 * és olvasásra optimalizált, könnyen szerkeszthető táblázatot alakít ki.
 *
 * HASZNÁLAT (egyszer kell lefuttatni):
 *  1. A táblázatban: Bővítmények → Apps Script  (Extensions → Apps Script)
 *  2. Új fájl: + → Script,  illeszd be ide ezt a teljes tartalmat.
 *  3. Mentés (Ctrl+S).
 *  4. A függvény-legördülőből válaszd ki: importFilms → Futtatás (Run).
 *     Első alkalommal engedélyezés szükséges (a saját fiókoddal).
 *  5. Kész — a "filmek" lap feltöltődik mind a 30 filmmel.
 *
 * ÚJ FILM HOZZÁADÁSA később: egyszerűen írj egy új sort a "filmek" lap aljára.
 * A weboldal adatszerkezete = az oszlopfejlécek (title, year, genre, …).
 */

const FILMS_SHEET  = 'filmek';
const FILM_COLUMNS = ["title","year","genre","duration","block","ytId","link","description"];
const FILM_BLOCKS  = ['Ident', 'Fordulatok', 'Projektek', 'Sötét oldal', 'Egyéb'];

function importFilms() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FILMS_SHEET);
  if (!sheet) sheet = ss.insertSheet(FILMS_SHEET);
  sheet.clearContents();
  sheet.clearFormats();

  const rows = getFilmsData_();
  const values = [FILM_COLUMNS].concat(rows);
  sheet.getRange(1, 1, values.length, FILM_COLUMNS.length).setValues(values);

  formatFilmsSheet_(sheet, rows.length);
  SpreadsheetApp.flush();
  Logger.log('Kész: ' + rows.length + ' film importálva a(z) "' + FILMS_SHEET + '" lapra.');
}

/** Reads the films into webpage-shaped objects (for a future API endpoint). */
function listFilms() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FILMS_SHEET);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).filter(r => r[0]).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    o.year     = parseInt(o.year, 10)      || o.year;
    o.duration = parseFloat(o.duration)    || o.duration;
    return o;
  });
}

function formatFilmsSheet_(sheet, n) {
  const cols = FILM_COLUMNS.length;
  const idx  = (k) => FILM_COLUMNS.indexOf(k) + 1;
  const rowsN = Math.max(n, 1);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight('bold').setBackground('#14110f').setFontColor('#f4b942')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 30);

  const widths = { title:230, year:60, genre:150, duration:120, block:120, ytId:150, link:240, description:560 };
  FILM_COLUMNS.forEach((k, i) => sheet.setColumnWidth(i + 1, widths[k] || 120));

  sheet.getRange(2, idx('year'), rowsN, 1).setNumberFormat('0');       // 2016, nem 2,016
  sheet.getRange(2, idx('duration'), rowsN, 1).setNumberFormat('0.##'); // perc, max 2 tizedes
  sheet.getRange(2, idx('description'), rowsN, 1)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment('top');

  // Legördülő a "block" oszlopra (üres is engedélyezett)
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(FILM_BLOCKS, true).setAllowInvalid(true).build();
  sheet.getRange(2, idx('block'), rowsN + 100, 1).setDataValidation(rule);
}

function getFilmsData_() {
  return [
  [
    "1435MM",
    2016,
    "Rövidfilm",
    20,
    "Ident",
    "mrjREvSq28A",
    "https://youtu.be/mrjREvSq28A",
    "A világ vasútjainak több mint 50%-a 1435 mm-es nyomtávolságú. Nehéz egy külön esszé megnyitása nélkül ennél bővebben beszélni erről a műről. A Nocturnal Dog történetének egyik legfontosabb darabja a 1435MM, amely három szereplőt követ végig, akik sorsa összefonódik valahol végtelenben a feloldódás és eltűnés élménye által kísérve. A képek és a montázs embert próbáló, a hangulata kísérleti, de ez volt az első film, amely megragadta a műhely nehezen megragadható, de határozottan kitapintható identitását."
  ],
  [
    "Phish",
    2016,
    "Misztikus",
    7.75,
    "Fordulatok",
    "dLq1gBb8lSc",
    "https://youtu.be/dLq1gBb8lSc",
    "Az első filmünk, amely a később bejáratott 48 órás filmpályázatra készült. A műfaj \"mystery\" címkével lett ellátva, szerepeltetnünk kellett egy halat a műben, és az \"it will never fly\" mondatnak el kellett valamilyen formában hangoznia. A történet egy rongyos gyerekcsoportról szól, akik ritualisztikus eszközökkel sikeresen véghez visznek valamit, ami a tudomány eszközeivel lehetetlennek bizonyul."
  ],
  [
    "Ördögszekér",
    2025,
    "Rövidfilm",
    25,
    "Sötét oldal",
    "DZnKJDzESfI",
    "https://youtu.be/DZnKJDzESfI",
    "Rita, Csaba és gyermekük Márk egy csodálatos közös vakációra készültek. Egy rossz kanyar és hibás útvonalválasztás azonban más irányba tereli az utazásukat, és egy országút menti társulat szállásánál kötnek ki. Szerencsére pont ma este játszák újra a világraszóló bábelőadásukat."
  ],
  [
    "Morzsi",
    2016,
    "Műhelyfilm",
    2.63,
    "Ident",
    "byx36iFVp2k",
    "https://youtu.be/byx36iFVp2k",
    "A pincében anya és apa nagy rendetlenséggel találkozik. A család kutyája, Morzsi, elpusztul. Ezt a két eseményt köti össze ez az igen korai, klasszikus Nocturnal Dog alkotás."
  ],
  [
    "A varázsló halála",
    2016,
    "Dráma",
    1.98,
    "Ident",
    "srPUdQ6Il7o",
    "https://youtu.be/srPUdQ6Il7o",
    "Egy testvérpár idősebb tagja kockázatos lépésre szánta el magát. Szerencsésen hazatért, de vajon minden marad a régiben, vagy örökre megváltozik az életük? Csáth Géza művének semmi köze a filmhez, viszont a Jalan Jalan zenei víziója itt fejti ki először a hatását az alkotásainkra."
  ],
  [
    "The Minimum Clearance Outline",
    2017,
    "Road movie",
    8,
    "Fordulatok",
    "nK5TWRSkJrQ",
    "https://youtu.be/nK5TWRSkJrQ",
    "Az általunk frekventált (ma már nem létező) 48 órás filmpályázat short listre került alkotása. Műfaja road movie, de mindenféle jármű nélkül. A filmben egy Dorothy jellegű karaktert követhetünk végig, ahogy egy tükörvilágban maga mellé gyűjtve hasonló sorsú útitársakat végül kimásznak a feledés és elveszettség síkjából."
  ],
  [
    "Fényszennyezés",
    2017,
    "Rövidfilm",
    5.65,
    "Sötét oldal",
    "UCVhZ09MsD4",
    "https://youtu.be/UCVhZ09MsD4",
    "Valami zajlik odakint. Egy csoportnyi gyerek ez elől menekült egy pincehelyiségbe. Vajon örökre csapdába kerültek, vagy megtalálják egyedül innen a kiutat?"
  ],
  [
    "Három fehér ló",
    2018,
    "Rövidfilm",
    3.96,
    "Projektek",
    "fF1MVz1zWrE",
    "https://youtu.be/fF1MVz1zWrE",
    "Két barát összeül sakkozni és iszogatni. Ekkor furcsa dolgok történnek."
  ],
  [
    "Kenopsia, opia, lachesism",
    2018,
    "Etűd",
    5.92,
    "Projektek",
    "Bs1tHvCRx8E",
    "https://youtu.be/Bs1tHvCRx8E",
    "Három szót választottunk, amik bonyolult érzéseket egy szóval írnak le. Kenopsia: egy érzés, ami akkor fog el minket, amikor egy olyan helyen járunk, ami most kihalt, ám a legtöbbször állandó nyüzsgésben látjuk. Opia: amikor a másik szemébe nézünk és egy egyszerre érződik behatoló gesztusnak és egyszerre törékenyek leszünk tőle. Lachesism: amikor titokban arra vágyunk, hogy átéljünk egy katasztrófát, pusztán, hogy túlélhessük. Kísérleti film Philip Glass méltán híres Koyaanisquatsi darabjára."
  ],
  [
    "Mr A, Mr K, a Pápa, Izom Tibor és az elnyomottak",
    2018,
    "Kísérleti film",
    5.2,
    "Projektek",
    "opjXJhNPBO8",
    "https://youtu.be/opjXJhNPBO8",
    "Az emberi személyiség komplex dinamikák együtthatásában létezik. A film arra kísérlet, hogy megmutassa, hogy léteznek együtt különböző erők egy személyben."
  ],
  [
    "How to Make a Remake",
    2018,
    "Werkfilm",
    14.37,
    "Ident",
    "Fg-T8T7Tr5I",
    "https://youtu.be/Fg-T8T7Tr5I",
    "A How To Make A Remake című film a 2018-as (akkor még) „bicós-mozis” táborban készült Remake (vagy néha tévesen: Remix) című nyári alkotásunk werkje. A film, amelyről ez a „hogyan készült?” stílusú munka szól, és amely nem került be a fesztiválprogramunkba, egy kevésbé közönségbarát mű visszaemlékezésről, alternatív valóságokról, kapcsolatokról és barátságról. Ádám sokszor jellemzi úgy a filmet, mint jó példa arra, amikor a folyamat jobb volt, mint maga az eredmény. A Remake rövid szinopszisa segíthet megérteni a werket: a táborozók 2018-ban üzeneteket kaptak egy baljós alternatív jövőből, amelyben a már kialakult veszélyt kizárólag a „vörös kutya” megmentésével lehet elkerülni, így üzenetet kell küldeni a múltba."
  ],
  [
    "Da Capo",
    2018,
    "Etűd",
    5,
    "Projektek",
    "JpRKm48n0n0",
    "https://youtu.be/JpRKm48n0n0?si=bVzJQbK98ZJ70QqI",
    "Mozart Requiemének megírásával kapcsolatban több párhuzamos városi legenda is létezik a köztudatban. A BFZ 2018-as \"Lásd, amit hallasz\" pályázatára készülő alkotásunk a zeneszerző utolsó szimfóniájának mitológiájáról emlékezik meg az első szimfóniája által vezetve."
  ],
  [
    "Biztos, hogy tűzálló",
    2018,
    "Krimi",
    3.43,
    "Sötét oldal",
    "7Zik7dNAwwU",
    "https://youtu.be/7Zik7dNAwwU",
    "A híradó egy sikertelen elnök elleni merényletről számol be. De mi ment félre? Mi történt az elkövetőkkel?"
  ],
  [
    "Jó ok a távozásra",
    2019,
    "Rövidfilm",
    13.2,
    "Ident",
    "78qHkmMnRnA",
    "https://youtu.be/78qHkmMnRnA",
    "Egy kiránduló gyerektársaság nem találja a kiutat az erdőből. Se térerő, sem ötlet, hogy merre mehetnének tovább. Csak az erdőben tanyázó fura alakok keresztezik az útjukat."
  ],
  [
    "A hős útja...",
    2019,
    "Trailer",
    0.88,
    "Ident",
    "ZjxZlqWpILs",
    "https://youtu.be/ZjxZlqWpILs",
    "Egy hős dacol minden veszéllyel. A bélapátfalvi táborunk \"reklámfilmjét\" láthatjátok."
  ],
  [
    "Hétköznapi szuperhősök (és hogy miért utáljuk őket)",
    2020,
    "Áldokumentumfilm",
    29.62,
    "Projektek",
    "ZCSH9qDzpOI",
    "https://youtu.be/ZCSH9qDzpOI",
    "Az ember azt gondolná, hogy szuperhősökkel egy fedél alatt élni kifejezetten pozitív, de legalább izgalmas élmény. Sajnos az utóbbi igaz csak a kettő közül: drámában és eseményekben nincs hiány a szuperhősök közös albérletében. Ezeket a hétköznapi konfliktusokat követi végig és örökíti meg a szuperhősöket filmező dokumentumfilmes stáb."
  ],
  [
    "Akherón ...és mi lett a pandával?",
    2021,
    "Kísérleti film",
    12,
    "Ident",
    "_qTjQ7OeDrc",
    "https://youtu.be/_qTjQ7OeDrc",
    "Hősünk testvérét elrabolták. A nyomok az alvilág legmélyebb bugyraiba vezetnek. Az Akherón - És a pandával mi lett? díjat nyert a 2021-es diákfilmszemlén."
  ],
  [
    "Praedo",
    2021,
    "Reklám",
    0.6,
    "Ident",
    "4OTwHdkkoIo",
    "https://youtu.be/4OTwHdkkoIo",
    "Egy háztartásvezető élete nem könnyű. Ehhez nehéz bármi mást hozzáfűzni. Egyike a rengeteg stílusgyakorlatának a Nocturnal Dog filmműhelynek."
  ],
  [
    "Asomik",
    2021,
    "Reklám",
    0.72,
    "Fordulatok",
    "s1KhAeIctOw",
    "https://youtu.be/s1KhAeIctOw",
    "A szentgyőzőházai bányákból származó összetevők közismerten magas folttisztítóhatással rendelkezik. Ez a reklám a helybeli üzemekben készült Asomik mosószert mutatja be. Nekem beválik!"
  ],
  [
    "Silence in Bjordall",
    2021,
    "Trailer",
    1.05,
    "Projektek",
    "QQkATp3ZrNE",
    "https://youtu.be/QQkATp3ZrNE",
    "A finn fjordok közelében egy szürke kisváros éli mindennapjait egészen addig, amíg rejtélyes körülmények között nem válik gyilkosság áldozatává Judi. A rejtélyt felgöngyölíteni azonban csupán egy olyan ember képes, aki már rég visszavonult a bűnüldözéstől... Sigmund Vestarsson leghíresebb sorozatának főcímét láthatjuk."
  ],
  [
    "Piroska és a Farkas",
    2019,
    "Rövidfilm/ Kísérleti film",
    16.78,
    "Sötét oldal",
    "oOY_ZimZMC0",
    "https://youtu.be/oOY_ZimZMC0",
    "Közismert mese, talán a világ legismertebbje. Mi is feldolgoztuk, különböző ötleteket, stílusokat vegyítve a történettel. "
  ],
  [
    "Aratás",
    2022,
    "Rövidfilm",
    30.28,
    "Fordulatok",
    "k5C0P4FN7WQ",
    "https://youtu.be/k5C0P4FN7WQ",
    "Négy mezőgazdasággal foglalkozó család gyerekei egy tanyán találják magukat. Ezt a helyet valami misztikus erő miatt nem tudják elhagyni, így csapdába kerültek. Egy nap Misire, az egyik legidősebb gyermekre holtan találnak. Ez felborítja az összeverődött családok közötti időleges békét."
  ],
  [
    "Ki ez a sok művész?",
    2023,
    "Rövidfilm",
    25.8,
    "Fordulatok",
    "093OOQEkEfU",
    "https://youtu.be/093OOQEkEfU",
    "Az Újhegyi Waldorf Gimnázium színjátszószakkörének résztvevőit a diákszínjátszó fesztivál után elrabolják, és arra kényszerítik őket a fogvatartók, hogy folytassák az évekkel ezelőtt a műsorról levett kedvenc francia szappanoperájukat. A gyerekek végül egyetlen lehetőséget látnak arra, hogy értelmetlenné tegyék további fogvatartásukat."
  ],
  [
    "Greetings from Bjordall",
    2021,
    "Trailer",
    1.07,
    "Sötét oldal",
    "dgyIO9-bp0g",
    "https://youtu.be/dgyIO9-bp0g",
    "Nyomozó? Drogdíler? Bűnöző? Olaf Guntersson főszereplésével a 2010-es évek közepén megalkották a finnek az északi régió talán egyik legismertebb, legszeretettebb sitcomját. Ennek a főcímét nézhetjük most végig."
  ],
  [
    "Jószándék",
    2024,
    "Etűd",
    5.5,
    "Projektek",
    "NwJ8VgWiHeU",
    "https://www.youtube.com/watch?v=NwJ8VgWiHeU",
    "18 éven aluliaknak nem ajánlott. Egy nevelőintézetben nevelkedő gyermek fiatal felnőttként visszatér a már bezárt intézetbe, hogy szembenézzen a múltjával. Filmetűd Arvo Pärt Fratres című darabjára."
  ],
  [
    "Kiterítenek úgy is...",
    2024,
    "Etűd",
    5.66,
    "Ident",
    "bBO8fy1W-3A",
    "https://www.youtube.com/watch?v=bBO8fy1W-3A",
    "Tan Dun Buddha Passion című alkotásának egy tételére készült 2024 nyarán Magyarszéken ez a filmetűd. Elsődlegesen Ádám munkája, amely a „Kádár dilemmája” anekdotára és morális dilemmára adott válaszként került megfogalmazásra. A film két iteráción keresztül mutatja be egy fausti alku, vagy egy tiltott gyümölcs körüli döntésopciókat. Az örök élet és örök tudás vajon elhozza-e a végtelen boldogságot az ember számára?"
  ],
  [
    "Kezdetben volt a tett",
    2016,
    "Etűd",
    3.76,
    "Fordulatok",
    "0PxBSRa3yVs",
    "https://youtu.be/0PxBSRa3yVs",
    "Az első hivatalosan is pályázatra leadott alkotása a Nocturnal Dog filmműhelynek: a BFZ 2016-os \"Lásd, amit hallasz\" pályázatára Sosztakovics Hamlet-szvitjére készítettük ezt az alkotást, amely egy Faust-történetet tár a nézők elé különféle kísérleti mozgóképes eszközökkel."
  ],
  [
    "Holnap",
    2024,
    "Horror",
    12.1,
    "Sötét oldal",
    "OgBC-vPL0W8",
    "https://youtu.be/OgBC-vPL0W8",
    "A világot megrázta a dél-jemeni parazita futótűzként terjedő és mutálódott változata. Ez az organizmus a központi idegrendszer éhséggel kapcsolatos részeit támadta meg, így minden fertőzött egyén kétségbeesetten keresi és zabálja fel az elé kerülő tápanyagforrásokat. Akit azonban a parazita nem észlel zabálónak, rögtön megfertőzi. Emberek egy kisebb csoportja sikeresen tudott kisebb, zárt kolóniákban életben maradni úgy, hogy \"majszolóknak\" tettették magukat, ezzel elkerülve a parazitafertőzést. Egy ideig. A paranoia azonban egy ilyen világban végzetes lehet."
  ],
  [
    "4 szoba",
    2025,
    "Kísérleti film",
    10,
    "Projektek",
    "",
    "TBA",
    "Friss rezidens pszichiáter érkezik a klinikára. A fiatal orvosnak fel kell tűrnie az ingujját és munkához kell látnia, hiszen ezeket a klienseket egyáltalán nem könnyű kezelni."
  ],
  [
    "Drámaország",
    2021,
    "Rövidfilm",
    24.37,
    "",
    "xOJwczfvYmg",
    "https://youtu.be/xOJwczfvYmg",
    "A Drámaország nevű tábor évek óta sikerrel készíti fel a leendő színészpalántákat a nehéz színiiskolákra és a színpadi életre. Aki ilyen nehéz pályára vágyik, jól teszi, ha megragadja ezeket a lehetőségeket, ahol nagynevű tanároktól lesheti el a mesterség fogásait és közben még jól is érzi magát. Csakhogy a Drámaország nevű táborban a tanárok inkább álságosak, nagyképűek, kihasználják a gyermekek igyekezetét és kiszolgáltatottságát. A közelmúlt híreiből ismerős lehet a képlet. Viszont ebben a történetben a gyerekek a saját kezükbe veszik a sorsukat."
  ]
];
}
