# INTERLIS VS Code – aktueller Ausführungsstand

V0 IN_PROGRESS; V1–V5 PLANNED und durch unabhängige Abnahme gesperrt.
Erste eigene Entwicklungs-VSIX gebaut/installiert; kein Phasen-PASS.

AssignmentBase und V0 phaseBase (unveränderlich):
- Core `/Users/stefan/sources/interlis-java`: `20b0029d824b3602d9a304320bf0feae4c35c1f9`.
- Extension `/Users/stefan/sources/interlis-vscode`: `73badd9807f407aea048d397af5549fe907a1501`.

Beide getrackten Ausgangsbäume sauber; fremdes ungetracktes `.DS_Store` bleibt erhalten.
Corebranch `codex/compiler-cli-modernization`, Extensionarbeitsbranch `codex/vscode-extension`.
Core liegt 22 Commits nach Recherchepin b8051493; neue CLI-Farbe und
Repository-/Verbosearbeiten bleiben erhalten. LSP-/Projektor-/Queryquellen sind
gegenüber dem Recherchepin unverändert. Kein Zurücksetzen, Push oder Release.

## Preflight

OpenCode 2.0.28 unter `/Users/stefan/.opencode/bin/opencode`; gespeicherte
DeepSeek-Anmeldung verwendet, kein Keyexport. `run/auth/models --help` geprüft;
`--standalone --model deepseek/deepseek-flash --format json` tatsächlich ausgeführt.
[Anbieterzuordnung](https://api-docs.deepseek.com/quick_start/pricing/) am 01.11.2026:
`deepseek-flash` → DeepSeek-V4.1-Flash-1017; Projektprofil setzt direkte
`https://api.deepseek.com`. Keine Proxy-/OpenRouterausweichroute.

Frische Bereitschaftssession `ses_e687497f7ffe6Q0D0tNVOcNH1s` las beide detached
Baselines, führte Nodeassert aus und prüfte Bildlesewerkzeug; Prozess Exit0,
Guard passed/Exit0. Das ist keine V0-Abnahme. Rohbelege ausserhalb der Produktrepos:
`/Users/stefan/sources/interlis-vscode-evidence/preflight/`.
Die erste Suche übersah VSCode unter `/Users/stefan/apps/vscode/`; ihr Befund
„keine VSCode-Installation“ ist damit widerlegt, kein ungelöster Installationsblocker.

Eigener echter GUI-Preflight: ExTester8.28.1, VSCode1.140.0,
ChromeDriver150.0.7871.250, macOS15.8.1 arm64; echte Palette per Tastatur,
Problemscommand, zwei Screenshots, ein Test, Exit0 unter Pythonguard.
Bild tatsächlich geöffnet: Palette/Command sichtbar, lesbar, echte Workbench.
Rohbelege `/Users/stefan/sources/interlis-vscode-evidence/gui-preflight/`.
Unabhängige GUIbereitschaftsprobe beendet: eigener Lauf/Bildprüfung, Exit0, Guard passed0; Bericht `preflight/gui-readiness.md`. GUI-01–03 brauchen weiterhin
installiertes eigenes VSIX und echten Server.

## V0-Testauswahl vor Implementierung

| Änderung/Consumer | Fällige Prüfung | Begründet nicht fällig |
|---|---|---|
| Neuer Extensionhost/Start/Shutdown | T0, TSunit/Manifest, echter Distributions-stdio-Prozess, vorhandene LSPstarttests | Keine Parser-/Semantikänderung, kein Compilerkorpus |
| Staging/VSIX/Java25 | Hashinventar, saubere Installation, fehlender/falscher Java-/Bundlepfad | Runtimebündelung/weitere Pflichtplattformen erst V5 |
| Syntax/Snippets/Vorlage | Ressourcenkontrolle, Extensionhost und GUI-01–03 | Vollständige Completion-/AutoClosehilfe erst V4 |
| Echter GUIharness | Installiertes VSIX, Problems/F12/Format/Undo/Restart, Negativcanary, Reviewerbedienbarkeit | UML/Export noch nicht implementiert, daher V2–V4-GUI später |

Keine Reviewanfrage vor fertigem sauberem V0-Kandidatenpaar; V1 nur nach validem PASS.

## Baselinefortschreibung ohne Produktänderung

Core wurde extern auf `main`/`76df3815973597280845a9bb575fa399e9773ccc` gewechselt.
Vollständiger Inhaltsdiff gegen ursprüngliches `20b0029…` leer; reiner Squashstand.
AssignmentBase/phaseBase bleiben unverändert. Serverlock und künftiges Kandidatenpaar
verwenden den aktuellen SHA. Keine eigene Coreänderung.

## Eigene V0-Qualifikation

Sechs vorhandene Java-LSP-Tests, ein echter entpackter stdio-Prozesstest und fünf
Host-/Manifesttests bestanden; isolierter Extension-Host mit drei Checkgruppen Exit0.
Installierter Smoke GUI-01–03: drei Fälle bestanden unter Guard am Entwicklungsstand.
Aktueller vollständiger Lauf `build/reports/gui/smoke/2026-11-01T15-07-08-462Z/`;
frische Kandidatenbelege folgen nach Commit. Bilder tatsächlich angesehen:
Problems mit realem Typfehler, korrigierter Editor, Stop/Restart und Output mit
eigenen Java-PIDs/Core-/Bundlehash. Technische Baselineprosa bleibt als V1-Lücke sichtbar.
Negativcanary korrekt Exit1, zwei eigene Java-PIDs beendet; unabhängiger V0-Review noch nicht gestartet.

## Isolierter Core-Arbeitsbaum

Nach dem ersten Extensioncommit entstanden fremde produktive Änderungen im
ursprünglichen Core-Arbeitsbaum. Diese bleiben unangetastet. Fortsetzung dieses
Auftrags in eigenem Git-Worktree
`/Users/stefan/sources/interlis-vscode-evidence/product-core`, Branch
`codex/vscode-extension-core`, unverändert auf gelocktem
`76df3815973597280845a9bb575fa399e9773ccc`. Die strenge Sauberkeitsprüfung hielt
den Qualifikationslauf vor jedem Test an; dies war kein Test-PASS. Originalbäume
nicht zurückgesetzt oder fremde Änderungen committet. Künftige V1-Corearbeit
erst nach V0-PASS auf diesem isolierten Zweig.

Saubere Qualifikation `qualification/V0-r2/qualification.json` bestand für Core
`76df381…`/Extension `cf850b6…`, tatsächlicher GuardExit0 und unveränderte Trees.
Vor Review zusätzliche Evidenzabsicherung: normaler standardmässig ausgeschalteter
LSPtrace als bewusste Diagnoseoption, im isolierten GUIprofil verbose für echte
Dokument-/Diagnoseversionen. GUI-03 erzeugt und korrigiert nach Restart zusätzlich
einen neuen Typfehler, damit Ready allein kein Analysefrischebeleg ist. Diese
Änderung erfordert einen neuen Extensionkandidaten und frische GUIbelege.
