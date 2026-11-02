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
