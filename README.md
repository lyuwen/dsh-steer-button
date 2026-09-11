# queue-steer-button

Queue / Steer / Backlog composer controls for DeepSeek Harness. While the
agent is **running** in a session, the plugin overrides the composer's input
behaviors with three delivery modes and shows every pending message in a queue
strip above the text box.

| | Trigger | Host RPC | Delivery |
|---|---|---|---|
| **Queue** | `Enter` | `session.prompt([…], "steer")` | **Next agent step**: the current step finishes and commits its observation, then the message is sent **together with that observation** in the next LLM request. Nothing is interrupted. |
| **Steer** | `⌘+Return` / `Ctrl+Enter` | `session.cancel()` then `session.prompt([…], "steer")` | The current step's LLM stream aborts; the partial output is preserved as an **interrupted assistant message**; the new request continues with your message. |
| **Backlog** | `⌘+⇧+Return` / `Ctrl+Shift+Enter` | `session.prompt([…], "queue")` | DSH's **native queue**: waits for the whole turn to finish, then runs as its own turn. |
| **Stop** | `Esc` | `session.cancel()` (plus a promotion per backlog row) | Stops the running agent — and if backlog rows are pending, promotes them to next-step delivery first, so they enter the context immediately and the turn continues with them. |

The controls replace the shipped behavior while the agent is busy:

- plain **Enter** is the plugin's Queue (next-step delivery) instead of the
  native busy-enter queue (whole-turn backlog) — the delivered text stays
  editable in the queue strip until the next step boundary;
- **Shift+Enter keeps its native newline role** in the text box;
- **⌘/Ctrl+⇧+Enter** sends to the backlog; **⌘/Ctrl+Enter** is the plugin's
  Steer instead of the native accelerated send. With an empty draft
  ⌘/Ctrl+Enter falls through to the native gesture that steers all pending
  backlog rows into the running turn.

Buttons are hidden while the agent is idle, in a blank/new chat, or in a
removed session; slash-command drafts (`/…`) and an open trigger menu keep
native adjudication.

### Escape

`Esc` is the composer's Stop button, with the queue folded in. It acts on the
**Session the workspace is showing** — a background Session's running turn is
never touched — and only while that Session is running. The composer draft is
never submitted by `Esc`.

| Pending queue | What `Esc` does |
|---|---|
| no `turn end` rows | `session.cancel()` — the same call the Stop button makes |
| one or more `turn end` rows | each row is promoted to next-step delivery (`updateQueue(id, {kind: "steer"})`, the native queue dock's Steer), **then** the current step is cancelled, so the messages enter the context immediately and the turn continues with them |

Rows already marked **next step** need no promotion; `Esc` simply stops, which
delivers them at the next boundary. Promotion happens before the cancel on
purpose: steering is only accepted while the agent is steerable, and the cancel
closes that window.

`Esc` is deliberately polite about it: an open trigger menu, popup, inline
editor, or dialog owns the key first, and a form field outside the composer
keeps it for itself. That is why the handler runs in the bubble phase and
checks `defaultPrevented` rather than intercepting like the Enter chords.

## The queue strip

Every still-pending message renders in a strip above the composer card:

- **next step** rows are Queue-mode messages waiting for the current step's
  finish — they enter the context with that step's observation;
- **turn end** rows are Backlog messages waiting for the whole turn — their
  **Send** button delivers them with the next agent step instead.

Each row offers icon buttons (with tooltips):

- **Edit** (pencil) — moves the text back into the text box (removing it from
  the queue) for free-form editing; press `Enter` to re-queue the edited text.
- **Remove** (trash) — drops the message without sending it.
- **Send** (arrow, backlog rows only) — deliver now with the next agent step.

With the cursor in the text box, pressing **↑** (Up) pulls the most recently
queued message back into the composer for editing. Editing always happens in
the text box — never in the narrow dock row.

## How it works

The plugin drives the **existing** Host session API directly from the browser
— the host half stays a pure UI mount with no custom RPC:

- Queue → `session.prompt([…], "steer")` — host mode `"steer"` is
  `agent.steer` (next-step delivery).
- Steer → `session.cancel()` then `session.prompt([…], "steer")` — `cancel`
  aborts the current step (`agent.cancel(…, { keepInbox: true })`), and the
  same delivery then continues with the new request.
- Backlog → `session.prompt([…], "queue")` — host mode `"queue"` is
  `agent.followup` (next-turn inbox): exactly DSH's native queue mode.

The queue strip replaces the shipped queue dock and pending-steering tail
bubbles (hidden via CSS) with one surface that shows both placements, and the
queue-mutation verbs (`updateQueue` edit/remove/steer) stay native.

(Note: the shipped Settings "queue" busy-enter preference now corresponds to
the plugin's **Backlog**, not its Queue. The plugin's Queue is exactly the
shipped "steer" preference — the same non-interrupting `agent.steer`
next-step delivery — so users of either preference keep consistent behavior;
only the dock display and the new editing model are added.)

## Package layout

- `package.json` — declares `dsh.bundle.patch` (self-installing bundle) and
  `dsh.client` (browser half, `platform: "web"`); exports map with `types`.
- `cordis.patch.yml` — the bundle patch that inserts the plugin row.
- `lib/index.js` — host half. Pure UI plugin; the empty `apply` exists so the
  row mounts in the host Loader.
- `lib/client.js` — browser half (`window.__ModuleLoader__.load` bundle).
  Registers the three composer actions in `conversation.input.right` and the
  queue strip in `conversation.input.dock`, wires the running-session chords
  and the ↑ withdraw gesture, and calls the session face from the `sessions`
  client service.
- `lib/types/*.d.ts` — hand-written declarations.
- `test/contract.test.mjs` — contract tests against the installed DSH
  (`npm test`); `tools/dsh-matrix.mjs` runs the same checks across versions.
- `LICENSE` — MIT.

## Compatibility

**Verified against DSH `0.1.5-rc.1` (current `latest`) and `0.1.5-rc.2`
(`next`)** — the full contract suite passes against both. The browser half is
composed at DSH **boot** from the profile's installed copy, so after installing
or updating this package the profile must be restarted — a page reload is not
enough.

The `0.1.1-rc.1` line is out of range: it predates
`@deepseek-ai/dsh-api-session-controller`, the package that now declares the
session face and queue-row contracts this plugin is written against, so the
matrix cannot evaluate it. The `0.1.1-rc.1` peer entries this repo used to
declare are gone for the same reason.

The plugin consumes only public client contracts, and every one of them is
asserted against the installed DSH so a future update fails the tests loudly
instead of silently dropping the controls (which is exactly what DSH `0.1.5`
did):

| Contract | Why it matters |
|---|---|
| `conversation.input.right`, `conversation.input.dock` | where the controls and the queue strip render |
| `useSession` / `useInput` standard slot props | Session lifecycle and draft state; `0.1.5` dropped the `InputZone` owner from the actions slot |
| `InputState.draft` / `.phase` / `.attachmentIds` | what gates the three actions; `imageIds` was renamed in `0.1.5` and is still read as a fallback |
| `[data-composer-card]`, `[data-composer-input]` | the composer card and its editor host; the editor was a `textarea` before `0.1.5` |
| `SessionFace.prompt` / `.cancel` / `.updateQueue` | the three delivery modes, the `Esc` stop, and the strip row actions |
| `QueueAction` kinds `steer` / `remove` | `Esc` promoting backlog rows, and the strip row actions |
| `SessionListState.current` | `Esc` acting only on the Session the workspace shows |
| `QueuedMessage.placement` / `.preview` / `.text` | the strip rows (`queued` = turn end, `steering` = next step) |

DSH client packages are supplied by the host at runtime, so none of them is
declared as a peer dependency: the profile never installs them, and npm's
prerelease rules cannot express a `0.1.x` prerelease range anyway.

### Tests

```sh
npm test                                         # contract tests against the installed DSH
DSH_ROOT=/path/to/@deepseek-ai/dsh npm test      # …against an explicit DSH
node tools/dsh-matrix.mjs 0.1.5-rc.2 0.1.1-rc.1  # the same checks across versions
```

`test/contract.test.mjs` reads the DSH's own type declarations and composed
client bundle — no browser, no network. `tools/dsh-matrix.mjs` installs each
published version into a throwaway directory first, so it needs the network and
belongs to an on-demand or nightly run; a version that fails there is outside
the range claimed above, so either the claim or the code has to change.

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

Installed into the local `web` profile from the git URL — dependency and
bundle layer in `~/.dsh/profiles/web/package.json`, package at
`~/.dsh/profiles/web/node_modules/queue-steer-button/`. To move the profile to
a new revision, re-run the install command (it re-resolves the dependency and
re-pins `pnpm-lock.yaml`), then restart the profile:

```sh
dsh plugin --profile web add git+https://github.com/lyuwen/dsh-steer-button
```

Editing `lib/*` in this checkout does **not** affect the running profile until
that install re-syncs the copy under `~/.dsh/profiles/web/node_modules/`.

## Verify

Start a slow task. While it runs:

- Type a message and press **Enter** — it appears in the queue strip as a
  **next step** row; when the current step finishes it joins the next request
  with that step's observation.
- Press **↑** with the cursor in the text box — the queued text returns to
  the box; edit it and press **Enter** again to re-queue.
- Press **⌘+Return / Ctrl+Enter** — the current step stops, its partial
  output stays visible, and the agent answers your message.
- Press **⌘+⇧+Return / Ctrl+Shift+Enter** — the message waits as a **turn end**
  row; its **Send** button delivers it with the next agent step.
- Press **Esc** — the agent stops. Queue one or more messages first and `Esc`
  promotes them to **next step** rows and stops in the same gesture, so the
  turn continues with them; press it while another session is on screen and
  nothing happens to this one.
