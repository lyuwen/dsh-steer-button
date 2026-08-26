# AGENTS.md

## Commit conventions

These rules are global: they apply to **every** commit made in this
repository, by agents and humans alike.

- **Respect the system/project-level git author settings.** Never override
  `user.name` or `user.email`; let git resolve the author from the existing
  system- and project-level configuration.
- **Append a `Co-Authored-By` trailer** on a new line at the very end of
  every commit message to show co-authorship with DeepSeek Harness:

  ```text
  Co-Authored-By: DeepSeek Harness <dev@dsh.local>
  ```

  It must be the last line of the message, preceded by a newline, and appear
  exactly once (do not duplicate it when amending or rebasing).

## Project layout

- `packages/queue-steer-button/` — the DSH plugin package, shaped after the
  shipped `@deepseek-ai/dsh-*` packages:
  - `package.json` — declares `dsh.bundle.patch` (self-installing bundle:
    `dsh plugin --profile <name> add <path>` installs the code **and** mounts
    the plugin row) and `dsh.client` (browser half, `platform: "web"`).
  - `cordis.patch.yml` — the bundle patch that inserts the plugin row.
  - `lib/index.js` — host half (empty `apply`; pure UI plugin so the row
    mounts in the host Loader).
  - `lib/client.js` — browser half (`window.__ModuleLoader__.load` bundle;
    this is the source, not a build artifact — the bundle is hand-written).
  - `lib/types/*.d.ts` — hand-written declarations referenced by the exports
    map.
  - `LICENSE` — MIT.

## Iterating on the plugin

- Edit `packages/queue-steer-button/lib/*` and `package.json`, then re-sync
  the installed copy under `~/.dsh/profiles/node_modules/queue-steer-button/`
  (a profile restart is required for changes to apply — `dsh.client` package
  metadata is cached per name and plugin-set changes take effect on restart).
- **Do not regress the semantics**:
  - Queue → `session.prompt([…], "steer")` — next-step delivery after the
    observation, sent together for the next assistant message; nothing is
    interrupted.
  - Steer → `session.cancel()` then `session.prompt([…], "steer")` — the
    current step's LLM stream aborts, the partial output is preserved as an
    interrupted assistant message, then the new request continues.
- **Do not regress the UI contract**: buttons render only while the agent is
  running in the session (hidden in blank/new chats and removed sessions);
  shortcuts are platform-aware — ⌘+Return / ⌘+⇧+Return on macOS,
  Ctrl+Enter / Ctrl+Shift+Enter elsewhere. Plain Enter keeps the shipped
  busy-enter setting untouched.
