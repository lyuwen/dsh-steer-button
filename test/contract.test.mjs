/**
 * Contract tests for queue-steer-button.
 *
 * These do not render anything. They read the DSH this repo is being loaded
 * into and assert that the contracts the plugin's browser half consumes are
 * still the ones it was written against. That is the failure mode this repo
 * has actually hit: a DSH update changed a slot's props (and two DOM/state
 * names), the plugin kept loading cleanly, and its controls silently stopped
 * rendering.
 *
 * Every assertion is two-sided: the DSH must still provide the contract AND
 * lib/client.js must still consume the shape the DSH provides it in.
 *
 * Usage:
 *   npm test                                        # auto-detect the installed DSH
 *   DSH_ROOT=/path/to/@deepseek-ai/dsh npm test     # test an explicit DSH
 *   node tools/dsh-matrix.mjs 0.1.4 0.1.5-rc.1      # the same checks across versions
 *
 * A DSH root is the `@deepseek-ai/dsh` package directory. The client packages
 * it composes are resolved through Node from inside it, so both npm's hoisted
 * layout and pnpm's virtual store work.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(repoRoot, "lib/client.js"), "utf8");

/** Locate the DSH install to test against: explicit root, profile, then global. */
function findDshRoot() {
	const explicit = process.env.DSH_ROOT;
	if (explicit !== undefined && explicit !== "") {
		if (!existsSync(join(explicit, "package.json"))) throw new Error(`DSH_ROOT is not a package directory: ${explicit}`);
		return explicit;
	}
	const candidates = [];
	const home = process.env.DSH_HOME;
	if (home !== undefined && home !== "") {
		const profiles = join(home, "profiles");
		if (existsSync(profiles)) {
			for (const entry of readdirSync(profiles)) candidates.push(join(profiles, entry, "node_modules/@deepseek-ai/dsh"));
		}
	}
	try {
		const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
		if (globalRoot !== "") candidates.push(join(globalRoot, "@deepseek-ai/dsh"));
	} catch {
		// No npm on PATH: the explicit and profile candidates are all we have.
	}
	return candidates.find((candidate) => existsSync(candidate));
}

const dshRoot = findDshRoot();
const skip = dshRoot === undefined ? "no DSH install found; set DSH_ROOT to the @deepseek-ai/dsh package directory" : false;

/**
 * Directory of one client package the DSH composes.
 *
 * Resolution is deliberately layout-tolerant. npm hoists the whole tree, so the
 * package is usually reachable from the DSH root; pnpm links only each
 * package's own dependencies, and the client packages arrive through the web
 * bundle, so there they exist only inside the virtual store.
 */
function packageDir(name) {
	const specifier = `@deepseek-ai/${name}`;
	if (dshRoot === undefined) return undefined;
	const has = (dir) => existsSync(join(dir, "package.json"));
	const resolve = createRequire(join(dshRoot, "package.json"));
	for (const candidate of [`${specifier}/package.json`, specifier]) {
		let entry;
		try {
			entry = resolve.resolve(candidate);
		} catch {
			continue;
		}
		// A package.json hit is already the package root; a main-entry hit is
		// somewhere inside it, so walk up to the manifest that names it.
		for (let dir = dirname(entry); ; dir = dirname(dir)) {
			if (has(dir) && JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name === specifier) return dir;
			if (dirname(dir) === dir) break;
		}
	}
	// pnpm: <node_modules>/@deepseek-ai/<name> is empty or absent, while
	// <node_modules>/.pnpm/<name>@<version>[_peers]/node_modules/ holds it.
	for (let dir = dshRoot; ; dir = dirname(dir)) {
		const modules = join(dir, "node_modules");
		if (existsSync(modules)) {
			const flat = join(modules, specifier);
			if (has(flat)) return flat;
			const virtual = join(modules, ".pnpm");
			if (existsSync(virtual)) {
				for (const entry of readdirSync(virtual)) {
					if (!entry.startsWith(`${name}@`) && !entry.includes(`+${name}@`)) continue;
					const stored = join(virtual, entry, "node_modules", specifier);
					if (has(stored)) return stored;
				}
			}
		}
		if (dirname(dir) === dir) break;
	}
	assert.fail(`DSH ${dshRoot} does not bundle ${specifier}: this DSH line predates it, or the package was renamed`);
}

/** Read every declaration file under a package (paths move between releases). */
function typeText(name) {
	const root = join(packageDir(name), "lib/types");
	const read = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return read(path);
		return entry.name.endsWith(".d.ts") ? [readFileSync(path, "utf8")] : [];
	});
	return existsSync(root) ? read(root).join("\n") : "";
}

/** The composed client bundle, where the DOM markers actually live. */
function clientBundle(name) {
	const path = join(packageDir(name), "lib/client.js");
	assert.ok(existsSync(path), `DSH ${dshRoot} has no lib/client.js for @deepseek-ai/${name}`);
	return readFileSync(path, "utf8");
}

const conversationTypes = () => typeText("dsh-client-ui-conversation");
const sessionTypes = () => typeText("dsh-api-session-controller");

/** One `interface X { ... }` body from a declaration text, or "" when absent. */
function interfaceBody(text, name) {
	const start = text.indexOf(`interface ${name} {`);
	if (start === -1) return "";
	const end = text.indexOf("\n}", start);
	return end === -1 ? text.slice(start) : text.slice(start, end);
}

/** One `'slot.key': { ... }` entry from the slot map, or "" when absent. */
function slotEntry(text, key) {
	const start = text.indexOf(`'${key}': {`);
	if (start === -1) return "";
	const end = text.indexOf("};", start);
	return end === -1 ? text.slice(start) : text.slice(start, end);
}

test("the composer controls still have a slot to render in", { skip }, () => {
	const types = conversationTypes();
	assert.notEqual(slotEntry(types, "conversation.input.right"), "", "conversation.input.right is no longer declared");
	assert.notEqual(slotEntry(types, "conversation.input.dock"), "", "conversation.input.dock is no longer declared");
	assert.match(source, /conversation\.input\.right/);
	assert.match(source, /conversation\.input\.dock/);
});

test("the actions entry reads Session/Input the way that slot supplies them", { skip }, () => {
	const right = slotEntry(conversationTypes(), "conversation.input.right");
	// DSH 0.1.5 dropped the InputZone owner from this slot and renders it as
	// renderSlot(key, {}); the standard props (useSession/useInput) are then the
	// only source. A DSH that still passes the owner must keep working too.
	if (/owner\s*:/.test(right)) {
		assert.match(source, /props\.session/, "this DSH still supplies the slot owner; the owner fallback is gone");
		assert.match(source, /props\.input/, "this DSH still supplies the slot owner; the owner fallback is gone");
	} else {
		assert.match(source, /props\.useSession/, "slot owner is gone, so the component must read useSession");
		assert.match(source, /props\.useInput/, "slot owner is gone, so the component must read useInput");
	}
});

test("the queue strip is still fed by the slot that owns its composer", { skip }, () => {
	assert.match(source, /updateQueue/);
	assert.match(source, /props\.session/);
	assert.notEqual(slotEntry(conversationTypes(), "conversation.input.dock"), "");
});

test("InputState still projects the draft the controls gate on", { skip }, () => {
	const input = interfaceBody(conversationTypes(), "InputState");
	assert.notEqual(input, "", "InputState is no longer declared in the conversation contract");
	for (const field of ["draft", "phase"]) {
		assert.match(input, new RegExp(`\\b${field}\\b`), `InputState no longer exposes ${field}`);
		assert.match(source, new RegExp(`input\\?\\.${field}`), `the controls no longer read input.${field}`);
	}
	// Attachments moved from imageIds to attachmentIds (now files and images).
	const attachmentField = /\battachmentIds\b/.test(input) ? "attachmentIds" : /\bimageIds\b/.test(input) ? "imageIds" : undefined;
	assert.notEqual(attachmentField, undefined, "InputState exposes neither attachmentIds nor imageIds; the attachment guard cannot work");
	assert.match(source, new RegExp(attachmentField), `DSH exposes ${attachmentField} but the plugin never reads it`);
});

test("the composer card still carries the DOM markers the strip binds to", { skip }, () => {
	const bundle = clientBundle("dsh-client-ui-conversation");
	assert.match(bundle, /data-composer-card/, "the composer card no longer carries data-composer-card");
	assert.match(source, /data-composer-card/, "the plugin no longer scopes itself to data-composer-card");
	// The editor host was a <textarea> before 0.1.5 and is a contenteditable
	// [data-composer-input] since; the plugin must target whichever exists.
	const hasEditor = /data-composer-input/.test(bundle);
	const hasTextarea = /"textarea"/.test(bundle) || /'textarea'/.test(bundle);
	assert.ok(hasEditor || hasTextarea, "the composer bundle exposes neither data-composer-input nor a textarea");
	if (hasEditor) assert.match(source, /data-composer-input/, "DSH exposes data-composer-input but the plugin does not focus it");
	if (hasTextarea) assert.match(source, /textarea/, "DSH still renders a textarea but the plugin dropped that fallback");
});

test("the session face still exposes the verbs the three modes drive", { skip }, () => {
	const session = interfaceBody(sessionTypes(), "ISession");
	assert.notEqual(session, "", "ISession is no longer declared in the session controller contract");
	for (const verb of ["prompt(", "cancel(", "updateQueue("]) {
		assert.ok(session.includes(verb), `ISession no longer exposes ${verb}`);
		assert.ok(source.includes(verb), `the plugin no longer calls ${verb}`);
	}
	assert.match(session, /'queue' \| 'steer'/, "the prompt mode union changed; Queue and Backlog map to queue/steer");
});

test("queue rows still project the fields the strip renders", { skip }, () => {
	const row = interfaceBody(sessionTypes(), "QueuedMessage");
	assert.notEqual(row, "", "QueuedMessage is no longer declared in the session controller contract");
	for (const field of ["placement", "preview", "text"]) {
		assert.match(row, new RegExp(`\\b${field}\\b`), `QueuedMessage no longer projects ${field}`);
		assert.match(source, new RegExp(`\\b${field}\\b`), `the strip no longer reads ${field}`);
	}
	assert.match(row, /'queued' \| 'steering'/, "the queue placements changed; the strip filters queued/steering");
});
