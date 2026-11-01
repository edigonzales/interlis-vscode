# Kontrollierte Quellübernahmen

Ursprung: `edigonzales/interlis-language-tools`, Commit `f27801bfebf0fdac82a19e016f4c347ae2b6f8fb`. MIT, Copyright2026 Stefan Ziegler; unveränderte Lizenz unter `licenses/syntax-resources-MIT.txt`. Einmalige passive Ressourcenübernahme, keine Paket-/Build-/Testabhängigkeit.

| Originalpfad | SHA-256 vorher/nachher | Eigener Pfad | Behandlung/Prüfung |
|---|---|---|---|
| apps/vscode-extension/syntaxes/interlis.tmLanguage.json | 989a3f5b3d265f582cf933adaa1ed89224287604379ca38f57e7e058c30035bc | resources/syntaxes/interlis.tmLanguage.json | Unverändert; JSON-/Manifesttest, installierte Sprache/GUI |
| apps/vscode-extension/language-configuration.json | 7fae0314a4f60e4fbea69e341216ff653d1ceb9874c9ec1795fcf4513b9b7aaf | resources/language-configuration.json | Unverändert; JSON-/Manifesttest, installierte Sprache/GUI |

Snippets und Modellvorlage sind neu geschrieben. Keine alte Extension-/Compiler-/AST-/LanguageServicequelle übernommen.

Für V2 geplant, noch nicht ausgeführt: bestehende Core-Vendor-Diagrammquellen mit ihrem vorhandenen Herkunftsmanifest nach `CORE/frontend/diagram-ui` überführen und erst nach Entfernung fremder Typen übernehmen. Beide Consumer wechseln auf eine Quelle. ELK0.11.0 und Sprotty-Protokoll1.4.0 sind tatsächliche vorhandene Corepins; echter Sprotty1.4.0 wird vor V2 anhand seiner APIs geprüft. Noch kein Diagrammclient installiert oder als fertig bezeichnet. Dokumentationsprojektion in V4 neu in Java.
