window.__ModuleLoader__.load({
	id: "queue-steer-button",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		// Platform-aware shortcut labels: ⌘+Return / ⌘+⇧+Return on macOS,
		// Ctrl+Enter / Ctrl+Shift+Enter elsewhere. The keydown handler accepts
		// both modifiers (metaKey or ctrlKey) so either chord works anywhere.
		const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
		const MOD_KEY = isMac ? "⌘" : "Ctrl";
		const ENTER_KEY = isMac ? "Return" : "Enter";

		// Captured in apply(); the component reaches the session face through it.
		let pluginCtx = null;

		/**
		 * Composer actions: two buttons in `conversation.input.right`, visible
		 * only while the agent is running in the session (hidden in blank/new
		 * chats and removed sessions).
		 *
		 * Queue  → session.prompt([…], "steer"): host mode "steer" is
		 *          agent.steer — the message lands in the agent's next-step
		 *          inbox, the current step finishes and commits its observation,
		 *          then the message is sent together with that observation in
		 *          the next LLM request. Nothing is interrupted.
		 * Steer  → session.cancel() then session.prompt([…], "steer"): the
		 *          current step's LLM stream aborts (partial output preserved
		 *          as an interrupted assistant message), then the same delivery
		 *          continues with the new request.
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
			const [pending, setPending] = react.useState(null);
			const stateRef = react.useRef({});
			stateRef.current = { enabled, draft, sessionId, inputActions, pending, running };

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
					let result;
					if (mode === "steer") {
						const cancelled = await face.cancel();
						if (!cancelled.ok) {
							console.error("queue-steer-button: cancel rejected", cancelled.error);
							return;
						}
					}
					result = await face.prompt([{ type: "text", text: s.draft }], "steer");
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
				const onKeyDown = (e) => {
					if (!stateRef.current.running) return;
					if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
					if (e.isComposing || e.repeat) return;
					const target = e.target;
					if (!(target instanceof HTMLElement)) return;
					if (target.closest("[data-composer-card]") === null) return;
					e.preventDefault();
					e.stopPropagation();
					runSubmit(e.shiftKey ? "steer" : "queue");
				};
				document.addEventListener("keydown", onKeyDown, true);
				return () => document.removeEventListener("keydown", onKeyDown, true);
			}, [runSubmit]);

			if (!running || blank || removed) return null;
			return react.createElement("div", { className: "qsb-actions" }, [
				react.createElement("button", {
					key: "queue",
					type: "button",
					className: "qsb-btn qsb-queue",
					disabled: !enabled || pending !== null,
					title: "Queue into the next agent step (" + MOD_KEY + "+" + ENTER_KEY + ")",
					onClick: () => { runSubmit("queue"); }
				}, "Queue"),
				react.createElement("button", {
					key: "steer",
					type: "button",
					className: "qsb-btn qsb-steer",
					disabled: !enabled || pending !== null,
					title: "Stop the current step and redirect (" + MOD_KEY + "+⇧+" + ENTER_KEY + ")",
					onClick: () => { runSubmit("steer"); }
				}, "Steer")
			]);
		};

		const inject = ["slots", "sessions"];
		function apply(ctx) {
			pluginCtx = ctx;
			const slots = ctx.slots;
			if (slots === undefined) return;
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"queue-steer-button\"]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "queue-steer-button";
				tag.dataset.pluginCss = "queue-steer-button";
				tag.textContent = ".qsb-actions{display:inline-flex;align-items:center;gap:4px;height:24px}.qsb-btn{height:24px;padding:0 10px;border-radius:6px;white-space:nowrap;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1;cursor:pointer}.qsb-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.qsb-btn:disabled{opacity:.45;cursor:default}.qsb-btn.qsb-steer{color:var(--dsw-alias-brand-primary)}";
				document.head.appendChild(tag);
			}
			slots.inject("conversation.input.right", () => slots.register({
				name: "conversation.input.right",
				id: "queue-steer-actions",
				order: 10,
				label: "Queue / Steer"
			}, QueueSteerActions));
		}

		exports.QueueSteerActions = QueueSteerActions;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
