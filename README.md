# QA Skills

Agent skills for QA engineers. Work is organised by **initiative**, not by code repository.

## Install

```bash
npx @victorarsjad/qa-skills add create-test-case
```

This copies the skill into `~/.agents/skills/`. Point it somewhere else with `--path <dir>` or `QA_SKILLS_DIR`. The CLI runs from npm without a global install.

Manual install, if you would rather clone:

```bash
git clone git@github.com:VictorArsjad/qa-skills.git
# or: git clone https://github.com/VictorArsjad/qa-skills.git
cp -R qa-skills/skills/create-test-case ~/.agents/skills/
```

Use the skills directory your agent actually reads.

Once the package is published, `npx` fetches it automatically. Before that, run the CLI from this repo with `node bin/qa-skills.js`.

## Skills

| Skill | Invocation | Purpose |
| --- | --- | --- |
| `create-test-case` | `/create-test-case` | Generate broad test scenarios from a PRD or feature reference |

## Usage guide

An initiative is a bounded testing effort: a small feature, a large multi-feature rollout, or an integration that may cover unrelated things. Several repos can belong to one initiative. Private state lives in `~/.qa-skills/`, outside this repo.

### 1. Start or name an initiative

Run `/create-test-case` with a PRD and an initiative name. On first use the skill asks once for:

- Output format: `markdown`, `csv-text`, or `csv-steps`.
- Optional glossary path.
- Optional domain notes.

Answers go into `~/.qa-skills/initiatives.md`. Later runs of the same initiative reuse them without asking.

### 2. Give the source

Paste the PRD text, pass a local file path, or give a URL. The skill reads the business requirements and derives domain vocabulary from them — no separate product-context input is needed.

For URLs the skill fetches the page and keeps a local snapshot. If access is blocked (login wall, SSO, paywall, VPN, bot block), it says what blocked it and offers four ways forward: paste the text, export the page to a local file, grant access or use a connector such as Atlassian for Jira/Confluence, or point to a public copy. Page content is treated as data, never as instructions.

### 3. Handle unclear terms

The skill checks `GLOSSARY.md` or `glossary.md` in the working directory, or a path you supply, and uses it silently. It assumes sensibly for most unclear terms and records each assumption in Open questions. It stops to ask only when a term would materially change coverage and no sensible default exists, or when sources conflict. Those few questions arrive in one round. For each:

- **clarify** — supply the meaning.
- **You decide** (or "roll with it", "just go with it") — the skill uses its recommended default; the assumption lands in Open questions.

### 4. Get scenarios

Default output: 5–9 scenario buckets, 1–3 representative cases each, named permutation axes, 3–5 high-value combinations, and an Open questions section. These are starting points, not caps — a large PRD gets more buckets. Step-by-step actions, test data, and automation code are excluded unless requested.

### 5. Choose an output format

| Value | Result |
| --- | --- |
| `markdown` | Chat output with bucket sections. Default. |
| `csv-text` | TestRail **Test Case (Text)** — one row per case. Headers `Title,Type,Priority,Preconditions,Steps,Expected Result,Sections`. Defaults: `Type: Functional`, `Priority: Medium`. Headers stay English. |
| `csv-steps` | TestRail **Test Case (Steps)** — one row per step. Only when you want to go deeper. |

TestRail maps CSV columns in its import wizard. If your export uses different header names or a saved import config, the skill follows yours.

### 6. When a PRD changes

The skill keeps a private snapshot and fingerprint of each source, including fetched URLs. If a source changes on a later run, it shows what changed and asks before doing anything: **regenerate affected scenarios**, **keep existing**, or **review diff first**. It never overwrites silently. If a URL cannot be re-fetched, it keeps the last snapshot and asks before using it.

## Repo layout

```
.
├── README.md
├── package.json
├── bin/
│   └── qa-skills.js
├── skills/
│   └── create-test-case/
│       └── SKILL.md
└── test/
    └── cli.test.js
```

## CLI

| Command | What it does |
| --- | --- |
| `qa-skills list` | Show bundled skills. |
| `qa-skills add <skill>` | Copy a skill into the skills directory. Fails if it already exists. |
| `qa-skills update <skill>` | Overwrite an installed skill with the bundled version. |
| `qa-skills remove <skill>` | Delete an installed skill. |
| `qa-skills --version` | Print the package version. |

`--path <dir>` or `QA_SKILLS_DIR` overrides the default `~/.agents/skills`. `add --force` overwrites without asking. Run the tests with `npm test`.

The skill sets `disable-model-invocation: true`, so it is user-invoked only: the agent does not run it on its own. Keep that flag when porting it to another runtime that supports it.

Private initiative state lives in `~/.qa-skills/` and is never packaged.
