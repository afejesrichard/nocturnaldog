// Nocturnal Dog — Játékadatbázis engine (vanilla port of the React prototype)
(function () {
  "use strict";

  var GAMES = window.GAMES_DATA || [];

  var CATEGORIES = [
    "Bemelegítés", "Improvizáció", "Karakter", "Mozgás",
    "Hang és szöveg", "Bizalom", "Koncentráció"
  ];
  var GROUP_SIZES = ["2-4", "5-10", "10+"];
  var DURATIONS = [
    { label: "rövid (≤5p)", test: function (d) { return d <= 5; } },
    { label: "közepes (5–15p)", test: function (d) { return d > 5 && d <= 15; } },
    { label: "hosszú (15p+)", test: function (d) { return d > 15; } }
  ];
  var ENERGIES = [
    { label: "csendes (1-2)", test: function (e) { return e <= 2; } },
    { label: "közepes (3)", test: function (e) { return e === 3; } },
    { label: "pörgős (4-5)", test: function (e) { return e >= 4; } }
  ];

  /* ---------- DOM helper ---------- */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === "class") node.className = props[k];
        else if (k === "text") node.textContent = props[k];
        else node.setAttribute(k, props[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  /* ---------- element refs ---------- */
  var searchInput = document.getElementById("search");
  var randomBtn = document.getElementById("randomBtn");
  var clearBtn = document.getElementById("clearBtn");
  var sortSelect = document.getElementById("sort");
  var viewButtons = Array.prototype.slice.call(document.querySelectorAll(".view-toggle button"));
  var sidebar = document.getElementById("sidebar");
  var results = document.getElementById("results");
  var activeChipsEl = document.getElementById("activeChips");
  var statTotal = document.getElementById("statTotal");
  var statFound = document.getElementById("statFound");
  var statTags = document.getElementById("statTags");
  var countNum = document.getElementById("countNum");
  var totalNum = document.getElementById("totalNum");

  /* ---------- URL state ---------- */
  function readUrlState() {
    var u = new URL(window.location.href);
    var get = function (k) { return u.searchParams.get(k); };
    var getSet = function (k) { return new Set((get(k) || "").split(",").filter(Boolean)); };
    return {
      q: get("q") || "",
      cats: getSet("f_cat"),
      sizes: getSet("f_size"),
      durs: getSet("f_dur"),
      energies: getSet("f_energy"),
      tags: getSet("f_tag"),
      sort: get("f_sort") || "alpha",
      view: get("f_view") || "list"
    };
  }
  function writeUrlState() {
    var u = new URL(window.location.href);
    var set = function (k, v) { v ? u.searchParams.set(k, v) : u.searchParams.delete(k); };
    var setSet = function (k, s) { set(k, Array.from(s).join(",")); };
    set("q", state.q);
    setSet("f_cat", state.cats);
    setSet("f_size", state.sizes);
    setSet("f_dur", state.durs);
    setSet("f_energy", state.energies);
    setSet("f_tag", state.tags);
    set("f_sort", state.sort === "alpha" ? "" : state.sort);
    set("f_view", state.view === "list" ? "" : state.view);
    try { window.history.replaceState(null, "", u.toString()); } catch (e) { /* sandboxed/file:// contexts */ }
  }

  var state = readUrlState();
  var lastFocused = null;
  var drawerBack = null;
  var drawerEl = null;

  /* ---------- derived data ---------- */
  function toggleSet(set, val) { set.has(val) ? set.delete(val) : set.add(val); }

  function activeFilterCount() {
    return state.cats.size + state.sizes.size + state.durs.size +
      state.energies.size + state.tags.size + (state.q ? 1 : 0);
  }

  function allTags() {
    var m = new Map();
    GAMES.forEach(function (g) {
      (g.tags || []).forEach(function (t) { m.set(t, (m.get(t) || 0) + 1); });
    });
    return Array.from(m.entries()).sort(function (a, b) { return b[1] - a[1]; });
  }

  function getFiltered() {
    var q = state.q.trim().toLowerCase();
    var list = GAMES.filter(function (g) {
      if (state.cats.size && !state.cats.has(g.category)) return false;
      if (state.sizes.size && !state.sizes.has(g.groupSize)) return false;
      if (state.durs.size) {
        var okD = Array.from(state.durs).some(function (d) {
          var f = DURATIONS.find(function (x) { return x.label === d; });
          return f && f.test(g.duration);
        });
        if (!okD) return false;
      }
      if (state.energies.size) {
        var okE = Array.from(state.energies).some(function (d) {
          var f = ENERGIES.find(function (x) { return x.label === d; });
          return f && f.test(g.energy);
        });
        if (!okE) return false;
      }
      if (state.tags.size) {
        var okT = Array.from(state.tags).every(function (t) {
          return (g.tags || []).indexOf(t) !== -1;
        });
        if (!okT) return false;
      }
      if (q) {
        var hay = [g.title, g.summary, g.howTo, g.notes, g.category]
          .concat(g.tags || []).filter(Boolean).join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    switch (state.sort) {
      case "cat":
        list.sort(function (a, b) {
          return a.category.localeCompare(b.category, "hu") || a.title.localeCompare(b.title, "hu");
        });
        break;
      case "dur": list.sort(function (a, b) { return a.duration - b.duration; }); break;
      case "dur-desc": list.sort(function (a, b) { return b.duration - a.duration; }); break;
      case "energy": list.sort(function (a, b) { return a.energy - b.energy; }); break;
      case "random":
        for (var i = list.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
        }
        break;
      default:
        list.sort(function (a, b) { return a.title.localeCompare(b.title, "hu"); });
    }
    return list;
  }

  /* ---------- small builders ---------- */
  function highlight(text, query) {
    var frag = document.createDocumentFragment();
    if (!query || !text) { frag.appendChild(document.createTextNode(text || "")); return frag; }
    var q = query.trim();
    if (q.length < 2) { frag.appendChild(document.createTextNode(text)); return frag; }
    var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    text.split(re).forEach(function (p) {
      if (!p) return;
      if (p.toLowerCase() === q.toLowerCase()) {
        frag.appendChild(el("mark", { class: "hl", text: p }));
      } else {
        frag.appendChild(document.createTextNode(p));
      }
    });
    return frag;
  }

  function energyBar(value) {
    var bar = el("div", { class: "energy-bar", role: "img", "aria-label": "Energiaszint: " + value + " az 5-ből" });
    for (var n = 1; n <= 5; n++) bar.appendChild(el("i", { class: n <= value ? "on" : "" }));
    return bar;
  }

  /* ---------- sidebar (built once, synced on change) ---------- */
  var pillRegistry = [];
  var resetRegistry = [];

  function resetHandler(key) {
    return function () { state[key] = new Set(); update(); };
  }

  function addGroup(title, key, items) {
    var h4 = el("h4", {}, [el("span", { text: title })]);
    var reset = el("span", { class: "reset", role: "button", tabindex: "0", text: "törlés" });
    reset.hidden = true;
    var clear = resetHandler(key);
    reset.addEventListener("click", clear);
    reset.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clear(); }
    });
    h4.appendChild(reset);
    resetRegistry.push({ key: key, el: reset });

    var pills = el("div", { class: "filter-pills" });
    items.forEach(function (it) {
      var pill = el("button", { class: "filter-pill", type: "button", "aria-pressed": "false", text: it });
      pill.addEventListener("click", function () { toggleSet(state[key], it); update(); });
      pillRegistry.push({ key: key, value: it, el: pill });
      pills.appendChild(pill);
    });
    sidebar.appendChild(el("div", { class: "filter-group" }, [h4, pills]));
  }

  function addTagGroup() {
    var h4 = el("h4", {}, [el("span", { text: "Címkék" })]);
    var reset = el("span", { class: "reset", role: "button", tabindex: "0", text: "törlés" });
    reset.hidden = true;
    var clear = resetHandler("tags");
    reset.addEventListener("click", clear);
    reset.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clear(); }
    });
    h4.appendChild(reset);
    resetRegistry.push({ key: "tags", el: reset });

    var cloud = el("div", { class: "gp-tag-cloud" });
    allTags().slice(0, 24).forEach(function (entry) {
      var t = entry[0], n = entry[1];
      var btn = el("button", { type: "button", "aria-pressed": "false" }, [
        "#" + t, el("span", { class: "count", text: String(n) })
      ]);
      btn.addEventListener("click", function () { toggleSet(state.tags, t); update(); });
      pillRegistry.push({ key: "tags", value: t, el: btn });
      cloud.appendChild(btn);
    });
    sidebar.appendChild(el("div", { class: "filter-group" }, [h4, cloud]));
  }

  function buildSidebar() {
    sidebar.textContent = "";
    pillRegistry = [];
    resetRegistry = [];
    addGroup("Kategória", "cats", CATEGORIES);
    addGroup("Létszám", "sizes", GROUP_SIZES);
    addGroup("Időtartam", "durs", DURATIONS.map(function (d) { return d.label; }));
    addGroup("Energiaszint", "energies", ENERGIES.map(function (e) { return e.label; }));
    addTagGroup();
  }

  function syncSidebar() {
    pillRegistry.forEach(function (p) {
      var on = state[p.key].has(p.value);
      p.el.classList.toggle("active", on);
      p.el.setAttribute("aria-pressed", String(on));
    });
    resetRegistry.forEach(function (r) { r.el.hidden = state[r.key].size === 0; });
  }

  /* ---------- chips ---------- */
  function buildChips() {
    activeChipsEl.textContent = "";
    var chips = [];
    if (state.q) chips.push({ label: "„" + state.q + "\"", clear: function () { state.q = ""; searchInput.value = ""; } });
    state.cats.forEach(function (c) { chips.push({ label: c, clear: function () { state.cats.delete(c); } }); });
    state.sizes.forEach(function (s) { chips.push({ label: s + " fő", clear: function () { state.sizes.delete(s); } }); });
    state.durs.forEach(function (d) { chips.push({ label: d, clear: function () { state.durs.delete(d); } }); });
    state.energies.forEach(function (e) { chips.push({ label: e, clear: function () { state.energies.delete(e); } }); });
    state.tags.forEach(function (t) { chips.push({ label: "#" + t, clear: function () { state.tags.delete(t); } }); });

    chips.forEach(function (c) {
      var x = el("button", { type: "button", "aria-label": "Szűrő törlése: " + c.label, text: "×" });
      x.addEventListener("click", function () { c.clear(); update(); });
      activeChipsEl.appendChild(el("span", { class: "active-filter-chip" }, [c.label, x]));
    });
  }

  /* ---------- results ---------- */
  function gameRow(game, idx) {
    var h4 = el("h4", {}, [el("span", { class: "gcat", text: game.category }), highlight(game.title, state.q)]);
    var gtags = el("div", { class: "gtags" }, [highlight(game.summary, state.q)]);
    var btn = el("button", { class: "game-row", type: "button" }, [
      el("div", { class: "gid", text: String(idx + 1).padStart(2, "0") }),
      el("div", { class: "gtitle" }, [h4, gtags]),
      el("div", { class: "gmeta" }, [el("span", { class: "lbl", text: "időtartam" }), el("span", { text: game.duration + " perc" })]),
      el("div", { class: "gmeta" }, [el("span", { class: "lbl", text: "létszám" }), el("span", { text: game.groupSize + " fő" })]),
      el("div", { class: "arrow", "aria-hidden": "true", text: "→" })
    ]);
    btn.addEventListener("click", function () { openDrawer(game); });
    return btn;
  }

  function gameCard(game) {
    var btn = el("button", { class: "gp-card", type: "button" }, [
      el("div", { class: "cat", text: game.category }),
      el("h3", {}, [highlight(game.title, state.q)]),
      el("div", { class: "summary" }, [highlight(game.summary, state.q)]),
      el("div", { class: "meta" }, [
        el("span", { text: game.duration + "′ · " + game.groupSize + " fő" }),
        energyBar(game.energy)
      ])
    ]);
    btn.addEventListener("click", function () { openDrawer(game); });
    return btn;
  }

  function buildResults(filtered) {
    results.textContent = "";
    if (filtered.length === 0) {
      var empty = el("div", { class: "empty-state" }, [
        el("h4", { text: "Üres a háló." }),
        el("p", { text: "Lazíts a szűrőkön, vagy keress más kulcsszóra." })
      ]);
      if (activeFilterCount() > 0) {
        var btn = el("button", { class: "empty-state-btn", type: "button", text: "Összes szűrő törlése" });
        btn.addEventListener("click", clearAll);
        empty.appendChild(btn);
      }
      results.appendChild(empty);
      return;
    }
    if (state.view === "cards") {
      var wrap = el("div", { class: "gp-cards" });
      filtered.forEach(function (g) { wrap.appendChild(gameCard(g)); });
      results.appendChild(wrap);
    } else {
      var list = el("div", { class: "games-list" });
      filtered.forEach(function (g, i) { list.appendChild(gameRow(g, i)); });
      results.appendChild(list);
    }
  }

  /* ---------- drawer ---------- */
  function drawerStat(lbl, val) {
    return el("div", { class: "drawer-stat" }, [
      el("div", { class: "lbl", text: lbl }),
      el("div", { class: "val", text: val })
    ]);
  }
  function drawerBlock(title, text) {
    return el("div", { class: "drawer-block" }, [el("h3", { text: title }), el("p", { text: text })]);
  }
  function onDrawerKey(e) { if (e.key === "Escape") closeDrawer(); }

  function closeDrawer() {
    document.removeEventListener("keydown", onDrawerKey);
    document.body.style.overflow = "";
    if (drawerBack) drawerBack.remove();
    if (drawerEl) drawerEl.remove();
    drawerBack = drawerEl = null;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function openDrawer(game) {
    lastFocused = document.activeElement;

    var closeBtn = el("button", { class: "drawer-close", type: "button", "aria-label": "Bezárás", text: "×" });
    closeBtn.addEventListener("click", closeDrawer);

    var crumb = el("div", { class: "crumb" }, [
      "Játékok ", el("span", { class: "crumb-sep", text: "/" }), " ",
      el("span", { class: "accent", text: game.category })
    ]);

    var energyVal = el("div", { class: "val" }, [energyBar(game.energy)]);
    var stats = el("div", { class: "drawer-stats" }, [
      drawerStat("Időtartam", game.duration + "′"),
      drawerStat("Létszám", game.groupSize),
      drawerStat("Kortól", game.minAge + "+"),
      el("div", { class: "drawer-stat" }, [el("div", { class: "lbl", text: "Energia" }), energyVal])
    ]);

    var body = el("div", { class: "drawer-body" }, [
      el("h2", { text: game.title }),
      el("p", { class: "drawer-summary", text: game.summary }),
      stats,
      drawerBlock("Hogyan játszd", game.howTo)
    ]);
    if (game.notes) body.appendChild(drawerBlock("Vezetői jegyzet", game.notes));

    var dtags = el("div", { class: "drawer-tags" });
    (game.tags || []).forEach(function (t) { dtags.appendChild(el("span", { text: "#" + t })); });
    body.appendChild(el("div", { class: "drawer-block" }, [el("h3", { text: "Címkék" }), dtags]));

    drawerBack = el("div", { class: "drawer-back" });
    drawerBack.addEventListener("click", closeDrawer);
    drawerEl = el("aside", {
      class: "drawer", role: "dialog", "aria-modal": "true", "aria-label": game.title
    }, [el("header", { class: "drawer-head" }, [crumb, closeBtn]), body]);

    document.body.appendChild(drawerBack);
    document.body.appendChild(drawerEl);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onDrawerKey);
    closeBtn.focus();
  }

  /* ---------- actions ---------- */
  function clearAll() {
    state.q = "";
    state.cats = new Set();
    state.sizes = new Set();
    state.durs = new Set();
    state.energies = new Set();
    state.tags = new Set();
    searchInput.value = "";
    update();
  }

  function random() {
    var pool = getFiltered();
    if (!pool.length) pool = GAMES;
    if (!pool.length) return;
    openDrawer(pool[Math.floor(Math.random() * pool.length)]);
  }

  function setViewButtons() {
    viewButtons.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === state.view);
    });
  }

  /* ---------- main update ---------- */
  function update() {
    var filtered = getFiltered();
    var tagCount = allTags().length;

    statTotal.textContent = String(GAMES.length);
    statFound.textContent = String(filtered.length);
    statTags.textContent = String(tagCount);
    countNum.textContent = String(filtered.length);
    totalNum.textContent = String(GAMES.length);

    var afc = activeFilterCount();
    clearBtn.hidden = afc === 0;
    clearBtn.textContent = "Szűrők törlése (" + afc + ")";

    syncSidebar();
    buildChips();
    buildResults(filtered);
    writeUrlState();
  }

  /* ---------- init ---------- */
  buildSidebar();
  searchInput.value = state.q;
  sortSelect.value = state.sort;
  setViewButtons();

  searchInput.addEventListener("input", function (e) { state.q = e.target.value; update(); });
  sortSelect.addEventListener("change", function (e) { state.sort = e.target.value; update(); });
  viewButtons.forEach(function (b) {
    b.addEventListener("click", function () { state.view = b.getAttribute("data-view"); setViewButtons(); update(); });
  });
  randomBtn.addEventListener("click", random);
  clearBtn.addEventListener("click", clearAll);

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      searchInput.focus();
    }
  });

  update();
})();
