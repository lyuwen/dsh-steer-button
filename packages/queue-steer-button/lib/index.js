/**
 * queue-steer-button — host half.
 *
 * Pure UI plugin: the empty apply exists so the row appears in the host
 * composition / Loader. The browser half ships via exports["./client"],
 * discovered through the package.json `dsh.client` declaration.
 *
 * The buttons drive the existing Host session API directly from the browser
 * (`session.prompt(…, "steer")` for Queue, `session.cancel()` followed by
 * `session.prompt(…, "steer")` for Steer), so this host half needs no
 * behavior of its own.
 */
export function apply() {}
