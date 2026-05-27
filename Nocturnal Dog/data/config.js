// Nocturnal Dog — Apps Script API URL
// Állítsd be az URL-t, miután a Google Sheet-hez tartozó Apps Script-et "Web app"-ként publikáltad.
// Ha üresen marad, a frontend a beépített data/games.js fájlból olvas (fallback).
//
// Megjegyzés: a szerkesztő (szerkeszto.html) első indításkor is bekéri ezt, és
// localStorage-ban tárolja — de ha ide is bemásolod, akkor a publikus játékadatbázis-
// oldal (jatekok.html) is mindig a Sheets-ből frissül.

window.NDOG_API = "";
