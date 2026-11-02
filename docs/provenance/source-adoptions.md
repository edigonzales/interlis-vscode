# Kontrollierte Quellübernahmen

Ursprung: `edigonzales/interlis-language-tools`, Commit `f27801bfebf0fdac82a19e016f4c347ae2b6f8fb`. MIT, Copyright2026 Stefan Ziegler; unveränderte Lizenz unter `licenses/syntax-resources-MIT.txt`. Einmalige passive Ressourcenübernahme, keine Paket-/Build-/Testabhängigkeit.

| Originalpfad | SHA-256 vorher/nachher | Eigener Pfad | Behandlung/Prüfung |
|---|---|---|---|
| apps/vscode-extension/syntaxes/interlis.tmLanguage.json | 989a3f5b3d265f582cf933adaa1ed89224287604379ca38f57e7e058c30035bc | resources/syntaxes/interlis.tmLanguage.json | Unverändert; JSON-/Manifesttest, installierte Sprache/GUI |
| apps/vscode-extension/language-configuration.json | 7fae0314a4f60e4fbea69e341216ff653d1ceb9874c9ec1795fcf4513b9b7aaf | resources/language-configuration.json | Unverändert; JSON-/Manifesttest, installierte Sprache/GUI |

Snippets und Modellvorlage sind neu geschrieben. Keine alte Extension-/Compiler-/AST-/LanguageServicequelle übernommen.

In V2 ausgeführt: kontrollierte Übernahme der vorhandenen Core-Diagrammquellen
nach `CORE/frontend/diagram-ui`, mit Originalcommit/-pfaden/-hashes in dessen
`provenance.json` und unveränderten MIT-/EPL-Texten. Fremde Compiler-/AST-/Language-
Service-Typen sind entfernt. Beide Consumer verwenden dieselbe eigene neutrale
Quelle mit echtem Sprotty1.4.0, Sprotty-Protokoll1.4.0 und ELK0.11.0. Das Core-
Editorbundle enthält die vollständigen gebündelten Dependencylizenzen. Die
Extension besitzt nur geprüfte Artefakte, keine zweite Rendererquellkopie.
Dokumentationsprojektion bleibt V4-Arbeit.

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
