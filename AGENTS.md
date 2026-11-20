# INTERLIS Editor development

- Inspect the current branch, index and worktree before changing files. Preserve
  existing work. Read the [architecture and qualification rules](docs/development.md).
- The Java Core owns compilation, diagnostics and wire contracts. The extension
  owns the editor host, rendering, layout and view state.
- Resolve the single LSP ZIP with `./gradlew stageLsp`. All later tasks use that
  staging directory. Configure changing Maven versions in `gradle.properties`.
- Package one native jlink runtime per VSIX. Verify the JDK archive against its
  vendor checksum. Preserve safe archive handling, workspace trust, and the
  real installed protocol and GUI checks.
- Apply the smallest verification that exercises the change. Keep normal CI
  and publication on their documented paths.
