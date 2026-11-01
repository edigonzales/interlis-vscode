# INTERLIS VS Code – aktueller Ausführungsstand

**V0 PASS**, unabhängig und operativ validiert. **V1 implementiert, eigene Qualifikation und unabhängiger Review werden abgeschlossen.**
V2–V5 bleiben durch ihre jeweiligen unabhängigen Gates gesperrt. Kein Push/Release.

| Phase | Stand | Geprüftes Produktpaar / Beleg |
|---|---|---|
| V0 | PASS, alle 7 ACs | Core `76df3815973597280845a9bb575fa399e9773ccc` / Extension `d8f8adeb89e26f8a979744b81299d51da45cf0fe`; [unveränderter Review](reviews/V0/attempt-02/review.md), [Verdict](reviews/V0/attempt-02/verdict.json), [äussere Prüfung](reviews/V0/attempt-02/outer-audit.json) |
| V1 | Eigene GUI-01–11 bestanden; unabhängiges PASS noch offen | Java-LSP-/Repository-/Editorparität, GUI-01–11 |
| V2 | PLANNED | Ein neutraler gemeinsamer interaktiver Sprotty-/ELK-Renderer |
| V3 | PLANNED | Vollständige UMLbedienung und aktuelle SVG-/PNG-Exporte |
| V4 | PLANNED | Editorhilfen, Dokumentations-/Textformate |
| V5 | PLANNED | Gebündelte Runtimes, reale Plattformen/Remote, kumulative 56-AC-Abnahme |

## Unveränderliche Gesamtbasis und Arbeitsbäume

AssignmentBase: Core `20b0029d824b3602d9a304320bf0feae4c35c1f9`, Extension
`73badd9807f407aea048d397af5549fe907a1501`. V0-phaseBase war identisch und blieb
über alle Reparaturen unverändert. Keine Null-SHAs.

EXT: `/Users/stefan/sources/interlis-vscode`, Branch `codex/vscode-extension`.
CORE für diesen Auftrag: `/Users/stefan/sources/interlis-vscode-evidence/product-core`,
Branch `codex/vscode-extension-lsp`, auf V1-Core `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9` (enthält gepushtes `cf585ec1…`); siehe [V1-Bericht](implementation/V1.md).
Der ursprüngliche Core-Checkout `/Users/stefan/sources/interlis-java` bleibt unangetastet; die inzwischen gepushte Repositoryarbeit wurde als Commit in den isolierten Zweig übernommen. Der Wechsel von `20b0029…` auf
`76df381…` war eine externe Squash-Fortschreibung mit identischem vollständigem
Tree; Originalstatus und Gründe stehen im [V0-Bericht](implementation/V0.md).
Die anfängliche fremde `.DS_Store` im Extensionrepo bleibt ungetrackt erhalten.

## V0-Belege und tatsächliche Grenzen

OpenCode2.0.28 mit `deepseek/deepseek-flash`, direkter Host `api.deepseek.com`;
Anbieterzuordnung und tatsächliche Sessionmetadaten als DeepSeek-V4.1-Flash-1017
geprüft. Akzeptierte Session `ses_e6829e6d3ffePmDs0M8Plx1SAp`: ProzessExit0,
Guard passed/Exit0, beide detached Reviewtrees unverändert. Bericht und Verdict
stimmen überein; alle Bild-Lesebehauptungen mit tatsächlichen Aufrufen abgeglichen.
[Unveränderte Versuche und Prozessnotizen](reviews/V0/PROCESS_NOTES.md).

Eigene Qualifikation: `…/interlis-vscode-evidence/qualification/V0-r4/`.
Akzeptierter unabhängiger Lauf: `…/interlis-vscode-evidence/reviews/V0-r3/evidence/`.
Frisch geprüft: 5 TS-/Hosttests, 1 entpackter stdio-Prozesstest, 6 gezielte Java-LSPtests,
3 Extension-Host-Prüfgruppen und GUI-01–03 (3/3). Negativcanary korrekt Exit1;
eigene neue installierte Tamper-GUIprobe des Reviewers (1/1). Keine Rest-Java-PIDs.
Kein globaler Compiler-/Conformance-/Browserkorpuslauf, weil Java/Parser/IR/Browser
in V0 unverändert blieben; Auswahl unabhängig bestätigt.

VSIX: `build/packages/interlis-vscode-darwin-arm64.vsix`, SHA-256
`1f2142f761594705d44390cdf382d610cfeebb90ff3ce824b054bedf3cbfa38d`.
11 serverseitige JARs sind im [Artefaktlock](../../../release/editor-artifacts.lock.json)
gepinnt. Alle Nutzdateien reproduzierbar identisch; ZIP-Zeitstempel verändern den
Containerhash bei erneutem Packen. Primär geprüft: macOS arm64, VSCode1.140.0,
ExTester8.28.1, ChromeDriver150.0.7871.250, externes Temurin25.0.3.
Keine Linux-/Windows-/Remote- oder Runtimebündelungsbehauptung vor V5.

V0 liefert eine installierte dünne Editorintegration, einfache Snippets/Vorlage,
Syntax, Status/Output und Stop/Restart. Die Diagnoseprosa ist noch technisch;
Outline, Repositories/Readonly und Rootcompile sind V1-Arbeit. UML, vollständige
Editorhilfen und Exporte bleiben vollständig beauftragt, aber noch unimplementiert.
Keine zweite Sprachengine und keine Altprojektabhängigkeit.

## V1 zur unabhängigen Abnahme

Corekandidat `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9` enthält die ausdrücklich
berücksichtigte gepushte Repositorysuche und Cachearbeit bis `cf585ec1…`.
Der [V1-Bericht](implementation/V1.md) beschreibt Umsetzung, Risikogates,
Fehlversuche und die getrennten Rohbelege. Eigene GUI-01–11 sind nach visueller
Korrektur des Theme-Orakels bestanden. Finale Qualifikation und unabhängiges
Produktpaar-PASS sind noch offen; V2 bleibt gesperrt.
