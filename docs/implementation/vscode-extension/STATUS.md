# INTERLIS VS Code – aktueller Ausführungsstand

**V0–V3 PASS**, unabhängig und operativ validiert. **V4 ist geöffnet.**
V5 bleibt bis zum unabhängigen V4-PASS gesperrt. Kein Push/Release.

| Phase | Stand | Geprüftes Produktpaar / Beleg |
|---|---|---|
| V0 | PASS, alle7 ACs | Core `76df3815973597280845a9bb575fa399e9773ccc` / Extension `d8f8adeb89e26f8a979744b81299d51da45cf0fe`; [Originalreview](reviews/V0/attempt-02/review.md), [äussere Prüfung](reviews/V0/attempt-02/outer-audit.json) |
| V1 | PASS, alle10 ACs | Core `3b60e6c1309a4897ad6d0e99f6d8dfd137520ca9` / Extension `d237d92fbe22f6fb41d7d6f3f0965c0d080e30e9`; [Originalreview](reviews/V1/attempt-01/review.md), [Verdict](reviews/V1/attempt-01/verdict.json), [äussere Prüfung](reviews/V1/attempt-01/outer-audit.json) |
| V2 | PASS, alle10 ACs | Core `7026e7f6b5834bf593d91dfee3323efb60688f3d` / Extension `01f353114cc7a19a9ac6dd884cb0b285ac723c9c`; [Originalreview](reviews/V2/attempt-02/review.md), [äussere Prüfung](reviews/V2/attempt-02/outer-audit.json) |
| V3 | PASS, alle12 ACs | Core `a0272965c4691320ca316d519581d4db4cefc930` / Extension `dd6e4fd342dbe58a43dc648e2b2ad285db6896e2`; [Originalreview](reviews/V3/attempt-01/review.md), [äussere Prüfung](reviews/V3/attempt-01/outer-audit.json) |
| V4 | READY_FOR_REVIEW nach Nacharbeit | Beide Ursachen korrigiert; frische Authoring7/Comfort28/Canary qualifiziert. Neuer unabhängiger Review ausstehend. [Originalreview](reviews/V4/attempt-01/review.md), [Bericht](implementation/V4.md) |
| V5 | PLANNED | Gebündelte Runtimes, reale Plattformen/Remote, kumulative56-AC-Abnahme |

## Unveränderliche Gesamtbasis und Arbeitsbäume

AssignmentBase: Core `20b0029d824b3602d9a304320bf0feae4c35c1f9`, Extension
`73badd9807f407aea048d397af5549fe907a1501`. Die jeweilige phaseBase bleibt über
Nacharbeit unverändert; die nächste Basis wird nach diesem reinen Archiv-Dokucommit
extern festgehalten. Keine Null-SHAs oder Selbstreferenz.

EXT: `/Users/stefan/sources/interlis-vscode`, Branch `codex/vscode-extension`.
CORE: `/Users/stefan/sources/interlis-vscode-evidence/product-core`, Branch
`codex/vscode-extension-lsp`. Der Originalcheckout `/Users/stefan/sources/interlis-java`
bleibt unangetastet. Auf Nutzerhinweis wurden seine gepushten Repository-/Cache-
Arbeiten bis `cf585ec1ea2270bafed4083a8ebfa2e68de05133` übernommen; spätere fremde
uncommittete Dokumente bleiben ausgeschlossen. Fremde `.DS_Store` bleibt ungetrackt.
Die frühere externe Squash-Fortschreibung `20b0029…` → `76df381…` besass identischen
vollständigen Tree; Originalstatus im [V0-Bericht](implementation/V0.md).

## Tatsächliche unabhängige Abnahmen

OpenCode2.0.28, Provider `deepseek`, API-Modell `deepseek-flash`, direkt
`api.deepseek.com`, offizielle aktuelle Zuordnung DeepSeek-V4.1-Flash-1017.
V0-Session `ses_e6829e6d3ffePmDs0M8Plx1SAp`; V1-Session
`ses_e67b64df8ffeHhPoi417w5C1r4`. Je ProzessExit0/Guard passed0 und unveränderte
detached Trees. Alle konkreten Sichtungsbehauptungen gegen tatsächliche Reads
geprüft. V0-Prozessgeschichte unter [PROCESS_NOTES](reviews/V0/PROCESS_NOTES.md).

V1: eigene finale Qualifikation `…/qualification/V1-final-r4`; unabhängige Rohbelege
`…/reviews/V1-r2/evidence` jeweils unter `interlis-vscode-evidence`. Eigene und
unabhängige installierte GUI jeweils11/11; richtige Negativcanary, eigene neue
Reviewer-Gegenproben2/2. Frisch unabhängig LSP65, Repository64, Workspace23,
Model23/Compiler766, Unit5, echter stdio-Transport1 und Extension-Host. Keine
Rest-Java-PIDs. Einzelheiten und Fehlversuche im [V1-Bericht](implementation/V1.md).

Historischer V1-VSIX-Nachweis (der ursprüngliche Buildpfad wird je Phase neu erzeugt): `build/packages/interlis-vscode-darwin-arm64.vsix`, SHA-256
`07071ebe6ebee9c803ce53bc367dd7b0fc51d095a028c01f7cef3fc8a30e7049`.
Elf JARs im [Artefaktlock](../../../release/editor-artifacts.lock.json).
Primärplattform macOS arm64, VSCode1.140.0, ExTester8.28.1,
ChromeDriver150.0.7871.250, externes Temurin25.0.3. ZIP-Zeitstempel können beim
erneuten Packen den Containerhash ändern; Nutzdateien werden separat geprüft.

## Grenzen und nächster Umfang

V1 liefert zentrale Diagnoseprosa/RelatedInformation, hierarchische Outline,
Repositoryhost mit transitivem Cache/Offline, readonly Quellhandles und explizites
Current-/Workspacecompile. Standardqueries und versionierte Edits bleiben in Java.
Einige DE-Regelphrasen sind noch englisch; Restart kann gleichnamige readonly Tabs
hinterlassen. Die äussere Prüfung hält kleine Prosa-/Beleggrenzen transparent fest.

V2 liefert echte Node-/Container-/Routeinteraktion und aktuelle Navigation aus
einer gemeinsamen neutralen Sprotty-/ELK-Quelle. Details, unveränderte PhaseBase,
Rohbelege, Fehlversuche und Testwiederverwendung stehen im [V2-Bericht](implementation/V2.md).
V2 ist unabhängig abgenommen; die ursprünglichen Entwicklungsbelege bleiben erhalten. V3 ergänzt volle UMLbedienung und aktuelle Exporte und ist unabhängig abgenommen. Editorhilfen bleiben V4 zugeordnet. Keine zweite Sprachengine oder
Altprojektabhängigkeit. Linux/Windows/Remote und Runtimebündelung sind V5-Pflicht;
ein sauberer kumulativer Portablelauf ebenfalls. Kein pauschaler sachfremder
Korpus-/Benchmark-/Safari-/releaseCheckP3-Lauf.

V2 attempt01: Inhalt-PASS auf Core `7026e7f6b5834bf593d91dfee3323efb60688f3d` / Extension
`bae7f3d52ef7e20fc7edf067626a4191c7395717`, jedoch sechs unbelegte explizite Bildsichtungen.
[Äussere Prüfung](reviews/V2/attempt-01/outer-audit.json) verwirft die Phasenfreigabe;
Originale und alle echten erfolgreichen Rohprüfungen bleiben erhalten.

V2 attempt02: frische Session `ses_e66e3c1e2ffe2ZNMLbIxlmGHmm`, gültiger unabhängiger PASS
auf dem oben genannten Paar. Prozess/Guard0, LSP7/Projektion21, portable Adapter6/
Browser3/nativeUI1, Unit7/stdio1, GUI18/18 und eigener neuer Gegenfall1/1, richtige
Negativcanary;29 Bildsichtungen tatsächlich verifiziert. V3 ist dadurch geöffnet.

V3 attempt01: frische Session `ses_e64d9da59ffezKdHVhExON30uJ`, alle12 ACs erfüllt;
Prozess/Guard0, unveränderte detached Trees, direkte Modellidentität geprüft.
Frisch unabhängig UI8, Browser3, LSP70/Projektion22, Unit/stdio11 und native
GUI-Gegenprobe2; erwartete Negativcanary1. Eigene kumulative GUI28 verifiziert
wiederverwendet, alle74 ZIPdateien byte-identisch.26 tatsächliche Bildreads
decken alle23 Sichtungsangaben ab (sechs nachgewiesene identische Aliaspfade).
Originale und optionale Beobachtungen unter `reviews/V3/attempt-01`.

## V3 erneut validiert und V4 zur Prüfung bereit

Die erneute V3-Validierung am02.11.2026 unter
`/Users/stefan/sources/interlis-vscode-evidence/phases/V3/revalidation-2026-11-02.json`
bestätigt Originalgleichheit, exaktes Reviewpaar, saubere detached Trees,
Session-/Modell-/Prozessabschluss und die ursprünglichen GUI-Belege. Alle12 ACs
sind erfüllt. Eigene GUI28 und zwei tatsächliche neue Reviewer-GUI-Gegenfälle
sind belegt; das leere Reviewer-Manifestcases-Array ist anhand echter Mocha-
Ausgabe ausdrücklich aufgelöst. Alle74 ZIPeinträge waren bytegleich,61Artefakte
geprüft;26 tatsächliche Bildreads decken23 Sichtungsangaben. Keine offene Pflicht.
Das ursprüngliche V3-VSIX ist extern unveränderlich aufbewahrt.

V4 besitzt nun reine Java-Editorpläne, vollständige Snippets/Slots/Metaattribute,
drei sichere Fixes, CompiledSchema-Dokumentation mit MD/HTML/echtem DOCX und
drei Graphtextformaten. Eigene native GUI29–35 7/7 und frische GUI01–28 28/28,
erwartete Negativcanary, keine verbleibenden Java-PIDs. Java-/Transport-/Artefakt-
nachweise und genaue Wiederverwendung stehen im [V4-Bericht](implementation/V4.md).
Das ist kein unabhängiger V4-PASS. V5 darf weiterhin nicht beginnen.

V4 attempt01: Original-FAIL auf Core `668caa9a975ffac41a56880c9349a70ee3fdc788` /
Extension `e38cfb73e781952ad8ae0b597d2e6ea5504ae717`. Frische Session
`ses_e640b461fffeZwqfvTMJupDca4`, Modell deepseek-flash direkt, Prozess/Guard0.
Pflichtbefunde: umgekehrte Mermaid-Vererbung und zweimal nicht-grüner voller
Comfort-Lauf wegen GUI09 nach Offline-Neustart. Native Authoring7, neue
Gegenfälle3, gezielte UML2 und V3-Subset10 sowie Java/Build waren grün; das
ersetzt kein PASS. Originale unverändert archiviert; V4-PhaseBase unverändert,
V5 gesperrt. Temporäre Reviewer-Profile wurden bei dessen Speicherbereinigung
entfernt; persistente Logs/Bilder/Artefakte und Original-VSIX bleiben erhalten.
