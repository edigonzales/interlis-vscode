# Architecture and qualification

Java owns parsing, semantic snapshots, repository closure, language queries,
completion/END plans, diagnostics, documentation and graph projections. The
extension transports LSP stdio messages, maps native editor interactions, and
owns the diagram renderer, layout worker, view state and export. It imports the
wire types and schema from the Maven LSP distribution. Core tests own projection
semantics and portable compiler/worker transport. Extension renderer tests
exercise the packaged browser code, with native VSIX tests for the host boundary.

The client accepts editor protocol1, diagram protocol1 and DiagramDocument1.0.
Server-instance IDs, document versions, snapshot IDs and request generations
prevent obsolete navigation, layout and exports from becoming current. Cancellation
invalidates both the host request and the actual layout worker. Layout state is
bounded presentation data keyed by workspace/root/panel identity, not source text.
Panel disposal removes its listeners, cancels work and destroys the webview worker.

The Gradle wrapper stages one complete Maven LSP distribution under `build/lsp`.
TypeScript compiles against its wire types and diagram schemas. The VSIX contains
the LSP JARs and license files plus a native jlink runtime. It launches
`guru.interlis.lsp/guru.interlis.lsp.Main` on the module path. Java overrides
come from user configuration. Workspace Trust gates Java start and repository
activity. The webview loads packaged resources under its CSP.

GitHub Actions resolves the changing SNAPSHOT once and shares the staged files
with Linux x64, Windows x64 and macOS ARM64. Each native job builds, installs
and tests one VSIX. The package test runs the real LSP over stdio and HTTPS.
The native GUI smoke verifies editor activation, diagnostics and restart.
The PR and stable-release gates also run Chromium renderer tests and the full
editor and authoring GUI suites on Linux.

For a local integration before the first production SNAPSHOT, publish the
Core ZIP to an isolated Maven file repository using the Core's Gradle task.
Resolve it using the normal staging task with a repository URL override.

```sh
./gradlew stageLsp --refresh-dependencies -PlspRepository=file:///absolute/temp/maven/
npm ci
npm run build
npm run package:vsix
node scripts/ci/smoke.cjs
```

Integrate the Core PR first. After its protected main CI publishes the LSP
SNAPSHOT, run the Extension PR CI against the default Maven repository and
review the exact tested consumer commit before integrating it.

## Native GUI qualification

Use the installed VSIX with pinned VS Code 1.140.0 and ExTester 8.28.1.
`comfort` covers GUI01–28 and `authoring` covers GUI29–35. On macOS, the
offline and resilience runners retain GUI36–42, including trust, process errors,
restoration and resource limits. Use a pre-acquired VS Code and ChromeDriver
cache for the offline test. These commands use the staged Maven inputs and
the already packaged native VSIX.

```sh
node scripts/gui-offline-run.cjs /absolute/gui-cache
node scripts/gui-resilience-run.cjs --cache /absolute/gui-cache --java-home "$JAVA_HOME"
```

The offline sandbox denies source reads, external networking and interpreter
execution. The resilience runner samples its own Electron and Java children
with a read-only observer. A missing-server canary on a separate installation
must fail.

## Publishing the extension

Local VSIX builds use `0.1.0`. CI versions use `0.1.<GITHUB_RUN_NUMBER>` across
the platform matrix and across retries. The Open VSX upload uses the three
VSIX files tested by the same run. Pushes to `main` publish a pre-release.
Manually running **Publish Open VSX** on `main` runs the full Linux GUI gate
and publishes a stable release.
