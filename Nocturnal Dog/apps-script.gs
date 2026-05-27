/**
 * Nocturnal Dog — Játékadatbázis backend (Google Apps Script)
 * ────────────────────────────────────────────────────────────
 *
 * TELEPÍTÉS:
 *  1. Új Google Sheet létrehozása.
 *  2. Extensions → Apps Script. Töröld a Code.gs tartalmát, illeszd be ezt a fájlt.
 *  3. Mentés.
 *  4. A futtatási menüből futtasd le egyszer a `setup()` függvényt (engedélyezés szükséges).
 *  5. Futtasd le a `addUser("admin", "valami-eros-jelszo")` függvényt is — saját jelszót adj!
 *     (a függvény paramétereit a forráskódban módosítsd, futtasd, majd töröld a jelszót).
 *  6. Deploy → New deployment → Web app:
 *       - Execute as: Me
 *       - Who has access: Anyone (with the link)
 *     Másold ki a webalkalmazás URL-jét.
 *  7. A frontenden (Nocturnal Dog) nyisd meg a /szerkeszto.html oldalt — első indításkor
 *     bekéri ezt az URL-t, majd a felhasználónév + jelszót.
 *
 * BIZTONSÁG:
 *  - A jelszó SHA-256 (10 000× iterált, sózott) hash-ként van eltárolva — NEM nyíltan.
 *  - A munkamenet-token HMAC-SHA256-tal aláírt, lejárati idővel.
 *  - A teljes kommunikáció HTTPS-en zajlik (Google TLS).
 *  - Az URL-t ne tedd közzé nyilvánosan.
 */

const SHEET_GAMES   = 'Games';
const SHEET_USERS   = 'Users';
const SHEET_LOG     = 'Log';
const TOKEN_HOURS   = 8;
const PBKDF_ITER    = 10000;

const COLUMNS = [
  'id','title','category','energy','groupSize','duration','minAge',
  'tags','summary','howTo','notes','updated','updatedBy'
];

// ────────────────── ONE-TIME SETUP ──────────────────
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let games = ss.getSheetByName(SHEET_GAMES);
  if (!games) {
    games = ss.insertSheet(SHEET_GAMES);
    games.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    games.setFrozenRows(1);
    games.setColumnWidths(1, COLUMNS.length, 140);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GAMES);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GAMES);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GAMES);
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOG);
    if (sheet) sheet.appendRow([new Date(), user, action, detail]);
  } catch (e) {}
}

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
