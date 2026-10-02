// Shared by the server root layout (inline <head> script) and the client
// ThemeProvider, so it must not live in a "use client" module.

export const THEME_STORAGE_KEY = "oxide-theme";
export const ADMIN_PREFIX = "/master-admin";

/**
 * Runs in <head> before first paint so the admin never flashes the wrong
 * theme. It only acts on admin URLs; the public site keeps its own look.
 * Saved choice wins, then the OS preference, then dark.
 */
export const themeInitScript = `(function(){try{if(location.pathname.indexOf('${ADMIN_PREFIX}')!==0)return;var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;
