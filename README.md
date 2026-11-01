# INTERLIS

Desktop VS Code extension `edigonzales.interlis-vscode` using the Java INTERLIS
language server. The initial development package supports the installed editor
path on macOS arm64. Java25 must be configured explicitly. The development package includes Java repository resolution/cache, readable
diagnostics, root compilation and an interactive UML custom editor. Independent
phase acceptance is tracked in STATUS. Bundled runtimes remain later work.

Install the local VSIX through **Extensions → Install from VSIX**. Set
`interlisGuru.server.javaPath` in user settings to the absolute Java25 executable
(e.g. `/path/to/jdk25/bin/java`). Open a trusted workspace and an `.ili`/`.ILI`
file. The status bar shows Starting/Ready/Stopped/Error. **INTERLIS: Show Language
Server Output**, **Stop Language Server**, **Restart Language Server** and
**New Model from Template** are available in the palette. Templates create an
unsaved document. Standard F12, formatting and diagnostics come from Java.

Diagnostics use the shared DE/EN formatter, including related locations.
`interlisGuru.diagnostics.language` selects auto/de/en (auto follows the UI with
English fallback). Other INTERLIS extensions can supply competing
providers; this extension reports a conflict and leaves their management to you.
Untrusted workspaces receive passive syntax resources; Java starts after trust.
Nothing is published automatically.

**Compile Current Model** compiles the current unsaved version through the Java
gate, asking for a model when a file declares several. **Compile Workspace** is
a separate explicit command. The Problems view retains the complete workspace
analysis independently of a root compilation.

`interlisGuru.repositories` is an ordered list (default models.interlis.ch). Local
workspace sources and dirty buffers take precedence. The host uses the same
repository traversal/version-chain rules as the Java compiler CLI. Its verified
cache is in extension global storage on the workspace host; `interlisGuru.offline`
uses those bytes without HTTP. Empty or corrupt required cache entries fail
explicitly. `modelPins`, `sourcePins` and `resolutionLock` constrain exact remote
identities. F12 opens external sources in readonly `interlis-source:` documents;
opening one grants no edit authority. Handles expire on restart/reconfiguration;
navigate again from the root to obtain a current source.

Open **INTERLIS: Show Diagram for This File** to view the selected saved source
beside the editor. Diagrams are pinned by default; **Following** explicitly follows
another active local INTERLIS document. Drag nodes/topic containers and selected
inner edge handles to arrange the view. These actions keep source and semantic
endpoints unchanged. Double click a node, member or association to navigate to its
current source, including readonly imports. **Refresh**, **Fit** and association
entity/compact binary modes are available. Partial/stale/error states are explicit;
new source/server generations reject old layouts and navigation anchors. Each
panel keeps its own arrangement. Full filtering, layout controls and exports remain
subsequent planned work.

## Development and verification

Node22.13.0/npm10.9.2 and Temurin25.0.3 were used. Dependencies are pinned in
`package-lock.json`; the server is pinned by full Core SHA and per-JAR hashes in
`release/editor-artifacts.lock.json`. There are no links to another source tree.

```sh
npm ci
npm run build
JAVA_HOME=/absolute/jdk25 npm run stage:core -- --core-dir /absolute/interlis-java
INTERLIS_JAVA=/absolute/jdk25/bin/java npm run test:protocol
npm run test:unit
npm run verify:no-legacy-dependencies
INTERLIS_JAVA=/absolute/jdk25/bin/java npm run package:vsix -- --target darwin-arm64
INTERLIS_JAVA=/absolute/jdk25/bin/java npm run test:gui -- --suite smoke
INTERLIS_JAVA=/absolute/jdk25/bin/java npm run test:gui -- --suite editor
```

`stage:core` calls the Core Gradle `editorBundle` task on the
explicit clean Core checkout, copies the complete runtime libraries and records
their identities, neutral renderer, worker, schemas and host DTOs. It rejects a changing Core HEAD. Use the exact locked Core
commit when reproducing a candidate. No separate compiler build is introduced.
VSIX output: `build/packages/interlis-vscode-darwin-arm64.vsix`.

The GUI runner downloads VSCode1.140.0 and matching ChromeDriver into an isolated
test directory, installs the VSIX and uses ExTester8.28.1/Selenium. Optional
`--cache /absolute/cache` reuses downloaded zip archives. Each run has fresh
user-data, extensions, workspace and evidence. `--vsix /absolute/file.vsix`
chooses an explicit archive. `--canary missing-status` deliberately expects an
impossible visible state and **must exit nonzero**. Unknown suites/arguments fail.
No `--passWithNoTests` or hidden product commands are used. Workbench keyboard and
mouse actions implement GUI-01–03 in smoke and GUI-01–11 in editor, GUI-01–18 in uml and focused GUI-12–18 in diagram; screenshots,
case results and a manifest live under `build/reports/gui/<suite>/<run>/`. The
editor suite serves a controlled local HTTP repository, pins its fixture bytes
and records request counts for offline assertions. A declared suite with missing
cases fails. This differs from API integration tests.

```sh
INTERLIS_JAVA=/absolute/jdk25/bin/java \
INTERLIS_TEST_CODE='/absolute/isolated/Visual Studio Code.app/Contents/MacOS/Code' \
npm run test:extension-host
```

This additional isolated Extension-Host run checks activation, the real definition
provider and the unsaved template through VSCode APIs. It is not GUI evidence.
On macOS use the Core `tools/verification/without-python.cjs` wrapper for the
review and qualification processes, setting the Extension CWD inside the guard.
See the [execution plan](docs/implementation/vscode-extension/EXECUTION_PLAN.md)
and [current status](docs/implementation/vscode-extension/STATUS.md).

Source resource origins and license hashes are in
[provenance](docs/provenance/source-adoptions.md). Bundled Node notices are
regenerated from esbuild's actual input graph. Java third-party notices remain
inside the unchanged distribution JARs, alongside the Core license.
