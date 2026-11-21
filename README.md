# INTERLIS Editor

Desktop VS Code extension `edigonzales.interlis-editor` using the Java INTERLIS
language server. Target-specific VSIX packages contain a vendor-verified Java 25
runtime, repository resolution/cache, readable diagnostics, root compilation and
an interactive UML custom editor.

The extension uses the existing Open VSX identity `edigonzales.interlis-editor`
(display name **INTERLIS Editor**, publisher **edigonzales**). Local builds use
`0.1.0`; GitHub Actions packages use `0.1.<GITHUB_RUN_NUMBER>`, for example
`0.1.42`. Reruns keep the same version. Stamping changes only the prepared VSIX
manifest. Successful pushes to `main` publish native preview packages on
[Open VSX](https://open-vsx.org/extension/edigonzales/interlis-editor). In VSCodium,
choose **Install Pre-Release Version** or **Switch to Pre-Release Version**.
Report extension issues in the [INTERLIS Editor issue tracker](https://github.com/edigonzales/interlis-vscode/issues).
Historical V0–V5 reviews refer to the identities and bytes tested then.

Install the local VSIX through **Extensions → Install from VSIX**. Set
`interlisGuru.server.javaPath` empty to use bundled Java25. An optional absolute
Java25 path is a user-level development override. Open a trusted workspace and an `.ili`/`.ILI`
file. The status bar shows Starting/Ready/Stopped/Error. **INTERLIS: Show Language
Server Output**, **Stop Language Server**, **Restart Language Server** and
**New Model from Template** are available in the palette. Templates create an
unsaved document. Standard F12, formatting and diagnostics come from Java.

Opening an INTERLIS file shows the Problems view and keeps keyboard focus in
the editor.

Diagnostics use the shared DE/EN formatter, including related locations.
`interlisGuru.diagnostics.language` selects auto/de/en (auto follows the UI with
English fallback). Other INTERLIS extensions can supply competing
providers; this extension reports a conflict and leaves their management to you.
Untrusted workspaces receive passive syntax resources; Java starts after trust.

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
The Java override is read only from user settings. Multiple local workspace
folders share one model space; duplicate model identities are not silently chosen.

## Development and verification

Use Node 22 or later and a Java 25 JDK for the build. Set `JAVA_HOME` first.

```sh
npm ci
./gradlew stageLsp
npm run build
npm run test:unit
INTERLIS_JAVA="$JAVA_HOME/bin/java" npm run test:protocol
npm run package:vsix
node scripts/ci/smoke.cjs
npm run test:gui -- --suite smoke
```

The Gradle wrapper resolves one Maven ZIP at
`guru.interlis:interlis-lsp-distribution:<interlisLspVersion>@zip` from
`jars.interlis.guru/snapshots/`. The version is declared in `gradle.properties`.
Use `--refresh-dependencies` to check for a newer build of the same SNAPSHOT.
Windows uses `gradlew.bat`. Node and VSIX tasks consume `build/lsp` from the
single staging run. The source-tree protocol test uses the explicitly supplied
Java path. The installed-package smoke uses the Java executable inside the VSIX.

Packaging runs on the target platform and creates
`build/packages/interlis-editor-<target>.vsix`. Each VSIX includes its own
jlink runtime plus the LSP modules. The installed extension starts Java from
the package. The build verifies the Temurin JDK archive against the vendor
checksum in `release/jdk-sources.json`.

### Debug with F5

Install dependencies with `npm ci`. Open the extension repository in VS Code
or VSCodium with Node 22 or later on `PATH` and `JAVA_HOME` set to a Java 25 JDK.
In **Run and Debug**, select a profile and press F5.

- **INTERLIS Editor: Build Local LSP and Extension** is the default for Java
  development. It builds the LSP from the working tree in `../interlis-java`,
  stages the ZIP through a temporary local Maven repository and builds the
  development extension against that ZIP's types and schemas. Set
  `INTERLIS_CORE_DIR` in the editor's environment to use another Java checkout.
- **INTERLIS Editor: Stage LSP and Build Extension** uses the published Maven
  snapshot configured in `gradle.properties`. Use it to debug the extension
  against the published server.

The profiles are in [`.vscode/launch.json`](.vscode/launch.json) and their
pre-launch tasks are in [`.vscode/tasks.json`](.vscode/tasks.json). Both open a
separate Extension Development Host with the sample workspace. Open
`Example.ili` there and grant workspace trust if prompted.

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
INTERLIS_JAVA="$JAVA_HOME/bin/java" npm run test:extension-host
```

This additional isolated Extension-Host run checks activation, the real definition
provider and dirty-buffer restart through VSCode APIs. It is not GUI evidence.
On macOS use the extension’s `scripts/without-python.cjs` wrapper for the
review and qualification processes, setting the Extension CWD inside the guard.
See [architecture and qualification](docs/development.md).

Source resource origins and license hashes are in
[provenance](docs/provenance/source-adoptions.md). Bundled Node notices are
regenerated from esbuild's actual input graph. Java third-party notices remain
inside the unchanged distribution JARs, alongside the Core license.

The diagram toolbar has Refresh, Fit, follow mode, Options, Export and More.
Options opens a drawer with Display, Layout, Filters and Advanced. Domain
enumeration values and inline attribute enumerations have separate controls,
as do member and association-end cardinalities. The Inkscape target preserves
live connectors for straight and orthogonal routes. Splines export as static paths.

Initial settings use `interlisGuru.diagram.*`. **INTERLIS: Reset Diagram Options
to Defaults** reapplies defaults to the active diagram. **More** contains
selection, visibility and view history actions. View storage keeps bounded
geometry and filters per workspace, source and panel. Theme changes preserve
the view, and Full/Visible SVG and PNG use the colors captured at export start.

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
