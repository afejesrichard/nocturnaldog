// Nocturnal Dog — Játékadatbázis SZERKESZTŐ
// Backend: Google Apps Script bound to a Google Sheet.
// Auth: server-side (salted iterated SHA-256), HMAC-signed session token.
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const CATEGORIES = [
  "Bemelegítés", "Improvizáció", "Karakter", "Mozgás",
  "Hang és szöveg", "Bizalom", "Koncentráció"
];
const GROUP_SIZES = ["2-4", "5-10", "10+"];

const LS_API_URL = "nd_editor_api_url";
const SS_TOKEN   = "nd_editor_token";
const SS_USER    = "nd_editor_user";

// ───────────────────────── helpers ─────────────────────────
function getApiUrl() {
  return localStorage.getItem(LS_API_URL) || window.NDOG_API || "";
}

async function api(action, params = {}, opts = {}) {
  const url = getApiUrl();
  if (!url) throw new Error("Az API URL nincs beállítva.");
  const token = opts.token || sessionStorage.getItem(SS_TOKEN) || "";
  const body = JSON.stringify({ action, token, ...params });
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      // text/plain elkerüli a CORS preflight-et az Apps Script ellen
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow"
    });
  } catch (e) {
    throw new Error("Hálózati hiba — ellenőrizd az internetet és az API URL-t.");
  }
  if (!res.ok) throw new Error("Backend hiba: " + res.status);
  let data;
  try { data = await res.json(); }
  catch (e) { throw new Error("Érvénytelen válasz a backendtől (HTML-t kaptunk?). Ellenőrizd, hogy az Apps Script Web app-ként van publikálva, és hogy az URL a `/exec`-re végződik."); }
  if (!data.ok) {
    if (data.error === "invalid_token") {
      sessionStorage.removeItem(SS_TOKEN);
      sessionStorage.removeItem(SS_USER);
    }
    throw new Error(data.error || "Ismeretlen hiba");
  }
  return data;
}

function blankGame(id) {
  return {
    id: id || ("uj-jatek-" + Date.now().toString(36)),
    title: "",
    category: CATEGORIES[0],
    energy: 3,
    groupSize: "5-10",
    duration: 10,
    minAge: 10,
    tags: [],
    summary: "",
    howTo: "",
    notes: ""
  };
}

function slugify(s) {
  return (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
}

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "épp most";
  if (s < 60) return s + " mp";
  if (s < 3600) return Math.round(s / 60) + " perc";
  return Math.round(s / 3600) + " óra";
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, kind = "success") => {
    setToast({ msg, kind, id: Date.now() });
    setTimeout(() => setToast(t => (t && t.id ? null : t)), 2800);
  }, []);
  const el = toast ? <div className={`ed-toast ${toast.kind}`}>{toast.msg}</div> : null;
  return [el, show];
}

// ───────────────────────── SETUP WIZARD (API URL) ─────────────────────────
function SetupWizard({ onDone }) {
  const [url, setUrl] = useState(getApiUrl());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function test() {
    setErr(""); setBusy(true);
    try {
      localStorage.setItem(LS_API_URL, url.trim());
      const r = await fetch(url.trim(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "ping" })
      });
      const data = await r.json();
      if (!data.ok) throw new Error("Nem várt válasz a backendtől.");
      onDone();
    } catch (e) {
      setErr("Nem sikerült csatlakozni: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ed-lock">
      <div className="ed-lock-card" style={{ width: "min(540px, 100%)" }}>
        <div className="ed-lock-brand">
          <img src="assets/nocturnal_logo.png" alt="" />
          <span>Nocturnal Dog</span>
        </div>
        <div className="ed-lock-eyebrow"><span className="dot"></span>Telepítés · 1/2</div>
        <h1>API <em>csatlakoztatása</em></h1>
        <p className="sub">
          Az adatok a Google Sheets-ben élnek. Add meg a Sheet-hez tartozó
          Apps Script <b>Web app</b> URL-jét. (Lásd <code>apps-script.gs</code> a projektben —
          az ottani telepítési útmutató szerint <code>setup()</code> + <code>addUser()</code> +
          <i>Deploy → Web app</i>.)
        </p>
        <label>Apps Script Web app URL</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/…/exec"
          style={{
            width: "100%", background: "var(--card)", border: "1px solid var(--border)",
            color: "var(--ink)", padding: "12px 14px", borderRadius: 8,
            fontFamily: "var(--mono)", fontSize: 12, marginBottom: 14
          }}
        />
        <div className="msg">{err}</div>
        <button
          className="btn-primary"
          onClick={test}
          disabled={busy || !url.trim().startsWith("https://")}
        >
          {busy ? "Csatlakozás…" : "Csatlakozás és tovább"}
        </button>
        <div className="footnote">
          <b>Mit jelent ez?</b> Ez az URL egy Google Apps Script, ami a Sheet-eddel
          van összekötve. Ez kezeli a bejelentkezést, az olvasást és a mentést.
          A jelszavakat <i>sózott, iterált SHA-256 hash-ként</i> tárolja, a teljes
          kommunikáció HTTPS-en zajlik.
        </div>
        <div className="ed-lock-back">
          <a href="/jatekok/">← vissza a játékadatbázishoz</a>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── LOGIN ─────────────────────────
function Login({ onLogin, onReconfig }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 60); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api("login", { username: u.trim(), password: p });
      sessionStorage.setItem(SS_TOKEN, r.token);
      sessionStorage.setItem(SS_USER, r.username);
      onLogin(r.username);
    } catch (e) {
      const next = attempts + 1;
      setAttempts(next);
      setErr(e.message === "invalid_credentials"
        ? `Hibás felhasználónév vagy jelszó. (${next})`
        : e.message);
      setP("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ed-lock">
      <div className="ed-lock-card">
        <div className="ed-lock-brand">
          <img src="assets/nocturnal_logo.png" alt="" />
          <span>Nocturnal Dog</span>
        </div>
        <div className="ed-lock-eyebrow"><span className="dot"></span>Védett terület · Szerkesztő</div>
        <h1>Belépés a <em>szerkesztőbe</em></h1>
        <p className="sub">
          Csapattagi belépés. A munkamenet ennek a fülnek a bezárásáig,
          de legfeljebb 8 óráig él.
        </p>
        <form onSubmit={submit}>
          <label>Felhasználónév</label>
          <input
            ref={ref}
            type="text"
            value={u}
            onChange={e => setU(e.target.value)}
            autoCapitalize="off"
            autoComplete="username"
            style={{
              width: "100%", background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--ink)", padding: "12px 14px", borderRadius: 10,
              fontFamily: "var(--mono)", fontSize: 14, marginBottom: 14
            }}
          />
          <label>Jelszó</label>
          <input
            type="password"
            value={p}
            onChange={e => setP(e.target.value)}
            className={err ? "error" : ""}
            autoComplete="current-password"
          />
          <div className="msg">{err}</div>
          <button type="submit" className="btn-primary" disabled={busy || !u.trim() || !p}>
            {busy ? "Bejelentkezés…" : "Belépés"}
          </button>
        </form>
        <div className="footnote">
          <b>Védelem:</b> a jelszó nincs a frontend-forráskódban — a Google Sheet-hez
          tartozó Apps Script ellenőrzi, sózott SHA-256 hash alapján.
          A munkamenet HMAC-aláírt token, 8 óra lejárattal.
          {" "}<a onClick={onReconfig}>API URL újrabeállítása</a>
        </div>
        <div className="ed-lock-back">
          <a href="/jatekok/">← vissza a játékadatbázishoz</a>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── FORM PIECES ─────────────────────────
function Segmented({ value, options, onChange }) {
  return (
    <div className="ed-seg">
      {options.map(opt => {
        const v = typeof opt === "object" ? opt.value : opt;
        const l = typeof opt === "object" ? opt.label : opt;
        return (
          <button
            key={v}
            type="button"
            className={value === v ? "active" : ""}
            onClick={() => onChange(v)}
          >{l}</button>
        );
      })}
    </div>
  );
}

function TagEditor({ tags, onChange }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim().replace(/^#/, "");
    if (!t || tags.includes(t)) { setVal(""); return; }
    onChange([...tags, t]);
    setVal("");
  };
  const remove = (t) => onChange(tags.filter(x => x !== t));
  return (
    <div className="ed-tags">
      {tags.map(t => (
        <span className="ed-tag" key={t}>
          <b>#</b>{t}
          <button type="button" onClick={() => remove(t)} aria-label="töröl">×</button>
        </span>
      ))}
      <input
        type="text"
        placeholder={tags.length ? "új címke + Enter" : "címke (Enter)"}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !val && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={add}
      />
    </div>
  );
}

function SyncPill({ state, lastSaved, error }) {
  // states: idle | dirty | saving | saved | error
  if (state === "error") return <span className="ed-sync err">⚠ {error || "Mentés sikertelen"}</span>;
  if (state === "saving") return <span className="ed-sync saving"><span className="spinner"></span>Mentés…</span>;
  if (state === "dirty") return <span className="ed-sync dirty">○ Szerkesztés folyamatban</span>;
  if (state === "saved" && lastSaved) return <span className="ed-sync saved">✓ Mentve · {timeAgo(lastSaved)}</span>;
  return <span className="ed-sync">— Szinkronizálva</span>;
}

function GameForm({ game, onChange, onDelete, sync, onRetry, isNew }) {
  if (!game) {
    return (
      <div className="ed-form ed-form-empty">
        <h2>Válassz egy játékot</h2>
        <p>Bal oldalt válaszd ki, melyik játékot szeretnéd szerkeszteni — vagy adj hozzá egy újat.</p>
      </div>
    );
  }
  const set = (k, v) => onChange({ ...game, [k]: v });
  const errs = {};
  if (!game.title?.trim()) errs.title = "A cím kötelező.";
  if (!game.summary?.trim()) errs.summary = "Egy rövid összefoglaló segíti az áttekintést.";
  if (game.duration < 1 || game.duration > 999) errs.duration = "Reális percszámot adj.";
  if (game.minAge < 1 || game.minAge > 99) errs.minAge = "Érvényes kort adj.";

  return (
    <div className="ed-form">
      <div className="ed-form-head">
        <div>
          <div className="crumb">
            Játék <span style={{ margin: "0 6px", opacity: 0.4 }}>/</span>
            {game.category || "—"}
          </div>
          <h2>{game.title || <span style={{ color: "var(--ink-faint)", fontStyle: "italic" }}>(névtelen játék)</span>}</h2>
        </div>
        <div className="ed-form-badges">
          {isNew && <span className="ed-badge new">új</span>}
          <SyncPill state={sync.state} lastSaved={sync.lastSaved} error={sync.error} />
          {sync.state === "error" && (
            <button className="ed-btn" onClick={onRetry}>↻ Újra</button>
          )}
        </div>
      </div>

      <div className="ed-fld">
        <label>Azonosító (id) <span className="hint" style={{ marginLeft: 6 }}>— url-kompatibilis, egyedi</span></label>
        <input type="text" value={game.id} onChange={e => set("id", slugify(e.target.value))} />
      </div>

      <div className={`ed-fld ${errs.title ? "invalid" : ""}`}>
        <label>Cím *</label>
        <input type="text" value={game.title} onChange={e => set("title", e.target.value)} />
        {errs.title && <div className="err">{errs.title}</div>}
      </div>

      <div className={`ed-fld ${errs.summary ? "invalid" : ""}`}>
        <label>Egysoros összefoglaló *</label>
        <textarea
          value={game.summary}
          onChange={e => set("summary", e.target.value)}
          placeholder="1 mondat, ami egy ismeretlen játékvezetőnek elmondja a lényeget."
        />
        {errs.summary && <div className="err">{errs.summary}</div>}
      </div>

      <div className="ed-fld-row">
        <div className="ed-fld">
          <label>Kategória</label>
          <select value={game.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="ed-fld">
          <label>Létszám</label>
          <Segmented value={game.groupSize} options={GROUP_SIZES} onChange={v => set("groupSize", v)} />
        </div>
      </div>

      <div className="ed-fld-row">
        <div className={`ed-fld ${errs.duration ? "invalid" : ""}`}>
          <label>Időtartam (perc)</label>
          <input type="number" min="1" max="999" value={game.duration}
            onChange={e => set("duration", parseInt(e.target.value, 10) || 0)} />
          {errs.duration && <div className="err">{errs.duration}</div>}
        </div>
        <div className={`ed-fld ${errs.minAge ? "invalid" : ""}`}>
          <label>Ajánlott kortól</label>
          <input type="number" min="1" max="99" value={game.minAge}
            onChange={e => set("minAge", parseInt(e.target.value, 10) || 0)} />
          {errs.minAge && <div className="err">{errs.minAge}</div>}
        </div>
        <div className="ed-fld">
          <label>Energiaszint</label>
          <Segmented value={game.energy}
            options={[1,2,3,4,5].map(n => ({ value: n, label: String(n) }))}
            onChange={v => set("energy", v)} />
          <div className="hint">1 = csendes, 5 = pörgős</div>
        </div>
      </div>

      <div className="ed-fld">
        <label>Címkék</label>
        <TagEditor tags={game.tags || []} onChange={v => set("tags", v)} />
      </div>

      <div className="ed-fld">
        <label>Hogyan játszd</label>
        <textarea className="tall" value={game.howTo}
          onChange={e => set("howTo", e.target.value)}
          placeholder="A vezetői instrukció pontról-pontra." />
      </div>

      <div className="ed-fld">
        <label>Vezetői jegyzet (opcionális)</label>
        <textarea value={game.notes || ""} onChange={e => set("notes", e.target.value)}
          placeholder="Tippek, tapasztalatok, mikor működik, mikor nem." />
      </div>

      <div className="ed-form-foot">
        <button className="ed-btn danger" onClick={onDelete}>
          Játék törlése
        </button>
        <div className="spacer"></div>
        <span className="saved">● Auto-mentés Google Sheets-be (1,5 mp)</span>
      </div>
    </div>
  );
}

// ───────────────────────── MAIN EDITOR APP ─────────────────────────
function EditorApp({ username, onLogout, onReconfig }) {
  const [games, setGames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading|ready|error
  const [loadError, setLoadError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sync, setSync] = useState({}); // id -> { state, lastSaved, error }
  const [toastEl, toast] = useToast();
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Track which games are brand-new (haven't been saved at all yet)
  const newIdsRef = useRef(new Set());

  const reload = async () => {
    setLoadState("loading"); setLoadError("");
    try {
      const r = await api("list");
      setGames(r.games);
      if (!selectedId && r.games[0]) setSelectedId(r.games[0].id);
      setLoadState("ready");
    } catch (e) {
      setLoadError(e.message);
      setLoadState("error");
    }
  };

  useEffect(() => { reload(); }, []);

  // Debounced save per game
  const saveTimers = useRef({});
  const queueSave = (game) => {
    setSync(s => ({ ...s, [game.id]: { ...(s[game.id] || {}), state: "dirty" } }));
    clearTimeout(saveTimers.current[game.id]);
    saveTimers.current[game.id] = setTimeout(() => doSave(game), 1500);
  };
  const doSave = async (game) => {
    // Basic validity gate — don't save garbage
    if (!game.title?.trim() || !game.id?.trim()) {
      setSync(s => ({ ...s, [game.id]: { state: "error", error: "Hiányzó cím vagy id" } }));
      return;
    }
    setSync(s => ({ ...s, [game.id]: { ...(s[game.id] || {}), state: "saving" } }));
    try {
      await api("upsert", { game });
      newIdsRef.current.delete(game.id);
      setSync(s => ({ ...s, [game.id]: { state: "saved", lastSaved: Date.now() } }));
    } catch (e) {
      if (e.message === "invalid_token") {
        onLogout();
        return;
      }
      setSync(s => ({ ...s, [game.id]: { state: "error", error: e.message } }));
    }
  };

  // Mutators
  const updateGame = (next) => {
    const prev = games.find(g => g.id === selectedId);
    if (!prev) return;
    let nextGames;
    if (next.id !== prev.id) {
      // id changed — rename in list, and queue save under the new id (then delete old if it existed on server)
      nextGames = games.map(g => g.id === prev.id ? next : g);
      if (!newIdsRef.current.has(prev.id)) {
        // The old id exists on server; we need to delete it server-side after the new one is saved.
        // For simplicity: don't allow renaming an already-saved id silently — show a toast and do it.
        api("delete", { id: prev.id }).catch(() => {});
      }
      newIdsRef.current.delete(prev.id);
      newIdsRef.current.add(next.id); // treat as new until first save completes
      setSelectedId(next.id);
    } else {
      nextGames = games.map(g => g.id === prev.id ? next : g);
    }
    setGames(nextGames);
    queueSave(next);
  };

  const addGame = () => {
    const g = blankGame();
    newIdsRef.current.add(g.id);
    setGames(gs => [g, ...gs]);
    setSelectedId(g.id);
    setSync(s => ({ ...s, [g.id]: { state: "dirty" } }));
  };

  const askDelete = () => {
    const g = games.find(x => x.id === selectedId);
    if (g) setConfirmDelete(g);
  };

  const reallyDelete = async () => {
    const g = confirmDelete;
    setConfirmDelete(null);
    if (!g) return;
    // If never saved, just drop locally
    if (newIdsRef.current.has(g.id)) {
      newIdsRef.current.delete(g.id);
      setGames(gs => gs.filter(x => x.id !== g.id));
      const remaining = games.filter(x => x.id !== g.id);
      setSelectedId(remaining[0]?.id || null);
      toast("Eldobva.");
      return;
    }
    try {
      await api("delete", { id: g.id });
      const remaining = games.filter(x => x.id !== g.id);
      setGames(remaining);
      setSelectedId(remaining[0]?.id || null);
      toast(`Törölve: ${g.title}`);
    } catch (e) {
      toast("Törlés sikertelen: " + e.message, "error");
    }
  };

  const retrySave = () => {
    const g = games.find(x => x.id === selectedId);
    if (g) doSave(g);
  };

  // Sidebar list
  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return games;
    return games.filter(g => [g.title, g.category, g.summary, ...(g.tags || [])]
      .join(" ").toLowerCase().includes(q));
  }, [games, filterText]);

  const selected = games.find(g => g.id === selectedId) || null;
  const selectedSync = sync[selectedId] || { state: "saved", lastSaved: null };

  // Pending saves count
  const pending = Object.values(sync).filter(s => s.state === "dirty" || s.state === "saving").length;
  const errors = Object.values(sync).filter(s => s.state === "error").length;

  // Warn before leaving with pending saves
  useEffect(() => {
    const h = (e) => {
      if (pending > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [pending]);

  if (loadState === "loading") {
    return (
      <div className="ed-loading">
        <div className="spinner big"></div>
        <p>Adatok betöltése a Google Sheets-ből…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="ed-loading">
        <h2>Nem sikerült betölteni az adatokat</h2>
        <p style={{ color: "var(--crimson-soft)", marginBottom: 20 }}>{loadError}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className="ed-btn primary" onClick={reload}>↻ Újrapróbálás</button>
          <button className="ed-btn ghost" onClick={onReconfig}>API URL újrabeállítása</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-page">
      <header className="ed-bar">
        <div className="ed-bar-inner">
          <a className="ed-brand" href="/">
            <img src="assets/nocturnal_logo.png" alt="" />
            <span>Nocturnal Dog</span>
          </a>
          <span className="ed-crumb">
            <span style={{ opacity: 0.4 }}>/</span> Játékadatbázis <span style={{ opacity: 0.4 }}>/</span>{" "}
            <span className="accent">Szerkesztő</span>
          </span>
          <div className="ed-status">
            <span className="pill"><b>{games.length}</b>játék</span>
            <span className={`pill ${pending > 0 ? "mod" : ""}`}>
              <span className={`live-dot ${pending > 0 ? "pulse" : "ok"}`}></span>
              {pending > 0 ? `mentés (${pending})` : "szinkronban"}
            </span>
            {errors > 0 && <span className="pill del"><b>{errors}</b>hiba</span>}
          </div>
          <div className="ed-bar-actions">
            <span className="ed-user">
              <span className="dot"></span>
              {username}
            </span>
            <button className="ed-btn ghost" onClick={reload} title="Adatok újratöltése a Sheets-ből">↻ Frissítés</button>
            <button className="ed-btn ghost" onClick={onLogout} title="Kijelentkezés">⎋ Kilépés</button>
          </div>
        </div>
      </header>

      <div className="ed-main">
        <aside className="ed-sidebar">
          <div className="ed-sb-head">
            <div className="ed-sb-search">
              <span className="icon">⌕</span>
              <input
                type="text"
                placeholder="Keresés…"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
              />
            </div>
          </div>

          <div className="ed-sb-list">
            {filtered.length === 0 ? (
              <div className="ed-sb-empty">Nincs találat.</div>
            ) : filtered.map(g => {
              const s = sync[g.id];
              let dotClass = "";
              if (s?.state === "error") dotClass = "del";
              else if (s?.state === "saving" || s?.state === "dirty") dotClass = "mod";
              else if (newIdsRef.current.has(g.id)) dotClass = "new";
              return (
                <button
                  key={g.id}
                  className={`ed-sb-row ${selectedId === g.id ? "active" : ""}`}
                  onClick={() => setSelectedId(g.id)}
                >
                  <span className={`ed-sb-dot ${dotClass}`} />
                  <div className="ed-sb-meta">
                    <div className="ed-sb-title">{g.title || <i style={{ color: "var(--ink-faint)" }}>(névtelen)</i>}</div>
                    <div className="ed-sb-cat">{g.category} · {g.duration}′ · {g.groupSize}</div>
                  </div>
                  <span className="ed-sb-arrow">→</span>
                </button>
              );
            })}
          </div>

          <div className="ed-sb-add">
            <button className="ed-btn primary" onClick={addGame} style={{ width: "100%" }}>
              + Új játék hozzáadása
            </button>
          </div>
        </aside>

        <main>
          <GameForm
            game={selected}
            isNew={selected && newIdsRef.current.has(selected.id)}
            onChange={updateGame}
            onDelete={askDelete}
            sync={selectedSync}
            onRetry={retrySave}
          />
        </main>
      </div>

      {confirmDelete && (
        <div className="ed-modal-back" onClick={() => setConfirmDelete(null)}>
          <div className="ed-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="ed-modal-head">
              <h3>Játék törlése</h3>
              <button className="x" onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <div className="ed-modal-body">
              <p>Biztosan törlöd: <b style={{ color: "var(--ink)" }}>{confirmDelete.title}</b>?</p>
              <p className="warning">Ez azonnal eltávolítja a Google Sheets-ből. Nem visszavonható (a Sheets verziótörténetből még visszanyerhető).</p>
            </div>
            <div className="ed-modal-foot">
              <button className="ed-btn ghost" onClick={() => setConfirmDelete(null)}>Mégsem</button>
              <button className="ed-btn danger" onClick={reallyDelete}>Igen, törlés</button>
            </div>
          </div>
        </div>
      )}

      {toastEl}
    </div>
  );
}

// ───────────────────────── ROOT ─────────────────────────
function Root() {
  const [phase, setPhase] = useState(() => {
    if (!getApiUrl()) return "setup";
    if (sessionStorage.getItem(SS_TOKEN)) return "editor";
    return "login";
  });
  const [user, setUser] = useState(() => sessionStorage.getItem(SS_USER) || "");

  if (phase === "setup") {
    return <SetupWizard onDone={() => setPhase(sessionStorage.getItem(SS_TOKEN) ? "editor" : "login")} />;
  }
  if (phase === "login") {
    return <Login
      onLogin={(u) => { setUser(u); setPhase("editor"); }}
      onReconfig={() => setPhase("setup")}
    />;
  }
  return <EditorApp
    username={user}
    onLogout={() => {
      sessionStorage.removeItem(SS_TOKEN);
      sessionStorage.removeItem(SS_USER);
      setPhase("login");
    }}
    onReconfig={() => {
      sessionStorage.removeItem(SS_TOKEN);
      sessionStorage.removeItem(SS_USER);
      setPhase("setup");
    }}
  />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
