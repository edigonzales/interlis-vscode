# Codex-Startprompt – INTERLIS VS Code auf dem Java-Stack

**Du bist Agent A: Implementierung und autonome Review-Orchestrierung.** Führe diesen Auftrag vollständig in **V0 bis V5** aus. Du darfst die nächste Phase nur starten, wenn der getrennte OpenCode-Reviewer die vorige Phase auf dem aktuellen Core-/Extension-Produktpaar mit **PASS** abgenommen hat. Nach einem gültigen PASS arbeitest du ohne routinemässigen Benutzercheckpoint weiter. Ein `FAIL` bedeutet Nacharbeit derselben Phase; ein nicht autonom behebbares `BLOCKED` einen begründeten Stopp.

Dieser Prompt ist ein Implementierungsauftrag, **kein Auftrag, eine weitere allgemeine Spezifikation zu verfassen**. Massgeblich sind die bereits vorliegenden Dokumente:

1. [EXECUTION_PLAN.md](EXECUTION_PLAN.md) vollständig;
2. [FEATURE_AUDIT.md](FEATURE_AUDIT.md) – 60 konkrete Benutzerfähigkeiten und geprüfte Ausgangsquellen;
3. [GUI_TEST_MATRIX.md](GUI_TEST_MATRIX.md) – 42 echte GUI-Szenarien;
4. [OPENCODE_REVIEW_PROMPT.md](OPENCODE_REVIEW_PROMPT.md) – unabhängige Ziel-/Code-/GUIprüfung.

## 1. Feststehende Entscheidungen

- Verwende die **vorhandene Java-INTERLIS-Engine**. Compiler, Workspace, Repository und Projektionen bleiben fachlich autoritativ. Der Java-LSP wird gezielt vervollständigt, nicht durch einen TypeScript-Language-Service ersetzt.
- Neues eigenes lokales Extensionrepo **`interlis-vscode`**, eigene Extension-ID `edigonzales.interlis-vscode`, Command-/Setting-Namespace `interlisGuru`. Kein Aliaspaket für eine alte Extension und kein neues ili2c-Profil.
- **Keine Abhängigkeit von `interlis-language-tools` oder `@ilic/*`.** Das umfasst Runtime, Build, Tests, type-only imports, Git-/file-/workspace-Links, Submodule und dynamische Beschaffung. Einmalige kontrollierte Quellübernahme mit Lizenz-/Commit-/Dateihash ist erlaubt. Danach eigener Code und eigene Verantwortung. Historische Quellen-/Lizenznamen bleiben als Provenienz erhalten.
- **ELK + echter Sprotty-Renderer**, eine gemeinsame eigene Quelle `CORE/frontend/diagram-ui`, verwendet vom bestehenden Core-Browserpfad und der neuen Extension. Kein zusätzlicher GLSP-/Cytoscape-/WebSocketserver. Sprotty-Datenobjekte plus statisches SVG allein erfüllen den Interaktionsauftrag nicht.
- UML ist zunächst **fachlich read-only**, aber visuell voll interaktiv: Knoten/Container bewegen, Kantenrouten bearbeiten, Filter/Settle/Reset, Zustand, Navigation, Exporte. Diese Aktionen verändern keine `.ili` und keinen Editorbuffer. Künftige semantische Editierbarkeit architektonisch ermöglichen, nicht jetzt als Stub oder versteckten Schreibpfad implementieren.
- Wirkliche **installierte VS-Code-GUItests** ab V0. LSPtests, `vscode.execute...`, Extension-Host-APItests oder JSDOM ersetzen keine Maus-/Tastaturaktionen in der Workbench/Webview.
- Tests **nach Auswirkung**, nicht automatisch alle Compiler-/Corpus-/Safari-/Web-Image-/Releasegates. Jede Phase braucht die fälligen Tests aus Plan §10 und ihre GUI-Szenarien. Der Reviewer prüft auch diese Auswahl.
- Kein Python, keine neuen Normausnahmen/XFAILs, keine Publikation. Java-/Gradle-/Node-/Shellwerkzeuge genügen. Kein Push, Merge, Tag oder Marketplace-/npm-/Open-VSX-Upload ohne separaten Auftrag.

## 2. Arbeitsbeginn und tatsächliche Repositories

Die Recherchebasis des Java-Repos ist `b8051493a8b93e0be4b12735785803d068df6f80` auf `edigonzales/interlis-java`. Die genannte URL `interlis-guru` war beim Audit nicht erreichbar. **Keine Annahme einer automatischen Umbenennung.** Ermittle den tatsächlichen lokalen Compilercheckout aus Nutzerarbeitsverzeichnis, Remotes und Modulen. Aktueller HEAD kann neuer sein; niemals auf den Recherchecommit zurücksetzen.

```sh
pwd
git status --porcelain=v1
git branch --show-current
git rev-parse HEAD
git remote -v
```

Lies die geltenden `AGENTS.md`, insbesondere zusätzliche Regeln für `docs/spec/`. Erhalte fremde nicht committete Änderungen. Lege `CORE_DIR` und `EXT_DIR` als tatsächliche absolute Pfade fest. Falls das neue Extensionrepo fehlt, darfst du lokal ein passendes Geschwisterverzeichnis anlegen und initialisieren; keine entfernte Repoanlage. Falls es bereits existiert, vorhandenen Inhalt/Status zuerst prüfen. Die fünf Auftragsdateien werden unter `EXT_DIR/docs/implementation/vscode-extension/` abgelegt. Keine unbeauftragte Kopie des ganzen Java-Repos in die Extension.

Erzeuge beim neuen EXT-Repo eine echte Bootstraprevision für die Auftragsdateien, damit beide Baselines reale Commits sind. `assignmentBase` und `phaseBase` enthalten je **Core-SHA und Extension-SHA**. Keine Null-SHAs. Prüfe JDK25, Gradlewrapper, Node-/npm-/TypeScript-/VSCode-/GUItoolchain. Prüfe vorhandene Core-Artefaktaufgaben statt erfundene Befehle als ausgeführt auszugeben.

Lies gezielt die aktuellen Consumer:

- `interlis-lsp/.../InterlisLanguageServer`, `InterlisTextDocumentService`, `InterlisWorkspaceService`, `LspConfiguration`, `ProjectSourceLoader`, `AnalysisScheduler`, vorhandene LSPtests;
- `interlis-compiler/.../query/LanguageQueries`, aktuelle Queryimplementierungen, Formatter-/Diagnose-/Workspaceverträge;
- `interlis-projection` und DiagramDocument-/Optionsschemas;
- `interlis-wasm-teavm` Diagrammadapter/Vendorquellen und deren bestehende Browserconsumer;
- CLI1–CLI3-Status und aktuelles CLI, nur als erhaltene Baseline, nicht als nochmaligen Auftrag;
- im Audit bezeichnete Referenzmanifeste/Diagramm-/Snippet-/Exportquellen. Verhaltensparität nicht aus README-Häkchen allein ableiten.

Führe **jetzt** den OpenCode-/DeepSeek- und echten GUI-Preflight aus. Kein grosser Implementierungsblock, bevor feststeht, dass der unabhängige Prüfer beide Repos lesen und die tatsächliche GUIprüfung bedienen kann.

## 3. Phasenauftrag – keine Übersprünge

### V0 – Vertikaler installierter Editorpfad

**ACs: V0-01 bis V0-07.**

Neue Extension aktivieren, echten Java-LSP per stdio starten, Syntaxressourcen/einfache Snippets/Modellvorlage, Status/Output, Stop/Restart. Eigenes Artefaktlock und Paketierung. Minimaler echter GUI-Harness mit frischem installiertem VSIX und Cases GUI-01–03. Lizenz-/Quellübernahmeplan und knapper Featuredelta. V0 ist eine funktionierende vertikale Lieferung, keine reine Inventur.

V0 darf ein explizites vorhandenes Java25 verwenden; die spätere Runtimebündelung bleibt V5-Pflicht. GUI und echte Serverprozesse sind dagegen bereits jetzt Pflicht. Nur erste LSP-/Start-/Host-/Manifesttests plus diese GUIcases; kein Fullreleasegate. Committe und starte unabhängigen V0-Review. **V1 nicht vor gültigem PASS.**

### V1 – Java-LSP-Editorparität und Repositories

**ACs: V1-01 bis V1-10.**

Implementiere die im Plan konkret beschriebenen Java-Adapter: zentraler `DiagnosticMessageFormatter` im LSP, RelatedInformation, hierarchische Outline; `RepositoryHostCoordinator` mit transitiven Abhängigkeiten/Offline/Digests, sichere virtuelle readonly Importquellen; Rootcompile für aktuellen Buffer; vorhandene Queries/Synchronisations-/Closed-Rename-Garantien erhalten.

Die Extension transportiert Konfiguration und Benutzerwünsche, interpretiert keine INTERLIS-Namen. Modellauflösung nicht durch Sammeln aller Nachbardateien als Roots ersetzen. Öffnen einer externen Quelle macht sie nicht editierbar. Unaufgelöste oder mehrdeutige Daten nicht durch „best effort“-Rename verändern.

Standardsprachfunktionen und echte GUI-01–11 prüfen; relevante Java-/Transport-/Resolver-/Workspace-/Querytests. Bei tatsächlicher Parser-/Semantikänderung T6 erweitern. Nach Commit unabhängiger Review, nur dessen PASS öffnet V2.

### V2 – Eigener Diagrammbaustein, Node-Drag und Kantenrouten

**ACs: V2-01 bis V2-10.**

Der Benutzer soll früh ein **wirklich interaktives UML** erhalten. Überführe geeigneten vorhandenen Diagrammcode in `CORE/frontend/diagram-ui`, mit eigenem Paket-/DTOvertrag und vollständig entkoppelten Typen. Bestehenden Core-Browserconsumer auf dieselbe Quelle umstellen, keine weitere Kopie daneben.

Ergänze versionierten typisierten Diagramm-/Navigationsvertrag, eigene Sprotty-Views und ELKworker. Verwende Quellanker, Symbolidentitäten, Revisions-/Generation-/ServerInstance-Daten. N-äre/Self-/Parallelassoziationen, Attribute, Rollen und Diamanten müssen korrekt sein. Source darf bei Layoutdrag oder Routehandle nie dirty werden. Alte Antworten/Navigation ablehnen, partielle Ansicht ehrlich kennzeichnen.

GUI-12–18 und Editor-Smoke; betroffene Core-Projektion-/Browseradaptertests, nicht pauschal alle Browserkorpora. Reviewer muss selbst Maus-/Kantenaktionen ausführen. Keine V3-Komfortarbeit als Ersatz für fehlenden Node-/Route-Drag.

### V3 – UML-Parität, Export und Bedienkomfort

**ACs: V3-01 bis V3-12.**

Vervollständige Filterbaum mit All/None/Reset, direkte/indirekte Imports, Stub-/Containerregeln, Kompartimente, geerbte Attribute und Inline-Enums; Settle vs Reset, Pins, tatsächliche ORTHOGONAL/POLYLINE/SPLINES; Pan/Zoom/Fit/Scrollbars/Tastatur; View-Undo/Redo; stabilen Zustand und Source→Diagrammselektion.

SVG/PNG full/visible muss **aktuelle gefilterte und manuell angeordnete Ansicht** abbilden. Inkscape-Connectoren/GAPS übernehmen oder neu implementieren, ohne alte Compiler-/Language-Service-Typen. Sichere Hell/Dunkel/HighContrast-Darstellung, Assets lokal, keine HTML-/Commandinjektion. Semantische Änderungen bleiben ausgeschlossen.

GUI-12–28 plus gezielter Sprach-Smoke; komplette neue UI-/Geometrie-/Exporttests, Java-/WASMtests nur soweit berührt. Eigene Bilder und Dateiinhalte tatsächlich prüfen; keine reine Existenzprüfung. Unabhängiger Review danach.

### V4 – Vollständige Editorhilfen und Dokumentations-/Textformate

**ACs: V4-01 bis V4-09.**

Completion-/Snippet-/AutoClose-/QuickFix-Verträge im Audit vollständig umsetzen. Sprachabhängige Vorschläge und Edits werden in Java geplant; TS verantwortet Snippet-/Cursorbedienung. Keine neue Live-Regexsemantik. Keine stummen Scope-/Versionsverletzungen und keine schwache „unused import“-Heuristik.

Reine Java-Dokumentationsprojektion mit Markdown/HTML/DOCX und GraphML; bestehende Mermaid-/PlantUML-Renderer anschliessen. Dokumentation kann vier Labelsprachen, Headeroverride und Inheritancemodi, ohne Identifikatoren zu übersetzen. Vorschau/Save/Cancel in Extension, echte Artefakte. Rekursion begrenzen, Typ-/Constraintinformationen erhalten; kein Compiler-/Datei-IO im Renderer.

GUI-29–35 plus benannte Editor-/UMLregressionen. Java Queries/Projektion/Transport und Artefakte gezielt. Kein DOCX-Textdummy, keine alte ASTabhängigkeit. Eigenständiger V4-Review.

### V5 – Installiertes Gesamtprodukt und kumulative Freigabe

**ACs: V5-01 bis V5-08, kumulativ alle 56 ACs.**

Zielplattformspezifische VSIXe mit Java25-Runtime, sauberem Server-/Schema-/UIbundle, Lizenzen und überprüften Hashes. Reale macOS-arm64-/Linux-x64-/Windows-x64-Installation und GUI-Smokes sowie mindestens ein echter Linux-Remote-/Containerpfad. Keine Behauptung von Plattformunterstützung nur aus erzeugtem Archiv.

Primärplattform GUI-01–42; weitere Plattformen/Remote nach Matrix. Resilienz, Trust, Offline, Versions-/Servermismatch, Restart, Cancel, Multi-root und Panelcleanup. Gesamte **neue** Extension-/LSP-/UI-/Exporttests; gemeinsame Compiler-/WASMtests nach kumulativem Wirkungsdiff. Nicht automatisch vollständige sachfremde `releaseCheckP3`-Wiederholung erzwingen.

Finale Featurematrix F01–F60 mit individuellen Belegen, aktuelle Bedien-/Entwicklungs-/Testdoku und Grenzen. Abschliessender unabhängiger V5-Review ist zugleich Gesamtabnahme. Keine zusätzliche administrative Reviewphase, keine Publikation.

## 4. Testauswahl und Qualität

Vor jeder Phase und nach jeder Nacharbeit halte kurz fest: geänderte Verantwortung, direkt und transitiv betroffene Consumer, fällige Gates/GUIcases, begründet nicht fällige Tests. **Tests abzuwählen ist erlaubt, Ziele abzuwählen nicht.** Neue GUI-/Artefakttests dürfen nicht mit `--passWithNoTests` oder stillen Skips „bestehen“.

Regelbeispiele:

- Nur Webview-CSS/Viewport geändert: UIunit/realer Webview/GUI und Export, kein kompletter Compilerkorpus.
- Gemeinsamen Diagrammvertrag/Renderer umgezogen: Core-Projektion/Schema, bestehende Browserconsumer und Extension testen, nicht bloss TS-Build.
- Repository-/Workspace-/Rename geändert: Java Resolver/Workspace/Queries plus echter LSPprozess und GUI; relevante Persistenz-/Unicode-/Readonlyfälle.
- Parser oder semantische Queryentscheidung verändert: fachliche RED/GREEN-Sentinels und nötige Conformance-/Portableprüfungen, bestehende Normprofile erhalten.

Echte GUIaktion über Maus/Tastatur, screenshots vor/nach und Ergebnisassertions. Source-/Bufferhash bei Layoutinteraktionen prüfen. Gültige fachliche Eingaben über Javaengine herstellen. Alte Repo-GUIbilder oder vorhandene PASS-Dokumente sind nur historische Referenzen. Aktuelle Rohbelege tragen beide SHAs und die tatsächlich gestarteten Artefakthashes.

## 5. Produktpaar und unabhängiger Review

### 5.1 Commitreihenfolge

1. Code/Tests und kurzen Implementierungsbericht der Phase fertigstellen; beide Working Trees auf Fremdänderungen prüfen.
2. Coreänderung lokal committen; vollständigen Core-SHA ermitteln. Bei unverändertem Core denselben SHA verwenden.
3. Editorbundle aus genau diesem Core-SHA bauen, Hashe prüfen; EXT-Lock aktualisieren.
4. Extension lokal committen; vollständigen EXT-SHA ermitteln. Keine selbstreferenziellen SHAs in denselben Commit schreiben.
5. `phaseBase` bleibt bei allen Reparaturversuchen derselben Phase unverändert. `assignmentBase` bleibt Gesamtbasis.
6. Zwei **detached Reviewworktrees**, einen je Repo, auf Kandidatenpaar anlegen. Reviewer arbeitet nicht im Codex-Produktarbeitsbaum.
7. `request.json` nach Plan §11.5 ausserhalb getrackter Produktdateien erzeugen: wirkliche Pfade, komplette Kriterienliste, fällige Tests/GUIcases, Artefaktidentitäten, Gründe nicht fälliger Tests. **Kein vorgefertigtes PASS.**

### 5.2 OpenCode-/DeepSeek-Preflight

Ermittle die tatsächliche OpenCode-2.x-Installation mit Version und `run --help`. Nutze bestehende gespeicherte GUI-/CLI-Anmeldung, kein Zwang zu neuem `DEEPSEEK_API_KEY`. Secrets nicht ausgeben. Verbindlich: Provider `deepseek`, Modellalias `deepseek-flash`, direkter APIhost `api.deepseek.com`, tatsächliche Zuordnung **DeepSeek-V4.1-Flash-1017**. Zuordnung anhand Konfiguration/Session und aktueller Anbieterinformation bestätigen; keine Modellselbstauskunft als Beleg. Stellt der Alias inzwischen ein anderes Modell dar: BLOCKED, kein stiller Wechsel.

Kein OpenRouter/Go/Zen/LiteLLM-/Proxyfallback. Frische Session, nach bestätigter CLIhilfe vorzugsweise privater Standalonestart. Kein `--continue` oder gemeinsame Implementierungssession. Projektbezogene Rechte für beide Worktrees, Build-/GUI-/Evidenceordner einrichten. Keine pauschale globale Abschaltung von Schutzregeln.

### 5.3 Autonomer Start und echtes Warten

Verwende den im Plan §11.4 beschriebenen Weg. Insbesondere beachten: Der bestehende macOS-Pythonguard setzt CWD auf das Core-Root. Deshalb muss der Extension-CWD **innerhalb** des Guards gesetzt werden, nicht nur davor. Beispiel nach verifiziertem `--help`:

```sh
node "$REVIEW_ROOT/core/tools/verification/without-python.cjs" \
  /bin/sh -c 'cd "$1" || exit 1; shift; exec "$@"' interlis-review \
  "$REVIEW_ROOT/extension" "$OPENCODE_BIN" run \
  --standalone --model deepseek/deepseek-flash --format json \
  --file docs/implementation/vscode-extension/EXECUTION_PLAN.md \
  --file docs/implementation/vscode-extension/FEATURE_AUDIT.md \
  --file docs/implementation/vscode-extension/GUI_TEST_MATRIX.md \
  --file docs/implementation/vscode-extension/OPENCODE_REVIEW_PROMPT.md \
  --file "$REVIEW_DIR/request.json" \
  "Pruefe diese Phase eigenstaendig an beiden Kandidaten-SHAs einschliesslich echter GUI-Gegenprobe. Schreibe review.md und verdict.json in den Evidenceordner." \
  >"$REVIEW_DIR/opencode.jsonl" 2>"$REVIEW_DIR/opencode.stderr.log"
REVIEW_EXIT=$?
```

Auch bei `set -e` muss Fehlerstatus zuverlässig gesichert werden. Wait/Join bis zum tatsächlichen Ende des Reviewer-/Guardprozesses und all seiner benötigten Tests; niemals eine noch laufende Session als abgeschlossen behandeln. Logs/Reports sichern. Guardmanifest liegt nach diesem Weg im Core-Reviewworktree unter `build/reports/python-free/environment.json`; Guard ist **macOS-spezifisch** und kein allgemeiner Readonly-Dateischutz.

Vorhandene passende Runner benutzen oder eine kleine Node-Orchestrierung schreiben, keine neue Agentenplattform. Ein vorheriger GUIserver ausserhalb der Isolation beweist keine Pythonfreiheit. Für andere Hosts geprüften passenden Weg verwenden, keine falschen Schutzbehauptungen. Keine Pythonhilfsaufrufe durch A/B; einzige Ausnahme sind vorhandene autorisierte Negativprobes des Guards.

Bei technischem Transportfehler höchstens zwei saubere neue Versuche desselben unveränderten Paars, dann konkrete Blockade. Fachliches FAIL nicht einfach mit neuem Prompt wiederholen: zuerst Finding reproduzieren/beheben, neues Paar prüfen. Kein Wiederholen bis zufällig PASS entsteht.

### 5.4 Freigabe streng prüfen

Akzeptiere nur `review.md` und `verdict.json`, die übereinstimmen und erst vom tatsächlich unabhängigen Reviewer erzeugt wurden. Kontrolliere:

- Prozess/Guard beendet, tatsächlicher Exit und Manifeststatus;
- richtige Phase, beide vollständigen Kandidaten-SHAs, beide tracked Trees unverändert;
- direkte API-/Modellidentität, frischer Kontext;
- jede Muss-AC erfüllt, keine offenen Findings/fehlenden fälligen Checks;
- eigene Code-/Zielanalyse, notwendige selbst ausgeführte Tests und eine neue Gegenprobe;
- echte aktuelle GUIbilder/-aktionen/-Assertions, nicht nur Extension-APIaufrufe;
- Artefakt-/VSIXhash und Testanzahl, keine Altlogs/null Tests;
- risikobasierte Testauswahl ist plausibel; keine ungerechtfertigten Volltestforderungen, aber auch keine übersehene Coreauswirkung.

Ein Text „PASS“, Exit0, HTTP200 oder grüner Implementierungsbericht genügt nicht. Bei validem PASS Originalreview unverändert archivieren, kurze Statusfortschreibung als reinen Dokucommit, dann nächste Phase. Jede produktive Änderung nach PASS erfordert neue Prüfung.

## 6. Berichte und tatsächlicher Abschluss

Genau eine aktuelle `docs/implementation/vscode-extension/STATUS.md`, ein kurzer Implementierungsbericht je V0–V5 und unveränderte Reviewerberichte pro Versuch. Fehlgeschlagene Versuche behalten. Grosse Logs/GUItraces/VSIXe nicht als immer wachsende Produktquellen einchecken; reproduzierbare Buildpfade und Digests dokumentieren. Alle Pflichtbelege müssen für Reviewer erreichbar oder neu erzeugbar sein.

Abschlussbericht: geprüfte Produkt-SHAs; tatsächliche installierbare Artefakte; Stand jeder F01–F60-Fähigkeit; alle 56 ACs; wirkliche GUI-/Plattform-/Remoteergebnisse; Kopierherkunft/Lizenzen und Dependencyfreiheit; bewusst nicht unterstützte Umfänge; nicht ausgeführte sachfremde Tests mit Begründung. Keine fiktiven Tests oder Veröffentlichungen.

**Beginne jetzt V0.** Beweise zuerst die reale installierte Editorintegration und unabhängige GUIprüfbarkeit. V1 folgt nur nach belegtem V0-PASS, danach in derselben Weise bis V5. Keine automatische Fortsetzung bei FAIL/BLOCKED und kein manueller Benutzercheckpoint nach einem echten PASS.
