// Nocturnal Dog — homepage interactivity (vanilla port of the React prototype)
(function () {
  "use strict";

  /* ---------- tiny DOM helper ---------- */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === "class") node.className = props[k];
        else if (k === "text") node.textContent = props[k];
        else if (k === "html") node.innerHTML = props[k];
        else node.setAttribute(k, props[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    var setOpen = function (open) {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "×" : "≡";
    };
    toggle.addEventListener("click", function () {
      setOpen(!links.classList.contains("open"));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* ---------- active section highlight ---------- */
  // INVARIANT: section numbers, nav anchors, and the scroll-spy map must stay in
  // sync. Adding Csapat as 03 renumbered Filmek->04, Tudástár->05, footer->06.
  var sectionIds = ["rolunk", "csapat", "filmek", "kapcsolat"];
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      var visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!visible) return;
      document.querySelectorAll(".nav-link.active").forEach(function (l) {
        l.classList.remove("active");
      });
      var link = document.querySelector('.nav-link[href="#' + visible.target.id + '"]');
      if (link) link.classList.add("active");
    }, { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.1, 0.3, 0.5] });
    sectionIds.forEach(function (id) {
      var node = document.getElementById(id);
      if (node) obs.observe(node);
    });
  }

  /* ---------- team · Szabad portrék ---------- */
  // Rendered straight from the data/team.js snapshot (window.TEAM_DATA) — there
  // is no live endpoint, so this section can never blank. Runs BEFORE the films
  // early-return below so it renders even on pages without a films grid.
  renderTeam();

  function renderTeam() {
    var mount = document.getElementById("teamPeople");
    if (!mount || !Array.isArray(window.TEAM_DATA)) return;

    // hand-drawn amber underline (the marker-sketch nod), set per-name
    var SCRIBBLE =
      '<svg class="lib-scribble" viewBox="0 0 300 22" fill="none" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M4 13 C 60 5, 120 19, 178 9 S 268 6, 296 12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M22 18 C 90 12, 150 21, 230 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/></svg>';

    window.TEAM_DATA.forEach(function (p) {
      var imgProps = {
        src: p.photo,
        alt: p.family + " " + p.given,
        loading: "lazy"
      };
      // Intrinsic width/height let the browser reserve the box from its aspect
      // ratio, so a lazy/feathered portrait can't collapse to 0 height before
      // paint (regression seen in the prototype) and the section never jumps.
      if (p.w) imgProps.width = p.w;
      if (p.h) imgProps.height = p.h;

      var figure = el("figure", { class: "lib-figure" }, [
        el("div", { class: "glow", "aria-hidden": "true" }),
        el("div", { class: "ticks", text: p.idx + " · Műhelyvezető · " + p.since.replace(/^.*· /, "") }),
        el("div", { class: "lib-media lib-media--photo" }, [el("img", imgProps)])
      ]);

      var more = el("button", { class: "lib-more", type: "button" }, [
        "Teljes bemutatkozás",
        el("span", { class: "ar", html: "&rarr;", "aria-hidden": "true" })
      ]);
      more.addEventListener("click", function () { openDrawer(p, more); });

      var scribble = el("div", { html: SCRIBBLE }).firstChild;

      var body = el("div", { class: "lib-body" }, [
        el("div", { class: "lib-role", text: p.role }),
        // Hungarian order: family name on top (small/faint), given name below
        // (large) — e.g. "László" over a big "Ádám".
        el("h2", { class: "lib-name" }, [
          el("span", { class: "family", text: p.family }),
          el("span", { class: "given", text: p.given })
        ]),
        scribble,
        el("p", { class: "lib-blurb", text: p.lead }),
        el("div", { class: "lib-focus" }, p.focus.map(function (f) { return el("span", { text: f }); })),
        more
      ]);

      mount.appendChild(el("article", { class: "lib-person" }, [figure, body]));
    });
  }

  /* ---------- team detail drawer ---------- */
  // Mirrors the film modal's open/close/Escape/backdrop/scroll-lock/focus-restore
  // pattern (kept as a separate implementation so the film modal stays behavior-
  // identical), and adds a real focus trap for the dialog as the drawer requires.
  var drawerBack = null;
  var drawerLastFocused = null;

  function closeDrawer() {
    if (!drawerBack) return;
    document.removeEventListener("keydown", onDrawerKeydown);
    document.body.style.overflow = "";
    drawerBack.remove();
    drawerBack = null;
    if (drawerLastFocused && drawerLastFocused.focus) drawerLastFocused.focus();
  }

  function drawerFocusable() {
    if (!drawerBack) return [];
    return Array.prototype.slice.call(drawerBack.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    ));
  }

  function onDrawerKeydown(e) {
    if (e.key === "Escape") { closeDrawer(); return; }
    if (e.key !== "Tab") return;
    // Trap Tab focus inside the dialog so it can't leak to the page behind it.
    var f = drawerFocusable();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openDrawer(p, trigger) {
    drawerLastFocused = trigger || document.activeElement;

    var closeBtn = el("button", {
      class: "lib-drawer-close",
      type: "button",
      "aria-label": "Bezárás"
    }, ["×"]);
    closeBtn.addEventListener("click", closeDrawer);

    var heroImg = el("img", { src: p.photo, alt: p.family + " " + p.given });

    var bodyKids = [el("p", { class: "lead", text: p.lead })];
    p.bio.forEach(function (para) { bodyKids.push(el("p", { text: para })); });
    bodyKids.push(el("div", { class: "lib-block" }, [
      el("h4", { text: "Mit hoz a műhelybe" }),
      el("div", { class: "lib-tags" }, p.focus.map(function (f) { return el("span", { text: f }); }))
    ]));
    // Only render the credits block when the person has linked works.
    if (p.works && p.works.length) {
      bodyKids.push(el("div", { class: "lib-block" }, [
        el("h4", { text: "Kötődő munkák" }),
        el("div", { class: "lib-credit" }, p.works.map(function (w) {
          return el("div", { class: "row" }, [
            el("span", { class: "t", text: w.t }),
            el("span", { class: "y", text: w.y })
          ]);
        }))
      ]));
    }

    var drawer = el("aside", {
      class: "lib-drawer",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": p.family + " " + p.given
    }, [
      el("div", { class: "lib-drawer-hero" }, [
        heroImg,
        el("div", { class: "scrim", "aria-hidden": "true" }),
        closeBtn,
        el("div", { class: "plate" }, [
          el("div", { class: "role", text: p.role }),
          el("div", { class: "name", text: p.family + " " + p.given })
        ])
      ]),
      el("div", { class: "lib-drawer-body" }, bodyKids)
    ]);
    drawer.addEventListener("click", function (e) { e.stopPropagation(); });

    drawerBack = el("div", { class: "lib-drawer-back" }, [drawer]);
    drawerBack.addEventListener("click", closeDrawer);

    document.body.appendChild(drawerBack);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onDrawerKeydown);
    closeBtn.focus();
  }

  /* ---------- films ---------- */
  var grid = document.getElementById("filmsGrid");
  var toolbar = document.getElementById("filmsToolbar");
  if (!grid || !toolbar) return;

  var round = function (n) { return Math.round(n); };
  var ytThumb = function (id) { return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg"; };
  var activeGenre = "Mind";

  loadFilms();

  function loadFilms() {
    showStatus("Filmek betöltése…", false);
    var api = window.NDOG_FILMS_API;
    if (!api) {
      showStatus("A film-adatforrás nincs beállítva.", true);
      return;
    }
    // cache-buster + no-store: a brief "always fresh" elve szerint
    var url = api + (api.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now();
    fetch(url, { cache: "no-store" })
      .then(function (res) {
        // 401/403/404/500 sikeres HTTP-csere, amit a .catch nem fog el — itt kezeljük
        if (!res.ok) throw new Error("HTTP " + res.status + (res.statusText ? " " + res.statusText : ""));
        return res.json();
      })
      .then(function (data) {
        // GAS surfaces failures as { error } with HTTP 200 — treat as failure
        if (data && data.error) throw new Error(data.error);
        if (!Array.isArray(data)) throw new Error("Váratlan válaszformátum.");
        renderFilms(data);
      })
      .catch(function (err) {
        showStatus(err && err.message ? err.message : String(err), true);
      });
  }

  function showStatus(msg, isError) {
    toolbar.innerHTML = "";
    grid.innerHTML = "";
    var children = [
      el("p", {
        class: "films-status-msg",
        text: isError ? "Nem sikerült betölteni a filmeket." : msg
      })
    ];
    if (isError) children.push(el("p", { class: "films-status-detail", text: msg }));
    grid.appendChild(el("div", {
      class: "films-status" + (isError ? " films-status--error" : ""),
      role: "status",
      "aria-live": "polite"
    }, children));
  }

  function renderFilms(films) {
    toolbar.innerHTML = "";
    grid.innerHTML = "";
    if (!films.length) {
      showStatus("Nincs megjeleníthető film.", true);
      return;
    }

    // Genre chips: "Mind" + each genre (alphabetical)
    var genres = films
      .map(function (f) { return f.genre; })
      .filter(function (g) { return g != null && g !== ""; })
      .filter(function (g, i, a) { return a.indexOf(g) === i; })
      .sort(function (a, b) { return String(a).localeCompare(String(b), "hu"); });

    var chipData = [["Mind", films.length]];
    genres.forEach(function (g) {
      chipData.push([String(g), films.filter(function (f) { return f.genre === g; }).length]);
    });

    activeGenre = "Mind";
    chipData.forEach(function (pair) {
      var label = pair[0], count = pair[1];
      var chip = el("button", {
        class: "chip" + (label === "Mind" ? " active" : ""),
        type: "button",
        "data-genre": label,
        "aria-pressed": label === "Mind" ? "true" : "false"
      }, [label + " ", el("span", { class: "chip-count", text: String(count) })]);
      chip.addEventListener("click", function () { setGenre(label); });
      toolbar.appendChild(chip);
    });

    // Cards, sorted newest year first (stable within a year)
    films
      .map(function (f, i) { return { f: f, i: i }; })
      .sort(function (a, b) { return b.f.year - a.f.year || a.i - b.i; })
      .forEach(function (entry) {
        grid.appendChild(buildCard(entry.f));
      });
  }

  function setGenre(genre) {
    activeGenre = genre;
    toolbar.querySelectorAll(".chip").forEach(function (c) {
      var on = c.getAttribute("data-genre") === genre;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    grid.querySelectorAll(".film-card").forEach(function (card) {
      var show = genre === "Mind" || card.getAttribute("data-genre") === genre;
      card.hidden = !show;
    });
  }

  function buildCard(film) {
    var thumb;
    if (film.ytId) {
      thumb = el("img", { src: ytThumb(film.ytId), alt: film.title, loading: "lazy" });
    } else {
      thumb = el("div", { class: "film-thumb--tba", text: "TBA" });
    }
    var card = el("button", {
      class: "film-card",
      type: "button",
      "data-year": String(film.year),
      "data-genre": String(film.genre == null ? "" : film.genre)
    }, [
      el("div", { class: "film-thumb" }, [
        thumb,
        el("div", { class: "block-tag", text: film.genre }),
        el("div", { class: "duration", text: round(film.duration) + "′" }),
        el("div", { class: "play" }, [el("span", { text: "▶", "aria-hidden": "true" })])
      ]),
      el("div", { class: "film-meta" }, [
        el("span", { text: String(film.year) }),
        el("span", { text: round(film.duration) + " perc" })
      ]),
      el("div", { class: "film-title", text: film.title }),
      el("div", { class: "film-desc", text: film.description })
    ]);
    card.addEventListener("click", function () { openModal(film); });
    return card;
  }

  /* ---------- film modal ---------- */
  var modalBack = null;
  var lastFocused = null;

  function closeModal() {
    if (!modalBack) return;
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
    modalBack.remove();
    modalBack = null;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  function openModal(film) {
    lastFocused = document.activeElement;

    var video;
    if (film.ytId) {
      video = el("div", { class: "modal-video" }, [
        el("iframe", {
          src: "https://www.youtube.com/embed/" + film.ytId + "?rel=0",
          title: film.title,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope",
          allowfullscreen: ""
        })
      ]);
    } else {
      video = el("div", { class: "modal-video modal-video--tba" }, [
        el("span", { text: "Hamarosan" })
      ]);
    }

    var bodyChildren = [
      el("div", { class: "modal-tags" }, [
        el("span", { class: "accent", text: String(film.year) }),
        el("span", { text: film.genre }),
        el("span", { text: film.duration + " perc" })
      ]),
      el("h2", { text: film.title }),
      el("p", { class: "lead", text: film.description })
    ];
    if (film.link && film.link !== "TBA") {
      bodyChildren.push(el("a", {
        class: "modal-link",
        href: film.link,
        target: "_blank",
        rel: "noopener"
      }, ["Megnyitás YouTube-on ↗"]));
    }

    var closeBtn = el("button", {
      class: "modal-close",
      type: "button",
      "aria-label": "Bezárás"
    }, ["×"]);
    closeBtn.addEventListener("click", closeModal);

    var modal = el("div", {
      class: "modal",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": film.title
    }, [closeBtn, video, el("div", { class: "modal-body" }, bodyChildren)]);
    modal.addEventListener("click", function (e) { e.stopPropagation(); });

    modalBack = el("div", { class: "modal-back" }, [modal]);
    modalBack.addEventListener("click", closeModal);

    document.body.appendChild(modalBack);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    closeBtn.focus();
  }
})();
