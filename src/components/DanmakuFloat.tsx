// Modified by jo9900 (2026): custom auto-hiding title bar and fully
// transparent idle state for the float window; danmaku bubbles also fade out
// after 10s without activity.
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Minus, X } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import DanmakuStreamView from "@/components/DanmakuStreamView";
import { useDanmaku, useUser } from "@/context/AppContext";
import { closeDanmakuFloat, windowDrag, windowMin } from "@/hooks/useTauri";

/**
 * The float window has no native decorations. Its "chrome" (title bar,
 * background, input bar) is drawn here and only shown while the window is
 * focused or hovered. Otherwise only the danmaku bubbles are visible, and
 * with no danmaku the window is fully transparent.
 *
 * After IDLE_HIDE_MS without focus, hover or a new danmaku the bubbles fade
 * out too, so nothing is drawn on screen. Any of those three brings them back.
 */
const IDLE_HIDE_MS = 10_000;

export default function DanmakuFloat() {
	const { danmakuList, clearDanmaku } = useDanmaku();
	const { user } = useUser();
	const [focused, setFocused] = useState(true);
	const [hovered, setHovered] = useState(false);
	const active = focused || hovered;
	const [dormant, setDormant] = useState(false);
	// Id of the newest danmaku; changes whenever a new one arrives.
	const newestId = Math.max(
		danmakuList[0]?.id ?? -1,
		danmakuList[danmakuList.length - 1]?.id ?? -1,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: newestId restarts the idle timer
	useEffect(() => {
		setDormant(false);
		if (active) return;
		const timer = setTimeout(() => setDormant(true), IDLE_HIDE_MS);
		return () => clearTimeout(timer);
	}, [active, newestId]);

	useEffect(() => {
		document.body.classList.add("float-window");
		return () => {
			document.body.classList.remove("float-window");
		};
	}, []);

	useEffect(() => {
		document.body.classList.toggle("float-idle", !active);
	}, [active]);

	useEffect(() => {
		const win = getCurrentWebviewWindow();
		let unlisten: (() => void) | undefined;
		let disposed = false;
		win
			.isFocused()
			.then((f) => {
				if (!disposed) setFocused(f);
			})
			.catch(() => {});
		win
			.onFocusChanged(({ payload }) => setFocused(payload))
			.then((fn) => {
				if (disposed) fn();
				else unlisten = fn;
			})
			.catch(() => {});
		return () => {
			disposed = true;
			unlisten?.();
		};
	}, []);

	const handleDragStart = (e: MouseEvent) => {
		if (e.button !== 0) return;
		if ((e.target as HTMLElement).closest("button")) return;
		windowDrag(e.screenX, e.screenY).catch(() => {});
	};

	const fade = `transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`;

	return (
		<div
			className="relative h-screen overflow-hidden rounded-xl"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{/* Background layer: only painted while active. */}
			<div
				className={`absolute inset-0 rounded-xl bg-[#f7f5f2]/80 dark:bg-[#1c1a1c]/80 ${fade}`}
			/>
			{/* Title bar: drag area + minimize / close, only while active. */}
			<div
				onMouseDown={handleDragStart}
				className={`absolute top-0 inset-x-0 z-10 h-8 flex items-center justify-end gap-1 px-2 select-none cursor-default ${fade}`}
			>
				<button
					type="button"
					onClick={() => windowMin().catch(() => {})}
					className="w-6 h-6 rounded-md flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-300/60 dark:hover:bg-stone-700/60 transition"
					title="最小化"
				>
					<Minus size={13} />
				</button>
				<button
					type="button"
					onClick={() => closeDanmakuFloat().catch(() => {})}
					className="w-6 h-6 rounded-md flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-white hover:bg-red-500/90 transition"
					title="关闭"
				>
					<X size={13} />
				</button>
			</div>
			<DanmakuStreamView
				className="relative h-full flex flex-col overflow-hidden"
				messages={danmakuList}
				user={user}
				onClear={clearDanmaku}
				compact
				inputHidden={!active}
				listHidden={dormant}
			/>
		</div>
	);
}
