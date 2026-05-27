// Nocturnal Dog — film-adatforrás (Apps Script web app /exec URL).
//
// Ide másold a "filmek" lapot kiszolgáló Apps Script web app /exec URL-jét,
// majd commitold. (Telepítés: külön films-api clasp projekt → Deploy ▸ Web app
// ▸ Execute as: Me ▸ Access: Anyone.)
//
// Ez NEM titok: a végpont szándékosan nyilvános ("Anyone"), Google-bejelentkezés
// nélkül hívható, és csak nyilvános filmadatokat ad vissza. Statikus oldalon
// (GitHub Pages) nincs futásidejű env változó, ezért a kiszolgált fájlban kell
// lennie. Az egyetlen valós kockázat a GAS napi kvóta kimerítése scrape-eléssel,
// nem adatszivárgás.
//
// Ha üresen marad, a főoldal látható hibát jelez (NEM esik vissza statikus
// pillanatképre) — a brief "always fresh" elve szerint.

window.NDOG_FILMS_API = "https://script.google.com/macros/s/AKfycbw0EOZMYBJv-l5nW-s6rG_7_x-E763T6bTfOhND1qBmqvCQGz8u87MFL9ZmP7aH4Bm6/exec";

// Nocturnal Dog — játék-adatforrás (Apps Script web app /exec URL).
// A "játékok" lapot kiszolgáló külön clasp projekt ("Nocturnal Dog backend").
// A jatekok.html ezt hívja ?action=list paraméterrel; üresen hagyva látható hibát jelez.
window.NDOG_GAMES_API = "https://script.google.com/macros/s/AKfycbxKn0giVlhL9D0krLaicr7fATGO7QmyDzrMkU-uUu0tOMsmJvsc-VoCUGAcT3m01Gr9/exec";
