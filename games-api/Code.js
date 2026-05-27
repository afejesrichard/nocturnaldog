/**
 * Nocturnal Dog — Játékadatbázis backend (Google Apps Script)
 * ────────────────────────────────────────────────────────────
 *
 * TELEPÍTÉS (clasp / parancssor — lásd a repo Nocturnal Dog/.clasp.json fájlját):
 *  1. npm i -g @google/clasp  &&  clasp login
 *  2. A "Nocturnal Dog" mappából: töltsd ki a .clasp.json scriptId mezőjét
 *     (új önálló projekt: `clasp create --type standalone`, vagy meglévő bound
 *     script Script ID-ja az Apps Script → Beállítások oldalról), majd `clasp push`.
 *  3. `clasp deploy` — webalkalmazásként telepít (lásd appsscript.json webapp blokk).
 *     A /exec URL az Apps Script → Telepítés → Telepítések kezelése alatt látható.
 *  4. A futtatási menüből futtasd le egyszer a `setup()` függvényt (engedélyezés szükséges),
 *     majd a `importGames()` függvényt a "játékok" lap feltöltéséhez.
 *  5. Futtasd le a `addUser("admin", "valami-eros-jelszo")` függvényt is — saját jelszót adj!
 *     (a függvény paramétereit a forráskódban módosítsd, futtasd, majd töröld a jelszót).
 *  6. A /exec URL-t írd be a data/config.js NDOG_API mezőjébe (publikus oldalhoz),
 *     a szerkeszto.html pedig első indításkor is bekéri.
 *
 * BIZTONSÁG:
 *  - A jelszó SHA-256 (10 000× iterált, sózott) hash-ként van eltárolva — NEM nyíltan.
 *  - A munkamenet-token HMAC-SHA256-tal aláírt, lejárati idővel.
 *  - A teljes kommunikáció HTTPS-en zajlik (Google TLS).
 *  - Az URL-t ne tedd közzé nyilvánosan.
 */

const SHEET_GAMES   = 'játékok';
const SHEET_FILMS   = 'filmek';
const SHEET_USERS   = 'felhasználók';
const SHEET_LOG     = 'napló';
const TOKEN_HOURS   = 8;
const PBKDF_ITER    = 10000;

const GAME_COLUMNS = [
  'id','title','category','energy','groupSize','duration','minAge',
  'tags','summary','howTo','notes','updated','updatedBy'
];

const FILM_COLUMNS = ["title","year","genre","duration","block","ytId","link","description"];
const FILM_BLOCKS  = ['Ident', 'Fordulatok', 'Projektek', 'Sötét oldal', 'Egyéb'];

const GAME_CATEGORIES = ['Bemelegítés', 'Improvizáció', 'Karakter', 'Mozgás', 'Hang és szöveg', 'Bizalom', 'Koncentráció'];
const GAME_SIZES      = ['2-4', '5-10', '10+'];

// A táblázat azonosítója (a /spreadsheets/d/<ID>/edit URL-ből).
const SPREADSHEET_ID = '1fNonRkW6r0ua0_fHeLaEdufacKLn0CJGY5hYFcljVN8';

// Bound scriptként a getActiveSpreadsheet() adja a táblát; önálló (clasp) deploynál
// nincs aktív táblázat, ilyenkor azonosító alapján nyitjuk meg.
function getSS_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ────────────────── ONE-TIME SETUP ──────────────────
function setup() {
  const ss = getSS_();

  let games = ss.getSheetByName(SHEET_GAMES);
  if (!games) {
    games = ss.insertSheet(SHEET_GAMES);
    games.getRange(1, 1, 1, GAME_COLUMNS.length).setValues([GAME_COLUMNS]);
    formatGamesSheet_(games, 0);
  }

  let films = ss.getSheetByName(SHEET_FILMS);
  if (!films) {
    films = ss.insertSheet(SHEET_FILMS);
    films.getRange(1, 1, 1, FILM_COLUMNS.length).setValues([FILM_COLUMNS]);
    formatFilmsSheet_(films, 0);
  }

  let users = ss.getSheetByName(SHEET_USERS);
  if (!users) {
    users = ss.insertSheet(SHEET_USERS);
    users.getRange(1, 1, 1, 4).setValues([['username','salt','hash','created']]);
    users.setFrozenRows(1);
    users.hideSheet(); // hide by default (re-show in Sheets UI if needed)
  }

  let log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG);
    log.getRange(1, 1, 1, 4).setValues([['time','user','action','detail']]);
    log.setFrozenRows(1);
  }

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) {
    const secret = Utilities.base64Encode(Utilities.getUuid() + ':' + Utilities.getUuid());
    props.setProperty('SECRET', secret);
  }

  Logger.log('Setup kész. Most futtasd: addUser("felhasználónév", "jelszó")');
}

// ────────────────── USER MANAGEMENT ──────────────────
/** Felhasználó hozzáadása. Hívd a script editorból: addUser("admin","jelszo123"). */
function addUser(username, password) {
  if (!username || !password) throw new Error('Felhasználónév és jelszó kötelező.');
  if (password.length < 8) throw new Error('A jelszó legalább 8 karakter legyen.');
  const sheet = getSS_().getSheetByName(SHEET_USERS);
  if (!sheet) throw new Error('Futtasd először a setup() függvényt.');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === username) {
      throw new Error('Ez a felhasználónév már létezik. Töröld először: removeUser("' + username + '")');
    }
  }
  const salt = Utilities.base64Encode(Utilities.getUuid());
  const hash = pbkdf2(password, salt);
  sheet.appendRow([username, salt, hash, new Date()]);
  Logger.log('Felhasználó hozzáadva: ' + username);
}

function removeUser(username) {
  const sheet = getSS_().getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === username) {
      sheet.deleteRow(i + 1);
      Logger.log('Törölve: ' + username);
      return;
    }
  }
  Logger.log('Nem található: ' + username);
}

function changePassword(username, newPassword) {
  if (!newPassword || newPassword.length < 8) throw new Error('Min. 8 karakter.');
  const sheet = getSS_().getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === username) {
      const salt = Utilities.base64Encode(Utilities.getUuid());
      const hash = pbkdf2(newPassword, salt);
      sheet.getRange(i + 1, 2, 1, 2).setValues([[salt, hash]]);
      Logger.log('Jelszó frissítve: ' + username);
      return;
    }
  }
  throw new Error('Felhasználó nem található: ' + username);
}

// ────────────────── CRYPTO ──────────────────
function pbkdf2(password, salt) {
  // Sózott + iterált SHA-256 (egyszerű, de kielégítő egy kis műhelynek)
  let v = salt + ':' + password;
  for (let i = 0; i < PBKDF_ITER; i++) {
    v = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, v));
  }
  return v;
}

function checkPassword(username, password) {
  if (!username || !password) return null;
  const sheet = getSS_().getSheetByName(SHEET_USERS);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === username) {
      const salt = rows[i][1];
      const expected = rows[i][2];
      const got = pbkdf2(password, salt);
      return constantTimeEq(got, expected) ? username : null;
    }
  }
  return null;
}

function constantTimeEq(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function makeToken(username) {
  const expiry = Date.now() + TOKEN_HOURS * 3600 * 1000;
  const payload = username + '|' + expiry;
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  const sig = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(payload, secret)
  );
  return Utilities.base64EncodeWebSafe(payload) + '.' + Utilities.base64EncodeWebSafe(sig);
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    const expectedSig = Utilities.base64Encode(
      Utilities.computeHmacSha256Signature(payload, secret)
    );
    const givenSig = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
    if (!constantTimeEq(expectedSig, givenSig)) return null;
    const [username, expiryStr] = payload.split('|');
    const expiry = parseInt(expiryStr, 10);
    if (!expiry || expiry < Date.now()) return null;
    return { username: username, expiry: expiry };
  } catch (e) {
    return null;
  }
}

// ────────────────── DATA OPS ──────────────────
function listGames() {
  const sheet = getSS_().getSheetByName(SHEET_GAMES);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r[0]).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    o.energy   = parseInt(o.energy, 10)   || 0;
    o.duration = parseInt(o.duration, 10) || 0;
    o.minAge   = parseInt(o.minAge, 10)   || 0;
    o.tags = typeof o.tags === 'string'
      ? o.tags.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(o.tags) ? o.tags : []);
    return o;
  });
}

function upsertGame(g, byUser) {
  if (!g || !g.id) throw new Error('Hiányzó id.');
  const sheet = getSS_().getSheetByName(SHEET_GAMES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const now = new Date();
  const buildRow = () => headers.map(h => {
    if (h === 'tags')      return (g.tags || []).join(', ');
    if (h === 'updated')   return now;
    if (h === 'updatedBy') return byUser;
    return g[h] !== undefined && g[h] !== null ? g[h] : '';
  });
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === g.id) {
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([buildRow()]);
      logAction(byUser, 'update', g.id + ' / ' + (g.title || ''));
      return g;
    }
  }
  sheet.appendRow(buildRow());
  logAction(byUser, 'create', g.id + ' / ' + (g.title || ''));
  return g;
}

function deleteGameById(id, byUser) {
  const sheet = getSS_().getSheetByName(SHEET_GAMES);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const title = rows[i][1] || '';
      sheet.deleteRow(i + 1);
      logAction(byUser, 'delete', id + ' / ' + title);
      return true;
    }
  }
  return false;
}

function logAction(user, action, detail) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_LOG);
    if (sheet) sheet.appendRow([new Date(), user, action, detail]);
  } catch (e) {}
}

// ────────────────── GAME SEED / IMPORT ──────────────────
/**
 * One-time seed: tölti a "játékok" lapot a weboldal játékadatbázisával (4 minta játék).
 * Futtasd a szkript-szerkesztőből egyszer. Új játékot később új sorként, vagy a
 * szerkesztőfelületen (szerkeszto.html) keresztül adj hozzá.
 */
function importGames() {
  const ss = getSS_();
  let sheet = ss.getSheetByName(SHEET_GAMES);
  if (!sheet) sheet = ss.insertSheet(SHEET_GAMES);
  sheet.clearContents();
  sheet.clearFormats();
  const rows = GAME_DATA_;
  const values = [GAME_COLUMNS].concat(rows);
  sheet.getRange(1, 1, values.length, GAME_COLUMNS.length).setValues(values);
  formatGamesSheet_(sheet, rows.length);
  SpreadsheetApp.flush();
  Logger.log("Kész: " + rows.length + " játék importálva a(z) \"" + SHEET_GAMES + "\" lapra.");
}

function formatGamesSheet_(sheet, n) {
  const cols = GAME_COLUMNS.length;
  const idx  = (k) => GAME_COLUMNS.indexOf(k) + 1;
  const rowsN = Math.max(n, 1);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight("bold").setBackground("#14110f").setFontColor("#f4b942")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 30);
  const widths = {
    id: 150, title: 200, category: 130, energy: 70, groupSize: 90, duration: 80,
    minAge: 70, tags: 220, summary: 340, howTo: 460, notes: 420, updated: 140, updatedBy: 110
  };
  GAME_COLUMNS.forEach((k, i) => sheet.setColumnWidth(i + 1, widths[k] || 120));
  ["energy", "duration", "minAge"].forEach(k =>
    sheet.getRange(2, idx(k), rowsN, 1).setNumberFormat("0"));
  ["summary", "howTo", "notes"].forEach(k =>
    sheet.getRange(2, idx(k), rowsN, 1)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment("top"));
  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(GAME_CATEGORIES, true).setAllowInvalid(true).build();
  sheet.getRange(2, idx("category"), rowsN + 100, 1).setDataValidation(catRule);
  const sizeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(GAME_SIZES, true).setAllowInvalid(true).build();
  sheet.getRange(2, idx("groupSize"), rowsN + 100, 1).setDataValidation(sizeRule);
}

const GAME_DATA_ = [
    [
      "zip-zap-zop",
      "Zip Zap Zop",
      "Bemelegítés",
      4,
      "10+",
      5,
      8,
      "fókusz, körjáték, reflex, ritmus",
      "Energialabda jár körbe-körbe szem-kontaktussal és három szóval.",
      "Mindenki körbe áll. Az első játékos rámutat egy másikra és mondja: ZIP. Aki kapta, rámutat a következőre: ZAP. A harmadik: ZOP. Aztán újra ZIP. A lendület soha nem állhat le; aki bizonytalankodik vagy elrontja, kiesik vagy bohóc-meghajlással visszaülhet.",
      "Klasszikus indító. Egy órás próba elején, állva, 3-4 percig. Ha gyors a csoport, vezess be tiltott szavakat (pl. \"BOING\" = irány váltás).",
      "",
      ""
    ],
    [
      "igen-es",
      "Igen, és…",
      "Improvizáció",
      3,
      "2-4",
      10,
      12,
      "alapelv, jelenetépítés, elfogadás",
      "Az improvizáció aranyszabálya: minden ajánlatra rábólintunk és továbbépítjük.",
      "Két játékos jelenetet kezd. Bármit mond a másik, te azt elfogadod (\"Igen\"), és HOZZÁTESZEL valamit (\"és…\"). Tilos blokkolni, kérdezni vagy tagadni. 2-3 perces jelenetek, utána csere.",
      "A drámafoglalkozások legfontosabb alapja. Először szándékosan játszátok le rosszul (mindenre \"nem\") — utána értik meg igazán.",
      "",
      ""
    ],
    [
      "tukor",
      "Tükör",
      "Mozgás",
      2,
      "2-4",
      8,
      8,
      "páros, koncentráció, csend, test",
      "Páros lassú mozdulatkövetés — kívülről nézve egyetlen testté olvadtok.",
      "Párokban, szemben. Az egyik vezet, a másik tükör — pontosan és lassan követi minden mozdulatát. Csere 90 másodperc után. Haladó: vezetőváltás láthatatlanul, néma egyezséggel.",
      "Ideális csendre hangoló gyakorlat. Halk zenére még jobb.",
      "",
      ""
    ],
    [
      "kavezo",
      "Kávézó",
      "Karakter",
      2,
      "2-4",
      15,
      14,
      "karakter, improv, státusz, jelenet",
      "Egyszerű helyszín, hármas jelenet — a feszültséget a státuszkülönbség adja.",
      "Egy kávézóban három karakter: pincér, törzsvendég, új vendég. A vezető előre megadja a státusz-számokat (1-10). A jelenet 4 perces. Cél: a számok kihallatszanak a viselkedésből, de senki nem mondja ki őket.",
      "Keith Johnstone státusz-elméletének bevezetésére tökéletes. Felvenni és visszanézni nagyon tanulságos.",
      "",
      ""
    ]
  ];

// ────────────────── FILM DATA OPS ──────────────────
function listFilms() {
  const sheet = getSS_().getSheetByName(SHEET_FILMS);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r[0]).map(r => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    o.year     = parseInt(o.year, 10)   || o.year;
    o.duration = parseFloat(o.duration) || o.duration;
    return o;
  });
}

/**
 * One-time seed: tölti a "filmek" lapot a weboldal adatszerkezetével (30 film).
 * Futtasd a szkript-szerkesztőből egyszer. Új filmet később egyszerűen új sorként adj hozzá.
 */
function importFilms() {
  const ss = getSS_();
  let sheet = ss.getSheetByName(SHEET_FILMS);
  if (!sheet) sheet = ss.insertSheet(SHEET_FILMS);
  sheet.clearContents();
  sheet.clearFormats();
  const rows = FILM_DATA_;
  const values = [FILM_COLUMNS].concat(rows);
  sheet.getRange(1, 1, values.length, FILM_COLUMNS.length).setValues(values);
  formatFilmsSheet_(sheet, rows.length);
  SpreadsheetApp.flush();
  Logger.log('Kész: ' + rows.length + ' film importálva a(z) "' + SHEET_FILMS + '" lapra.');
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
  sheet.getRange(2, idx('year'), rowsN, 1).setNumberFormat('0');
  sheet.getRange(2, idx('duration'), rowsN, 1).setNumberFormat('0.##');
  sheet.getRange(2, idx('description'), rowsN, 1)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment('top');
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(FILM_BLOCKS, true).setAllowInvalid(true).build();
  sheet.getRange(2, idx('block'), rowsN + 100, 1).setDataValidation(rule);
}

const FILM_DATA_ = [
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

// ────────────────── ROUTING ──────────────────
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return handle(e.parameter || {});
}

function doPost(e) {
  let p = {};
  try {
    if (e.postData && e.postData.contents) p = JSON.parse(e.postData.contents);
  } catch (err) { p = e.parameter || {}; }
  return handle(p);
}

function handle(p) {
  try {
    const action = p.action;

    if (action === 'ping') return json({ ok: true, version: 1 });

    if (action === 'list') {
      return json({ ok: true, games: listGames() });
    }

    if (action === 'films') {
      return json({ ok: true, films: listFilms() });
    }

    if (action === 'login') {
      const u = checkPassword(p.username, p.password);
      if (!u) {
        Utilities.sleep(500); // small delay against brute force
        return json({ ok: false, error: 'invalid_credentials' });
      }
      logAction(u, 'login', '');
      return json({ ok: true, token: makeToken(u), username: u, expiresIn: TOKEN_HOURS * 3600 });
    }

    // Authenticated actions
    const session = verifyToken(p.token);
    if (!session) return json({ ok: false, error: 'invalid_token' });

    if (action === 'whoami') {
      return json({ ok: true, username: session.username, expiry: session.expiry });
    }

    if (action === 'upsert') {
      const game = typeof p.game === 'string' ? JSON.parse(p.game) : p.game;
      return json({ ok: true, game: upsertGame(game, session.username) });
    }

    if (action === 'delete') {
      const ok = deleteGameById(p.id, session.username);
      return json({ ok: ok });
    }

    return json({ ok: false, error: 'unknown_action: ' + action });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}
