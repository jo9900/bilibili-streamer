// Modified by jo9900 (2026): float window native background is fully transparent.
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export type ThemeMode = "dark" | "light";

interface WindowThemeColor {
	r: number;
	g: number;
	b: number;
	a?: number;
}

/** Native window background colour per window label and mode. */
const WINDOW_THEME_COLORS: Record<
	string,
	Record<ThemeMode, WindowThemeColor>
> = {
	main: {
		dark: { r: 45, g: 42, b: 46 },
		light: { r: 247, g: 245, b: 242 },
	},
	// The float window paints its own background in CSS (DanmakuFloat) so it
	// can disappear when the window is idle; keep the native layer clear.
	"danmaku-float": {
		dark: { r: 0, g: 0, b: 0, a: 0 },
		light: { r: 0, g: 0, b: 0, a: 0 },
	},
};

/**
 * Apply a theme mode to the current window: toggle the `dark` class on the
 * document root and set the native window background colour from the table.
 */
export function applyTheme(dark: boolean) {
	document.documentElement.classList.toggle("dark", dark);
	const label = getCurrentWebviewWindow().label;
	const color = WINDOW_THEME_COLORS[label]?.[dark ? "dark" : "light"];
	if (!color) return;
	invoke("set_window_background", { ...color, dark }).catch(() => {});
}
