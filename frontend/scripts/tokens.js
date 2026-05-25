(function () {
  async function applyTokens() {
    const res = await fetch("/assets/design_tokens.json");
    const tokens = await res.json();
    const root = document.documentElement;
    const c = tokens.colors;

    root.style.setProperty("--purple",         c.purple);
    root.style.setProperty("--purple-light",   c.purple_light);
    root.style.setProperty("--purple-glow",    c.purple_glow);
    root.style.setProperty("--purple-glow-sm", c.purple_glow_sm);
    root.style.setProperty("--pink",           c.pink);
    root.style.setProperty("--gold",           c.gold);
    root.style.setProperty("--hot",            c.hot);
    root.style.setProperty("--new",            c.new);
    root.style.setProperty("--bg-deepest",     c.bg_deepest);
    root.style.setProperty("--bg-deep",        c.bg_deep);
    root.style.setProperty("--bg-surface",     c.bg_surface);
    root.style.setProperty("--bg-card",        c.bg_card);
    root.style.setProperty("--bg-card-hover",  c.bg_card_hover);
    root.style.setProperty("--border",         c.border);
    root.style.setProperty("--text-1",         c.text_1);
    root.style.setProperty("--text-2",         c.text_2);
    root.style.setProperty("--text-3",         c.text_3);

    const s = tokens.shadows;
    root.style.setProperty("--shadow-card",  s.card);
    root.style.setProperty("--shadow-hover", s.hover);
    root.style.setProperty("--glow-hover",   s.glow);

    const r = tokens.radii;
    root.style.setProperty("--radius-sm", r.sm);
    root.style.setProperty("--radius-md", r.md);
    root.style.setProperty("--radius-lg", r.lg);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTokens);
  } else {
    applyTokens();
  }
})();
