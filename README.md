# INTERLIS

Desktop VS Code extension `edigonzales.interlis-vscode` using the Java INTERLIS
language server. The initial development package supports the installed editor
path on macOS arm64. Java25 must be configured explicitly. UML, external
repositories, the improved diagnostics and bundled runtimes belong to later
phases and are not implemented yet.

Install the local VSIX through **Extensions → Install from VSIX**. Set
`interlisGuru.server.javaPath` in user settings to the absolute Java25 executable
(e.g. `/path/to/jdk25/bin/java`). Open a trusted workspace and an `.ili`/`.ILI`
file. The status bar shows Starting/Ready/Stopped/Error. **INTERLIS: Show Language
Server Output**, **Stop Language Server**, **Restart Language Server** and
**New Model from Template** are available in the palette. Templates create an
unsaved document. Standard F12, formatting and diagnostics come from Java.

The current baseline diagnostics still show technical message keys. Readable
DE/EN diagnostics are V1 work. Other INTERLIS extensions can supply competing
providers; this extension reports a conflict and leaves their management to you.
Untrusted workspaces receive passive syntax resources; Java starts after trust.
Nothing is published automatically.

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
```

`stage:core` calls the existing Gradle `:interlis-lsp:installDist` task on the
explicit clean Core checkout, copies the complete runtime libraries and records
their identities. It rejects a changing Core HEAD. Use the exact locked Core
commit when reproducing a candidate. No separate compiler build is introduced.
VSIX output: `build/packages/interlis-vscode-darwin-arm64.vsix`.

The GUI runner downloads VSCode1.140.0 and matching ChromeDriver into an isolated
test directory, installs the VSIX and uses ExTester8.28.1/Selenium. Optional
`--cache /absolute/cache` reuses downloaded zip archives. Each run has fresh
user-data, extensions, workspace and evidence. `--vsix /absolute/file.vsix`
chooses an explicit archive. `--canary missing-status` deliberately expects an
impossible visible state and **must exit nonzero**. Unknown suites/arguments fail.
No `--passWithNoTests` or hidden product commands are used. Workbench keyboard and
mouse actions implement GUI-01–03; screenshots, case results and a manifest live
under `build/reports/gui/smoke/<run>/`. This differs from API integration tests.

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
