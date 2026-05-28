# URL structure

Pages live as `/<name>/index.html` to produce clean URLs via GitHub Pages
directory indexing (e.g. `jatekok/index.html` is served at `/jatekok` and
`/jatekok/`). Do not collapse back to `<name>.html` without re-establishing
redirect stubs at the old paths.

Internal links use root-absolute paths (`/jatekok/`, `/styles.css`) so they
keep resolving regardless of the source file's depth.

The `.nojekyll` file at the repo root tells GitHub Pages to serve files
as-is without running Jekyll.

Backward-compat: `jatekok.html` at the root is a meta-refresh stub that
redirects to `/jatekok/` and carries a `<link rel="canonical">` to the
clean URL. GitHub Pages cannot issue true 301 redirects without a Jekyll
plugin, which this site does not use.

The editor entry at `/games-editor/szerkeszto.html` is intentionally not
restructured.
