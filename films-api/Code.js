/**
 * Nocturnal Dog — "filmek" → public JSON endpoint (Google Apps Script).
 *
 * Standalone web app. Reads ONLY the `filmek` tab (columns A:H) of the
 * nocturnal_dog_adatbazis sheet and returns a bare JSON array, fresh on every
 * request. It never reads, queries, or references the `játékok` tab.
 *
 * Deploy: Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Access: Anyone.
 *
 * Field map (sheet column → JSON key; matches what the site's main.js consumes):
 *   A title | B year | C genre | D duration | E block | F ytId | G link | H description
 *
 * Quota note: a consumer (gmail) account is capped at roughly 20,000 web-app /
 * UrlFetchApp calls per day. We do NOT cache, because the brief requires
 * always-fresh data. If traffic ever approaches the cap, the lever is a short
 * CacheService.getScriptCache() TTL (e.g. 30s) wrapped around the read — at the
 * cost of up to ~30s of staleness. Deliberately NOT enabled here.
 */

var SHEET_ID = '1fNonRkW6r0ua0_fHeLaEdufacKLn0CJGY5hYFcljVN8';
var SHEET_TAB = 'filmek';

function doGet() {
  try {
    var films = [];
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_TAB);
    if (sheet) {
      var lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        films = sheet.getRange(2, 1, lastRow - 1, 8).getValues()
          // ignore blank / whitespace-only title rows (stray trailing-row typos)
          .filter(function (r) { return String(r[0]).trim() !== ''; })
          .map(function (r) {
            return {
              title:       String(r[0]).trim(),
              year:        Number(r[1]),
              genre:       String(r[2]).trim(),
              duration:    Number(r[3]),
              block:       String(r[4]).trim(),
              ytId:        String(r[5]).trim(),
              link:        String(r[6]).trim(),
              description: String(r[7])
            };
          });
      }
    }
    return json(films);
  } catch (err) {
    // GAS ContentService can't set an HTTP status; surface the failure in the
    // body so the frontend can detect it and show its error panel.
    return json({ error: String((err && err.message) || err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
