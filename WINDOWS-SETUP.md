# Windows Setup — cloudcli handoff

Handoff doc for bringing this project up on a Windows machine. Written to be handed directly to Claude Code on the Windows side — it should read this top-to-bottom before running anything.

## Context (read first)

- `cloudcli` is a fork of `siteboon/claudecodeui` (a web UI for Claude Code / Codex / Cursor / Gemini CLIs), with local CCS (Claude Code Sessions) customizations layered on top. The fork lives at `git@github.com:J-Will01/cloudcli.git` (`origin`). Upstream is `git@github.com:siteboon/claudecodeui.git` (`upstream`).
- Local customizations that must not be lost are all commits tagged `feat(ccs)` / `fix(ccs)` — multi-profile CCS account awareness, profile color badges, session routing fixes, account picker for new conversations, session header badge, etc. As of handoff these are pushed to `origin/main` (15 commits ahead of the v1.29.2 upstream release point).
- Node **v22+** required (see `.nvmrc`).
- Stack: Vite + React 18 + TypeScript on the client (`src/`), Express + WebSocket on the server (`server/`), SQLite via `better-sqlite3` for auth. Native deps: `better-sqlite3`, `node-pty`, `bcrypt`, `sharp` — all require a compile toolchain on Windows.
- Alongside cloudcli, we want `hilash/cabinet` cloned as a **design reference** (not merged). Cabinet has a cleaner/minimal UI we're mining for visual patterns.

## Prerequisites (install in this order)

1. **Git for Windows** — https://git-scm.com/download/win. Includes `bash` which husky hooks rely on.
2. **Node.js 22 LTS** — https://nodejs.org/. During install, **check the box** for "Automatically install the necessary tools for native modules" (this installs Python 3 + VS Build Tools via chocolatey, which you need for `better-sqlite3` / `node-pty` / `bcrypt` / `sharp`).
   - If you skipped that box: `npm install --global --production windows-build-tools` is deprecated. Instead, install Python 3 from the Microsoft Store AND install "Desktop development with C++" workload via the Visual Studio Installer (Build Tools 2022 is enough).
3. **Claude Code CLI** on Windows — follow https://docs.anthropic.com/en/docs/claude-code for the current install method. Verify with `claude --version`.
4. (Optional) **GitHub CLI** — https://cli.github.com/ — convenient for auth and PRs.

Verify before continuing:

```powershell
node --version   # should print v22.x
npm --version
git --version
python --version # 3.x
claude --version
```

## Clone the repos

Pick a parent directory (example uses `C:\src`):

```powershell
mkdir C:\src
cd C:\src

# your fork of cloudcli (has all CCS customizations on main)
git clone git@github.com:J-Will01/cloudcli.git
cd cloudcli
git remote add upstream git@github.com:siteboon/claudecodeui.git
git submodule update --init --recursive   # pulls plugins/starter
cd ..

# Cabinet — UI reference only, not merged
git clone https://github.com/hilash/cabinet.git
```

If SSH isn't set up yet on Windows, use HTTPS URLs (`https://github.com/J-Will01/cloudcli.git`) and authenticate via `gh auth login` or a PAT.

## Install & first run

```powershell
cd C:\src\cloudcli
copy .env.example .env          # edit if you need non-default ports
npm install                     # expect 2–5 min; native modules compile
npm run dev                     # starts server + vite in parallel
```

Open http://localhost:5173 — server API is on 3001. If `npm install` fails on a native module, the error is almost always missing Build Tools or Python. Fix that and re-run, don't `--ignore-scripts`.

The `postinstall` script (`scripts/fix-node-pty.js`) is a macOS-only spawn-helper chmod fix — it early-returns on Windows, so it's harmless.

## CCS (Claude Code Sessions) notes

- CCS profile data lives at `~/.ccs/` on macOS. On Windows the equivalent is `%USERPROFILE%\.ccs\`. cloudcli auto-discovers profiles from that directory via `server/projects.js` — if you don't have any CCS profiles set up on Windows yet, the app still runs; you just won't see profile badges/account pickers until profiles exist.
- Claude Code's project data is at `~/.claude/projects/` (macOS) → `%USERPROFILE%\.claude\projects\` (Windows). cloudcli reads session history from there.
- If cloudcli fails to read these dirs on first launch, it'll create them empty — Claude Code itself populates them when you run `claude` in a project.

## Known Windows-specific friction

- **Husky hooks** (`.husky/pre-commit`, `.husky/commit-msg`) run via the bash that ships with Git for Windows. They should Just Work, but if a hook throws `bash: not found`, make sure Git for Windows's `bin` dir is on PATH.
- **`node-pty`** sometimes needs a rebuild against the exact Node version: `npm rebuild node-pty` if the terminal tab errors on launch.
- **Line endings** — the repo has `.prettier`/eslint configs but no `.gitattributes` enforcing LF. Set `git config --global core.autocrlf input` before cloning to avoid phantom diffs.
- **Paths with spaces** — avoid cloning under `C:\Users\<name>\OneDrive\...` or any synced folder. OneDrive's file locking breaks `node_modules` writes.

## What "switching over" means

Once the Windows box is running:

1. Do all new CCS work there. Push to `origin/main` (this same fork).
2. The macOS checkout can be left as-is or `git pull`-ed for parity — it's no longer authoritative.
3. Cabinet stays as a read-only reference clone. When porting UI ideas, extract Tailwind tokens / layout patterns into cloudcli's `tailwind.config.js` and `src/components/` — do **not** try to merge Cabinet's Next.js code into this Vite SPA, the stacks are incompatible.

## First-session prompt for Claude Code on Windows

Paste this as your first message on the Windows machine:

> I've just cloned `J-Will01/cloudcli` to `C:\src\cloudcli` (fork of `siteboon/claudecodeui` with CCS customizations on `main`). Read `WINDOWS-SETUP.md` in the repo root for full context. Verify prereqs are installed, run `npm install` and `npm run dev`, confirm the UI loads at http://localhost:5173, and flag anything that didn't match the doc so I can update it. Do not merge Cabinet code — it's a design reference only.

## Quick reference

| | Path |
|---|---|
| Repo | `C:\src\cloudcli` |
| Cabinet (reference) | `C:\src\cabinet` |
| CCS profiles | `%USERPROFILE%\.ccs\` |
| Claude Code data | `%USERPROFILE%\.claude\` |
| Env | `.env` (copied from `.env.example`) |
| Dev | `npm run dev` |
| Build + serve | `npm start` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
