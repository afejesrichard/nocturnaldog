// Nocturnal Dog — Films Portfolio
const { useState, useMemo } = React;

const BLOCK_INFO = {
  "Ident": { color: "#f4b942", desc: "Műhely-identitás" },
  "Fordulatok": { color: "#d96565", desc: "Fordulatok blokk" },
  "Projektek": { color: "#7eb6c1", desc: "Projekt-filmek" },
  "Sötét oldal": { color: "#a888c8", desc: "Sötét oldal" },
  "Egyéb": { color: "#8a8175", desc: "Egyéb alkotás" }
};

const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

function FilmCard({ film, onOpen }) {
  return (
    <button className="film-card" onClick={() => onOpen(film)}>
      <div className="film-thumb">
        {film.ytId ?
        <img src={ytThumb(film.ytId)} alt={film.title} loading="lazy" /> :

        <div style={{
          width: "100%", height: "100%",
          background: "repeating-linear-gradient(135deg, var(--bg-3), var(--bg-3) 12px, var(--bg-2) 12px, var(--bg-2) 24px)",
          display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-faint)",
          letterSpacing: "0.14em", textTransform: "uppercase"
        }}>TBA</div>
        }
        <div className="block-tag">{film.genre}</div>
        <div className="duration">{Math.round(film.duration)}′</div>
        <div className="play"><span>▶</span></div>
      </div>
      <div className="film-meta">
        <span>{film.year}</span>
        <span>{Math.round(film.duration)} perc</span>
      </div>
      <div className="film-title">{film.title}</div>
      <div className="film-desc">{film.description}</div>
    </button>);

}

function FilmModal({ film, onClose }) {
  React.useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  if (!film) return null;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Bezárás">×</button>
        {film.ytId ?
        <div className="modal-video">
            <iframe
            src={`https://www.youtube.com/embed/${film.ytId}?rel=0`}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen />
          
          </div> :

        <div className="modal-video" style={{
          background: "repeating-linear-gradient(135deg, #1a1612, #1a1612 16px, #14110f 16px, #14110f 32px)",
          display: "grid", placeItems: "center"
        }}>
            <div style={{
            fontFamily: "var(--mono)", color: "var(--ink-faint)",
            letterSpacing: "0.18em", textTransform: "uppercase", fontSize: 13
          }}>Hamarosan</div>
          </div>
        }
        <div className="modal-body">
          <div className="modal-tags">
            <span className="accent">{film.year}</span>
            <span>{film.genre}</span>
            <span>{film.duration} perc</span>
          </div>
          <h2>{film.title}</h2>
          <p className="lead">{film.description}</p>
          {film.link && film.link !== "TBA" &&
          <a href={film.link} target="_blank" rel="noopener" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 12,
            letterSpacing: "0.14em", textTransform: "uppercase",
            borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 12
          }}>
              Megnyitás YouTube-on ↗
            </a>
          }
        </div>
      </div>
    </div>);

}

function FilmsSection() {
  const [active, setActive] = useState("Mind");
  const [openFilm, setOpenFilm] = useState(null);
  const films = window.FILMS_DATA;

  const years = useMemo(() => {
    const ys = [...new Set(films.map((f) => f.year))].sort((a, b) => b - a);
    const out = [["Mind", films.length]];
    ys.forEach((y) => {
      out.push([String(y), films.filter((f) => f.year === y).length]);
    });
    return out;
  }, [films]);

  const filtered = useMemo(() => {
    const list = active === "Mind" ? films : films.filter((f) => String(f.year) === active);
    return list.slice().sort((a, b) => b.year - a.year);
  }, [films, active]);

  return (
    <section className="section" id="filmek" data-screen-label="03 Filmek">
      <header className="section-head">
        <div className="section-num">03 — Portfólió</div>
        <div>
          <h2 className="section-title">Filmek</h2>
          <p className="section-sub">
            Tíz év alatt {films.length}+ alkotás született a műhelyben — etűdök, áldokumentumfilmek,
            road movie-k jármű nélkül, és egy ház, amiből nem lehet kijutni. Kattints bármelyikre.
          </p>
        </div>
      </header>

      <div className="films-toolbar">
        {years.map(([y, n]) =>
        <button
          key={y}
          className={`chip ${active === y ? "active" : ""}`}
          onClick={() => setActive(y)}>
          
            {y} <span className="chip-count">{n}</span>
          </button>
        )}
      </div>

      <div className="films-grid">
        {filtered.map((film, i) =>
        <FilmCard key={film.title + i} film={film} onOpen={setOpenFilm} />
        )}
      </div>

      {openFilm && <FilmModal film={openFilm} onClose={() => setOpenFilm(null)} />}
    </section>);

}

Object.assign(window, { FilmsSection });