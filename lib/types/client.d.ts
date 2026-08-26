import type { Context } from '@deepseek-ai/cordis';

/**
 * queue-steer-button — browser half declarations.
 *
 * Registers the Queue / Steer composer actions in `conversation.input.right`
 * (visible only while the agent is running) and wires the platform-aware
 * shortcuts (⌘+Return / ⌘+⇧+Return on macOS, Ctrl+Enter / Ctrl+Shift+Enter
 * elsewhere).
 *
 * Queue  → session.prompt([…], "steer"): next-step delivery after the
 *          observation, sent together for the next assistant message.
 * Steer  → session.cancel() then session.prompt([…], "steer"): the current
 *          step's LLM stream aborts, the partial output is preserved as an
 *          interrupted assistant message, then the new request continues.
 */
export function apply(ctx: Context): void;
export const inject: readonly string[];
