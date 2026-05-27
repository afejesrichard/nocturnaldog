// Nocturnal Dog — Játékadatbázis (dedicated engine)
const { useState, useEffect, useMemo, useRef } = React;

const CATEGORIES = [
  "Bemelegítés", "Improvizáció", "Karakter", "Mozgás",
  "Hang és szöveg", "Bizalom", "Koncentráció"
];
const GROUP_SIZES = ["2-4", "5-10", "10+"];
const DURATIONS = [
  { label: "rövid (≤5p)", test: d => d <= 5 },
  { label: "közepes (5–15p)", test: d => d > 5 && d <= 15 },
  { label: "hosszú (15p+)", test: d => d > 15 }
];
const ENERGIES = [
  { label: "csendes (1-2)", test: e => e <= 2 },
  { label: "közepes (3)", test: e => e === 3 },
  { label: "pörgős (4-5)", test: e => e >= 4 }
];
const SORTS = [
  { key: "alpha", label: "Cím szerint" },
  { key: "cat", label: "Kategória szerint" },
  { key: "dur", label: "Időtartam (rövid→hosszú)" },
  { key: "dur-desc", label: "Időtartam (hosszú→rövid)" },
  { key: "energy", label: "Energia (alacsony→magas)" },
  { key: "random", label: "Véletlen" },
];

function EnergyBar({ value }) {
  return (
    <div className="energy-bar">
      {[1,2,3,4,5].map(n => <i key={n} className={n <= value ? "on" : ""} />)}
    </div>
  );
}

// Highlight a search query in text
function highlight(text, query) {
  if (!query || !text) return text;
  const q = query.trim();
  if (q.length < 2) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? <mark className="hl" key={i}>{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function GameRow({ game, idx, onOpen, query }) {
  return (
    <button className="game-row" onClick={() => onOpen(game)}>
      <div className="gid">{String(idx + 1).padStart(2, "0")}</div>
      <div className="gtitle">
        <h4>
          <span className="gcat">{game.category}</span>
          {highlight(game.title, query)}
        </h4>
        <div className="gtags">{highlight(game.summary, query)}</div>
      </div>
      <div className="gmeta">
        <span className="lbl">időtartam</span>
        <span>{game.duration} perc</span>
      </div>
      <div className="gmeta">
        <span className="lbl">létszám</span>
        <span>{game.groupSize} fő</span>
      </div>
      <div className="arrow">→</div>
    </button>
  );
}

function GameCard({ game, onOpen, query }) {
  return (
    <button className="gp-card" onClick={() => onOpen(game)}>
      <div className="cat">{game.category}</div>
      <h3>{highlight(game.title, query)}</h3>
      <div className="summary">{highlight(game.summary, query)}</div>
      <div className="meta">
        <span>{game.duration}′ · {game.groupSize} fő</span>
        <EnergyBar value={game.energy} />
      </div>
    </button>
  );
}

function GameDrawer({ game, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  if (!game) return null;
  return (
    <React.Fragment>
      <div className="drawer-back" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer-head">
          <div className="crumb">
            Játékok <span style={{ margin: "0 8px" }}>/</span>
            <span className="accent">{game.category}</span>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Bezárás">×</button>
        </header>
        <div className="drawer-body">
          <h2>{game.title}</h2>
          <p className="drawer-summary">{game.summary}</p>

          <div className="drawer-stats">
            <div className="drawer-stat">
              <div className="lbl">Időtartam</div>
              <div className="val">{game.duration}′</div>
            </div>
            <div className="drawer-stat">
              <div className="lbl">Létszám</div>
              <div className="val">{game.groupSize}</div>
            </div>
            <div className="drawer-stat">
              <div className="lbl">Kortól</div>
              <div className="val">{game.minAge}+</div>
            </div>
            <div className="drawer-stat">
              <div className="lbl">Energia</div>
              <div className="val" style={{ paddingTop: 6 }}><EnergyBar value={game.energy} /></div>
            </div>
          </div>

          <div className="drawer-block">
            <h3>Hogyan játszd</h3>
            <p>{game.howTo}</p>
          </div>

          {game.notes && (
            <div className="drawer-block">
              <h3>Vezetői jegyzet</h3>
              <p>{game.notes}</p>
            </div>
          )}

          <div className="drawer-block">
            <h3>Címkék</h3>
            <div className="drawer-tags">
              {game.tags.map(t => <span key={t}>#{t}</span>)}
            </div>
          </div>
        </div>
      </aside>
    </React.Fragment>
  );
}

// URL state — share filter combos
function readUrlState() {
  const u = new URL(window.location.href);
  const get = (k) => u.searchParams.get(k);
  const getSet = (k) => new Set((get(k) || "").split(",").filter(Boolean));
  return {
    q: get("q") || "",
    cats: getSet("f_cat"),
    sizes: getSet("f_size"),
    durs: getSet("f_dur"),
    energies: getSet("f_energy"),
    tags: getSet("f_tag"),
    sort: get("f_sort") || "alpha",
    view: get("f_view") || "list",
  };
}
function writeUrlState(s) {
  const u = new URL(window.location.href);
  const set = (k, v) => v ? u.searchParams.set(k, v) : u.searchParams.delete(k);
  const setSet = (k, set_) => set(k, [...set_].join(","));
  set("q", s.q);
  setSet("f_cat", s.cats);
  setSet("f_size", s.sizes);
  setSet("f_dur", s.durs);
  setSet("f_energy", s.energies);
  setSet("f_tag", s.tags);
  set("f_sort", s.sort === "alpha" ? "" : s.sort);
  set("f_view", s.view === "list" ? "" : s.view);
  window.history.replaceState(null, "", u.toString());
}

function FilterGroup({ title, items, active, onToggle, onClear }) {
  return (
    <div className="filter-group">
      <h4>
        <span>{title}</span>
        {active.size > 0 && <span className="reset" onClick={onClear}>törlés</span>}
      </h4>
      <div className="filter-pills">
        {items.map(it => {
          const val = typeof it === "string" ? it : it.label;
          const display = typeof it === "string" ? it : it.label;
          return (
            <button
              key={val}
              className={`filter-pill ${active.has(val) ? "active" : ""}`}
              onClick={() => onToggle(val)}
            >{display}</button>
          );
        })}
      </div>
    </div>
  );
}

function GamesApp() {
  // Load games from the live API (Google Sheets via Apps Script). On failure,
  // fall back to the bundled data/games.js. The bundled file is always available,
  // so the page never breaks — it just shows a slightly older snapshot.
  const [games, setGames] = useState(() => window.GAMES_DATA || []);
  const [liveStatus, setLiveStatus] = useState("idle"); // idle | loading | live | offline

  useEffect(() => {
    const apiUrl = window.NDOG_API;
    if (!apiUrl) { setLiveStatus("offline"); return; }
    setLiveStatus("loading");
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "list" })
    })
      .then(r => r.json())
      .then(d => {
        if (d && d.ok && Array.isArray(d.games) && d.games.length) {
          setGames(d.games);
          setLiveStatus("live");
        } else {
          setLiveStatus("offline");
        }
      })
      .catch(() => setLiveStatus("offline"));
  }, []);

  const init = readUrlState();
  const [search, setSearch] = useState(init.q);
  const [cats, setCats] = useState(init.cats);
  const [sizes, setSizes] = useState(init.sizes);
  const [durs, setDurs] = useState(init.durs);
  const [energies, setEnergies] = useState(init.energies);
  const [tags, setTags] = useState(init.tags);
  const [sort, setSort] = useState(init.sort);
  const [view, setView] = useState(init.view);
  const [open, setOpen] = useState(null);
  const searchRef = useRef(null);

  // Persist to URL
  useEffect(() => {
    writeUrlState({ q: search, cats, sizes, durs, energies, tags, sort, view });
  }, [search, cats, sizes, durs, energies, tags, sort, view]);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const h = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const toggle = (setterSet, setSet) => (val) => {
    const next = new Set(setterSet);
    next.has(val) ? next.delete(val) : next.add(val);
    setSet(next);
  };
  const clearAll = () => {
    setSearch(""); setCats(new Set()); setSizes(new Set());
    setDurs(new Set()); setEnergies(new Set()); setTags(new Set());
  };

  // Tag cloud — count occurrences
  const allTags = useMemo(() => {
    const m = new Map();
    games.forEach(g => (g.tags || []).forEach(t => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [games]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = games.filter(g => {
      if (cats.size && !cats.has(g.category)) return false;
      if (sizes.size && !sizes.has(g.groupSize)) return false;
      if (durs.size) {
        const ok = [...durs].some(d => DURATIONS.find(x => x.label === d)?.test(g.duration));
        if (!ok) return false;
      }
      if (energies.size) {
        const ok = [...energies].some(d => ENERGIES.find(x => x.label === d)?.test(g.energy));
        if (!ok) return false;
      }
      if (tags.size) {
        const ok = [...tags].every(t => (g.tags || []).includes(t));
        if (!ok) return false;
      }
      if (q) {
        const hay = [g.title, g.summary, g.howTo, g.notes, g.category, ...(g.tags||[])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (sort) {
      case "cat": list.sort((a, b) => a.category.localeCompare(b.category, "hu") || a.title.localeCompare(b.title, "hu")); break;
      case "dur": list.sort((a, b) => a.duration - b.duration); break;
      case "dur-desc": list.sort((a, b) => b.duration - a.duration); break;
      case "energy": list.sort((a, b) => a.energy - b.energy); break;
      case "random":
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        break;
      default: list.sort((a, b) => a.title.localeCompare(b.title, "hu"));
    }
    return list;
  }, [games, search, cats, sizes, durs, energies, tags, sort]);

  const random = () => {
    const pool = filtered.length ? filtered : games;
    setOpen(pool[Math.floor(Math.random() * pool.length)]);
  };

  const activeFilterCount = cats.size + sizes.size + durs.size + energies.size + tags.size + (search ? 1 : 0);

  // Active filter chips
  const activeChips = [];
  if (search) activeChips.push({ label: `„${search}"`, clear: () => setSearch("") });
  cats.forEach(c => activeChips.push({ label: c, clear: () => toggle(cats, setCats)(c) }));
  sizes.forEach(s => activeChips.push({ label: s + " fő", clear: () => toggle(sizes, setSizes)(s) }));
  durs.forEach(d => activeChips.push({ label: d, clear: () => toggle(durs, setDurs)(d) }));
  energies.forEach(e => activeChips.push({ label: e, clear: () => toggle(energies, setEnergies)(e) }));
  tags.forEach(t => activeChips.push({ label: "#" + t, clear: () => toggle(tags, setTags)(t) }));

  return (
    <div className="gp-page">
      <nav className="gp-nav">
        <div className="gp-nav-inner">
          <a className="gp-brand" href="index.html">
            <img src="assets/nocturnal_logo.png" alt="" />
            <span>Nocturnal Dog</span>
          </a>
          <span className="gp-crumb"><span style={{ color: "var(--ink-faint)" }}>/</span> <span className="accent">Játékadatbázis</span></span>
          <div className="gp-nav-links">
            <a className="gp-back" href="index.html">← Vissza</a>
            <a href="index.html#filmek">Filmek</a>
            <a href="index.html#rolunk">Rólunk</a>
            <a href="index.html#kapcsolat">Kapcsolat</a>
          </div>
        </div>
      </nav>

      <header className="gp-hero">
        <div className="gp-eyebrow">
          <span className="dot"></span>
          <span>Tudástár · 2015 óta gyűjtve</span>
        </div>
        <h1 className="gp-title">Játékadatbázis</h1>
        <p className="gp-lead">
          Tíz év alatt összeszedett dráma- és improvizációs gyakorlatok — bemelegítések,
          bizalom-játékok, karakter-mélyítések, csoport-kísérletek. Keress kulcsszóra,
          szűrj létszámra, időre, energiára, vagy hagyd, hogy a véletlen találjon neked.
        </p>

        <div className="gp-search">
          <div className="gp-search-box">
            <span className="icon">⌕</span>
            <input
              ref={searchRef}
              className="gp-search-input"
              placeholder="Keress játékra, módszerre, címkére…  (nyomd meg a /-t)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="icon-btn" onClick={random} title="Véletlen játék">
            🎲 <span>Véletlen</span>
          </button>
          {activeFilterCount > 0 && (
            <button className="icon-btn clear-btn" onClick={clearAll}>
              Szűrők törlése ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="gp-stats">
          <span><b>{games.length}</b>játék összesen</span>
          <span className="accent"><b>{filtered.length}</b>találat most</span>
          <span><b>{CATEGORIES.length}</b>kategória</span>
          <span><b>{allTags.length}</b>címke</span>
        </div>
      </header>

      <div className="gp-toolbar">
        <div className="gp-toolbar-inner">
          <div className="pill-group">
            <span className="lbl">Rendezés</span>
            <select className="gp-select" value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="pill-group">
            <span className="lbl">Nézet</span>
            <div className="view-toggle">
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>≡ Lista</button>
              <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>▦ Kártyák</button>
            </div>
          </div>
          {activeChips.length > 0 && (
            <div className="pill-group" style={{ gap: 6, flexWrap: "wrap" }}>
              {activeChips.map((c, i) => (
                <span key={i} className="active-filter-chip">
                  {c.label}
                  <button onClick={c.clear} aria-label="töröl">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="right">
            <span><span className="count">{filtered.length}</span> / {games.length} találat</span>
          </div>
        </div>
      </div>

      <main className="gp-main">
        <aside className="gp-sidebar">
          <FilterGroup
            title="Kategória"
            items={CATEGORIES}
            active={cats}
            onToggle={toggle(cats, setCats)}
            onClear={() => setCats(new Set())}
          />
          <FilterGroup
            title="Létszám"
            items={GROUP_SIZES.map(s => s)}
            active={sizes}
            onToggle={toggle(sizes, setSizes)}
            onClear={() => setSizes(new Set())}
          />
          <FilterGroup
            title="Időtartam"
            items={DURATIONS.map(d => d.label)}
            active={durs}
            onToggle={toggle(durs, setDurs)}
            onClear={() => setDurs(new Set())}
          />
          <FilterGroup
            title="Energiaszint"
            items={ENERGIES.map(e => e.label)}
            active={energies}
            onToggle={toggle(energies, setEnergies)}
            onClear={() => setEnergies(new Set())}
          />

          <div className="filter-group">
            <h4>
              <span>Címkék</span>
              {tags.size > 0 && <span className="reset" onClick={() => setTags(new Set())}>törlés</span>}
            </h4>
            <div className="gp-tag-cloud">
              {allTags.slice(0, 24).map(([t, n]) => (
                <button
                  key={t}
                  className={tags.has(t) ? "active" : ""}
                  onClick={() => toggle(tags, setTags)(t)}
                >#{t}<span className="count">{n}</span></button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h4>Üres a háló.</h4>
              <p>Lazíts a szűrőkön, vagy keress más kulcsszóra.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    marginTop: 16,
                    background: "var(--accent)", color: "#000", border: 0,
                    padding: "10px 16px", borderRadius: 999,
                    fontFamily: "inherit", fontSize: 14, fontWeight: 500
                  }}
                >Összes szűrő törlése</button>
              )}
            </div>
          ) : view === "cards" ? (
            <div className="gp-cards">
              {filtered.map(g => (
                <GameCard key={g.id} game={g} onOpen={setOpen} query={search} />
              ))}
            </div>
          ) : (
            <div className="games-list">
              {filtered.map((g, i) => (
                <GameRow key={g.id} game={g} idx={i} onOpen={setOpen} query={search} />
              ))}
            </div>
          )}
        </section>
      </main>

      {open && <GameDrawer game={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<GamesApp />);
