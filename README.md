# queue-steer-button

Queue & Steer composer buttons for DeepSeek Harness. While the agent is
**running** in a session, two buttons appear in the composer
(`conversation.input.right`), plus keyboard shortcuts — so you can redirect
the agent without the only previous option (stop, then send). Both behaviors
are available at the same time; no need to pick one in Settings.

| | Button | Shortcut (macOS / other) | Semantics |
|---|---|---|---|
| **Queue** | `Queue` | ⌘+Return / Ctrl+Enter | The new request lands in the agent's *next-step* inbox: the current step finishes and commits its observation, then the message is sent **together with that observation** in the next LLM request for the next assistant message. Nothing is interrupted. |
| **Steer** | `Steer` | ⌘+⇧+Return / Ctrl+Shift+Enter | The current step's LLM stream aborts; the partial output is preserved as an **interrupted assistant message**; the new user message is appended; the LLM continues with the next agentic step. |

Buttons are hidden while the agent is idle, in a blank/new chat, or in a
removed session. Plain Enter keeps the shipped "Enter behavior while busy"
setting untouched.

## How it works

The buttons drive the **existing** Host session API directly from the browser
— this package has no custom host RPC:

- Queue → `session.prompt([…], "steer")` — host mode `"steer"` is
  `agent.steer` (next-step delivery).
- Steer → `session.cancel()` then `session.prompt([…], "steer")` — `cancel`
  aborts the current step (`agent.cancel(…, { keepInbox: true })`), and the
  same delivery then continues with the new request.

(Note: the shipped Settings "queue" mode means *wait for the whole turn*
(`followup`), which is not what these buttons do.)

## Package layout

- `package.json` — declares `dsh.bundle.patch` (self-installing bundle) and
  `dsh.client` (browser half, `platform: "web"`); exports map with `types`.
- `cordis.patch.yml` — the bundle patch that inserts the plugin row.
- `lib/index.js` — host half. Pure UI plugin; the empty `apply` exists so the
  row mounts in the host Loader.
- `lib/client.js` — browser half (`window.__ModuleLoader__.load` bundle).
  Registers the buttons in `conversation.input.right`, wires the platform-aware
  shortcuts, and calls the session face from the `sessions` client service.
- `lib/types/*.d.ts` — hand-written declarations.
- `LICENSE` — MIT.

## Install

This package is a **bundle**: the repo root is the package, it ships its own
`cordis.patch.yml`, and declares `dsh.bundle.patch` — so a single command
installs the code **and** mounts the plugin row, with no manual composition
edit.

**From the git URL** (canonical):

```sh
dsh plugin --profile web add git+https://github.com/lyuwen/dsh-steer-button
```

**Or from a local checkout** (same behavior):

```sh
dsh plugin --profile web add /home/lfu/git-projects/dsh-steer
```

(Without the CLI: `cd ~/.dsh/profiles/web && pnpm add <this-repo>` /
`npm install <this-repo>` — the package manager adds the dependency, then the
same `dsh plugin` reconcile logic promotes the `dsh.bundle`-declaring package
into the profile's bundle layer stack.)

Then restart the profile: `dsh.client` package metadata is cached per name, so
plugin-set changes take effect only on restart.

> "install plugin https://github.com/lyuwen/dsh-steer-button" — telling a DSH
> agent this installs the plugin exactly as the command above does.

### Current deployment state

Already installed into the local `web` profile (dependency + bundle layer in
`~/.dsh/profiles/web/package.json`, package at
`~/.dsh/profiles/node_modules/queue-steer-button/`). A profile restart is the
remaining step to activate it. After editing `lib/*` or `package.json`, re-sync
the installed copy:

```sh
cp -r . ~/.dsh/profiles/node_modules/queue-steer-button/
```

## Verify

While the agent is running, the Queue / Steer buttons appear in the composer.
Start a slow task and press ⌘+Return (queue) — the message joins the next step
after the observation without stopping the task. Start another and press
⌘+⇧+Return (steer) — the current step stops, its partial output stays visible,
and the agent answers the new message.
