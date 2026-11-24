import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import type {
	AppConfig,
	LoginResult,
	PartitionMap,
	QrCodeData,
	StartLiveResponse,
	UserConfig,
} from "@/types/api";

const RELEASES_API =
	"https://api.github.com/repos/jo9900/bilibili-streamer/releases/latest";
const RELEASES_PAGE =
	"https://github.com/jo9900/bilibili-streamer/releases/latest";

export interface UpdateInfo {
	available: boolean;
	version?: string;
	body?: string;
	/** Release page to open for downloading the new version. */
	url?: string;
}

/** True when dotted version `a` is greater than `b` (numeric parts only). */
function isNewerVersion(a: string, b: string): boolean {
	const parse = (v: string) =>
		v
			.replace(/^v/, "")
			.split(/[.-]/)
			.map((n) => Number.parseInt(n, 10) || 0);
	const pa = parse(a);
	const pb = parse(b);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
		if (diff !== 0) return diff > 0;
	}
	return false;
}

// Builds are unsigned, so updates are not installed in place: compare against
// the latest GitHub release and send the user to its download page.
export async function checkUpdate(): Promise<UpdateInfo> {
	const res = await fetch(RELEASES_API, {
		headers: { Accept: "application/vnd.github+json" },
	});
	// 404 means no release has been published yet.
	if (res.status === 404) return { available: false };
	if (!res.ok) throw new Error(`GitHub API ${res.status}`);
	const release = (await res.json()) as {
		tag_name: string;
		body?: string;
		html_url?: string;
	};
	const current = await getVersion();
	if (!isNewerVersion(release.tag_name, current)) return { available: false };
	return {
		available: true,
		version: release.tag_name.replace(/^v/, ""),
		body: release.body,
		url: release.html_url ?? RELEASES_PAGE,
	};
}

export async function openReleasePage(url?: string): Promise<void> {
	await openUrl(url ?? RELEASES_PAGE);
}

export async function getLoginQrcode(): Promise<QrCodeData> {
	return await invoke("get_login_qrcode");
}

export async function pollLoginStatus(key: string): Promise<LoginResult> {
	return await invoke("poll_login_status", { key });
}

export async function loadSavedConfig(): Promise<UserConfig | null> {
	return await invoke("load_saved_config");
}

export async function refreshCurrentUser(): Promise<UserConfig> {
	return await invoke("refresh_current_user");
}

export async function getAccountList(): Promise<UserConfig[]> {
	return await invoke("get_account_list");
}

export async function switchAccount(uid: number): Promise<UserConfig> {
	return await invoke("switch_account", { uid });
}

export async function logout(uid: number): Promise<void> {
	return await invoke("logout", { uid });
}

export async function clearSession(): Promise<void> {
	return await invoke("clear_session");
}

export async function getPartitions(): Promise<PartitionMap> {
	return await invoke("get_partitions");
}

export async function updateTitle(title: string): Promise<void> {
	return await invoke("update_title", { title });
}

export async function updateArea(pName: string, sName: string): Promise<void> {
	return await invoke("update_area", { pName, sName });
}

export async function startLive(
	pName?: string,
	sName?: string,
): Promise<StartLiveResponse> {
	return await invoke("start_live", { pName, sName });
}

export async function stopLive(): Promise<void> {
	return await invoke("stop_live");
}

export async function sendDanmaku(
	msg: string,
): Promise<{ code: number; msg: string }> {
	return await invoke("send_danmaku", { msg });
}

export async function getEmoteList(): Promise<Record<string, string>> {
	return await invoke("get_emote_list");
}

export async function getAppConfig(): Promise<AppConfig> {
	return await invoke("get_app_config");
}

export async function setAppConfig(key: string, value: boolean): Promise<void> {
	return await invoke("set_app_config", { key, value });
}

export async function getVersion(): Promise<string> {
	return await invoke("get_version");
}

export async function startDanmakuMonitor(): Promise<void> {
	return await invoke("start_danmaku_monitor");
}

export async function stopDanmakuMonitor(): Promise<void> {
	return await invoke("stop_danmaku_monitor");
}

export async function windowMin(): Promise<void> {
	return await invoke("window_min");
}

export async function windowMax(): Promise<boolean> {
	return await invoke("window_max");
}

export async function windowClose(): Promise<void> {
	return await invoke("window_close");
}

export async function windowDrag(x: number, y: number): Promise<void> {
	return await invoke("window_drag", { x, y });
}

export async function openDanmakuFloat(): Promise<void> {
	return await invoke("open_danmaku_float");
}

export async function closeDanmakuFloat(): Promise<void> {
	return await invoke("close_danmaku_float");
}
