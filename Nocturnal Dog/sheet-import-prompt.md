You have write access to my Google Sheets. Please populate one tab of an existing spreadsheet — do NOT create a new spreadsheet.

SPREADSHEET
- Title: nocturnal_dog_adatbazis
- ID: 1fNonRkW6r0ua0_fHeLaEdufacKLn0CJGY5hYFcljVN8
- URL: https://docs.google.com/spreadsheets/d/1fNonRkW6r0ua0_fHeLaEdufacKLn0CJGY5hYFcljVN8/edit
- Target tab/sheet: "filmek"  (it already exists and is empty)
- IMPORTANT: do not touch the other tab "játékok".

TASK
Write the 30 films below into the "filmek" tab, starting at cell A1. Use this exact column order, with the field names as the header row (row 1). These are the same field names the website uses, so keep them exactly:

  A: title        (text — film title)
  B: year         (integer, e.g. 2016 — no thousands separator)
  C: genre        (text)
  D: duration     (number, minutes; decimals allowed, e.g. 7.75)
  E: block        (text; one of: Ident, Fordulatok, Projektek, Sötét oldal — may be empty)
  F: ytId         (text — YouTube video id; may be empty)
  G: link         (text — full URL, or "TBA")
  H: description  (text — long paragraph)

Leave a cell blank where the value is empty in the data (one film has no ytId, one has no block).

FORMAT THE TAB FOR EASY EDITING
- Freeze row 1; make the header row bold.
- Column widths: title ~230, year ~60, genre ~150, duration ~120, block ~120, ytId ~150, link ~240, description ~560.
- Format column B (year) as a plain integer (no decimals, no thousands separator) and column D (duration) as a number.
- Add a dropdown (data validation) on column E (block) with the options: Ident, Fordulatok, Projektek, Sötét oldal, Egyéb — allow blank / invalid entries too.
- Keep description on a single clipped line (don't expand row heights).

After writing, tell me how many rows you wrote and paste the header row back so I can confirm.

DATA (30 films, JSON — same structure as the website):
[
  {
    "title": "1435MM",
    "year": 2016,
    "genre": "Rövidfilm",
    "duration": 20,
    "block": "Ident",
    "ytId": "mrjREvSq28A",
    "link": "https://youtu.be/mrjREvSq28A",
    "description": "A világ vasútjainak több mint 50%-a 1435 mm-es nyomtávolságú. Nehéz egy külön esszé megnyitása nélkül ennél bővebben beszélni erről a műről. A Nocturnal Dog történetének egyik legfontosabb darabja a 1435MM, amely három szereplőt követ végig, akik sorsa összefonódik valahol végtelenben a feloldódás és eltűnés élménye által kísérve. A képek és a montázs embert próbáló, a hangulata kísérleti, de ez volt az első film, amely megragadta a műhely nehezen megragadható, de határozottan kitapintható identitását."
  },
  {
    "title": "Phish",
    "year": 2016,
    "genre": "Misztikus",
    "duration": 7.75,
    "block": "Fordulatok",
    "ytId": "dLq1gBb8lSc",
    "link": "https://youtu.be/dLq1gBb8lSc",
    "description": "Az első filmünk, amely a később bejáratott 48 órás filmpályázatra készült. A műfaj \"mystery\" címkével lett ellátva, szerepeltetnünk kellett egy halat a műben, és az \"it will never fly\" mondatnak el kellett valamilyen formában hangoznia. A történet egy rongyos gyerekcsoportról szól, akik ritualisztikus eszközökkel sikeresen véghez visznek valamit, ami a tudomány eszközeivel lehetetlennek bizonyul."
  },
  {
    "title": "Ördögszekér",
    "year": 2025,
    "genre": "Rövidfilm",
    "duration": 25,
    "block": "Sötét oldal",
    "ytId": "DZnKJDzESfI",
    "link": "https://youtu.be/DZnKJDzESfI",
    "description": "Rita, Csaba és gyermekük Márk egy csodálatos közös vakációra készültek. Egy rossz kanyar és hibás útvonalválasztás azonban más irányba tereli az utazásukat, és egy országút menti társulat szállásánál kötnek ki. Szerencsére pont ma este játszák újra a világraszóló bábelőadásukat."
  },
  {
    "title": "Morzsi",
    "year": 2016,
    "genre": "Műhelyfilm",
    "duration": 2.63,
    "block": "Ident",
    "ytId": "byx36iFVp2k",
    "link": "https://youtu.be/byx36iFVp2k",
    "description": "A pincében anya és apa nagy rendetlenséggel találkozik. A család kutyája, Morzsi, elpusztul. Ezt a két eseményt köti össze ez az igen korai, klasszikus Nocturnal Dog alkotás."
  },
  {
    "title": "A varázsló halála",
    "year": 2016,
    "genre": "Dráma",
    "duration": 1.98,
    "block": "Ident",
    "ytId": "srPUdQ6Il7o",
    "link": "https://youtu.be/srPUdQ6Il7o",
    "description": "Egy testvérpár idősebb tagja kockázatos lépésre szánta el magát. Szerencsésen hazatért, de vajon minden marad a régiben, vagy örökre megváltozik az életük? Csáth Géza művének semmi köze a filmhez, viszont a Jalan Jalan zenei víziója itt fejti ki először a hatását az alkotásainkra."
  },
  {
    "title": "The Minimum Clearance Outline",
    "year": 2017,
    "genre": "Road movie",
    "duration": 8,
    "block": "Fordulatok",
    "ytId": "nK5TWRSkJrQ",
    "link": "https://youtu.be/nK5TWRSkJrQ",
    "description": "Az általunk frekventált (ma már nem létező) 48 órás filmpályázat short listre került alkotása. Műfaja road movie, de mindenféle jármű nélkül. A filmben egy Dorothy jellegű karaktert követhetünk végig, ahogy egy tükörvilágban maga mellé gyűjtve hasonló sorsú útitársakat végül kimásznak a feledés és elveszettség síkjából."
  },
  {
    "title": "Fényszennyezés",
    "year": 2017,
    "genre": "Rövidfilm",
    "duration": 5.65,
    "block": "Sötét oldal",
    "ytId": "UCVhZ09MsD4",
    "link": "https://youtu.be/UCVhZ09MsD4",
    "description": "Valami zajlik odakint. Egy csoportnyi gyerek ez elől menekült egy pincehelyiségbe. Vajon örökre csapdába kerültek, vagy megtalálják egyedül innen a kiutat?"
  },
  {
    "title": "Három fehér ló",
    "year": 2018,
    "genre": "Rövidfilm",
    "duration": 3.96,
    "block": "Projektek",
    "ytId": "fF1MVz1zWrE",
    "link": "https://youtu.be/fF1MVz1zWrE",
    "description": "Két barát összeül sakkozni és iszogatni. Ekkor furcsa dolgok történnek."
  },
  {
    "title": "Kenopsia, opia, lachesism",
    "year": 2018,
    "genre": "Etűd",
    "duration": 5.92,
    "block": "Projektek",
    "ytId": "Bs1tHvCRx8E",
    "link": "https://youtu.be/Bs1tHvCRx8E",
    "description": "Három szót választottunk, amik bonyolult érzéseket egy szóval írnak le. Kenopsia: egy érzés, ami akkor fog el minket, amikor egy olyan helyen járunk, ami most kihalt, ám a legtöbbször állandó nyüzsgésben látjuk. Opia: amikor a másik szemébe nézünk és egy egyszerre érződik behatoló gesztusnak és egyszerre törékenyek leszünk tőle. Lachesism: amikor titokban arra vágyunk, hogy átéljünk egy katasztrófát, pusztán, hogy túlélhessük. Kísérleti film Philip Glass méltán híres Koyaanisquatsi darabjára."
  },
  {
    "title": "Mr A, Mr K, a Pápa, Izom Tibor és az elnyomottak",
    "year": 2018,
    "genre": "Kísérleti film",
    "duration": 5.2,
    "block": "Projektek",
    "ytId": "opjXJhNPBO8",
    "link": "https://youtu.be/opjXJhNPBO8",
    "description": "Az emberi személyiség komplex dinamikák együtthatásában létezik. A film arra kísérlet, hogy megmutassa, hogy léteznek együtt különböző erők egy személyben."
  },
  {
    "title": "How to Make a Remake",
    "year": 2018,
    "genre": "Werkfilm",
    "duration": 14.37,
    "block": "Ident",
    "ytId": "Fg-T8T7Tr5I",
    "link": "https://youtu.be/Fg-T8T7Tr5I",
    "description": "A How To Make A Remake című film a 2018-as (akkor még) „bicós-mozis” táborban készült Remake (vagy néha tévesen: Remix) című nyári alkotásunk werkje. A film, amelyről ez a „hogyan készült?” stílusú munka szól, és amely nem került be a fesztiválprogramunkba, egy kevésbé közönségbarát mű visszaemlékezésről, alternatív valóságokról, kapcsolatokról és barátságról. Ádám sokszor jellemzi úgy a filmet, mint jó példa arra, amikor a folyamat jobb volt, mint maga az eredmény. A Remake rövid szinopszisa segíthet megérteni a werket: a táborozók 2018-ban üzeneteket kaptak egy baljós alternatív jövőből, amelyben a már kialakult veszélyt kizárólag a „vörös kutya” megmentésével lehet elkerülni, így üzenetet kell küldeni a múltba."
  },
  {
    "title": "Da Capo",
    "year": 2018,
    "genre": "Etűd",
    "duration": 5,
    "block": "Projektek",
    "ytId": "JpRKm48n0n0",
    "link": "https://youtu.be/JpRKm48n0n0?si=bVzJQbK98ZJ70QqI",
    "description": "Mozart Requiemének megírásával kapcsolatban több párhuzamos városi legenda is létezik a köztudatban. A BFZ 2018-as \"Lásd, amit hallasz\" pályázatára készülő alkotásunk a zeneszerző utolsó szimfóniájának mitológiájáról emlékezik meg az első szimfóniája által vezetve."
  },
  {
    "title": "Biztos, hogy tűzálló",
    "year": 2018,
    "genre": "Krimi",
    "duration": 3.43,
    "block": "Sötét oldal",
    "ytId": "7Zik7dNAwwU",
    "link": "https://youtu.be/7Zik7dNAwwU",
    "description": "A híradó egy sikertelen elnök elleni merényletről számol be. De mi ment félre? Mi történt az elkövetőkkel?"
  },
  {
    "title": "Jó ok a távozásra",
    "year": 2019,
    "genre": "Rövidfilm",
    "duration": 13.2,
    "block": "Ident",
    "ytId": "78qHkmMnRnA",
    "link": "https://youtu.be/78qHkmMnRnA",
    "description": "Egy kiránduló gyerektársaság nem találja a kiutat az erdőből. Se térerő, sem ötlet, hogy merre mehetnének tovább. Csak az erdőben tanyázó fura alakok keresztezik az útjukat."
  },
  {
    "title": "A hős útja...",
    "year": 2019,
    "genre": "Trailer",
    "duration": 0.88,
    "block": "Ident",
    "ytId": "ZjxZlqWpILs",
    "link": "https://youtu.be/ZjxZlqWpILs",
    "description": "Egy hős dacol minden veszéllyel. A bélapátfalvi táborunk \"reklámfilmjét\" láthatjátok."
  },
  {
    "title": "Hétköznapi szuperhősök (és hogy miért utáljuk őket)",
    "year": 2020,
    "genre": "Áldokumentumfilm",
    "duration": 29.62,
    "block": "Projektek",
    "ytId": "ZCSH9qDzpOI",
    "link": "https://youtu.be/ZCSH9qDzpOI",
    "description": "Az ember azt gondolná, hogy szuperhősökkel egy fedél alatt élni kifejezetten pozitív, de legalább izgalmas élmény. Sajnos az utóbbi igaz csak a kettő közül: drámában és eseményekben nincs hiány a szuperhősök közös albérletében. Ezeket a hétköznapi konfliktusokat követi végig és örökíti meg a szuperhősöket filmező dokumentumfilmes stáb."
  },
  {
    "title": "Akherón ...és mi lett a pandával?",
    "year": 2021,
    "genre": "Kísérleti film",
    "duration": 12,
    "block": "Ident",
    "ytId": "_qTjQ7OeDrc",
    "link": "https://youtu.be/_qTjQ7OeDrc",
    "description": "Hősünk testvérét elrabolták. A nyomok az alvilág legmélyebb bugyraiba vezetnek. Az Akherón - És a pandával mi lett? díjat nyert a 2021-es diákfilmszemlén."
  },
  {
    "title": "Praedo",
    "year": 2021,
    "genre": "Reklám",
    "duration": 0.6,
    "block": "Ident",
    "ytId": "4OTwHdkkoIo",
    "link": "https://youtu.be/4OTwHdkkoIo",
    "description": "Egy háztartásvezető élete nem könnyű. Ehhez nehéz bármi mást hozzáfűzni. Egyike a rengeteg stílusgyakorlatának a Nocturnal Dog filmműhelynek."
  },
  {
    "title": "Asomik",
    "year": 2021,
    "genre": "Reklám",
    "duration": 0.72,
    "block": "Fordulatok",
    "ytId": "s1KhAeIctOw",
    "link": "https://youtu.be/s1KhAeIctOw",
    "description": "A szentgyőzőházai bányákból származó összetevők közismerten magas folttisztítóhatással rendelkezik. Ez a reklám a helybeli üzemekben készült Asomik mosószert mutatja be. Nekem beválik!"
  },
  {
    "title": "Silence in Bjordall",
    "year": 2021,
    "genre": "Trailer",
    "duration": 1.05,
    "block": "Projektek",
    "ytId": "QQkATp3ZrNE",
    "link": "https://youtu.be/QQkATp3ZrNE",
    "description": "A finn fjordok közelében egy szürke kisváros éli mindennapjait egészen addig, amíg rejtélyes körülmények között nem válik gyilkosság áldozatává Judi. A rejtélyt felgöngyölíteni azonban csupán egy olyan ember képes, aki már rég visszavonult a bűnüldözéstől... Sigmund Vestarsson leghíresebb sorozatának főcímét láthatjuk."
  },
  {
    "title": "Piroska és a Farkas",
    "year": 2019,
    "genre": "Rövidfilm/ Kísérleti film",
    "duration": 16.78,
    "block": "Sötét oldal",
    "ytId": "oOY_ZimZMC0",
    "link": "https://youtu.be/oOY_ZimZMC0",
    "description": "Közismert mese, talán a világ legismertebbje. Mi is feldolgoztuk, különböző ötleteket, stílusokat vegyítve a történettel. "
  },
  {
    "title": "Aratás",
    "year": 2022,
    "genre": "Rövidfilm",
    "duration": 30.28,
    "block": "Fordulatok",
    "ytId": "k5C0P4FN7WQ",
    "link": "https://youtu.be/k5C0P4FN7WQ",
    "description": "Négy mezőgazdasággal foglalkozó család gyerekei egy tanyán találják magukat. Ezt a helyet valami misztikus erő miatt nem tudják elhagyni, így csapdába kerültek. Egy nap Misire, az egyik legidősebb gyermekre holtan találnak. Ez felborítja az összeverődött családok közötti időleges békét."
  },
  {
    "title": "Ki ez a sok művész?",
    "year": 2023,
    "genre": "Rövidfilm",
    "duration": 25.8,
    "block": "Fordulatok",
    "ytId": "093OOQEkEfU",
    "link": "https://youtu.be/093OOQEkEfU",
    "description": "Az Újhegyi Waldorf Gimnázium színjátszószakkörének résztvevőit a diákszínjátszó fesztivál után elrabolják, és arra kényszerítik őket a fogvatartók, hogy folytassák az évekkel ezelőtt a műsorról levett kedvenc francia szappanoperájukat. A gyerekek végül egyetlen lehetőséget látnak arra, hogy értelmetlenné tegyék további fogvatartásukat."
  },
  {
    "title": "Greetings from Bjordall",
    "year": 2021,
    "genre": "Trailer",
    "duration": 1.07,
    "block": "Sötét oldal",
    "ytId": "dgyIO9-bp0g",
    "link": "https://youtu.be/dgyIO9-bp0g",
    "description": "Nyomozó? Drogdíler? Bűnöző? Olaf Guntersson főszereplésével a 2010-es évek közepén megalkották a finnek az északi régió talán egyik legismertebb, legszeretettebb sitcomját. Ennek a főcímét nézhetjük most végig."
  },
  {
    "title": "Jószándék",
    "year": 2024,
    "genre": "Etűd",
    "duration": 5.5,
    "block": "Projektek",
    "ytId": "NwJ8VgWiHeU",
    "link": "https://www.youtube.com/watch?v=NwJ8VgWiHeU",
    "description": "18 éven aluliaknak nem ajánlott. Egy nevelőintézetben nevelkedő gyermek fiatal felnőttként visszatér a már bezárt intézetbe, hogy szembenézzen a múltjával. Filmetűd Arvo Pärt Fratres című darabjára."
  },
  {
    "title": "Kiterítenek úgy is...",
    "year": 2024,
    "genre": "Etűd",
    "duration": 5.66,
    "block": "Ident",
    "ytId": "bBO8fy1W-3A",
    "link": "https://www.youtube.com/watch?v=bBO8fy1W-3A",
    "description": "Tan Dun Buddha Passion című alkotásának egy tételére készült 2024 nyarán Magyarszéken ez a filmetűd. Elsődlegesen Ádám munkája, amely a „Kádár dilemmája” anekdotára és morális dilemmára adott válaszként került megfogalmazásra. A film két iteráción keresztül mutatja be egy fausti alku, vagy egy tiltott gyümölcs körüli döntésopciókat. Az örök élet és örök tudás vajon elhozza-e a végtelen boldogságot az ember számára?"
  },
  {
    "title": "Kezdetben volt a tett",
    "year": 2016,
    "genre": "Etűd",
    "duration": 3.76,
    "block": "Fordulatok",
    "ytId": "0PxBSRa3yVs",
    "link": "https://youtu.be/0PxBSRa3yVs",
    "description": "Az első hivatalosan is pályázatra leadott alkotása a Nocturnal Dog filmműhelynek: a BFZ 2016-os \"Lásd, amit hallasz\" pályázatára Sosztakovics Hamlet-szvitjére készítettük ezt az alkotást, amely egy Faust-történetet tár a nézők elé különféle kísérleti mozgóképes eszközökkel."
  },
  {
    "title": "Holnap",
    "year": 2024,
    "genre": "Horror",
    "duration": 12.1,
    "block": "Sötét oldal",
    "ytId": "OgBC-vPL0W8",
    "link": "https://youtu.be/OgBC-vPL0W8",
    "description": "A világot megrázta a dél-jemeni parazita futótűzként terjedő és mutálódott változata. Ez az organizmus a központi idegrendszer éhséggel kapcsolatos részeit támadta meg, így minden fertőzött egyén kétségbeesetten keresi és zabálja fel az elé kerülő tápanyagforrásokat. Akit azonban a parazita nem észlel zabálónak, rögtön megfertőzi. Emberek egy kisebb csoportja sikeresen tudott kisebb, zárt kolóniákban életben maradni úgy, hogy \"majszolóknak\" tettették magukat, ezzel elkerülve a parazitafertőzést. Egy ideig. A paranoia azonban egy ilyen világban végzetes lehet."
  },
  {
    "title": "4 szoba",
    "year": 2025,
    "genre": "Kísérleti film",
    "duration": 10,
    "block": "Projektek",
    "ytId": "",
    "link": "TBA",
    "description": "Friss rezidens pszichiáter érkezik a klinikára. A fiatal orvosnak fel kell tűrnie az ingujját és munkához kell látnia, hiszen ezeket a klienseket egyáltalán nem könnyű kezelni."
  },
  {
    "title": "Drámaország",
    "year": 2021,
    "genre": "Rövidfilm",
    "duration": 24.37,
    "block": "",
    "ytId": "xOJwczfvYmg",
    "link": "https://youtu.be/xOJwczfvYmg",
    "description": "A Drámaország nevű tábor évek óta sikerrel készíti fel a leendő színészpalántákat a nehéz színiiskolákra és a színpadi életre. Aki ilyen nehéz pályára vágyik, jól teszi, ha megragadja ezeket a lehetőségeket, ahol nagynevű tanároktól lesheti el a mesterség fogásait és közben még jól is érzi magát. Csakhogy a Drámaország nevű táborban a tanárok inkább álságosak, nagyképűek, kihasználják a gyermekek igyekezetét és kiszolgáltatottságát. A közelmúlt híreiből ismerős lehet a képlet. Viszont ebben a történetben a gyerekek a saját kezükbe veszik a sorsukat."
  }
]
