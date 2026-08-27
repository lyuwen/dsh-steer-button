import type { Context } from '@deepseek-ai/cordis';

/**
 * queue-steer-button — browser half declarations.
 *
 * Overrides the running-session composer with three delivery modes:
 *
 * - Queue (plain Enter) → session.prompt([…], "steer"): next-step delivery —
 *   the current step finishes and commits its observation, then the message
 *   is sent together with that observation in the next LLM request. Nothing
 *   is interrupted.
 * - Steer (⌘/Ctrl+Enter) → session.cancel() then session.prompt([…], "steer"):
 *   the current step's LLM stream aborts (partial output preserved as an
 *   interrupted assistant message), then the new request continues.
 * - Backlog (⌘/Ctrl+Shift+Enter) → session.prompt([…], "queue"): DSH's native
 *   queue — waits for the whole turn to finish. Shift+Enter keeps its native
 *   newline role in the text box.
 *
 * Pending messages render in a queue strip above the composer (the shipped
 * dock and pending-steering tail bubbles are hidden). The composer Up arrow
 * or a row's Edit action moves the text back into the composer for free-form
 * editing; backlog rows can be delivered early with Send.
 */
export function apply(ctx: Context): void;
export const inject: readonly string[];
