/**
 * Run the contract tests from test/contract.test.mjs against several DSH
 * versions, or against DSH installs you already have.
 *
 *   node tools/dsh-matrix.mjs 0.1.4 0.1.5-rc.1     # install each into a temp dir
 *   node tools/dsh-matrix.mjs --root /path/to/dsh  # check an existing install
 *
 * It lives outside test/ on purpose: `node --test` treats every file under a
 * test directory as a test case.
 *
 * A version run installs the published CLI into a throwaway directory, so it
 * needs the network and a pnpm store big enough to hold one DSH tree per
 * version. That is why this is an on-demand / nightly job rather than part of
 * `npm test`: it answers "which DSH versions does this plugin still match?".
 *
 * A failing version is not automatically a bug in this repo — it means that
 * version is outside the range README.md claims, and the claim (or the code)
 * has to change.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const [versions, roots] = parseArgs(process.argv.slice(2));

if (versions.length === 0 && roots.length === 0) {
	console.error("usage: node test/matrix.mjs <dsh-version>... | --root <dsh-root>...");
	process.exit(2);
}

const targets = roots.map((root) => ({ label: root, root }));
const tempDirs = [];
for (const version of versions) {
	const dir = mkdtempSync(join(tmpdir(), "qsb-matrix-"));
	tempDirs.push(dir);
	writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "qsb-matrix", private: true }));
	process.stdout.write(`installing @deepseek-ai/dsh@${version} … `);
	try {
		execFileSync("pnpm", ["add", "--silent", `@deepseek-ai/dsh@${version}`], { cwd: dir, stdio: ["ignore", "ignore", "pipe"] });
		console.log("ok");
	} catch (error) {
		console.log(`failed (${error.status ?? "?"}); skipping`);
		continue;
	}
	targets.push({ label: `dsh ${version}`, root: join(dir, "node_modules/@deepseek-ai/dsh") });
}

const results = [];
for (const target of targets) {
	const output = runContract(target.root);
	const failures = output.split("\n").filter((line) => line.startsWith("not ok")).map((line) => line.replace(/^not ok \d+ - /, ""));
	results.push({ ...target, ok: failures.length === 0, failures });
}

rmSyncTempDirs();

console.log("");
for (const result of results) {
	console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label}`);
	for (const failure of result.failures) console.log(`        ✕ ${failure}`);
}
const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed}/${results.length} target(s) match this plugin.`);
process.exit(failed === 0 ? 0 : 1);

function parseArgs(args) {
	const versions = [];
	const roots = [];
	for (let i = 0; i < args.length; i += 1) {
		if (args[i] === "--root") {
			i += 1;
			if (args[i] === undefined) throw new Error("--root needs a path");
			roots.push(args[i]);
		} else {
			versions.push(args[i]);
		}
	}
	return [versions, roots];
}

/** One contract run; the exit code is the verdict, stdout carries the failures. */
function runContract(root) {
	try {
		return execFileSync(process.execPath, ["--test", "test/contract.test.mjs"], {
			cwd: repoRoot,
			encoding: "utf8",
			env: { ...process.env, DSH_ROOT: root },
			stdio: ["ignore", "pipe", "pipe"]
		});
	} catch (error) {
		return `${error.stdout ?? ""}${error.stderr ?? ""}`;
	}
}

function rmSyncTempDirs() {
	for (const dir of tempDirs) {
		try {
			rmSync(dir, { recursive: true, force: true });
		} catch {
			// A leaked temp dir is not worth failing the matrix over.
		}
	}
}
