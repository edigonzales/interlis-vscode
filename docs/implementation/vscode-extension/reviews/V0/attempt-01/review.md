# Unabhängiger Review V0 – INTERLIS VS Code

**Reviewer:** Agent B (OpenCode 2.x, DeepSeek-V4.1-Flash-1017 über die direkte DeepSeek API)
**Datum:** 2026-11-01
**Auftrag:** V0, Kandidatenpaar Core `76df3815973597280845a9bb575fa399e9773ccc` / Extension `d8f8adeb89e26f8a979744b81299d51da45cf0fe`.

## 1. Identität

| Feld | Wert |
|---|---|
| Phase | V0 (nicht kumulativ; V1–V5 gesperrt) |
| OpenCode | `opencode v2.0.28` (`/Users/stefan/.opencode/bin/opencode --version`) |
| Provider / API-Modell | `deepseek` / `deepseek/deepseek-flash` (API-Modellname `deepseek-flash`) |
| API-Host | `https://api.deepseek.com` (Projektprofil; Preflight ohne Proxy-/OpenRouter-Route) |
| Aliasnachweis | Offizielle DeepSeek-Preisseite, am 2026-11-01 selbst abgerufen: `deepseek-flash` → `DeepSeek-V4.1-Flash-1017`, Base URL `https://api.deepseek.com`. Zusätzlich `preflight/model-identity.json` und `opencode models` (dort `deepseek/deepseek-flash`). |
| Core assignmentBase | `20b0029d824b3602d9a304320bf0feae4c35c1f9` |
| Core phaseBase | `20b0029d824b3602d9a304320bf0feae4c35c1f9` |
| Core candidate / tatsächlicher HEAD | `76df3815973597280845a9bb575fa399e9773ccc` (detached `HEAD`) |
| Extension assignmentBase | `73badd9807f407aea048d397af5549fe907a1501` |
| Extension phaseBase | `73badd9807f407aea048d397af5549fe907a1501` |
| Extension candidate / tatsächlicher HEAD | `d8f8adeb89e26f8a979744b81299d51da45cf0fe` (detached `HEAD`) |
| Tracked Zustand vorher/nachher | Core: leer/leer. Extension: leer/leer. Einzige untracked Datei in Extension: `opencode.json` (Review-Transportkonfiguration, von der äusseren Revieworchestrierung angelegt). Keine getrackte Produktdatei geändert. |
| Core-Inhaltsdiff phaseBase→candidate | leer (identischer Tree `393d5980cd079b07f564e9e451b45926127136ca`); Änderungen seit Recherchepin `b8051493` ausschliesslich `interlis-compiler-cli`, Docs, Testdata, Tools; keine LSP-/Compiler-/Projektor-/Workspace-Quellen. |
| VSIX | `/Users/stefan/sources/interlis-vscode/build/packages/interlis-vscode-darwin-arm64.vsix`, SHA-256 `1f2142f761594705d44390cdf382d610cfeebb90ff3ce824b054bedf3cbfa38d` |
| Client-Bundle | `out/extension.cjs` SHA-256 `0f98c54a7575cc3e53320940f93109424a64520c88315b50c55493cd617eccf8`; identisch im VSIX |
| Server | 11 JARs gemäss `release/editor-artifacts.lock.json`; alle SHA-256 in Worktree, VSIX und Request-Artefaktliste identisch |
| Runtime | Temurin `25.0.3+9`, Java-Binary SHA-256 `0a1eea36b7899323b32caab6f1d0e416ad7208792b076391278062efab4b15d8` (V0: explizit extern, keine gebündelte Runtimebehauptung) |
| GUI-Umgebung | VS Code 1.140.0 (isoliert aus Cache entpackt), ExTester 8.28.1, ChromeDriver 150.0.7871.250, macOS 24.6.0 arm64 |

Der äussere Guard-/Transportabschluss ist aus meiner noch laufenden Session nicht feststellbar. Ich behaupte ihn nicht; Codex prüft ihn nach Prozessende (Plan §11.5).

## 2. Eigene Ziel-, Code- und Architekturprüfung

**Relevanter Diff.** Extension: 33 Dateien, +6311/−1. Neu sind der dünne Host (`src/extension.ts`, `src/host/launch.ts`), Build-/Staging-/Paket-/GUI-Skripte, Tests, passive Syntax-/Snippet-/Template-Ressourcen, Herkunfts-/Lizenzdateien, Artefaktlock, Doku. Core: in dieser Phase keine Produktänderung; der Kandidatentree ist mit phaseBase inhaltsgleich. Die 50 Dateien seit `b8051493` betreffen nur die bereits abgenommene CLI-/Doku-/Testdata-/Tooling-Linie.

**Eine Java-Sprachautorität.** Die Extension enthält keinen `.ili`-Parser, keinen Symbol-/Typindex und keine Rename-/Importlogik. Sie startet den echten Java-LSP über `LanguageClient` und liefert nur Hostfunktionen. Snippets und Modellvorlage sind statische Ressourcen, keine zweite Semantik. Die Standard-LSP-Funktionen kommen vom Server; die Extension registriert keine konkurrierenden Definition-/Rename-/Diagnosticprovider.

**Keine Altprojektabhängigkeit.** Ich habe nicht nur `grep @ilic` ausgeführt: `package.json`, `package-lock.json`, der vollständige `npm ls --all`-Graph, das gebündelte `out/extension.cjs` und alle Quellimporte wurden geprüft. Kein `@ilic/*`, kein `interlis-language-tools`, kein `ilic.wasm`, kein Git-/`file:`-/`workspace:`-Link, keine unerwartete Registryquelle. Die beiden übernommenen Syntaxressourcen sind passive, lizenzierte Quellen; ihre in `docs/provenance/source-adoptions.md` genannten SHA-256 stimmen exakt (`989a3f5b…`, `7fae0314…`). Das ist erlaubte Quellübernahme, keine Abhängigkeit.

**Start-/Sicherheitsgrenze.** `resolveLaunchPlan` verlangt ein absolutes Java-25-Binary, prüft das vollständige JAR-Inventar gegen das Lock, lehnt zusätzliche/fehlende Bibliotheken ab und startet mit Argumentarray und `shell:false`. Der Pfad ist nicht aus Webview-/Dokumenttext ableitbar. Start erfolgt nur in vertrauenswürdigen Workspaces; im untrusted Fall bleibt nur die passive Sprachressource. Fehler werden als Status `Error` und verständliche Meldung sichtbar (eigene Gegenprobe, Abschnitt 7). Der Client setzt `revealOutputChannelOn: 4`; in `vscode-languageclient` 9.0.1 bedeutet 4 tatsächlich `Never`, also kein automatisches Output-Reveal und kein beobachteter Fokusdiebstahl.

**Keine zweite Rendererquelle / kein UML in V0.** Es gibt keine Diagramm-, Sprotty-, ELK- oder Repositoryimplementierung in der Extension. Das ist für V0 korrekt und keine Abkürzung: V2 ist gesperrt, bis V0 bestanden ist.

**Grenzen, die V0 ausdrücklich offenlässt (keine Verletzung):** technische Baseline-Diagnoseprosa (V1), flache Outline (V1), Workspace-Compile statt rootspezifischem Compile (V1), externe Repositories/Readonly (V1), vollständige Snippets/AutoClose/QuickFixes (V4), UML (V2/V3), Dokumente (V4), gebündelte Runtime/Plattformen/Remote (V5). Der Bericht und README markieren diese Grenzen ehrlich.

## 3. Jede fällige Muss-AC

| AC-ID | erfüllt / verletzt / nicht prüfbar | eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V0-01 | erfüllt | Beide detached Worktrees an den Kandidaten-SHAs; Tracked-Status leer; Core-Tree phaseBase = candidate, Diff leer; Änderungen seit `b8051493` nur CLI/Docs/Testdata/Tools; Extension-Diff und neue Eigentümerschaft in `package.json`, `release/editor-artifacts.lock.json`, `docs/implementation/vscode-extension/implementation/V0.md`, `docs/provenance`. Keine CLI-Reimplementierung in der Extension. | Kein Muss-Finding. Die Behauptung „fremde Änderungen im Originalcheckout erhalten“ ist eine Prozessaussage des Implementierers; ich habe den Originalcheckout gemäss Scope nicht verändert und nur die detached Review-Worktrees geprüft. |
| V0-02 | erfüllt | `package.json`: ID `edigonzales.interlis-vscode`, `interlisGuru.*`-Commands/Settings, Sprache `interlis`, Grammatik, Snippets, Template; `resources/templates/model.ili`; `resources/snippets/interlis.json`; GUI-Gegenprobe `positive-4` (Template und `topic`-Snippet über echte Palette/QuickPick); Extension-Host-Test (Template ungespeichert). Abhängigkeitsprüfung siehe V0-01. | Kein Muss-Finding. |
| V0-03 | erfüllt | `test:protocol` startet die entpackte Java-Distribution über stdio: Initialize, didOpen, Diagnose, Definition, `interlis.compile`, Shutdown/Exit 0, saubere LSP-Rahmung; `java-lsp` 6/6; `test:unit` prüft fehlende/relative Java-Pfade, fehlendes Java-Binary, manipulierte Serverbytes, falsche Java-Version; eigene GUI-Gegenprobe `negative-2` mit Java 21: Status `Error`, Meldung „INTERLIS requires Java 25 without preview.“, kein Ready, kein Java-Prozess; eigene Pfadprüfung: fehlendes Serververzeichnis und fehlende Bibliothek werden abgelehnt. | Kein Muss-Finding. |
| V0-04 | erfüllt | VSIX-Hash und Inhalt geprüft; `out/extension.cjs` im VSIX = aktueller Kandidatenbuild; 11 Server-JARs im VSIX = Lock; frisch aus dem Kandidaten neu gepacktes VSIX ist in allen Nutzdateien byte-identisch (nur ZIP-Zeitstempel unterscheiden den Containerhash). GUI-Smoke `2026-11-01T15-29-43-225Z`: isoliertes Profil, installierte ID/Version, echter Server, gültiges Modell, per Tastatur erzeugter Typfehler, Problems mit echter Zeile 8, F12 auf Zeile 5, Format/Undo/Redo, Stop/Restart ohne Dirtyverlust, frische Diagnose nach Restart. | Kein Muss-Finding. Das „ungültige Modell“ wird matrixkonform (GUI-02) durch echtes Tippen in eine gültige Quelle erzeugt, nicht als separate ungültige Datei geöffnet. |
| V0-05 | erfüllt | ExTester/Selenium mit echter Workbench, echten Tastatur-/Pointeraktionen, installiertem VSIX und realem Java-LSP. Die Hauptsuite und meine beiden eigenen GUI-Gegenproben liefen in je eigenen temporären Profilen. Lesende DOM-/Screenshotnutzung dient nur als Orakel; keine zustandsändernde `page.evaluate`-Abkürzung. Negative Canary `2026-11-01T15-32-28-934Z` endet tatsächlich mit Exit 1 (2/3 Cases). | Kein Muss-Finding. Die Extension-Host-APIprüfung ist separat und wird nicht als GUI gezählt. |
| V0-06 | erfüllt | `docs/implementation/vscode-extension/implementation/V0.md`, `STATUS.md`, `docs/provenance/source-adoptions.md`; Feature-/Paritätsdelta (F01/F10/F12/F17/F22/F55/F56/F59/F60 für V0, Rest später); konkrete Versionspins in `package.json`/README/Report; Sourceadoptions-Hashes exakt verifiziert; Lizenznotizen aus dem tatsächlichen esbuild-Graph; risikobasierte Gate-Tabelle; keine V1+-Implementierung im Extension-Code. | Kein Muss-Finding. |
| V0-07 | erfüllt | Dieser unabhängige Review auf beiden SHAs; eigene neue Start-/Editor-GUI-Gegenprobe (`positive-4`) und eigene negative Java-Konfigurationsgegenprobe (`negative-2`); relevante Bilder visuell geprüft; Urteil PASS für den Inhalt. | Der äussere Guard-/Transportabschluss und die Artefaktidentitätskontrolle nach Prozessende bleiben Codex vorbehalten (Plan §11.5); das ist kein offener Muss-Befund des Inhaltsreviews. |

## 4. Featureparität (V0-Scope)

| F-ID | V0-Umsetzung / tatsächlicher Pfad | Grenze |
|---|---|---|
| F01 | `.ili`/`.ILI`, Sprach-ID `interlis`, TextMate-Grammatik und Sprachkonfiguration; GUI-01 zeigt echte Syntaxhervorhebung. | Metaattribut-/Kommentar-Feinheiten und vollständige Parität sind nicht V0-Gegenstand. |
| F10 | Whole-document-Formatierung über den Java-LSP; GUI-03 (Format, Undo, Redo). | Formatterparität im Detail ist V1. |
| F12 (einfach) | Drei statische Snippets (`model`, `topic`, `class`); eigene GUI-Gegenprobe fügt `topic` über echte Palette/QuickPick ein. | Vollständige Slots/Placeholder sind V4. |
| F17 | Eingebettete Vorlage `resources/templates/model.ili` über `interlisGuru.newFromTemplate`; GUI-Gegenprobe und Extension-Host. | Optionale HTTPS-Vorlage ist V4. |
| F22 | Status Starting/Ready/Stopped/Error/Trust required; Stop/Restart-Commands; GUI-03 und negative Gegenprobe; kein automatischer Restartloop (`DoNotRestart`). | Crash-/Restart-/Multi-root-Härte ist V5. |
| F55 | Installiertes VSIX im isolierten Profil; GUI-01 und eigene Gegenproben. | Gebündelte Runtime/Plattformpakete sind V5. |
| F56 | Konflikt-Warnung bei anderer Extension mit Sprache `interlis`; Code geprüft. | Nicht mit einer zweiten real installierten INTERLIS-Extension GUI-exerziert; kein V0-AC, für V1/V5 nachzuholen. |
| F59 | Keine Altprojektabhängigkeit im Lock, im vollständigen Graph, im Bundle und in Quellimporten. | – |
| F60 | Echte installierte Workbench, echte Tastatur/Pointer, Screenshots und Assertions; eigene Gegenproben. | – |

Nicht implementiert und daher nicht als V0-Erfolg behauptet: F02–F09/F11/F19–F21 (V1), F13–F16/F18 (V4), F23–F46 (V2/V3), F47–F52 (V4), F53/F54 (V5). F56 ist als Code-/Warnpfad vorhanden, aber nicht GUI-exerziert.

## 5. Risikobasierte Tests

| Gate/Case | fällig warum / nicht fällig warum | ausgeführtes Kommando und cwd | Exit / Tests / Fehler / Skips | eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
| T0 Abhängigkeiten/Inventory | Extensionhost/Staging/Paket neu | `npm ci --ignore-scripts` (extension) | 0 | eigener Lauf | `checks/prepare-dependencies.log` |
| T0/Core-Artefakt | Lock und Serverinventar | `npm run stage:core -- --core-dir /Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/core` (extension) | 0; Lock-Hash vor/nach identisch; 11 JARs = Lock | eigener Lauf | `checks/prepare-core-distribution.log`, `checks/lock-before.sha256`, `checks/lock-after.sha256`, `checks/staged-server-hashes.txt` |
| T3 Build | TS-Check/Bundle/Lizenzen | `npm run build` (extension) | 0 | eigener Lauf | `checks/build.log` |
| T3 Unit/Manifest | Hostpfade, Korruption, falsche Java-Version, Manifest/Ressourcen | `npm run test:unit` (extension) | 0; 5 Tests, 5 Pass, 0 Fail/Skip | eigener Lauf | `checks/unit.log` |
| T2 Protokoll | echter stdio-Prozess, reales Fixture, Definition, Compile, Shutdown | `npm run test:protocol` (extension) | 0; 1 Test, 0 Fail/Skip; Core `76df381…`, Exit 0 | eigener Lauf | `checks/protocol.log` |
| T1 Java-LSP | vorhandene Initialize-/Prozess-/Shutdowntests | `./gradlew :interlis-lsp:test --tests guru.interlis.lsp.LspServerTest --tests guru.interlis.lsp.LspProcessTest --no-daemon` (core) | 0; 6 Tests (4+2), 0 Fail/Skip | eigener Lauf | `checks/java-lsp.log`; XML: `core/interlis-lsp/build/test-results/test/TEST-*.xml` |
| T0 Dependency-Graph | vollständiger npm-Graph und Bundle | `npm run verify:no-legacy-dependencies` (extension) | 0 | eigener Lauf | `checks/dependency-graph.log` |
| T4 Extension-Host | echte VS-Code-APIs, Aktivierung, Definition, Template | `npm run test:extension-host` (extension) | 0; 3 Prüfgruppen, Extension-Host Exit 0 | eigener Lauf | `checks/extension-host.log` |
| T4 GUI-01..03 | installiertes VSIX, echter Java-LSP, Maus/Tastatur | `npm run test:gui -- --suite smoke --vsix /Users/stefan/sources/interlis-vscode/build/packages/interlis-vscode-darwin-arm64.vsix --cache /Users/stefan/sources/interlis-vscode-evidence/gui-preflight/storage` (extension) | 0; 3/3 Cases | eigener Lauf | `checks/installed-gui.log`; `extension/build/reports/gui/smoke/2026-11-01T15-29-43-225Z/` |
| T4 Negativcanary | Harness muss bei unmöglicher Sichtbedingung scheitern | `npm run test:gui -- --suite smoke --vsix /Users/stefan/sources/interlis-vscode/build/packages/interlis-vscode-darwin-arm64.vsix --cache /Users/stefan/sources/interlis-vscode-evidence/gui-preflight/storage --canary missing-status` (extension) | 1 (erwartet); 2/3 Cases, GUI-01 absichtlich rot | eigener Lauf | `checks/negative-canary.log`; `extension/build/reports/gui/smoke/2026-11-01T15-32-28-934Z/` |
| T5 VSIX-Reproduktion | Artefakt aus Kandidaten neu packen und Inhalt vergleichen | `npm run package:vsix -- --target darwin-arm64` (extension) | 0; Containerhash `8ba178…` (nur ZIP-Zeitstempel), alle Nutzdateien byte-identisch zum Request-VSIX | eigener Lauf + Inhaltsvergleich | `checks/package-vsix.log` |
| T3 Launch-Negativpfade | fehlendes Bundle/fehlende Bibliothek | `node ../evidence/checks/launch-negative-paths.cjs` (extension) | 0; fehlendes Verzeichnis/Bibliothek abgelehnt, gepacktes Inventar akzeptiert | eigener Lauf | `checks/launch-negative-paths.cjs`, `checks/launch-negative-paths.log` |
| T6 Compiler-Konformanz | **nicht fällig**: keine Parser-/Typ-/Query-/IR-Änderung; Core-Diff phaseBase→candidate leer; seit `b8051493` nur CLI/Docs/Testdata/Tools | – | – | – | Core-Diffanalyse |
| T3 Browser/Safari/WASM | **nicht fällig**: keine Diagramm-/Projektor-/Browseränderung; gemeinsamer Renderer startet erst V2 | – | – | – | Diff/Manifest |
| T5 Crossplatform/Remote | **nicht fällig**: gebündelte Runtime, Linux/Windows/Remote sind V5; V0 qualifiziert explizit Java 25 auf macOS arm64 | – | – | – | Plan §7/§10.3, V0-Bericht |

Keine fällige Prüfung fehlt; die drei nicht fälligen Gates sind mit dem tatsächlichen Diff begründet und nicht nachträglich zum Bestehen abgewählt.

## 6. Echte GUI und Sichtprüfung

**Eigener Hauptlauf.** `installed-gui` mit dem Request-VSIX, isoliertem Profil und echtem Java-LSP: 3/3 Cases, Exit 0. Manifest: `extension/build/reports/gui/smoke/2026-11-01T15-29-43-225Z/manifest.json`; installiert `edigonzales.interlis-vscode@0.0.1`, Bundlehash `0f98c54a7575cc3e53320940f93109424a64520c88315b50c55493cd617eccf8`, Serverstarts PIDs 9566/9887, danach `remaining: []`, `extensionShaAfter = d8f8adeb89e26f8a979744b81299d51da45cf0fe`. Das Manifest notiert als einzige Dirty-Zeile `?? opencode.json` (Transportkonfiguration, kein getrackter Produktstand).

**Tatsächlich angesehene Bilder und Beobachtungen:**

- `GUI-01-ready.png`: echte Workbench, Explorer mit „UNICODE MODELLE/Example.ili“, Editor mit Syntaxfarben, Status `INTERLIS: Ready`, Sprache `INTERLIS`. Keine abgeschnittenen Controls, kein leeres Panel.
- `GUI-02-error.png`: `height : MissingHeight;`, Problems mit genau einem Fehler `ILI-SEM-0001`, Zeile 8, Spalte 16; Meldung ist noch technische Baselineprosa (V1-Grenze, kein V0-Fehler). Navigation per Doppelklick auf die Problems-Zeile, Cursor auf Zeile 8.
- `GUI-02-corrected.png`: nach Tastatureingabe `Height`, Problems leer; Text unverändert semantisch.
- `GUI-03-formatted.png`: formatierter Text, Einrückung sichtbar, keine Clipping-/Überlappungsprobleme.
- `GUI-03-output.png`: echt geöffneter Output-Kanal, LSP-Trace sichtbar (Hover-Antwort); kein ANSI/Chaos.
- `GUI-03-restarted-error.png` / `GUI-03-restarted.png`: nach Stop/Restart ist der Dirtybuffer erhalten; nach erneutem Tippen erscheint eine frische Diagnose, nach Korrektur ist Problems leer; Status `Ready`; Tab zeigt Dirtypunkt.
- Canary `failure-GUI-01.png`: Workbench ist korrekt `Ready`, aber der Test erwartete absichtlich einen unmöglichen Status; der Harness scheitert mit Exit 1 und zählt keinen PASS. PIDs danach `[]`.

**Eigene Gegenproben (Bilder ebenfalls angesehen):**

- `counterprobes/positive-4/probe-01-ready.png`: eigenes Modell unter `Andere Modelle/O'Brien Modell.ili` (Leerzeichen, Apostroph, Nicht-ASCII), Status `Ready`, Sprache `INTERLIS`.
- `probe-02-f12.png`: F12 landet auf der eigenen Domaindeklaration (Zeile 5), nicht auf einem fremden Ziel.
- `probe-03-problem.png`: eigener Typfehler `Undefined` erscheint in Problems (Zeile 8, Spalte 16), danach Korrektur zu `Distance`; Problems leer.
- `probe-04-template.png`: `INTERLIS: New Model from Template` öffnet ein ungespeichertes INTERLIS-Dokument mit `MODEL Example`.
- `probe-05-snippet.png`: contributed `topic`-Snippet wird über echte Palette/QuickPick eingefügt (`TOPIC Data = … END Data;`); der absichtlich angehängte Block erzeugt erwartungsgemäss einen Syntaxfehler, das Snippet selbst ist sichtbar und vollständig.
- `counterprobes/negative-2/probe-negative-error.png`: Java 21 als `javaPath`; Status `INTERLIS: Error`, sichtbare Meldung „INTERLIS: INTERLIS requires Java 25 without preview.“, **kein** Ready, **kein** Serverstart.

**Source-/Bufferunverändertheit:** In V0 gibt es keine Diagramm-/Layoutaktion, die `.ili` verändern könnte. Die einzigen Textänderungen sind bewusste Editorbenutzeraktionen in GUI-02/03 (Tippen, Format, Undo/Redo). Die GUI-03-Assertions prüfen den Dirtybuffer und den semantisch gleichen Text; der Restart verliert keine ungespeicherte Änderung.

**Export/Dialoge/Plattform/Remote:** In V0 nicht implementiert und nicht behauptet. Kein Plattform-/Remote-PASS; das ist V5.

## 7. Neue Gegenproben

**7.1 Positiv: eigener Start-/Editor-/Snippetpfad.**
Hypothese: Der installierte Host funktioniert auch mit einem selbst gewählten, anders benannten Modell in einem Pfad mit Leerzeichen, Apostroph und Nicht-ASCII, und die contributed Snippets/Templates sind echte Benutzerpfade, nicht nur Manifesteinträge. Aktionen: eigenes Fixture `evidence/counterprobes/fixtures/Andere Modelle/O'Brien Modell.ili`; Explorer-Doppelklick; auf `INTERLIS: Ready` warten; F12 von `Distance`-Nutzung; Typfehler tippen; Problems öffnen; korrigieren; Template über Palette; `topic`-Snippet über `Insert Snippet` und QuickPick. Erwartet: Ready, Sprache INTERLIS, F12 Zeile 5, Fehler sichtbar und verschwindet, Template ungespeichert, Snippettext sichtbar. Tatsächlich: 2/2 Cases, Exit 0, ein echter Java-Start (PID 40211), danach keine Rest-PIDs; Belege `counterprobes/positive-4/`. Falsifizierbar wäre ein falscher Sprung, ein ausbleibender Fehler oder ein fehlendes Snippet; der erste Entwurf war durch einen F12-Bereitschaftswettlauf bzw. eine falsche QuickPick-Gross-/Kleinschreibung rot und wurde mit begrenzten Wiederholungen bzw. case-insensitivem Match korrigiert. Das ist eine Harness-Robustheitsbeobachtung, kein Produktfehler des geprüften Kandidaten.

**7.2 Negativ: falsche Java-Konfiguration im installierten Produkt.**
Hypothese: Das installierte VSIX lehnt Java 21 sichtbar ab und startet keinen Server. Aktionen: isoliertes Profil, `interlisGuru.server.javaPath` auf ein echtes ausführbares Java-21-Skript; eigenes Fixture öffnen. Erwartet: Status `Error`, Meldung mit Java-25-Anforderung, nie `Ready`, kein Java-LSP-Prozess. Tatsächlich: 1/1 Case, Exit 0; Status `Error`; sichtbare Meldung; `serverStarts: []`, `remainingServerPids: []`; Beleg `counterprobes/negative-2/`. Der erste Versuch war wegen fehlendem `chmod +x` ein EACCES-Fall (also „nicht ausführbar“ statt „falsche Version“); nach Korrektur wurde die echte Java-21-Ablehnung geprüft. Beides sind gültige negative Konfigurationsfälle; der finale Beleg ist der Java-21-Fall.

## 8. Findings / Blocker

**Offene Muss-Findings:** keine.

**Optionale Beobachtungen (nicht abnahmewirksam, keine V0-Verletzung):**

1. **F12-Bereitschaftswettlauf in einem frischen GUI-Kontext.** In meinem ersten eigenen Gegenprobenentwurf konnte F12 direkt nach `Ready` ins Leere laufen, weil `Ready` den Prozessstart, nicht den Abschluss der ersten Analyse signalisiert. Die ausgelieferte GUI-03-Sequenz ist davon nicht betroffen, weil sie nach GUI-02 bereits Diagnosen gesehen hat; meine finale Probe wartet mit begrenzten Wiederholungen. Empfehlung für V1: in GUI-Suiten vor F12 auf eine sichtbare Analyse-/Outline-Bedingung warten oder F12 begrenzt wiederholen.
2. **`editor-basic`-Fixture ist minimal.** Die Matrix §3 nennt für diese Familie zusätzlich Warnung, strukturierte Kommentare und Metaattribute; die V0-Fixture enthält nur ein gültiges Modell. Für V0-04/GUI-02 ausreichend (Fehler wird getippt), für V1 sollte die Fixturefamilie erweitert werden.
3. **Fehlendes Serververzeichnis** wird als rohes `ENOENT` abgelehnt (funktional korrekt, aber wenig benutzerfreundlich). V1-Kandidat für eine verständlichere Hostmeldung.
4. **Review-Transport** legt `opencode.json` untracked im Extension-Worktree an. Das ist die äussere Revieworchestrierung, keine Produktänderung; Codex sollte es bei der finalen Baumprüfung als Transportartefakt behandeln.

**Fehlende Pflichtnachweise:** keine. **Blocker:** keine.

## 9. Urteil

**PASS** (inhaltlich, für V0).

Begründung: Beide Kandidaten-SHAs sind korrekt und tracked sauber; die Core-Produktbasis ist in dieser Phase unverändert; die Extension ist eine dünne, echte Hostintegration ohne zweite Sprachsemantik und ohne Altprojektabhängigkeit. Der echte Java-LSP startet aus dem gelockten Artefakt, bleibt stdio-protokollrein, wird sauber beendet und lehnt fehlende/falsche Java-/Bundlekonfiguration ab. Das VSIX ist reproduzierbar, enthält Client, Server-JARs und Lizenzen, und GUI-01–03 bestehen mit echten Maus-/Tastaturaktionen in einem isolierten Profil; die Negativcanary scheitert wie gefordert. Meine eigenen neuen Gegenproben (eigener Unicode-/Apostrophpfad mit F12/Problems/Template/Snippet sowie falsche Java-Version) bestätigen den Pfad unabhängig. Alle fälligen Gates sind ausgeführt; die nicht fälligen Gates sind mit dem tatsächlichen Diff begründet.

**Nächster erlaubter Schritt:** V1 erst nach dem äusseren Guard-/Transportabschluss und der Artefaktidentitätskontrolle durch Codex sowie der unveränderten Ablage dieses Berichts/`verdict.json`; keine Publikation, kein Push, kein Release.
