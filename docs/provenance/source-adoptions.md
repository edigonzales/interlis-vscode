# Kontrollierte Quellübernahmen

Ursprung: `edigonzales/interlis-language-tools`, Commit `f27801bfebf0fdac82a19e016f4c347ae2b6f8fb`. MIT, Copyright2026 Stefan Ziegler; unveränderte Lizenz unter `licenses/syntax-resources-MIT.txt`. Einmalige passive Ressourcenübernahme, keine Paket-/Build-/Testabhängigkeit.

| Originalpfad | SHA-256 vorher/nachher | Eigener Pfad | Behandlung/Prüfung |
|---|---|---|---|
| apps/vscode-extension/syntaxes/interlis.tmLanguage.json | 989a3f5b3d265f582cf933adaa1ed89224287604379ca38f57e7e058c30035bc | resources/syntaxes/interlis.tmLanguage.json | Unverändert; JSON-/Manifesttest, installierte Sprache/GUI |
| apps/vscode-extension/language-configuration.json | 7fae0314a4f60e4fbea69e341216ff653d1ceb9874c9ec1795fcf4513b9b7aaf | resources/language-configuration.json | Unverändert; JSON-/Manifesttest, installierte Sprache/GUI |

Snippets und Modellvorlage sind neu geschrieben. Keine alte Extension-/Compiler-/AST-/LanguageServicequelle übernommen.

## Diagrammrenderer

Die VS-Code-Extension baut Sprotty, ELK und die Diagrammassets aus
`src/diagram/renderer`. Dessen `provenance.json` und `original-vendor-pin.json`
halten die ursprünglichen Quellen, Commits und Hashes fest. Die Original-
und Abhängigkeitslizenzen werden mit der Extension ausgeliefert. Die
frühere gemeinsame V2-Quelle im Core ist in den V2-Berichten dokumentiert.

## V1-Testeingaben aus dem gemeinsamen Core

Einmalige Kopie zweier eigener MIT-Testmodelle aus `edigonzales/interlis-java`,
Commit `cf585ec1ea2270bafed4083a8ebfa2e68de05133`; Lizenz unter
`licenses/interlis-java.txt`. Keine Compilerquellen oder Paketlinks.

| Originalpfad | Eigener Pfad | SHA-256 (unverändert) |
|---|---|---|
| testdata/models/base24.ili | test/fixtures/workspace-imports/Base.ili | 4daeaa3677765ffa195fe03bf0de1ea2934ecd7c7db2b060f035ba8338ca3c6a |
| testdata/models/survey24.ili | test/fixtures/workspace-imports/Survey.ili | 0970aaf76bf4d20c98ac91ae1cc4d782f1f7e28733da1268f99c0ef597ee004e |

Die übrigen Workspace-/HTTP-Fixtures sind neu geschrieben und werden mit der
Java-Engine beziehungsweise dem installierten Java-LSP geprüft.

## V4 Verhaltensreferenz für Editorhilfen

Completion-/Snippet-/Metaattributverhalten wurde am Referenzstand `f27801bfebf0fdac82a19e016f4c347ae2b6f8fb`
abgeglichen. Metadatenprofil-/Wertbeispiele: `packages/language-service/src/completion-meta.test.ts`,
SHA-256 `36feaa80cf7567de06bb6a59bc056de4ed3b9428a148bd25711b0c6ab8a5c77f`. Keine Language-Service-/Scannerimplementierung
wurde übernommen. `EditorAssistanceService`, `EditorCompletions` und
`MetaAttributeCatalog` sind neue reine Java-Queries über echte Core-Syntax und
Bindungsfakten. Die Extension enthält nur native Snippet-/Cursorinteraktion.
Die Dokumentprojektion/OOXML-/GraphML-Renderer sind ebenfalls neu geschrieben.
Build und Tests benötigen keinen Referenzcheckout; bestehende Lizenzangaben
bleiben als historische Provenienz erhalten.
