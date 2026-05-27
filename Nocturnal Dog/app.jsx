// Nocturnal Dog — Main app
const { useState, useEffect, useRef } = React;

const NAV_ITEMS = [
{ id: "rolunk", label: "Rólunk" },
{ id: "filmek", label: "Filmek" },
{ id: "jatekok", label: "Játékok", href: "jatekok.html" },
{ id: "kapcsolat", label: "Kapcsolat" }];


function Nav({ active, onTweak, tweaksOpen }) {
  const [open, setOpen] = useState(false);
  const scrollTo = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-logo" href="#top" onClick={(e) => {e.preventDefault();window.scrollTo({ top: 0, behavior: "smooth" });}}>
          <img src="assets/nocturnal_logo.png" alt="" />
          <span>Nocturnal Dog</span>
        </a>
        <button className="nav-mobile" onClick={() => setOpen((o) => !o)} aria-label="menü">
          {open ? "×" : "≡"}
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {NAV_ITEMS.map((item) =>
          item.href ?
          <a
            key={item.id}
            className="nav-link"
            href={item.href}>
            {item.label} <span style={{ opacity: 0.5, fontSize: 11, marginLeft: 2 }}>↗</span></a> :

          <a
            key={item.id}
            className={`nav-link ${active === item.id ? "active" : ""}`}
            href={`#${item.id}`}
            onClick={(e) => {e.preventDefault();scrollTo(item.id);}}>
            {item.label}</a>
          )}
        </div>
      </div>
    </nav>);

}

function Hero() {
  return (
    <section className="hero" id="top" data-screen-label="01 Cimlap">
      <div className="hero-art" style={{ position: "absolute", top: 80, right: 0, width: "44%", maxWidth: 620, opacity: 0.16, pointerEvents: "none", zIndex: 0 }}>
        <div className="moon" />
        <img src="assets/nocturnal_logo.png" alt="" style={{ filter: "blur(0.5px)" }} />
      </div>
      <div className="hero-grid" style={{ position: "relative", zIndex: 1 }}>
        <div>
          <div className="eyebrow">
            <span className="dot"></span>
            <span>2015 ÓTA · IFJÚSÁGI FILMKOLLEKTÍVA · 12–18 ÉV</span>
          </div>
          <h1>Nocturnal <span className="neon">Dog</span>.</h1>
          <p className="hero-lead">
            A Nocturnal Dog egy fiatal alkotókból álló filmes kollektíva.
            Évek óta tábort, próbafolyamatot és műhelyt tartunk
            kamaszoknak, akik nem várnak engedélyt arra, hogy saját
            filmjeiket elkezdjék elképzelni.
          </p>
        </div>
        <div className="hero-art">
          <div className="moon" />
          <img src="assets/nocturnal_logo.png" alt="Nocturnal Dog logó" />
          <div className="hero-coords tl">
            N 47°29′52″<br />
            E 19°02′25″
          </div>
          <div className="hero-coords tr">
            EST. MMXV<br />
            BUDAPEST
          </div>
          <div className="hero-coords bl">
            ROLL 12<br />
            REEL 04
          </div>
          <div className="hero-coords br">
            FRAME 0247<br />
            24 FPS
          </div>
        </div>
      </div>

    </section>);

}

function About() {
  return (
    <section className="section" id="rolunk" data-screen-label="02 Rolunk">
      <header className="section-head">
        <div className="section-num">02 — Rólunk</div>
      </header>

      <div className="about-grid">
        <div className="about-text">
          <p>
            A Nocturnal Dog 2015-ben indult egy nyári táborban — azzal a feltételezéssel,
            hogy a 12–18 éves alkotók képesek bármilyen filmre, amit egy felnőtt
            stáb képes lenne elkészíteni. Csak más a tempó, más a tét.
          </p>
          <p>
            Azóta évente három-négy alkotás születik a műhelyben: etűdök zenei
            ihletre, áldokumentumok kitalált szuperhősökkel, 48 órás filmpályázatokra
            készült rövidfilmek, és egy-egy hosszabb projekt, amibe egy egész tábor
            beleölheti az energiáját.
          </p>
          <p>
            Hisszük, hogy a filmkészítés nem szakma, hanem nyelv — és minél hamarabb
            sajátítja el az ember, annál szabadabban tud benne gondolkodni. Hisszük
            azt is, hogy a jó dráma- és improvizációs gyakorlatok ugyanannyit
            számítanak, mint egy jó kamera. Innen ered ennek a honlapnak a két fele.
          </p>
        </div>

        <div className="about-side">
          <div className="about-card about-card--people">
            <h4>Műhelyvezetők</h4>
            <div className="crew-row">
              <span className="name">László Ádám</span>
              <span className="role">Drámapedagógus · mentálhigiénés szakember</span>
            </div>
            <div className="crew-row">
              <span className="name">Fejes Richárd</span>
              <span className="role">Narratológus kutató</span>
            </div>
            <div className="crew-row">
              <span className="name">Váradi Márton</span>
              <span className="role">Közösségszervező · orvostanhallgató</span>
            </div>
          </div>

          <div className="about-card">
            <h4>Miből áll egy év?</h4>
            <div className="crew-row">
              <span>Heti műhely</span>
              <span className="role">Sze · 17:00</span>
            </div>
            <div className="crew-row">
              <span>Nyári tábor</span>
              <span className="role">Augusztus</span>
            </div>
            <div className="crew-row">
              <span>48 órás verseny</span>
              <span className="role">Évente 2×</span>
            </div>
            <div className="crew-row">
              <span>Saját fesztivál</span>
              <span className="role">December</span>
            </div>
          </div>
        </div>
      </div>

    </section>);

}

function Footer() {
  return (
    <footer className="footer" id="kapcsolat" data-screen-label="05 Kapcsolat">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand">Nocturnal <span className="accent">Dog</span></div>
            <div className="footer-tagline">
              Ifjúsági filmes műhely Budapesten. 2015 óta vesszük fel,
              amit más csapatok kihagynak.
            </div>
          </div>
          <div>
            <h5>Műhely</h5>
            <a href="#rolunk">Rólunk</a>
            <a href="#filmek">Filmek</a>
            <a href="#jatekok">Játékok</a>
            <a href="#">Tábor 2026</a>
          </div>
          <div>
            <h5>Kapcsolat</h5>
            <a href="mailto:hello@nocturnaldog.hu">hello@nocturnaldog.hu</a>
            <a href="tel:+36000000">+36 1 234 5678</a>
            <a href="#">Jelentkezés</a>
          </div>
          <div>
            <h5>Kövess minket</h5>
            <a href="#" target="_blank" rel="noopener">YouTube</a>
            <a href="#" target="_blank" rel="noopener">Instagram</a>
            <a href="#" target="_blank" rel="noopener">Facebook</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Nocturnal Dog</span>
          <span>Sose voltunk olyan ébren, mint éjszaka.</span>
        </div>
      </div>
    </footer>);

}

function GamesTeaser() {
  const games = window.GAMES_DATA;
  // Hand-pick a few representative games for the preview
  const previews = [
  games.find((g) => g.id === "igen-es"),
  games.find((g) => g.id === "viaszmuzeum"),
  games.find((g) => g.id === "status-leporello"),
  games.find((g) => g.id === "rosszul-csinaltad")].
  filter(Boolean);
  const tagCount = new Set(games.flatMap((g) => g.tags || [])).size;
  const catCount = new Set(games.map((g) => g.category)).size;

  return (
    <section className="section" id="jatekok-teaser" data-screen-label="04 Jatekok teaser">
      <header className="section-head">
        <div className="section-num">04 — Tudástár</div>
        <div>
          <h2 className="section-title">Játékadatbázis</h2>
          <p className="section-sub">
            Tíz év alatt összegyűjtött dráma- és improvizációs gyakorlatok. A műhely
            legfontosabb tudástőkéje — szürőkkel, kereséssel, címkefelhővel saját
            felhőz a mühön.
          </p>
        </div>
      </header>

      <div className="games-teaser">
        <div className="games-teaser-body">
          <div className="gt-eyebrow">Adatbázis</div>
          <h3>Keress, szűrj, tépj fel egy <span style={{ color: "var(--accent)", fontStyle: "italic" }}>véletlen</span> játékot.</h3>
          <p>
            Több mint {games.length} drámapedagógiai és improvizációs gyakorlat — tétoskedd reggeltől
            kifulladt pénteki bemelegítésig. Szűrj kategóriára, létszámra, időre, energiára,
            életkorra. Mindegyik mellett vezetői jegyzet és hogyan-játszd útmutató.
          </p>
          <div className="cta-row">
            <a className="cta" href="jatekok.html">
              Adatbázis megnyitása →
            </a>
            <a className="cta-secondary" href={`jatekok.html?sort=random`}>· Véletlen játék</a>
          </div>
          <div className="games-teaser-stats">
            <div>
              <div className="num">{games.length}</div>
              <div className="lbl">játék</div>
            </div>
            <div>
              <div className="num">{catCount}</div>
              <div className="lbl">kategória</div>
            </div>
            <div>
              <div className="num">{tagCount}+</div>
              <div className="lbl">címke</div>
            </div>
          </div>
        </div>

        <div className="games-teaser-preview">
          {previews.map((g, i) =>
          <a key={g.id} className="gt-row" href={`jatekok.html?q=${encodeURIComponent(g.title)}`}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span className="title">{g.title}</span>
              <span className="cat">{g.category}</span>
            </a>
          )}
          <a
            href="jatekok.html"
            style={{
              textAlign: "center",
              padding: "14px",
              color: "var(--accent)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase"
            }}>

            Összes {games.length} játék megtekintése →
          </a>
        </div>
      </div>
    </section>);

}

function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const ids = ["rolunk", "filmek", "kapcsolat"];
    const obs = new IntersectionObserver((entries) => {
      const visible = entries.
      filter((e) => e.isIntersecting).
      sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.1, 0.3, 0.5] });
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return active;
}

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "night",
  "accent": "#f4b942",
  "headerStyle": "italic",
  "density": "comfortable"
} /*EDITMODE-END*/;

function App() {
  const active = useActiveSection();
  const t = window.useTweaks ? window.useTweaks(DEFAULTS) : [DEFAULTS, () => {}];
  const [tweaks, setTweak] = t;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme === "night" ? "" : tweaks.theme);
    if (tweaks.theme === "night") document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.setProperty("--accent", tweaks.accent || "#f4b942");
  }, [tweaks.theme, tweaks.accent]);

  return (
    <React.Fragment>
      <Nav active={active} />
      <Hero />
      <About />
      <window.FilmsSection />
      <GamesTeaser />
      <Footer />

      {window.TweaksPanel &&
      <window.TweaksPanel>
          <window.TweakSection title="Téma">
            <window.TweakRadio
            label="Hangulat"
            value={tweaks.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
            { value: "night", label: "Éjszaka" },
            { value: "dusk", label: "Alkony" },
            { value: "paper", label: "Papír" }]
            } />
          
            <window.TweakColor
            label="Kiemelő szín"
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={["#f4b942", "#d96565", "#7eb6c1", "#a888c8", "#9ab87a"]} />
          
          </window.TweakSection>
        </window.TweaksPanel>
      }
    </React.Fragment>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);