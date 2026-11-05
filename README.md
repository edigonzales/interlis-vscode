# INTERLIS Editor

Desktop VS Code extension `edigonzales.interlis-editor` using the Java INTERLIS
language server. Target-specific VSIX packages contain a pinned, verified Java25
runtime, repository resolution/cache, readable diagnostics, root compilation and
an interactive UML custom editor. V0–V5 have independent cumulative acceptance under the
user-adjusted platform scope. Current platform evidence and the exact accepted product pair are
tracked in [STATUS](docs/implementation/vscode-extension/STATUS.md).

The extension uses the existing Open VSX identity `edigonzales.interlis-editor`
(display name **INTERLIS Editor**, publisher **edigonzales**). Local builds use
`0.1.0`; GitHub Actions packages use `0.1.<GITHUB_RUN_NUMBER>`, for example
`0.1.42`. Reruns keep the same version. Stamping changes only the prepared VSIX
manifest; source manifests and locks remain unchanged. No registry publication is
automatic. Historical V0–V5 reviews refer to the identities and bytes tested then.

Install the local VSIX through **Extensions → Install from VSIX**. Set
`interlisGuru.server.javaPath` empty to use bundled Java25. An optional absolute
Java25 path is a user-level development override. Open a trusted workspace and an `.ili`/`.ILI`
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
panel keeps its own arrangement. Filters, pins, Settle/Reset, view Undo/Redo,
routing choices and full/visible SVG/PNG export are available.
**Cancel** stops a pending analysis/layout update and leaves the view stale;
**Refresh** resumes it. A crashed/stopped server also leaves visible diagrams stale.
Executable and server-bundle overrides are read only from user settings, never
from a model repository's workspace configuration. Multiple local workspace
folders share one model space; duplicate model identities are not silently chosen.

## Development and verification

Node22.13.0/npm10.9.2 and Temurin25.0.3 were used. Dependencies are pinned in
`package-lock.json`; the server is pinned by full Core SHA and per-JAR hashes in
`release/editor-artifacts.lock.json`. There are no links to another source tree.

```sh
npm ci
JAVA_HOME=/absolute/jdk25 npm run stage:core -- --core-dir /absolute/interlis-java
npm run stage:runtime -- --target all
npm run build
npm run test:protocol
npm run test:unit
npm run verify:no-legacy-dependencies
npm run package:vsix -- --target darwin-arm64
npm run test:gui -- --suite smoke
npm run test:gui -- --suite editor
```

`stage:core` calls `java build/InterlisJvmBuild.java editor-bundle` on the
explicit clean Core checkout, copies the complete runtime libraries and records
their identities, neutral renderer, worker, schemas and host DTOs. Select the Core Node pin with an absolute `INTERLIS_NODE` (currently 24.22.0); the Extension Node engine remains >=22. It rejects a changing Core HEAD. Use the exact locked Core
commit when reproducing a candidate. No separate compiler build is introduced.
A prebuilt bundle can be imported without a Core checkout or process start:

```sh
node scripts/stage-core.cjs --bundle-dir /absolute/bundle --core-commit PRODUCER_SHA --manifest-sha256 PRODUCER_MANIFEST_SHA256
```

Both identities must come from the selected producer result. Dirty Core bundles are accepted only by the separate development preparation path.

VSIX output: `build/packages/interlis-editor-darwin-arm64.vsix`.
Use `linux-x64` or `win32-x64` for the other target packages. Each archive contains
only its own runtime. Source URLs, vendor archive SHA256s and extracted file hashes
are locked under `release/`; unexpected, missing or changed files prevent startup.
Cross-packaging is not a native platform test. Linux/Windows qualification uses
short native GitHub Actions smokes; their GUI and Remote GUI remain untested under
the [user-adjusted scope](docs/implementation/vscode-extension/PLATFORM_TEST_SCOPE.md).

GitHub Actions builds the locked server/renderer once, then builds and tests both
a full Temurin JRE and a custom `jlink` runtime on each native target runner.
The final VSIX uses `jlink` only when its compressed download is at least 10%
smaller. A failed candidate test fails the workflow; only insufficient size savings
select the full JRE. The job summary and `*.selection.json` record the comparison.
All three native jobs, including the full macOS qualification of the selected
VSIX, must pass before `platform-packages` is uploaded. Comparison artifacts are
kept for three days; no Marketplace publication is performed.

Runtime JRE/JDK sources are pinned in `release/runtime-sources.lock.json`;
`release/runtime-link.json` documents link options and dynamic module dependencies.
Generated inventories, provenance and notices live under `build/runtimes/` in CI,
leaving committed locks unchanged. To build a native candidate locally:

```sh
node scripts/stage-runtime.cjs --target darwin-arm64 --variant jlink --output "$PWD/build/local-runtime"
node scripts/package.cjs --target darwin-arm64 --runtime-root "$PWD/build/local-runtime" --output "$PWD/build/local-packages"
```

`--input /absolute/common-root` selects a staged Core bundle for either command.
Java stays inside the VSIX, with no first-run download or system-Java fallback.
HTTPS checks use an isolated test truststore and an EC certificate fixture; the
packaged vendor truststore is never modified.

For local development, open this repository in Codium or VS Code and press **F5**
(configuration **INTERLIS Editor: Build LSP + Extension**). It installs missing
npm dependencies, builds the sibling `../interlis-java` LSP and shared diagram UI,
builds the extension and opens a new Development Host using the **same editor**.
On the first opening, trust the sample workspace if asked and open `Example.ili`.

Development output lives under `build/`; the existing editor application and
profile are reused. Personal settings and installed extensions are not modified. No VSIX installation or runtime download is required.
Local Core edits are supported, and tracked release locks stay unchanged.
Stop the debug session and press F5 again after changes to rebuild and restart.
For preparation without launching an editor, use `npm run dev:prepare`.
Set `INTERLIS_CORE_DIR` for a different Core checkout and
`INTERLIS_DEV_JAVA_HOME` for an explicit JDK25. Otherwise it discovers Java25
from JAVA_HOME, macOS registrations, SDKMAN or PATH. Node22+ and a JDK25 must
already be installed.

The GUI runner downloads VSCode1.140.0 and matching ChromeDriver into an isolated
test directory, installs the VSIX and uses ExTester8.28.1/Selenium. Optional
`--cache /absolute/cache` reuses an already unpacked, pinned macOS VS Code and
ChromeDriver through directory links; it does not copy the applications per run.
Each run has fresh user-data, shared-data, extensions, workspace and evidence.
Temporary installations are removed after process exit; logs, screenshots and
qualified VSIX artifacts remain. `--vsix /absolute/file.vsix`
chooses an explicit archive. `--canary missing-status` deliberately expects an
impossible visible state; `--canary missing-server` removes the LSP JAR in a
separate installed test copy, restoring its original bytes afterwards. Both
**must exit nonzero**. Unknown suites/arguments fail.
No `--passWithNoTests` or hidden product commands are used. Workbench keyboard and
mouse actions implement GUI-01–03 in smoke and GUI-01–11 in editor, GUI-01–18 in uml and focused GUI-12–18 in diagram; screenshots,
case results and a manifest live under `build/reports/gui/<suite>/<run>/`. The
editor suite serves a controlled local HTTP repository, pins its fixture bytes
and records request counts for offline assertions. A declared suite with missing
cases fails. This differs from API integration tests.

```sh
INTERLIS_TEST_CODE='/absolute/isolated/Visual Studio Code.app/Contents/MacOS/Code' \
npm run test:extension-host
```

This additional isolated Extension-Host run checks activation, the real definition
provider and dirty-buffer restart through VSCode APIs. It is not GUI evidence.
On macOS use the Core `tools/verification/without-python.cjs` wrapper for the
review and qualification processes, setting the Extension CWD inside the guard.
See the [execution plan](docs/implementation/vscode-extension/EXECUTION_PLAN.md)
and [current status](docs/implementation/vscode-extension/STATUS.md).

Source resource origins and license hashes are in
[provenance](docs/provenance/source-adoptions.md). Bundled Node notices are
regenerated from esbuild's actual input graph. Java third-party notices remain
inside the unchanged distribution JARs, alongside the Core license.

V3 local diagram controls include visibility filters, pins, Settle/Reset, view
Undo/Redo, routing and layout choices, and full/visible SVG/PNG export of the
current arranged view. Initial settings use `interlisGuru.diagram.*`; automatic
opening and follow-active-editor default to false. `INTERLIS: Reveal Source
Selection in Diagram` uses the Java symbol query. Save uses the native dialog;
Cancel creates no file. View storage keeps bounded hashed presentation identities,
geometry and filters, independently for each workspace/root/panel. It stores no
source text. The `comfort` GUI suite runs cumulative GUI01–28; its qualification
has passed its independent V3 review. See STATUS and the archived review for
the exact accepted product pair and evidence.

## Editor assistance and catalogues

Java supplies contextual completion and block templates. MODEL names are mirrored
after END; Tab/Enter advance native placeholders, and Enter in the final body
inserts a normal newline. Manual cursor navigation leaves the active snippet.
Enter after a complete block header asks Java for an exact edit and body caret;
comments, value assignments and existing END are excluded. Standard on-type
formatting and this negotiated assistance path are mutually exclusive. Safe
Quick Fixes cover END names, missing semicolons and proven unused imports; incomplete
binding suppresses the import fix. Use normal native Undo for source edits.

**INTERLIS: Preview Documentation**, **Export Documentation**, **Documentation
Options** and **Export Graph** operate on the current checked Java root schema.
Catalogues support Markdown, inert local HTML and real DOCX tables; graph formats
are Mermaid, PlantUML and GraphML. Save uses the native dialog; Cancel writes
nothing. Invalid models are rejected instead of producing a complete-looking
catalogue. Recursive structures use bounded references. DE/FR/IT/EN translate
labels only. `interlisGuru.documentation.*` selects language, inherited-member
presentation and header overrides. Graph text formats do not preserve manual
Sprotty geometry; export the current diagram as SVG/PNG for that view.

**New Model from Template** always offers the built-in offline template. Optional
`interlisGuru.templates.file` and `templates.url` are explicit choices in a trusted
workspace. Network templates use HTTPS, with HTTP limited to loopback test servers;
size and timeout are bounded. Templates become unsaved text and are never executed.

The `authoring` GUI suite exercises GUI29–35 in an isolated fixture workspace;
`authoring-probe` retains the focused native Enter/caret regression with installed
editor smoke. V4 has independent acceptance. The `resilience` suite covers native
Trust, crash/start/protocol errors, local Multi-root, Cancel and twenty panel cycles.
The offline `distribution` suite is launched through
`node scripts/gui-offline-run.cjs /absolute/pre-acquired/gui-cache`; its single
macOS sandbox denies interpreter execution, external IP traffic and source reads,
while its Code launcher has an empty PATH. Acquire VS Code/ChromeDriver in a normal
GUI run first. See [architecture and test contracts](docs/development.md).

The Jenesis migration B uses the single Core Java 25 entry point for server and renderer staging. The committed artifact lock uses schema 2 with the fixed `guru.interlis.lsp/guru.interlis.lsp.Main` module launch; Core bundles use schema 3. `resolveLaunchPlan` returns a frozen, verified module plan. The LSP protocol and renderer schemas keep their existing versions. Unknown modules, extra launch flags, automatic own modules, changed JARs and damaged bundled runtimes fail verification.

The existing pinned full-JRE/jlink pipeline remains the runtime owner. Its analysis combines actual module descriptors, jdeps and documented dynamic providers; application JARs stay outside the JDK-only image. On the local macOS arm64 migration gate both actual VSIX variants were inspected; jlink saved 35.6% and passed HTTP/HTTPS protocol, isolated extension-host navigation/restart, and corruption probes. Windows/Linux workflow definitions were updated but not executed for this local migration. Full release/platform qualification remains a separate gate. Original migration receipts and the final independent candidate-pair review are retained outside both repositories in `interlis-java-jenesis-b-evidence`.

The historical phase V0–V5 `npm run review` transport was removed during migration B. Current pair reviews use a fresh external OpenCode 2/direct DeepSeek request with OS-enforced read-only candidate worktrees and an external evidence directory, as specified by Core `docs/implementation/jenesis-migration-b/OPENCODE_REVIEW_PROMPT.md`. Historical phase review records retain their original transport descriptions.
