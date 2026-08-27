window.__ModuleLoader__.load({
	id: "queue-steer-button",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		// Queue-strip icons. The web boot registers
		// @deepseek-ai/dsh-client-ui-primitives as a static module (the same
		// registry that resolves "react"), so the native icon components are used
		// when present. The inline SVGs below carry the same path data
		// (fill: currentColor, inheriting the button color) so the plugin still
		// loads if a host ever stops providing the module.
		let primitives = null;
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch (error) {
			console.error("queue-steer-button: icon module unavailable, using inline icons", error);
		}
		const svgIcon = (viewBox, path) => (props) => react.createElement("svg", {
			width: props.size ?? 14,
			height: props.size ?? 14,
			viewBox,
			fill: "none",
			xmlns: "http://www.w3.org/2000/svg",
			"aria-hidden": true
		}, react.createElement("path", { d: path, fill: "currentColor" }));
		const FALLBACK_ICONS = {
			IconEditOutline16: svgIcon("0 0 16 16", "M9.94076 1.34942C10.7047 0.90231 11.6503 0.902415 12.4143 1.34942C12.7061 1.52015 12.9688 1.79118 13.3104 2.13284C13.6521 2.47448 13.9231 2.73721 14.0939 3.02894C14.5408 3.79294 14.5409 4.73856 14.0939 5.50251C13.9231 5.79415 13.652 6.05704 13.3104 6.39861L6.65932 13.0497C6.28068 13.4284 6.00695 13.7108 5.66543 13.9097C5.32391 14.1085 4.94315 14.2074 4.42705 14.3498L3.24394 14.6761C2.77527 14.8054 2.34538 14.9262 2.00131 14.9684C1.65196 15.0112 1.17964 15.0013 0.810764 14.6325C0.441921 14.2637 0.432107 13.7913 0.47486 13.442C0.517035 13.0979 0.6379 12.668 0.767181 12.1993L1.09352 11.0162C1.23588 10.5001 1.33481 10.1193 1.5336 9.77784C1.7325 9.43632 2.0149 9.1626 2.39355 8.78395L9.04466 2.13284C9.38625 1.79126 9.64911 1.52016 9.94076 1.34942ZM15.5427 14.8398H7.55223L8.96707 13.425H15.5427V14.8398ZM3.39382 9.78422C2.965 10.213 2.84244 10.3436 2.75709 10.49C2.67183 10.6366 2.61862 10.8079 2.45733 11.3925L2.13099 12.5756C2.00183 13.0439 1.92194 13.3419 1.88863 13.5536C2.10041 13.5204 2.39872 13.4416 2.86764 13.3123L4.05075 12.9859C4.63544 12.8246 4.80669 12.7715 4.95323 12.6862C5.09968 12.6008 5.23022 12.4783 5.65905 12.0494L10.721 6.98644L8.45577 4.72121L3.39382 9.78422ZM11.7 2.57079C11.3774 2.38198 10.9777 2.38198 10.6551 2.57079C10.5602 2.62647 10.4487 2.72931 10.0449 3.13311L9.45604 3.72094L11.7213 5.98617L12.3102 5.39833C12.7139 4.99457 12.8168 4.88307 12.8725 4.78818C13.0613 4.46561 13.0612 4.06585 12.8725 3.74326C12.8169 3.64827 12.7146 3.53752 12.3102 3.13311C11.9057 2.72863 11.795 2.6264 11.7 2.57079Z"),
			IconTrashOutline16: svgIcon("0 0 16 16", "M14.4782 4.84067L14.2138 10.1152C14.1102 12.1872 14.067 13.0115 13.3866 13.9607C13.1044 14.3546 12.7498 14.6912 12.3424 14.9535C11.8239 15.2872 11.2415 15.4316 10.5585 15.4998C9.88727 15.5668 9.04946 15.5656 7.99998 15.5656C6.95051 15.5656 6.1127 15.5668 5.44142 15.4998C4.75851 15.4316 4.17602 15.2872 3.65753 14.9535C3.25012 14.6912 2.89559 14.3546 2.61332 13.9607C1.93296 13.0115 1.88979 12.1872 1.78619 10.1152L1.52179 4.84067L2.89006 4.77277L3.15343 10.0463C3.26221 12.2218 3.32452 12.6015 3.72646 13.1624C3.90825 13.4161 4.13686 13.6334 4.39927 13.8023C4.66204 13.9714 5.00263 14.0792 5.57825 14.1367C6.16562 14.1953 6.92298 14.1963 7.99998 14.1963C9.07699 14.1963 9.83434 14.1953 10.4217 14.1367C10.9973 14.0792 11.3379 13.9714 11.6007 13.8023C11.8631 13.6334 12.0917 13.4161 12.2735 13.1624C12.6755 12.6015 12.7378 12.2218 12.8465 10.0463L13.1099 4.77277L14.4782 4.84067ZM5.43011 6.22849H6.7994V11.3909H5.43011V6.22849ZM9.20056 6.22849H10.5699V11.3909H9.20056V6.22849ZM8.53597 0.434431C9.17976 0.434431 9.6522 0.426926 10.0966 0.571258C10.2357 0.616451 10.3717 0.672554 10.502 0.738948C10.9182 0.951107 11.2464 1.29099 11.7015 1.74612L12.4978 2.54136H15.3742V3.91169H0.625732V2.54136H3.50218L4.29845 1.74612C4.75358 1.29099 5.08174 0.951107 5.49801 0.738948C5.62831 0.672554 5.76425 0.616451 5.90334 0.571258C6.34776 0.426926 6.82021 0.434431 7.46399 0.434431H8.53597ZM7.46399 1.80476C6.73208 1.80476 6.51641 1.81187 6.32617 1.87369C6.25545 1.89667 6.18668 1.92533 6.12041 1.95907C5.96398 2.03878 5.82348 2.16253 5.44142 2.54136H10.5585C10.1765 2.16253 10.036 2.03878 9.87955 1.95907C9.81329 1.92533 9.74452 1.89667 9.6738 1.87369C9.48356 1.81187 9.26789 1.80476 8.53597 1.80476H7.46399Z"),
			IconSendOutline14: svgIcon("0 0 14 14", "M7.24707 1.01771C7.52897 1.07653 7.77619 1.19694 8.00391 1.38001C8.19202 1.53136 8.39884 1.73784 8.61914 1.95814L12.6396 5.9806L11.6299 6.99134L7.71484 3.0763V13.0001H6.28516V3.0763L2.36914 6.99134L1.35938 5.9806L5.38086 1.95814C5.60116 1.73784 5.80798 1.53136 5.99609 1.38001C6.19476 1.22027 6.4385 1.06739 6.75195 1.01771C6.91296 0.992304 7.07471 0.997504 7.24707 1.01771Z")
		};
		const iconOf = (name) => (primitives !== null && typeof primitives[name] === "function" ? primitives[name] : FALLBACK_ICONS[name]);
		const IconEdit = iconOf("IconEditOutline16");
		const IconTrash = iconOf("IconTrashOutline16");
		const IconSend = iconOf("IconSendOutline14");

		// Platform-aware labels: ⌘ / Ctrl and Return / Enter.
		const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
		const MOD_KEY = isMac ? "⌘" : "Ctrl";
		const ENTER_KEY = isMac ? "Return" : "Enter";

		// Captured in apply(); components reach the session face through it.
		let pluginCtx = null;

		/**
		 * Delivery modes (all only while the addressed agent is running):
		 *
		 * - Queue   (plain Enter)            → session.prompt([…], "steer"):
		 *   next-step delivery — the current step finishes and commits its
		 *   observation, then the message is sent together with that observation
		 *   in the next LLM request. Nothing is interrupted; the text stays
		 *   editable in the composer queue strip until that boundary.
		 * - Steer   (⌘/Ctrl+Enter)           → session.cancel() then the same
		 *   prompt: the current step's LLM stream aborts (partial output kept as
		 *   an interrupted assistant message), then the new request continues.
		 * - Backlog (⌘/Ctrl+⇧+Enter)         → session.prompt([…], "queue"):
		 *   DSH's native queue — waits for the whole turn to finish. Shift+Enter
		 *   keeps its native newline role in the text box.
		 */
		/**
		 * Focus the composer textarea that belongs to the same composer stack as
		 * `anchor` (the dock element sits beside the composer card). Scoped so a
		 * multi-session layout never steals focus from another session's box.
		 */
		const focusComposer = (anchor) => {
			const host = anchor?.parentElement ?? document;
			const ta = host.querySelector("[data-composer-card] textarea");
			if (ta) ta.focus();
		};

		// Slash-command drafts stay with the native composer's adjudication; the
		// running-session chord interception never steals them.
		const draftStartsWithSlash = (draft) => /^\s*\//.test(draft);

		const reportWithdrawFailure = (info) => {
			console.error("queue-steer-button: withdraw rejected", info);
		};

		/**
		 * The "edit queued text" operation: remove one still-pending inbox row
		 * and place its text back in the composer for free-form editing. Editing
		 * therefore always happens in the composer, never in the narrow dock row.
		 * Shared by the keyboard path (session face, resolves {ok}) and the dock
		 * path (conversation service, rejects on failure).
		 * @param removeRow - async queue-remove operation for one row id.
		 * @param inputActions - composer draft write path.
		 * @param row - one pending inbox row with an editable text projection.
		 * @param onFailure - failure reporter (defaults to console.error).
		 * @returns whether the withdraw succeeded.
		 */
		const withdrawRow = async (removeRow, inputActions, row, onFailure = reportWithdrawFailure) => {
			if (row === undefined || row.text === null) return false;
			let result;
			try {
				result = await removeRow(row.id);
			} catch (error) {
				onFailure(error);
				return false;
			}
			if (result && result.ok === false) {
				onFailure(result.error ?? result);
				return false;
			}
			inputActions?.setDraft(row.text);
			return true;
		};

		/**
		 * Composer actions: three buttons in `conversation.input.right`, visible
		 * only while the agent is running in the session (hidden in blank/new
		 * chats and removed sessions).
		 */
		const QueueSteerActions = (props) => {
			const session = props.session;
			const input = props.input;
			const inputActions = props.inputActions;
			const sessionId = props.sessionId;
			const running = session?.running === true;
			const removed = session?.removed === true;
			const blank = session?.blank === true;
			const draft = input?.draft ?? "";
			const phase = input?.phase;
			const empty = draft.trim() === "";
			const busy = phase === "adjudicating" || phase === "submitting";
			const hasImages = (input?.imageIds?.length ?? 0) > 0;
			const enabled = !removed && !empty && !busy && !hasImages && phase === "plain";
			const queue = (session?.queue ?? []).filter((row) => row.placement === "queued" || row.placement === "steering");
			const [pending, setPending] = react.useState(null);
			const stateRef = react.useRef({});
			stateRef.current = { enabled, draft, sessionId, inputActions, pending, running, queue };
			// DOM anchor of THIS instance's buttons (rendered inside its own
			// composer card). When set, key events from any other session's
			// composer are rejected instead of double-firing every instance.
			const actionsRef = react.useRef(null);
			// Queue snapshot taken when our last submit started: the row added
			// since then is the one this instance just queued (see the ↑ handler).
			const submitBaseRef = react.useRef(null);

			const runSubmit = react.useCallback(async (mode) => {
				const s = stateRef.current;
				if (s.pending !== null || !s.enabled || !s.running) return;
				setPending(mode);
				// Capture the pending queue BEFORE the RPC: the row that appears
				// after it is the one this submit queued.
				const before = new Set(stateRef.current.queue.map((r) => r.id));
				try {
					const face = pluginCtx?.sessions?.binding(s.sessionId)?.session;
					if (face === undefined) {
						console.error("queue-steer-button: no session face for", s.sessionId);
						return;
					}
					if (mode === "steer") {
						const cancelled = await face.cancel();
						if (!cancelled.ok) {
							console.error("queue-steer-button: cancel rejected", cancelled.error);
							return;
						}
					}
					const rpcMode = mode === "backlog" ? "queue" : "steer";
					const result = await face.prompt([{ type: "text", text: s.draft }], rpcMode);
					if (result && result.ok === true) {
						s.inputActions?.setDraft("");
						submitBaseRef.current = before;
					} else {
						console.error("queue-steer-button: prompt rejected", result);
					}
				} catch (error) {
					console.error("queue-steer-button: submit failed", error);
				} finally {
					setPending(null);
				}
			}, []);

			react.useEffect(() => {
				// Capture-phase chord interception: runs BEFORE the native composer
				// handler, so the running-session Enter chords never reach the
				// native busy-enter path. Shift+Enter alone is never intercepted —
				// it keeps its native newline role. Pass-through cases:
				//  - a slash-command draft ("/…") — native adjudication owns it;
				//  - an open trigger menu (role=listbox inside the card) — the
				//    composer's Enter arbitration selects from it;
				//  - an empty draft — native accelerated-Enter still steers all
				//    pending backlog rows, and plain Enter stays a no-op.
				const onKeyDownCapture = (e) => {
					const s = stateRef.current;
					if (!s.running) return;
					if (e.isComposing || e.keyCode === 229) return;
					if (e.repeat) return;
					if (e.key !== "Enter") return;
					const target = e.target;
					if (!(target instanceof HTMLElement)) return;
					const card = target.closest("[data-composer-card]");
					if (card === null) return;
					const ownCard = actionsRef.current === null ? null : actionsRef.current.closest("[data-composer-card]");
					if (ownCard !== null && card !== ownCard) return;
					const chord = e.ctrlKey || e.metaKey;
					let mode = null;
					if (chord && !e.altKey) {
						// ⌘/Ctrl+Enter → Steer; ⌘/Ctrl+⇧+Enter → Backlog. Shift+Enter
						// itself is not intercepted — it keeps its native newline
						// role in the text box.
						if (e.shiftKey) {
							// Backlog (blocked even with an empty draft so the chord
							// never degrades into a newline).
							if (s.draft.trim() === "") {
								e.preventDefault();
								e.stopPropagation();
								return;
							}
							mode = "backlog";
						} else {
							// Steer; an empty draft falls through to the native
							// accelerated-Enter steer-all-queued gesture.
							if (s.draft.trim() === "") return;
							mode = "steer";
						}
					} else if (!e.shiftKey && !e.altKey) {
						// Enter → Queue.
						if (s.draft.trim() === "") return;
						mode = "queue";
					}
					if (mode === null) return;
					if (draftStartsWithSlash(s.draft)) return;
					if (card.querySelector('[role="listbox"]') !== null) return;
					if (!s.enabled) return;
					e.preventDefault();
					e.stopPropagation();
					runSubmit(mode);
				};
				// Bubble-phase ArrowUp: runs AFTER the composer's own handler, so an
				// open menu that consumed Up (e.defaultPrevented) keeps navigating;
				// an unconsumed Up in the composer withdraws the most recently
				// queued message back into the text box for editing.
				const onKeyDownBubble = (e) => {
					if (e.key !== "ArrowUp") return;
					if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
					if (e.isComposing || e.keyCode === 229) return;
					if (e.defaultPrevented) return;
					const s = stateRef.current;
					if (s.queue.length === 0) return;
					if (s.draft.trim() !== "") return; // never clobber an active draft
					const target = e.target;
					if (!(target instanceof HTMLElement)) return;
					const card = target.closest("[data-composer-card]");
					if (card === null) return;
					const ownCard = actionsRef.current === null ? null : actionsRef.current.closest("[data-composer-card]");
					if (ownCard !== null && card !== ownCard) return;
					// The host inbox is FIFO within each list (append at the tail,
					// claim from the front) and the combined snapshot projects
					// next-turn rows before next-step rows, so the last row is the
					// newest next-step ("queue") item. Prefer the row OUR last
					// successful submit added (exact even when a backlog row was
					// queued after a queue row), then fall back to the newest row.
					let row;
					const base = submitBaseRef.current;
					if (base !== null) {
						const added = s.queue.filter((candidate) => !base.has(candidate.id));
						if (added.length === 1) row = added[0];
					}
					if (row === undefined || row.text === null) {
						row = [...s.queue].reverse().find((candidate) => candidate.text !== null);
					}
					if (row === undefined) return;
					const face = pluginCtx?.sessions?.binding(s.sessionId)?.session;
					if (face === undefined) return;
					e.preventDefault();
					e.stopPropagation();
					withdrawRow((id) => face.updateQueue(id, { kind: "remove" }), s.inputActions, row);
				};
				document.addEventListener("keydown", onKeyDownCapture, true);
				document.addEventListener("keydown", onKeyDownBubble, false);
				return () => {
					document.removeEventListener("keydown", onKeyDownCapture, true);
					document.removeEventListener("keydown", onKeyDownBubble, false);
				};
			}, [runSubmit]);

			if (!running || blank || removed) return null;
			return react.createElement("div", { className: "qsb-actions", ref: actionsRef }, [
				react.createElement("button", {
					key: "queue",
					type: "button",
					className: "qsb-btn qsb-queue",
					disabled: !enabled || pending !== null,
					title: "Queue into the next agent step (" + ENTER_KEY + ")",
					onClick: () => { runSubmit("queue"); }
				}, "Queue"),
				react.createElement("button", {
					key: "steer",
					type: "button",
					className: "qsb-btn qsb-steer",
					disabled: !enabled || pending !== null,
					title: "Stop the current step and redirect (" + MOD_KEY + "+" + ENTER_KEY + ")",
					onClick: () => { runSubmit("steer"); }
				}, "Steer"),
				react.createElement("button", {
					key: "backlog",
					type: "button",
					className: "qsb-btn qsb-backlog",
					disabled: !enabled || pending !== null,
					title: "Backlog: wait for the whole turn to finish (" + MOD_KEY + "+⇧+" + ENTER_KEY + ")",
					onClick: () => { runSubmit("backlog"); }
				}, "Backlog")
			]);
		};

		/**
		 * Queue strip above the composer card (`conversation.input.dock`). Renders
		 * every still-pending inbox row — next-step ("queue") items and turn-end
		 * ("backlog") items — replacing the shipped dock and the pending-steering
		 * tail bubbles, which are hidden by CSS. Editing always withdraws the text
		 * back into the composer instead of editing inline in the narrow row.
		 */
		const QueueSteerDock = (props) => {
			const session = props.session;
			const inputActions = props.inputActions;
			const updateQueue = props.updateQueue;
			const notify = props.notify;
			const running = session?.running === true;
			const removed = session?.removed === true;
			const queueMutable = session?.subagent == null && !removed;
			const rows = (session?.queue ?? []).filter((row) => row.placement === "queued" || row.placement === "steering");
			const [busy, setBusy] = react.useState(null);
			// DOM anchor of this strip; focus is scoped through it to the composer
			// card in the same composer stack (never another session's box).
			const dockRef = react.useRef(null);
			if (rows.length === 0) return null;

			const applyAction = async (itemId, action, failure) => {
				setBusy(itemId);
				try {
					await updateQueue(itemId, action);
					return true;
				} catch (error) {
					notify?.("error", failure);
					return false;
				} finally {
					setBusy((current) => (current === itemId ? null : current));
				}
			};

			const withdraw = async (row) => {
				if (row.text === null) return;
				// Keep the busy guard applyAction provides: a double-click would
				// otherwise fire two concurrent removes (the second fails with
				// queue-item-not-found) and leave the other row actions enabled.
				setBusy(row.id);
				try {
					if (await withdrawRow(
						(id) => updateQueue(id, { kind: "remove" }),
						inputActions,
						row,
						() => notify?.("error", "Could not move the message back to the composer")
					)) {
						focusComposer(dockRef.current);
					}
				} finally {
					setBusy((current) => (current === row.id ? null : current));
				}
			};

			return react.createElement("div", { className: "qsb-dock", "data-queue-steer-dock": "", ref: dockRef },
				react.createElement("div", { className: "qsb-dock-panel" },
					react.createElement("ul", { className: "qsb-dock-list" },
						rows.map((row) =>
							react.createElement("li", { key: row.id, className: "qsb-dock-row" },
								react.createElement("span", {
									className: "qsb-dock-badge " + (row.placement === "steering" ? "qsb-dock-next" : "qsb-dock-turn"),
									title: row.placement === "steering"
										? "Enters the context with the next agent step"
										: "Enters the context when the current turn finishes"
								}, row.placement === "steering" ? "next step" : "turn end"),
								react.createElement("span", { className: "qsb-dock-preview", title: row.text ?? row.preview }, row.preview),
								react.createElement("span", { className: "qsb-dock-actions" },
									queueMutable && row.text !== null && react.createElement("button", {
										key: "edit",
										type: "button",
										className: "qsb-dock-action",
										"aria-label": "Move the text back to the composer for editing",
										disabled: busy !== null,
										title: "Move the text back to the composer for editing",
										onClick: () => { withdraw(row); }
									}, react.createElement(IconEdit, { size: 14 })),
									queueMutable && react.createElement("button", {
										key: "remove",
										type: "button",
										className: "qsb-dock-action",
										"aria-label": "Remove from the queue",
										disabled: busy !== null,
										title: "Remove from the queue",
										onClick: () => { applyAction(row.id, { kind: "remove" }, "Could not remove the message"); }
									}, react.createElement(IconTrash, { size: 14 })),
									row.placement === "queued" && queueMutable && react.createElement("button", {
										key: "send",
										type: "button",
										className: "qsb-dock-action qsb-dock-send",
										"aria-label": running ? "Deliver with the next agent step" : "Available while the agent is running",
										disabled: busy !== null || !running,
										title: running ? "Deliver with the next agent step" : "Available while the agent is running",
										onClick: () => { applyAction(row.id, { kind: "steer" }, "Could not deliver the message"); }
									}, react.createElement(IconSend, { size: 14 }))
								)
							)
						)
					)
				)
			);
		};

		const CSS = "[data-queue-dock]{display:none!important}[data-pending-steering]{display:none!important}"
			+ ".qsb-actions{display:inline-flex;align-items:center;gap:4px;height:24px}"
			+ ".qsb-btn{height:24px;padding:0 10px;border-radius:6px;white-space:nowrap;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1;cursor:pointer}"
			+ ".qsb-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}"
			+ ".qsb-btn:disabled{opacity:.45;cursor:default}"
			+ ".qsb-btn.qsb-steer{color:var(--dsw-alias-brand-primary)}"
			+ ".qsb-btn.qsb-backlog{color:var(--dsw-alias-state-business-primary)}"
			+ ".qsb-dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) - var(--dsh-composer-side-clearance));max-width:var(--dsh-composer-card-max-width);margin:0 auto;padding:0 var(--dsh-composer-side-clearance) 6px;flex:none}"
			+ ".qsb-dock-panel{background:var(--dsw-specific-tip);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:2px 0;position:relative;overflow:hidden}"
			+ ".qsb-dock-list{max-height:180px;margin:0;padding:0;list-style:none;overflow-y:auto}"
			+ ".qsb-dock-row{box-sizing:border-box;border-radius:8px;align-items:center;gap:10px;width:100%;min-height:36px;padding:4px 5px 4px 12px;display:flex}"
			+ ".qsb-dock-row+.qsb-dock-row{box-shadow:inset 0 1px 0 var(--dsw-alias-border-l1)}"
			+ ".qsb-dock-badge{flex:none;height:18px;padding:0 8px;border-radius:999px;font-size:11px;line-height:16px;white-space:nowrap;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary)}"
			+ ".qsb-dock-next{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}"
			+ ".qsb-dock-preview{min-width:0;flex:auto;color:var(--dsw-alias-label-primary-dimmed);text-overflow:ellipsis;white-space:nowrap;word-break:break-word;overflow:hidden;font:var(--dsw-font-xs-13)}"
			+ ".qsb-dock-actions{flex:none;align-items:center;gap:2px;display:flex}"
			+ ".qsb-dock-action{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:none;place-items:center;padding:0;display:grid}"
			+ ".qsb-dock-action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}"
			+ ".qsb-dock-action:focus-visible{outline:2px solid var(--dsw-alias-label-tertiary);outline-offset:-2px}"
			+ ".qsb-dock-action:disabled{opacity:.45;cursor:default}"
			+ ".qsb-dock-send{color:var(--dsw-alias-brand-primary)}";

		const inject = ["slots", "sessions", "conversation"];
		function apply(ctx) {
			pluginCtx = ctx;
			const slots = ctx.slots;
			if (slots === undefined) return;
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"queue-steer-button\"]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "queue-steer-button";
				tag.dataset.pluginCss = "queue-steer-button";
				tag.textContent = CSS;
				document.head.appendChild(tag);
			}
			slots.inject("conversation.input.right", () => slots.register({
				name: "conversation.input.right",
				id: "queue-steer-actions",
				order: 10,
				label: "Queue / Steer / Backlog"
			}, QueueSteerActions));
			slots.inject("conversation.input.dock", () => slots.register({
				name: "conversation.input.dock",
				id: "queue-steer-dock",
				order: 30,
				label: "Queue / Backlog strip",
				inject: (sessionId) => {
					const actx = ctx.sessions.scope(sessionId);
					if (actx === void 0) throw new Error("queue-steer-dock: session \"" + sessionId + "\" resolved no scope");
					const conversation = actx.get("conversation");
					if (conversation === void 0) throw new Error("queue-steer-dock: conversation service unavailable");
					return {
						updateQueue: (itemId, action) => conversation.updateQueue(itemId, action),
						notify: (level, text) => {
							conversation.input.for(actx).notify(level, text);
						}
					};
				}
			}, QueueSteerDock));
		}

		exports.QueueSteerActions = QueueSteerActions;
		exports.QueueSteerDock = QueueSteerDock;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
