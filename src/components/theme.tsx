"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// Runs in <head> before first paint so there's no flash of the wrong theme.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Read what the init script already applied. Syncing from the DOM after
    // mount is the point here, so the usual effect-setState warning is moot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* storage blocked: the choice just won't be remembered */
    }
  };

  return (
    <div className="seg" role="group" aria-label="Colour theme">
      <button type="button" aria-pressed={theme === "light"} onClick={() => choose("light")}>
        ☀ Light
      </button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => choose("dark")}>
        ☾ Dark
      </button>
    </div>
  );
}
