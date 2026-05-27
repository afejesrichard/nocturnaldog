// Drama / improv játékok adatbázisa — Nocturnal Dog
// PLACEHOLDER adat. Az alábbi néhány játék csak minta, hogy lássátok a mezők
// szerkezetét — cseréljétek le / egészítsétek ki a saját játékaitokkal
// (a szerkeszto.html felületen vagy közvetlenül a "játékok" Google Sheet lapon).

window.GAMES_DATA = [
  {
    id: "zip-zap-zop",
    title: "Zip Zap Zop",
    category: "Bemelegítés",
    energy: 4,
    groupSize: "10+",
    duration: 5,
    minAge: 8,
    tags: ["fókusz", "körjáték", "reflex", "ritmus"],
    summary: "Energialabda jár körbe-körbe szem-kontaktussal és három szóval.",
    howTo: "Mindenki körbe áll. Az első játékos rámutat egy másikra és mondja: ZIP. Aki kapta, rámutat a következőre: ZAP. A harmadik: ZOP. Aztán újra ZIP. A lendület soha nem állhat le; aki bizonytalankodik vagy elrontja, kiesik vagy bohóc-meghajlással visszaülhet.",
    notes: "Klasszikus indító. Egy órás próba elején, állva, 3-4 percig. Ha gyors a csoport, vezess be tiltott szavakat (pl. \"BOING\" = irány váltás)."
  },
  {
    id: "igen-es",
    title: "Igen, és…",
    category: "Improvizáció",
    energy: 3,
    groupSize: "2-4",
    duration: 10,
    minAge: 12,
    tags: ["alapelv", "jelenetépítés", "elfogadás"],
    summary: "Az improvizáció aranyszabálya: minden ajánlatra rábólintunk és továbbépítjük.",
    howTo: "Két játékos jelenetet kezd. Bármit mond a másik, te azt elfogadod (\"Igen\"), és HOZZÁTESZEL valamit (\"és…\"). Tilos blokkolni, kérdezni vagy tagadni. 2-3 perces jelenetek, utána csere.",
    notes: "A drámafoglalkozások legfontosabb alapja. Először szándékosan játszátok le rosszul (mindenre \"nem\") — utána értik meg igazán."
  },
  {
    id: "tukor",
    title: "Tükör",
    category: "Mozgás",
    energy: 2,
    groupSize: "2-4",
    duration: 8,
    minAge: 8,
    tags: ["páros", "koncentráció", "csend", "test"],
    summary: "Páros lassú mozdulatkövetés — kívülről nézve egyetlen testté olvadtok.",
    howTo: "Párokban, szemben. Az egyik vezet, a másik tükör — pontosan és lassan követi minden mozdulatát. Csere 90 másodperc után. Haladó: vezetőváltás láthatatlanul, néma egyezséggel.",
    notes: "Ideális csendre hangoló gyakorlat. Halk zenére még jobb."
  },
  {
    id: "kavezo",
    title: "Kávézó",
    category: "Karakter",
    energy: 2,
    groupSize: "2-4",
    duration: 15,
    minAge: 14,
    tags: ["karakter", "improv", "státusz", "jelenet"],
    summary: "Egyszerű helyszín, hármas jelenet — a feszültséget a státuszkülönbség adja.",
    howTo: "Egy kávézóban három karakter: pincér, törzsvendég, új vendég. A vezető előre megadja a státusz-számokat (1-10). A jelenet 4 perces. Cél: a számok kihallatszanak a viselkedésből, de senki nem mondja ki őket.",
    notes: "Keith Johnstone státusz-elméletének bevezetésére tökéletes. Felvenni és visszanézni nagyon tanulságos."
  }
];
