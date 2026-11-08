# Architecture and qualification

Java owns parsing, semantic snapshots, repository closure, language queries,
completion/END plans, diagnostics, documentation and graph projections. The
extension transports LSP stdio messages, maps native editor interactions, and
owns the diagram renderer, layout worker, view state and export. It imports the
wire types and schema from the locked Core bundle.

The client accepts editor protocol1, diagram protocol1 and DiagramDocument1.0.
Server-instance IDs, document versions, snapshot IDs and request generations
prevent obsolete navigation, layout and exports from becoming current. Cancellation
invalidates both the host request and the actual layout worker. Layout state is
bounded presentation data keyed by workspace/root/panel identity, not source text.
Panel disposal removes its listeners, cancels work and destroys the webview worker.

The artifact lock verifies all server JARs. A target distribution additionally
locks the runtime lock's own digest and target. Runtime verification compares the
complete extracted file inventory and Unix executable modes; Windows modes are
canonically false. Safe vendor legal links are materialized before VSIX packing.
The resulting ZIP is extracted and checked again, including target isolation.
Vendor legal notices remain in each runtime and under `licenses/`. User-level
absolute Java/server overrides are explicit development options. A packaged
runtime still has to verify even if Java is overridden. Workspace paths cannot
select executables. Restricted Mode starts no Java; the genuine Trust event starts
the client. External source handles stay read-only and expire on server changes.

macOS qualification uses installed VSIX profiles with pinned VS Code1.140.0,
ExTester8.28.1 and matching ChromeDriver. `comfort` exercises GUI01–28, `authoring`
GUI29–35, offline `distribution` GUI36/42 and `resilience` GUI37–41. Assertions use
native keys/pointers/dialogs, real Java processes, read-only DOM measurements and
actual saved artifacts. A separate missing-server run must fail. No API-only test
is labelled GUI. The Trust suite removes only ExTester's forced trust-disable
switch before its real browser starts; it does not emulate the product Trust API.
The offline runner uses one combined macOS sandbox because nested sandbox profiles
fail with EPERM. It allows the harness's scripts/tests/build/dependencies and its
already acquired tools, but denies Core and extension `src` data reads and external
network connections. Its tested Code descendants have an empty PATH. Boundary
negative probes are recorded before assertions run.

macOS denies executing its privileged `ps` utility inside the inherited sandbox.
`gui-resilience-run.cjs` therefore starts a separate fixed read-only Node observer
before launching the guarded GUI. The observer accepts only authenticated GETs
for metrics of its own preallocated profile; it accepts no command, PID or path.
It records actual own Electron/Java process RSS and IDs. UI and product descendants
remain protected by the original execution guard. CDP worker targets and native
panel cycles are observed by the guarded test. This boundary is explicit in the
resource evidence; it is not described as an in-sandbox `ps` execution.

For the complete macOS qualification, first commit the candidate and then run:

```sh
node scripts/qualify-macos.cjs \
  --core-dir /absolute/locked-interlis-java \
  --evidence /absolute/interlis-vscode-evidence/qualification/V5-final-run \
  --cache /absolute/pre-acquired/gui-cache \
  --java-home /absolute/jdk25
```

It requires clean tracked trees, keeps the full commit pair fixed, copies each
completed guard/JUnit report, checks all42 GUI IDs and preserves the exact VSIX.
The independent final review separately validates these raw results and designs
its own counterprobes. It is not started by this qualification command.

GitHub Actions builds the exact locked Core and extension commits. Each native
target installs and checks its actual VSIX using the packaged Java runtime,
then runs the short native GUI smoke (GUI01–03). Linux runs its GUI in Xvfb with
a window manager and a native X clipboard. The PR and stable release gates
also run the extension renderer browser tests and the full portable editor,
diagram and authoring suites (GUI01–35) against the selected Linux VSIX.
The macOS offline sandbox and process-observer qualification (GUI36–42)
remains available through the separate local command above.

The platform workflow uploads GUI screenshots, logs, result manifests and
native process evidence. Its final `Platform and GUI gate` job fails when the
package or any scheduled platform check fails. Configure this job as a required
status check for `main` once the new workflow has reported it.

The authoritative phase records remain under
`implementation/vscode-extension/STATUS.md`. Independent OpenCode2 direct DeepSeek
Flash1017 review runs on clean detached Core/extension worktrees. Final acceptance
requires all cumulative criteria under the explicit adjusted platform scope,
fresh native counterprobes, actual image reads, exact artifact identities and a
completed review/guard process. An implementation test pass is not that acceptance.

## Extension identity and build versions

The current extension is **INTERLIS Editor**, ID `edigonzales.interlis-editor`.
The Git repository remains `interlis-vscode`; command and setting namespaces
remain `interlisGuru`. The historical V0–V5 reports and qualified VSIX bytes are
immutable records of their original product pairs, not reviews of this identity change.

The source manifest and npm lock use `0.1.0`. Packaging stamps only its prepared
manifest with `0.1.` plus `GITHUB_RUN_NUMBER` when supplied. GitHub Actions
requires that number; malformed or missing CI numbers fail before packaging.
`GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT` do not affect the version. Use one
workflow for all platform packages so every target and rerun shares the version.

Outputs are `build/packages/interlis-editor-<target>.vsix` with matching
`.inventory.json` files carrying ID, version and SHA256. Packaging checks the
VSIX JSON and XML metadata. The publication workflow uses the same version
sequence for both channels and publishes the packages built and tested in
that run.

| Trigger | GUI checks | Open VSX |
| --- | --- | --- |
| Pull request against `main` | Native smoke on Linux, Windows and macOS, plus full Linux GUI | None |
| Push to `main` | One native GUI smoke per platform | Pre-release |
| Manual **Publish Open VSX** run on `main` | Native smoke on all three platforms, plus full Linux GUI | Stable release |

Start a stable release by selecting `main` and **Run workflow** in **Publish
Open VSX**. No tag is needed. The publish job waits for the same-run package
and GUI gate. To qualify a branch without publishing, manually run
**Native runtime packages** with the full Linux GUI option.

## F5 development loop

Open the extension repository as a folder in Codium or VS Code. The default
extensionHost launch uses `runtimeExecutable: ${execPath}` and a prelaunch task
`npm run dev:prepare`. It opens a separate Development Host in the same editor,
with the sample INTERLIS workspace. The normal editor installation/profile is
reused. The first workspace-trust question is handled normally.

The task installs extension dependencies when absent or their lock changes, runs
the sibling Core's incremental `editorBundle` task, verifies the emitted hashes,
and builds copied extension sources against that bundle's protocol types.
The Core task builds its shared UI and dependencies as needed. Java25 is discovered
locally; `INTERLIS_DEV_JAVA_HOME` selects an explicit JDK. `INTERLIS_CORE_DIR`
(or `npm run dev:prepare -- --core-dir /absolute/core`) selects another checkout.

The private `build/dev-extension` has its own artifact lock; dirty Core sources
are permitted only on this development path and recorded in
`build/dev-preparation.json`. Release staging still requires clean Core sources.
The debugger reads `build/dev.env` to pass the detected JDK to this development
host. The extension accepts that environment fallback only in Development mode;
an explicit user Java setting retains priority. Normal installed extensions
ignore the fallback. No bundled runtime, VSIX install, editor download, personal
settings change or release-lock rewrite is needed. Outputs are reused on subsequent
F5 runs. Stop debugging before rebuilding; another F5 rebuilds and starts a fresh
language server.
