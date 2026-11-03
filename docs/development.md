# Architecture and qualification

Java owns parsing, semantic snapshots, repository closure, language queries,
completion/END plans, diagnostics, documentation and graph projections. The
extension transports LSP stdio messages and versioned requests, maps native editor
interactions and hosts the shared `frontend/diagram-ui` renderer. It has no second
INTERLIS symbol resolver. UI, schemas, adapters and ELK worker are local assets
copied from the locked Core editor bundle; no sibling source link is required.

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

GitHub Actions builds exact locked Core/extension inputs and short native Linux
and Windows smokes inspect actual VSIX bytes, use bundled Java over real stdio,
install with VS Code's real CLI from Unicode/space paths and reject a removed JAR.
They run no GUI or corpus suite. Linux descendant exec tracing and Windows native
process-start events establish which executables actually ran; these observations
are not described as the macOS sandbox or as prevention of every possible process.
CI artifacts carry full commit pairs, vendor/runtime/VSIX digests, exits, commands
and durations. Builds must leave tracked locks unchanged. Isolated testbranch
pushes and Actions runs are authorized; there is no merge, tag or marketplace step.

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
`.inventory.json` files carrying ID, version and SHA256. Packaging checks both
actual VSIX JSON and XML metadata. GUI tests compare the installed manifest with
the selected VSIX; native CI smokes additionally check the run-derived expected
version and Code CLI's actual installed listing. The platform workflow runs on
main, the existing test branch and manual dispatch. There is no registry publish step.
