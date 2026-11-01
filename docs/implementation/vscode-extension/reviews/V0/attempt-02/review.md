# Unabhängiger Review V0 – INTERLIS VS Code

**Reviewer:** Agent B (OpenCode 2.x, DeepSeek-V4.1-Flash-1017 über die direkte DeepSeek API)
**Datum:** 2026-11-01
**Auftrag:** V0, Kandidatenpaar Core `76df3815973597280845a9bb575fa399e9773ccc` / Extension `d8f8adeb89e26f8a979744b81299d51da45cf0fe`.
**Besonderer Prüfauftrag dieser Runde:** unabhängige Korrektur der Bildbeleg-Attribution am unveränderten V0-Produktpaar; das frühere Inhalts-PASS wird nicht übernommen, sondern neu geprüft.

## 1. Identität

| Feld | Wert |
|---|---|
| Phase | V0 (nicht kumulativ; V1–V5 gesperrt) |
| OpenCode | `opencode v2.0.28` (`/Users/stefan/.opencode/bin/opencode --version`, selbst ausgeführt) |
| Provider / API-Modell | `deepseek` / `deepseek/deepseek-flash` (API-Modellname `deepseek-flash`) |
| API-Host | `https://api.deepseek.com` (Projektprofil `opencode.json`; kein Proxy-/OpenRouter-Pfad verwendet) |
| Aliasnachweis | Eigener Abruf von `https://api-docs.deepseek.com/quick_start/pricing/` am 2026-11-01: Tabelle nennt `MODEL deepseek-flash`, `MODEL VERSION DeepSeek-V4.1-Flash-1017`, `BASE URL https://api.deepseek.com`. Zusätzlich `/Users/stefan/sources/interlis-vscode-evidence/preflight/model-identity.json` (provider `deepseek`, model `deepseek-flash`, officialMapping `DeepSeek-V4.1-Flash-1017`, geprüft 2026-11-01, Proxy-/BaseURL-Env unset) und `opencode models` (`deepseek/deepseek-flash` vorhanden). Keine Selbstauskunft des Modells als Identitätsbeleg. |
| Core assignmentBase | `20b0029d824b3602d9a304320bf0feae4c35c1f9` |
| Core phaseBase | `20b0029d824b3602d9a304320bf0feae4c35c1f9` |
| Core candidate / tatsächlicher HEAD | `76df3815973597280845a9bb575fa399e9773ccc` (detached `HEAD`) |
| Extension assignmentBase | `73badd9807f407aea048d397af5549fe907a1501` |
| Extension phaseBase | `73badd9807f407aea048d397af5549fe907a1501` |
| Extension candidate / tatsächlicher HEAD | `d8f8adeb89e26f8a979744b81299d51da45cf0fe` (detached `HEAD`) |
| Tracked Zustand vorher/nachher | Core: leer/leer. Extension: leer/leer; einzige untracked Datei `opencode.json` (Review-Transport der äusseren Orchestrierung, keine Produktdatei). Alle eigenen Build-/Probeausgaben liegen unter ignorierten `build/`- bzw. Evidence-Pfaden. |
| Core-Inhaltsdiff phaseBase→candidate | leer; beide Trees `393d5980cd079b07f564e9e451b45926127136ca`. Der Basis-SHA `20b0029…` ist allerdings **kein Ancestor** des Kandidaten `76df381…` (Squash-Record auf parallelem Zweig); der Inhalt ist identisch. Der aktuelle Original-Core-`main` steht auf `fd07e194f14c8ee46debe930871a6c18fb72242d` (Nachfahre von `76df381`); dieser fremde, neuere Stand wurde von mir nicht verändert. |
| Core-Diff seit Recherchepin `b8051493` | 50 Dateien, ausschliesslich `interlis-compiler-cli`, Docs/Implementation, Testdata und Tools; **keine** Änderung an `interlis-compiler`/`interlis-lsp`/`interlis-model`/`interlis-projection`/`interlis-repository`/`interlis-workspace` unter `src/main` oder `src/test`. |
| Extension-Diff | 33 Dateien, +6311/−1 seit `73badd9`: dünner Host, Build-/Staging-/Paket-/GUI-Skripte, Tests, passive Sprachressourcen, Herkunft/Lizenzen, Artefaktlock, Doku; kein UML-/Repository-/Dokumentationscode. |
| VSIX | `/Users/stefan/sources/interlis-vscode/build/packages/interlis-vscode-darwin-arm64.vsix`, SHA-256 `1f2142f761594705d44390cdf382d610cfeebb90ff3ce824b054bedf3cbfa38d`, 25 Dateien, ID `edigonzales.interlis-vscode@0.0.1`, Target `darwin-arm64`. |
| Client-Bundle | `out/extension.cjs` SHA-256 `0f98c54a7575cc3e53320940f93109424a64520c88315b50c55493cd617eccf8`; identisch im Worktree-Build, im Request-VSIX und im von mir neu gepackten VSIX. |
| Server | 11 JARs gemäss `release/editor-artifacts.lock.json` (Lock-SHA-256 `bc4674f61986220998f19c72170725c09c8dfa0ab4017e3989c5a12b79404213`); alle JAR-Hashes in Worktree, Request-VSIX und Request-Artefaktliste identisch; `stage:core` aus dem Kandidaten erzeugte denselben Lock und dieselben 11 JARs. |
| Runtime | Temurin `25.0.3+9`, Java-Binary SHA-256 `0a1eea36b7899323b32caab6f1d0e416ad7208792b076391278062efab4b15d8` (V0: explizit extern, keine gebündelte Runtimebehauptung). |
| GUI-Umgebung | VS Code 1.140.0 (isoliert aus Cache entpackt), ExTester 8.28.1, ChromeDriver 150.0.7871.250, macOS 24.6.0 arm64. Eigener frischer Lauf `2026-11-01T16-02-58-070Z`, Storage `/var/folders/rp/xw19bm096bv14zzhq2ybnttm0000gn/T/ili-gui-9kMLRE`, Java-PIDs 45967/46031, danach `remaining: []`. |

Der äussere Guard-/Transportabschluss ist aus meiner noch laufenden Session **nicht** feststellbar. Ich behaupte ihn nicht; Codex prüft ihn nach Prozessende (Plan §11.5). Mein Urteil ist ein inhaltliches Review-Urteil.

### 1.1 Korrektur der Bildbeleg-Attribution

Der äussere Audit des früheren Laufs (`/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/outer-audit-incomplete.json`) beanstandete fünf Bildpfade, für die im damaligen Sessionprotokoll keine abgeschlossene Bild-Leseaktion nachweisbar war:

- `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/extension/build/reports/gui/smoke/2026-11-01T15-29-43-225Z/GUI-02-corrected.png`
- `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes/positive-4/probe-01-ready.png`
- `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes/positive-4/probe-02-f12.png`
- `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes/positive-4/probe-03-problem.png`
- `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes/positive-4/probe-04-template.png`

Diese Dateien existieren tatsächlich. Ich habe sie in **dieser frischen Session** mit dem bildfähigen Read-Werkzeug geöffnet und visuell geprüft (SHA-256: `GUI-02-corrected` `e06568bb…`, `probe-01-ready` `85136c4e…`, `probe-02-f12` `5c38a7f6…`, `probe-03-problem` `73c78154…`, `probe-04-template` `f9b6e6f9…`). Ich übernehme keine damalige Lese-Behauptung; die folgenden Bildaussagen stützen sich ausschliesslich auf in dieser Session geöffnete Dateien. Zusätzlich habe ich die übrigen relevanten Bilder des früheren Laufs sowie alle Bilder meines eigenen frischen GUI-Laufs und meiner Gegenprobe geöffnet (vollständige Liste in Abschnitt 6).

## 2. Eigene Ziel-, Code- und Architekturprüfung

**Relevanter Diff.** Die Extension ist ein neuer, dünner Host: `src/extension.ts` (LanguageClient-Start, Status, Stop/Restart, Template, Trust-Grenze), `src/host/launch.ts` (Lock-/Inventar-/Java25-Prüfung, Argumentarray), Build-/Staging-/Paket-/GUI-Skripte, Tests, passive Syntax-/Snippet-/Template-Ressourcen, Lizenzen/Herkunft, Artefaktlock und Doku. Der Core hat in diesem Paar keine Produktänderung; der Inhalt ist zum Basisstand identisch. Die 50 Dateien seit `b8051493` liegen ausschliesslich in der bereits abgenommenen CLI-/Doku-/Testdata-/Tooling-Linie.

**Eine Java-Sprachautorität.** Die Extension enthält keinen `.ili`-Parser, keinen Symbol-/Typindex, keine Import-/Rename-Engine und keinen Compiler-CLI-Aufruf für «Compile Current». Sie startet den echten Java-LSP aus dem gepinnten Distributionsartefakt über `LanguageClient`; F12, Diagnosen, Formatierung usw. kommen vom Server. Snippets und Modellvorlage sind statische Ressourcen, keine zweite Semantik. Die Extension registriert keine konkurrierenden Definition-/Rename-/Diagnosticprovider.

**Keine Altprojektabhängigkeit.** Geprüft wurden nicht nur `grep`-Treffer, sondern `package.json`, `package-lock.json`, der vollständige `npm ls --all`-Graph, das gebündelte `out/extension.cjs` und die Quellimporte: kein `@ilic/*`, kein `interlis-language-tools`, kein `ilic.wasm`, kein `file:`-/`workspace:`-/Git-Link, keine unerwartete Registryquelle. Die beiden übernommenen Syntaxressourcen sind passive, lizenzierte Quellen; ihre in `docs/provenance/source-adoptions.md` genannten SHA-256 stimmen exakt (`989a3f5b…` für `interlis.tmLanguage.json`, `7fae0314…` für `language-configuration.json`). Das ist erlaubte Quellübernahme, keine Abhängigkeit. `npm ci --ignore-scripts` installierte den Lock reproduzierbar.

**Start-/Sicherheitsgrenze.** `resolveLaunchPlan` verlangt ein absolutes Java-25-Binary, prüft das vollständige 11-JAR-Inventar gegen das Lock, lehnt zusätzliche/fehlende Bibliotheken und Digest-Abweichungen ab und startet mit Argumentarray und `shell:false`. Der Pfad ist nicht aus Dokument-/Webviewtext ableitbar; `javaPath`/`bundlePath` sind `machine`-scoped. Start erfolgt nur in vertrauenswürdigen Workspaces; im untrusted Fall bleibt die passive Sprachressource. Fehler werden als Status `Error` und sichtbare Meldung ausgegeben; mein neuer Tamper-Gegenfall bestätigt das am installierten Produkt.

**Keine zweite Rendererquelle / kein UML in V0.** Es gibt keine Diagramm-, Sprotty-, ELK-, Repository- oder Dokumentationsimplementierung in der Extension. Das ist für V0 korrekt; V2 ist bis zu einem V0-PASS gesperrt. Die im Plan geforderte spätere einzige Rendererquelle ist noch nicht Gegenstand dieser Phase.

**Ehrlich offen gelassene Grenzen (keine V0-Verletzung):** technische Baseline-Diagnoseprosa (V1), flache Outline (V1), Workspace-Compile statt rootspezifischem Compile (V1), externe Repositories/Readonly (V1), vollständige Snippets/AutoClose/QuickFixes (V4), UML (V2/V3), Dokumentation (V4), gebündelte Runtime/Plattformen/Remote (V5). `README`, `STATUS.md` und `V0.md` benennen diese Grenzen.

## 3. Jede fällige Muss-AC

| AC-ID | erfüllt / verletzt / nicht prüfbar | eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|
| V0-01 | **erfüllt** | Beide detached Worktrees an den Kandidaten-SHAs; `git status --porcelain=v1` tracked leer; Core-Tree phaseBase = candidate = `393d598…`; Extension-Diff 33 Dateien; Core-Diff seit `b8051493` nur `interlis-compiler-cli`/Docs/Testdata/Tools; neue Eigentümerschaft in `package.json`, `release/editor-artifacts.lock.json`, `docs/implementation/vscode-extension/implementation/V0.md`, `docs/provenance/source-adoptions.md`; Original-Core-`main` `fd07e19…` als fremder Nachfahre unverändert vorgefunden. | Kein Muss-Finding. Prozessbeobachtung: der Basis-SHA `20b0029…` ist kein Ancestor von `76df381…`, obwohl die Trees identisch sind; das ist im V0-Bericht als externe Baseline-Fortschreibung dokumentiert und ändert keinen Produktinhalt. |
| V0-02 | **erfüllt** | `package.json`: ID `edigonzales.interlis-vscode`, Commands `interlisGuru.restartServer/stopServer/showOutput/newFromTemplate`, Settings `server.javaPath`/`server.bundlePath`/`trace.server`, Sprache `interlis`, Grammatik, Snippets, Template; `resources/templates/model.ili`; `resources/snippets/interlis.json` (model/topic/class); eigener frischer Extension-Host-Test (Aktivierung/Commands, ungespeichertes Template); frühere GUI-Belege `positive-4` (Template und `topic`-Snippet über Palette/QuickPick) visuell geprüft; Abhängigkeitsprüfung siehe V0-01. | Kein Muss-Finding. |
| V0-03 | **erfüllt** | Eigener `test:protocol`-Lauf: echter stdio-Prozess aus der entpackten Distribution, Initialize, didOpen, Diagnose, Definition, `interlis.compile`, Shutdown/Exit 0, saubere LSP-Rahmung; Core `76df381…`, Exit 0. Eigener `java-lsp`-Lauf: 6 Tests (4 `LspServerTest` + 2 `LspProcessTest`), 0 Fail/Skip. Eigene `test:unit`: 5/5, darunter fehlende/relative Java-Pfade, fehlendes Java-Binary, manipulierte Serverbytes, falsche Java-Version. Eigener `launch-negative-paths`-Lauf: fehlendes Serververzeichnis und fehlende Bibliothek abgelehnt, gepacktes Inventar akzeptiert. Neuer installierter GUI-Tamper-Gegenfall: `Error`, sichtbare Digest-Meldung, kein Ready, keine Java-PID. | Kein Muss-Finding. |
| V0-04 | **erfüllt** | VSIX-Hash und Inhalt geprüft (25 Dateien; Client-Bundle und 11 JARs identisch zu Lock/Request); aus dem Kandidaten neu gepacktes VSIX in allen Nutzdateien byte-identisch (Containerhash `ff39b09d…` nur wegen ZIP-Zeitstempeln). Eigener frischer installierter GUI-Lauf `2026-11-01T16-02-58-070Z`: isoliertes Profil, installierte ID/Version, echter Java-LSP, gültiges Modell, per Tastatur erzeugter Typfehler, Problems mit echter Zeile 8, F12 auf Zeile 5, Format/Undo/Redo, Stop/Restart ohne Dirtyverlust, frische Diagnose und Korrektur nach Restart; 3/3, Exit 0, `remaining: []`. | Kein Muss-Finding. Das «ungültige Modell» wird matrixkonform (GUI-02) durch echtes Tippen in eine gültige Quelle erzeugt, nicht als separate ungültige Datei geöffnet. |
| V0-05 | **erfüllt** | ExTester/Selenium mit echter Electron-Workbench, echten Tastatur-/Pointeraktionen, installiertem VSIX und realem Java-LSP; eigener frischer Lauf in eigenem temporären Profil. Lesende DOM-/Screenshotnutzung dient nur als Orakel; keine zustandsändernde `page.evaluate`-Abkürzung. Die Extension-Host-APIprüfung ist separat und wird nicht als GUI gezählt. Frühere Negativcanary `2026-11-01T15-32-28-934Z` (2/3, Exit 1, `remaining: []`) und Implementer-Canary `2026-11-01T15-24-59-380Z` (2/3, Exit 1, `remaining: []`) als gleiches Paar verifiziert; zusätzlich eigener negativer Tamper-GUI-Fall. | Kein Muss-Finding. |
| V0-06 | **erfüllt** | `docs/implementation/vscode-extension/implementation/V0.md`, `STATUS.md`, `docs/provenance/source-adoptions.md`; Feature-/Paritätsdelta für F01/F10/F12(einfach)/F17/F22/F55/F56/F59/F60, übrige F-IDs mit Zielphase; konkrete Versionspins in `package.json`/Lock/README/V0.md; Sourceadoptions-Hashes exakt verifiziert; Lizenznotizen aus tatsächlichem esbuild-Graph; risikobasierte Testauswahl und Budgets; kein V1+-Produktcode. | Kein Muss-Finding. F56 ist als Code-/Warnpfad vorhanden, aber nicht mit einer zweiten real installierten INTERLIS-Extension GUI-exerziert (für V0 nicht als GUI-Gate gefordert; V1/V5 nachholen). |
| V0-07 | **erfüllt (Inhalt)** | Dieser unabhängige Review auf beiden SHAs; eigene frische installierte GUI-01..03-Reproduktion (3/3, Exit 0); eigener neuer Tamper-GUI-Gegenfall (1/1, Exit 0, Status Error, keine Java-PID); relevante Bilder in dieser Session geöffnet; frühere gleiche-Paar-Rohbelege verifiziert. | Der äussere Guard-/Transportabschluss und die Artefaktidentitätskontrolle nach Prozessende bleiben Codex vorbehalten (Plan §11.5). Das ist kein offener inhaltlicher Muss-Befund, aber die operative Freigabe entsteht erst mit diesem äusseren Abschluss. |

## 4. Featureparität (V0-Scope)

| F-ID | V0-Umsetzung / tatsächlicher Pfad | Grenze |
|---|---|---|
| F01 | `.ili`/`.ILI`, Sprach-ID `interlis`, TextMate-Grammatik und Sprachkonfiguration; GUI-01 zeigt echte Syntaxhervorhebung. | Metaattribut-/Kommentar-Feinheiten und vollständige Parität sind nicht V0-Gegenstand. |
| F10 | Whole-document-Formatierung über den Java-LSP; GUI-03 (Format, Undo, Redo). | Formatterparität im Detail ist V1. |
| F12 (einfach) | Drei statische Snippets (`model`, `topic`, `class`); frühere GUI-Gegenprobe fügt `topic` über echte Palette/QuickPick ein; `test:unit` prüft die Ressourcen. | Vollständige Slots/Placeholder sind V4. |
| F17 | Eingebettete Vorlage `resources/templates/model.ili` über `interlisGuru.newFromTemplate`; frischer Extension-Host-Test und frühere GUI-Gegenprobe (ungespeichertes Dokument, `MODEL Example`). | Optionale HTTPS-Vorlage ist V4. |
| F22 | Status Starting/Ready/Stopped/Error/Trust required; Stop/Restart-Commands; GUI-03 und negative Konfigurationsgegenprobe; kein automatischer Restartloop (`CloseAction.DoNotRestart`). | Crash-/Restart-/Multi-root-Härte ist V5. |
| F55 | Installiertes VSIX im isolierten Profil; eigener frischer GUI-Lauf und eigene Gegenprobe. | Gebündelte Runtime/Plattformpakete sind V5. |
| F56 | Konflikt-Warnung bei anderer Extension mit Sprache `interlis`; Code geprüft, keine automatische Deaktivierung, keine alten Command-Aliase. | Nicht mit einer zweiten real installierten INTERLIS-Extension GUI-exerziert; kein V0-GUI-Gate, für V1/V5 nachzuholen. |
| F59 | Keine Altprojektabhängigkeit im Lock, im vollständigen Graph, im Bundle und in Quellimporten. | – |
| F60 | Echte installierte Workbench, echte Tastatur/Pointer, Screenshots und Assertions; eigener frischer Lauf und eigene Gegenprobe. | – |

Nicht implementiert und daher nicht als V0-Erfolg behauptet: F02–F09/F11/F19–F21 (V1), F13–F16/F18 (V4), F23–F46 (V2/V3), F47–F52 (V4), F53/F54 (V5).

## 5. Risikobasierte Tests

| Gate/Case | fällig warum / nicht fällig warum | ausgeführtes Kommando und cwd | Exit / Tests / Fehler / Skips | eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
| T0 Abhängigkeiten | Extensionhost/Staging/Paket in diesem Review frisch | `npm ci --ignore-scripts` (extension) | 0; 318 Pakete | eigener Lauf | `checks/prepare-dependencies.log` |
| T0 Core-Artefakt | Lock/Serverinventar aus dem Kandidaten | `npm run stage:core -- --core-dir /Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r3/core` (extension) | 0; 11 JARs; Lock vor/nach identisch `bc4674f6…` | eigener Lauf | `checks/prepare-core-distribution.log`, `checks/lock-before.sha256`, `checks/lock-after.sha256`, `checks/staged-server-hashes.txt` |
| T3 Build | TS-Check/Bundle/Lizenzen | `npm run build` (extension) | 0; `out/extension.cjs` `0f98c54a…` | eigener Lauf | `checks/build.log` |
| T3 Unit/Manifest | Hostpfade, Korruption, falsche Java-Version, Manifest/Ressourcen | `npm run test:unit` (extension) | 0; 5 Tests, 5 Pass, 0 Fail/Skip | eigener Lauf | `checks/unit.log` |
| T2 Protokoll | echter stdio-Prozess, reales Fixture, Definition, Compile, Shutdown | `INTERLIS_JAVA=… npm run test:protocol` (extension) | 0; 1 Test, 1 Pass, 0 Fail/Skip; Core `76df381…`, Exit 0 | eigener Lauf | `checks/protocol.log` |
| T1 Java-LSP | vorhandene Initialize-/Prozess-/Shutdowntests am Kandidaten | `./gradlew :interlis-lsp:test --tests guru.interlis.lsp.LspServerTest --tests guru.interlis.lsp.LspProcessTest --no-daemon` (core) | 0; 6 Tests (4+2), 0 Fail/Skip | eigener Lauf | `checks/java-lsp-r3.log`; `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r3/core/interlis-lsp/build/test-results/test/TEST-guru.interlis.lsp.LspServerTest.xml`; `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r3/core/interlis-lsp/build/test-results/test/TEST-guru.interlis.lsp.LspProcessTest.xml` |
| T0 Dependency-Graph | vollständiger npm-Graph, Lock und Bundle | `npm run verify:no-legacy-dependencies` (extension) | 0 | eigener Lauf | `checks/dependency-graph.log` |
| T4 Extension-Host | echte VS-Code-APIs, Aktivierung, Definition, Template | `INTERLIS_JAVA=… INTERLIS_TEST_CODE=… npm run test:extension-host` (extension) | 0; 3 Prüfgruppen, Extension-Host Exit 0 | eigener Lauf | `checks/extension-host.log` |
| T4 GUI-01..03 | installiertes VSIX, echter Java-LSP, Maus/Tastatur | `INTERLIS_JAVA=… npm run test:gui -- --suite smoke --vsix /Users/stefan/sources/interlis-vscode/build/packages/interlis-vscode-darwin-arm64.vsix --cache /Users/stefan/sources/interlis-vscode-evidence/gui-preflight/storage` (extension) | 0; 3/3 Cases; 2 echte Java-Starts; `remaining: []` | eigener Lauf | `checks/installed-gui.log`; `build/reports/gui/smoke/2026-11-01T16-02-58-070Z/` |
| T5 VSIX-Reproduktion | Artefakt aus Kandidaten neu packen und Inhalt vergleichen | `INTERLIS_JAVA=… npm run package:vsix -- --target darwin-arm64` (extension) | 0; 25 Dateien; alle Nutzdateien byte-identisch zum Request-VSIX (Container nur Zeitstempel) | eigener Lauf + Inhaltsvergleich | `checks/package-vsix.log`, `checks/reproduced-vsix-contents.sha256`, `checks/request-vsix-contents.sha256` |
| T3 Launch-Negativpfade | fehlendes Bundle/fehlende Bibliothek | `node /Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/checks/launch-negative-paths.cjs` (extension) | 0; fehlendes Verzeichnis/Bibliothek abgelehnt; gepacktes Inventar akzeptiert | eigener Lauf | `checks/launch-negative-paths.log` |
| T4 Negativcanary | Harness muss bei unmöglicher Sichtbedingung scheitern | früherer Lauf `2026-11-01T15-32-28-934Z` und Implementer-Lauf `2026-11-01T15-24-59-380Z` | 1 (erwartet); 2/3 Cases; `remaining: []` | verifiziertes gleiches-Paar-Rohartefakt (nicht als eigener Lauf ausgegeben) | `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/checks/negative-canary.log`; `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/extension/build/reports/gui/smoke/2026-11-01T15-32-28-934Z/manifest.json`; `/Users/stefan/sources/interlis-vscode/build/reports/gui/smoke/2026-11-01T15-24-59-380Z/manifest.json` |
| T4 neuer Gegenfall | installierter Server-JAR manipuliert | `node build/probes/tampered-bundle-run.cjs …` (extension) | 0; 1/1 Case; Status Error; `serverStarts: []` | eigener Lauf | `checks/counterprobe-tampered-bundle.log`; `counterprobes/tampered-bundle/` |
| T6 Compiler-Konformanz | **nicht fällig**: keine Parser-/Typ-/Query-/IR-Änderung; Core-Tree phaseBase=candidate; seit `b8051493` nur CLI/Docs/Testdata/Tools | – | – | – | Core-Diffanalyse |
| T3 Browser/Safari/WASM | **nicht fällig**: keine Diagramm-/Projektor-/Browseränderung; gemeinsamer Renderer startet erst V2 | – | – | – | Diff/Manifest |
| T5 Crossplatform/Remote | **nicht fällig**: gebündelte Runtime, Linux/Windows/Remote sind V5; V0 qualifiziert explizit Java 25 auf macOS arm64 | – | – | – | Plan §7/§10.3, V0-Bericht |

Keine fällige Prüfung fehlt. Die drei nicht fälligen Gates sind mit dem tatsächlichen Diff begründet und nicht nachträglich zum Bestehen abgewählt. Die Negativcanary und die früheren Counterprobes sind als gleiche-Paar-Rohbelege verifiziert, nicht als eigene Ausführung deklariert. Trotz `allowedReuse` habe ich die kleine V0-Smoke-Suite sowie Build/Unit/Protocol/Stage/Java-LSP/Extension-Host in dieser Session frisch ausgeführt, weil die frühere Bildattribution beanstandet war und ich eigene Bilder/Identitäten benötigte; eine breite Compiler-/Browser-/Remote-Suite wurde nicht wiederholt. Die Implementer-Qualifikation `/Users/stefan/sources/interlis-vscode-evidence/qualification/V0-r4/qualification.json` mit `guard.json`/`exit.txt` nennt dasselbe Paar und Guard passed/Exit 0; ich habe sie als Kontext gelesen, nicht als eigenen Lauf gewertet. Prozesshinweis: Es wurde kein Python ausgeführt; ein versehentlicher `python3`-Aufruf wurde von der Umgebung mit „command not found“ abgelehnt und hatte keine Wirkung.

## 6. Echte GUI und Sichtprüfung

**Eigener Hauptlauf.** `installed-gui` mit dem Request-VSIX, isoliertem Profil und echtem Java-LSP: 3/3 Cases, Exit 0. Manifest: `build/reports/gui/smoke/2026-11-01T16-02-58-070Z/manifest.json`. Installiert `edigonzales.interlis-vscode@0.0.1`, Bundle `0f98c54a…`, Serverstarts PIDs 45967/46031 mit `core=76df381…`, `bundle=59f63272… packaged distribution`, danach `remaining: []`, `extensionShaAfter = d8f8ade…`. Frischer Workspace `Unicode Modelle/Example.ili`; GUI-02 erzeugte den Fehler per Tastatur, Problems zeigte `ILI-SEM-0001` in Zeile 8, GUI-03 F12 auf Zeile 5, Format/Undo/Redo, Stop/Restart und frische Diagnose/Korrektur nach Restart.

**Tatsächlich in dieser Session geöffnete Bilder und Beobachtungen:**

Früherer gleicher-Paar-Lauf `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/extension/build/reports/gui/smoke/2026-11-01T15-29-43-225Z`:

- `GUI-01-ready.png`: echte Workbench, Explorer `UNICODE MODELLE/Example.ili`, Syntaxfarben, Status `INTERLIS: Ready`, Sprache `INTERLIS`; keine abgeschnittenen Controls, kein leeres Panel.
- `GUI-02-error.png`: `height : MissingHeight;`, Problems mit genau einem Fehler `ILI-SEM-0001`, Zeile 8, Spalte 16; Status `Ready`; technische Baselineprosa (V0-Grenze).
- `GUI-02-corrected.png` (einer der fünf beanstandeten Pfade): nach Tastatureingabe `Height`, Problems leer, keine Restfehler.
- `GUI-03-formatted.png`: formatierter Text mit Einrückung, keine Clipping-/Überlappungsprobleme.
- `GUI-03-output.png`: echter Output-Kanal `INTERLIS Language Server` mit JSON-Trace, kein ANSI/Chaos.
- `GUI-03-restarted-error.png` / `GUI-03-restarted.png`: nach Stop/Restart Dirtybuffer erhalten; nach erneutem Tippen frische Diagnose, nach Korrektur Problems leer; Status `Ready`.
- `GUI-03-stopped.png`: Status `Stopped`, Dirtypunkt bleibt.
- `GUI-03-unformatted.png`: unformatierter Ausgangstext vor Formatierung.
- Canary `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/extension/build/reports/gui/smoke/2026-11-01T15-32-28-934Z/failure-GUI-01.png`: Workbench korrekt `Ready`; der Test erwartete absichtlich einen unmöglichen Status und scheiterte (Exit 1, 2/3).

Frühere Counterprobes `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes` (als gleiche-Paar-Rohbelege geprüft; nicht als meine Ausführung deklariert):

- `positive-4/probe-01-ready.png` (beanstandeter Pfad): eigenes Modell unter `Andere Modelle/O'Brien Modell.ili`, Status `Ready`, Sprache `INTERLIS`.
- `positive-4/probe-02-f12.png` (beanstandeter Pfad): F12 landet auf der eigenen Domaindeklaration `Distance` (Zeile 5), nicht auf einem fremden Ziel.
- `positive-4/probe-03-problem.png` (beanstandeter Pfad): eigener Typfehler `Undefined` in Problems, Zeile 8, Spalte 16.
- `positive-4/probe-04-template.png` (beanstandeter Pfad): `INTERLIS: New Model from Template` öffnet ein ungespeichertes INTERLIS-Dokument mit `MODEL Example`.
- `positive-4/probe-05-snippet.png`: contributed `topic`-Snippet sichtbar eingefügt (`TOPIC Data = … END Data;`); der absichtlich angehängte Block erzeugt erwartungsgemäss einen Syntaxfehler.
- `negative-2/probe-negative-error.png`: Java 21 als `javaPath`; Status `INTERLIS: Error`, Meldung „INTERLIS requires Java 25 without preview.“, kein `Ready`, kein Serverstart.

Eigener frischer Lauf `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r3/extension/build/reports/gui/smoke/2026-11-01T16-02-58-070Z`:

- `GUI-01-ready.png`: echte Workbench, `Example.ili`, Status `Ready`, Sprache `INTERLIS`.
- `GUI-02-error.png`: `MissingHeight`, Problems `ILI-SEM-0001` Zeile 8; `GUI-02-corrected.png`: `Height`, Problems leer.
- `GUI-03-formatted.png`: formatierter Text; `GUI-03-output.png`: JSON-Trace im Output-Kanal; `GUI-03-restarted-error.png`: frische Diagnose nach Restart; `GUI-03-restarted.png`: korrigiert, Problems leer; `GUI-03-stopped.png`: Status `Stopped`, Dirtypunkt bleibt.
- Keine abgeschnittenen Beschriftungen, keine leeren Panels, keine unlesbaren Überlappungen; Status, Sprache und Problems sind sichtbar konsistent.

Eigene Gegenprobe `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r3/evidence/counterprobes/tampered-bundle`:

- `probe-01-error.png`: installiertes Produkt mit manipuliertem `interlis-lsp-0.2.0-SNAPSHOT.jar`; Status `INTERLIS: Error`, sichtbare Notification „INTERLIS: Server artifact digest mismatch: lib/interlis-lsp-0.2.0-SN…“, **kein** `Ready`.
- `probe-02-output.png`: Output-Kanal zeigt „Host error: Server artifact digest mismatch: lib/interlis-lsp-0.2.0-SNAPSHOT.jar“; Status `Error`.
- `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r3/evidence/counterprobes/tampered-bundle-attempt-1/failure-tampered.png`: erster Explorationslauf; Produktverhalten bereits korrekt (Error, keine PID), mein Test scheiterte nur an einer NBSP-Normalisierung (`MODEL\u00a0Example`) – Harness-Fehler, kein Produktfehler; Beleg aufbewahrt.

**Source-/Bufferunverändertheit:** In V0 gibt es keine Diagramm-/Layoutaktion, die `.ili` verändern könnte. Die einzigen Textänderungen sind bewusste Editorbenutzeraktionen in GUI-02/03 (Tippen, Format, Undo/Redo). Die GUI-03-Assertions prüfen den Dirtybuffer und den semantisch gleichen Text; der Restart verliert keine ungespeicherte Änderung. Die eigene Tamper-Probe öffnet nur die Quelle und ändert sie nicht.

**Export/Dialoge/Plattform/Remote:** In V0 nicht implementiert und nicht behauptet. Kein Plattform-/Remote-PASS; das ist V5.

## 7. Neue Gegenproben

**7.1 Negativ: manipuliertes installiertes Serverartefakt.**

Hypothese: Das installierte VSIX prüft vor dem Java-Start das vollständige Serverinventar gegen das Lock und lehnt ein manipuliertes JAR sichtbar ab; es darf weder `Ready` werden noch einen Java-Prozess starten. Codex' Tests prüfen dies im Unit-/Launchpfad, aber nicht am real installierten Produkt mit sichtbarer Workbench; deshalb ist die Probe eigenständig.

Aktionen: Request-VSIX in ein frisches isoliertes ExTester-Profil installieren; installiertes `interlis-lsp-0.2.0-SNAPSHOT.jar` im Profil um Zusatzbytes verändern (Hash vorher `d244a2a3…`, nachher `7e789336…`); eigenes `Example.ili` per Explorer-Doppelklick öffnen; auf sichtbaren Status warten; Output-Kanal über die Palette öffnen; sichtbaren Text und Notification lesen; nach Laufende Serverstarts aus den Workbench-Logs und PIDs prüfen.

Erwartet: Status `Error`, Meldung mit `digest mismatch` und dem JAR-Pfad, nie `Ready`, `serverStarts: []`, keine Rest-PID. Tatsächlich: 1/1 Case, Exit 0; Manifest `status: passed`; `serverStarts: []`; `serverLogLines: ["Host error: Server artifact digest mismatch: lib/interlis-lsp-0.2.0-SNAPSHOT.jar"]`; Bilder und `probe-result.json` vorhanden. Falsifizierbar wäre ein `Ready`-Status, ein gestarteter Java-Prozess oder eine fehlende sichtbare Fehlermeldung; der erste Explorationslauf war nur wegen meiner NBSP-Assertion rot, das Produktverhalten war bereits korrekt. Die Probe verändert ausschliesslich die installierte Kopie im temporären Testprofil, nie den Kandidaten.

**7.2 Positiv: eigene frische Reproduktion von GUI-01..03.**

Hypothese: Das unveränderte Request-VSIX besteht den vertikalen installierten Pfad auch in einem neuen Reviewprofil. Aktionen: frischer `test:gui`-Smoke-Lauf mit isoliertem Storage, Cache, echtem Java 25 und Request-VSIX. Erwartet: 3/3, Exit 0, echte Java-Starts, keine Rest-PID, Bundle-/Serverhash identisch. Tatsächlich: 3/3, Exit 0, PIDs 45967/46031, `remaining: []`, Bundle `0f98c54a…`. Das ist meine eigene Ausführung, nicht die Übernahme des früheren Laufs; sie bestätigt die Bilder und Versionen unabhängig.

**7.3 Frühere Gegenproben:** Die in `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes/positive-4` und `/Users/stefan/sources/interlis-vscode-evidence/reviews/V0-r2/evidence/counterprobes/negative-2` dokumentierten Fälle (Unicode-/Apostrophpfad, Template, Snippet, Java 21) habe ich anhand ihrer Rohmanifeste und Bilder verifiziert. Sie sind **nicht** meine eigenen Läufe; sie dienen als gleiche-Paar-Kontext, nicht als Ersatz für 7.1/7.2.

## 8. Findings / Blocker

**Offene Muss-Findings:** keine.

**Optionale Beobachtungen (nicht abnahmewirksam, keine V0-Verletzung):**

1. **Technische Baseline-Diagnoseprosa** (`diagnostic.semantics.unresolved …`) ist sichtbar; V0 erlaubt das ausdrücklich, V1 muss lesbare DE/EN-Texte und echte RelatedInformation liefern.
2. **F56-Konfliktwarnung** ist als Code-/Warnpfad vorhanden, aber nicht mit einer zweiten real installierten INTERLIS-Extension GUI-exerziert. Für V0 nicht gefordert; V1/V5 nachholen.
3. **Basis-SHA nicht Ancestor:** `20b0029…` ist nicht Ancestor von `76df381…`, obwohl die Trees identisch sind; der V0-Bericht dokumentiert die externe Baseline-Fortschreibung. Für die Produktidentität ist der Lock auf `76df381…` gepinnt, kein schwimmendes `main`; als Prozessbeobachtung festgehalten.
4. **Lokale Template-Aktivierung im untrusted Workspace:** `newFromTemplate` ist auch untrusted verfügbar und liest nur die eingebettete statische Vorlage; das ist keine workspace-gesteuerte Codeausführung. Die endgültige Trust-/Template-Grenze ist in V5 (GUI-37) zu prüfen.
5. **Fehlendes Serververzeichnis** wird als rohes `ENOENT` abgelehnt; funktional korrekt, aber für V1 benutzerfreundlicher zu formulieren.
6. **Review-Transport** legt `opencode.json` untracked im Extension-Worktree an; das ist die äussere Orchestrierung, keine Produktänderung.
7. **VSIX-Containerhash** ist wegen ZIP-Zeitstempeln nicht byte-identisch reproduzierbar; alle Nutzdateien sind byte-identisch. Kein Produktfinding.
8. **npm-Audit:** Produktionsgraph (`npm audit --omit=dev`) meldet 0 Befunde; der vollständige Dev-Graph meldet 7 moderate Advisories. Keine Produktions-/Runtime-Abhängigkeit betroffen; kein V0-Blocker, aber im Dependencypflegeprozess beobachten. Belege: `checks/npm-audit-production.log`, `checks/npm-audit-all.log`.
9. **Java-Versionsprobe:** Ein harmloser Test mit `openjdk version "25.0.0-ea"` wird von `resolveLaunchPlan` akzeptiert (`checks/java25ea-probe.log`); die Probe schliesst nur die Hauptversion 25 ein und prüft EA-/Preview-Suffixe nicht explizit. Der getestete Temurin 25.0.3 ist GA und der LSP startet ohne `--enable-preview`; daher kein V0-Blocker. Falls «ohne Preview» auch EA-Builds ausschliessen soll, ist die Probe in V1/V5 nachzuschärfen.
10. **GUI-Signalauswertung:** Der Runner wertet Testfälle, Timeouts und eigene Java-PIDs aus; ChromeDriver-/Workbench-Rohlogs werden gespeichert, aber Browserconsole-Fehler, unhandled rejections und der Serverexit-Code werden nicht automatisch als Fehlerbedingung geparst. Für die V0-Kernfälle ausreichend (die sichtbaren Assertions greifen), für V1/V5-Härtung gemäss Matrix §9.2 empfehlenswert.

**Fehlende Pflichtnachweise:** keine. **Blocker:** keine.

## 9. Urteil

**PASS** (inhaltlich, für V0).

Begründung: Beide Kandidaten-SHAs sind korrekt und tracked sauber; der Core hat in diesem Paar keine Produktänderung; die Extension ist eine dünne, echte Hostintegration ohne zweite Sprachsemantik und ohne Altprojektabhängigkeit. Der echte Java-LSP startet aus dem gelockten Artefakt, bleibt stdio-protokollrein, wird sauber beendet und lehnt fehlende/falsche Java-/Bundlekonfiguration sowie ein manipuliertes installiertes Serverartefakt ab. Das VSIX ist aus dem Kandidaten in allen Nutzdateien reproduzierbar, enthält Client, Server-JARs und Lizenzen, und GUI-01–03 bestehen in einem eigenen frischen isolierten Lauf mit echten Maus-/Tastaturaktionen; die Negativcanary ist als gleiches-Paar-Rohbeleg Exit 1. Meine eigene neue Tamper-Gegenprobe bestätigt die Installations-/Integritätsgrenze sichtbar. Alle fälligen Gates sind ausgeführt oder als gleiche-Paar-Rohbelege verifiziert; die nicht fälligen Gates sind mit dem tatsächlichen Diff begründet.

**Nächster erlaubter Schritt:** V1 erst nach dem äusseren Guard-/Transportabschluss und der Artefaktidentitätskontrolle durch Codex sowie der unveränderten Ablage dieses Berichts/`verdict.json`; keine Publikation, kein Push, kein Release. Die operative Phasenfreigabe ist nicht schon durch dieses Inhalts-PASS hergestellt.
