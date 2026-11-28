// Shared by the server root layout (inline <head> script) and the client
// ThemeProvider, so it must not live in a "use client" module.

export const THEME_STORAGE_KEY = "oxide-theme";
export const ADMIN_PREFIX = "/master-admin";
export const EMPLOYEE_PREFIX = "/employee";

/**
 * Runs in <head> before first paint so Master Admin and Employee workspaces
 * never flash the wrong theme. The public site keeps its own look.
 * Saved choice wins, otherwise defaults to light mode.
 */
export const themeInitScript = `(function(){try{var p=location.pathname;if(p.indexOf('${ADMIN_PREFIX}')!==0&&p.indexOf('${EMPLOYEE_PREFIX}')!==0)return;var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t='light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;
