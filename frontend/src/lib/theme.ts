export const THEME_STORAGE_KEY = "saransh-theme";

/** Runs before first paint so a dark-mode reader never sees a white flash. */
export const themeInitScript = `(function () {
  try {
    var theme = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = theme === "dark" || ((!theme || theme === "system") && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();`;
