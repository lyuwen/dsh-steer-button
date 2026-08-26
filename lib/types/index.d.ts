/**
 * queue-steer-button — host half declarations.
 *
 * Pure UI plugin: the empty apply exists so the row appears in the host
 * composition / Loader. The browser half ships via exports["./client"],
 * discovered through the package.json `dsh.client` declaration.
 */
export function apply(): void;
