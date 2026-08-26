window.__ModuleLoader__.load({
	id: "queue-steer-button",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

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
		 * - Backlog (Shift+Enter)            → session.prompt([…], "queue"):
		 *   DSH's native queue — waits for the whole turn to finish.
		 */
		const focusComposer = () => {
			const ta = document.querySelector("[data-composer-card] textarea");
			if (ta) ta.focus();
		};

		// Slash-command drafts stay with the native composer's adjudication; the
		// running-session chord interception never steals them.
		const draftStartsWithSlash = (draft) => /^\s*\//.test(draft);

		/**
		 * The "edit queued text" operation: remove one still-pending inbox row
		 * and place its text back in the composer for free-form editing. Editing
		 * therefore always happens in the composer, never in the narrow dock row.
		 * @param face - the session face.
		 * @param inputActions - composer draft write path.
		 * @param row - one pending inbox row with an editable text projection.
		 * @returns whether the withdraw succeeded.
		 */
		const withdrawRow = async (face, inputActions, row) => {
			if (face === undefined || row === undefined || row.text === null) return false;
			const result = await face.updateQueue(row.id, { kind: "remove" });
			if (result && result.ok === true) {
				inputActions?.setDraft(row.text);
				focusComposer();
				return true;
			}
			console.error("queue-steer-button: withdraw rejected", result);
			return false;
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

			const runSubmit = react.useCallback(async (mode) => {
				const s = stateRef.current;
				if (s.pending !== null || !s.enabled || !s.running) return;
				setPending(mode);
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
				// native busy-enter / newline paths. Pass-through cases:
				//  - a slash-command draft ("/…") — native adjudication owns it;
				//  - an open trigger menu (role=listbox inside the card) — the
				//    composer's Enter arbitration selects from it;
				//  - an empty draft — native accelerated-Enter still steers all
				//    pending backlog rows, and plain Enter stays a no-op.
				const onKeyDownCapture = (e) => {
					const s = stateRef.current;
					if (!s.running) return;
					if (e.isComposing || e.nativeEvent?.isComposing || e.keyCode === 229) return;
					if (e.repeat) return;
					if (e.key !== "Enter") return;
					const target = e.target;
					if (!(target instanceof HTMLElement)) return;
					const card = target.closest("[data-composer-card]");
					if (card === null) return;
					const chord = e.ctrlKey || e.metaKey;
					let mode = null;
					if (chord && !e.shiftKey && !e.altKey) {
						// ⌘/Ctrl+Enter → Steer.
						if (s.draft.trim() === "") return;
						mode = "steer";
					} else if (e.shiftKey && !chord && !e.altKey) {
						// Shift+Enter → Backlog (blocked even with an empty draft so
						// running-session Shift+Enter never inserts a newline).
						if (s.draft.trim() === "") {
							e.preventDefault();
							e.stopPropagation();
							return;
						}
						mode = "backlog";
					} else if (!e.shiftKey && !chord && !e.altKey) {
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
					if (e.isComposing || e.nativeEvent?.isComposing || e.keyCode === 229) return;
					if (e.defaultPrevented) return;
					const s = stateRef.current;
					if (s.queue.length === 0) return;
					if (s.draft.trim() !== "") return; // never clobber an active draft
					const target = e.target;
					if (!(target instanceof HTMLElement)) return;
					if (target.closest("[data-composer-card]") === null) return;
					const row = [...s.queue].reverse().find((candidate) => candidate.text !== null);
					if (row === undefined) return;
					e.preventDefault();
					e.stopPropagation();
					const face = pluginCtx?.sessions?.binding(s.sessionId)?.session;
					withdrawRow(face, s.inputActions, row);
				};
				document.addEventListener("keydown", onKeyDownCapture, true);
				document.addEventListener("keydown", onKeyDownBubble, false);
				return () => {
					document.removeEventListener("keydown", onKeyDownCapture, true);
					document.removeEventListener("keydown", onKeyDownBubble, false);
				};
			}, [runSubmit]);

			if (!running || blank || removed) return null;
			return react.createElement("div", { className: "qsb-actions" }, [
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
					title: "Backlog: wait for the whole turn to finish (Shift+" + ENTER_KEY + ")",
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
				if (await applyAction(row.id, { kind: "remove" }, "Could not move the message back to the composer")) {
					inputActions?.setDraft(row.text);
					focusComposer();
				}
			};

			return react.createElement("div", { className: "qsb-dock", "data-queue-steer-dock": "" },
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
										disabled: busy !== null,
										title: "Move the text back to the composer for editing",
										onClick: () => { withdraw(row); }
									}, "Edit"),
									queueMutable && react.createElement("button", {
										key: "remove",
										type: "button",
										className: "qsb-dock-action",
										disabled: busy !== null,
										title: "Remove from the queue",
										onClick: () => { applyAction(row.id, { kind: "remove" }, "Could not remove the message"); }
									}, "Remove"),
									row.placement === "queued" && queueMutable && react.createElement("button", {
										key: "send",
										type: "button",
										className: "qsb-dock-action qsb-dock-send",
										disabled: busy !== null || !running,
										title: running ? "Deliver with the next agent step" : "Available while the agent is running",
										onClick: () => { applyAction(row.id, { kind: "steer" }, "Could not deliver the message"); }
									}, "Send")
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
			+ ".qsb-dock-actions{flex:none;align-items:center;gap:6px;display:flex}"
			+ ".qsb-dock-action{height:24px;padding:0 10px;border-radius:6px;white-space:nowrap;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1;cursor:pointer}"
			+ ".qsb-dock-action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}"
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
