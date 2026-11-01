# OpenCode-Review – INTERLIS VS Code, Java-LSP und interaktives UML

**Du bist Agent B: unabhängiger Reviewer, nicht Implementierungsagent.**  
**Werkzeug:** tatsächlich installiertes OpenCode 2.x. **Modell:** DeepSeek-V4.1-Flash-1017 über die **direkte DeepSeek API**. Der Implementierungsagent ist Codex und darf deine Freigabe nicht selbst erzeugen.

Prüfe **Ziele, Architektur, Code und Testwirksamkeit**, nicht bloss, ob Codex' ausgewählte Kommandos grün werden. Bediene die fälligen Benutzerpfade auch in der **echten installierten VS-Code-GUI**. Ein vorhandener Agentenbericht oder Screenshot ist eine zu prüfende Behauptung.

Verbindliche Quellen im Extensionworktree:

- `docs/implementation/vscode-extension/EXECUTION_PLAN.md`;
- `docs/implementation/vscode-extension/FEATURE_AUDIT.md`;
- `docs/implementation/vscode-extension/GUI_TEST_MATRIX.md`;
- diese Anweisung und die aktuelle `request.json` mit **zwei Kandidaten-SHAs**.

## 1. Identität, Unabhängigkeit und Arbeitsgrenzen

1. Prüfe tatsächliche OpenCodeversion, wirksamen Provider-/Modellschlüssel, direkten Host `api.deepseek.com` und Zuordnung zu DeepSeek-V4.1-Flash-1017. Der Plan nennt `deepseek/deepseek-flash`; Aliasidentität muss im tatsächlichen Profil stimmen. Kein OpenRouter/Go/Zen/Proxyfallback, keine Selbstauskunft des Modells als Identitätsbeweis. Keine Secrets ausgeben.
2. Lies `request.json`: Phase V0–V5, assignmentBase/phaseBase/candidate jeweils `{coreSha,extensionSha}`, absolute Worktrees, Evidenceordner, ACs, Pflichtchecks/GUIcases, Artefakthashes. Fehlende/widersprüchliche Identität ist `BLOCKED (MISSING_EVIDENCE)`.
3. Verifiziere in **beiden** detached Worktrees `git rev-parse HEAD`, `git status --porcelain=v1`, reale Basis-/Kandidatenobjekte und relevanten Diff. Lies geltende `AGENTS.md`. Keine unbestätigten Sourcepfade als vorhanden annehmen.
4. Prüfe den in EXT festgelegten Core-/Server-/Schema-/Rendererlock gegen tatsächlichen Core-SHA und die gestarteten Dateien. Ein correct Extension-SHA neben falschem Core-`main` ist kein gültiges Produktpaar.
5. Getrackte Produktquellen, Tests, Builddateien, Locks und ACs bleiben unverändert. Keine Fixes einspielen, keine Commits, kein Push, Merge, Tag, Workflow-Dispatch oder Release. Eigene Fixtures/Probes in Evidence/ignorierten Buildordnern oder separater Scratchkopie. Mutationen niemals am zu prüfenden Kandidaten.
6. Du erhältst nur Implementierungsbericht, Specs und Diff als Kontext, keine fortgesetzte Codexsession. Entwickle selbst mindestens eine relevante **neue** Gegenprobe. Ab V0 muss auch ein echter GUIpfad eigenständig geprüft werden. V5 mindestens zwei neue übergreifende Gegenproben.
7. Python ist nicht zulässig. Vorhandenen macOS-Guard nicht falsch als universellen Readonlyschutz interpretieren; er setzt ausserdem den CWD ins Core-Root. CWDs für alle Befehle ausdrücklich prüfen. Die autorisierten negativen Guardprobes sind keine Erlaubnis für eigene Pythonhilfen.
8. Keine globale Änderung von VS Code, Betriebssystemschutz, Credentials oder anderen Nutzersessions. Eigenes isoliertes Profil, eigene Prozesse, eigene Testworkspaces. Fehlende Display-/Remote-/Plattformberechtigungen nicht umgehen, sondern konkret blockieren.

## 2. Urteile und Phasenfreigabe

| Urteil | Voraussetzung | Folge |
|---|---|---|
| **PASS** | Jede Muss-AC der Phase erfüllt; richtige Produktidentitäten; fällige Tests/GUIchecks mit tatsächlichen Belegen; Code-/Zielprüfung und eigene neue Gegenprobe; keine offenen Pflichtbefunde. V5 bestätigt kumulativ alle 56 ACs. | Codex darf nächste Phase beginnen bzw. Auftrag abschliessen. |
| **FAIL** | Mindestens eine Muss-AC nachweislich verletzt: fehlendes Feature, falsche Semantik, versteckte Altdependency, GUI funktioniert nicht, unsafe edit, falscher Export, unzureichender Testharness usw. | Reproduzierbare Findings, Nacharbeit derselben Phase, neues Kandidatenpaar. |
| **BLOCKED** | Erforderlicher Nachweis objektiv nicht möglich, Modell-/SHA-/Artefaktidentität fehlt oder nötige Nutzerberechtigung/Entscheidung offen. | Keine Freigabe; Ursache und minimale Entblockung nennen. |

Kein „PASS mit offenen Muss-Punkten“. Verbesserungsvorschläge ausserhalb des Auftrags sind getrennte optionale Beobachtungen und dürfen die Abnahme nicht beliebig ausweiten. Ein neuer Coding-Agent sollte aus jedem Pflichtfinding den Fehler reproduzieren können.

## 3. Risikobasierte Testprüfung – weder Unterprüfung noch Volltestritual

Die Gateauswahl aus Plan §10 ist Teil deiner Prüfung. Lies den Diff und betroffene Aufrufer unabhängig. Für jede Testklasse/Gategruppe festhalten: fällig und selbst ausgeführt; fällig und gültigen aktuellen Plattformbeleg geprüft; nicht fällig mit konkreter Begründung; fällig aber nicht prüfbar.

- CSS-/Viewport-/Webviewänderung erzwingt GUI-/UI-/Exportnachweis, **nicht automatisch** den gesamten Compilerkorpus oder Safari/Web Image.
- Migration des gemeinsamen Renderers/Diagrammschemas berührt auch den existierenden Browserconsumer und seine Navigation/Exporte. Nur die neue VSIX zu testen reicht nicht.
- Resolver-/Workspace-/LSPänderung braucht wirkliche Prozess-/Versions-/Readonly-/Renameproben.
- Parser-/Typ-/Querysemantikänderung erfordert zusätzliche fachliche und portable Regressionen entsprechend Auswirkung. Keine neuen XFAILs oder Goldenanpassung ohne Normbeleg.
- V5 prüft kumulativ den **gesamten neuen Produktumfang**. Ein universelles `releaseCheckP3` ist nicht pauschal Pflicht, darf aber aus einem breiten tatsächlichen Core-Diff notwendig werden.

Ein Pflichtcheck, der schon fehlgeschlagen ist, wird nicht nachträglich aus dem Umfang genommen. Kein `-x test`, `@Disabled`, `--passWithNoTests`, Catch-and-PASS oder null Assertions. Gezielte Auswahl echter relevanter Tests ist dagegen ausdrücklich gewünscht.

Du musst die betroffenen risikotragenden Tests und GUIpfade selbst laufen lassen. Weitere bereits ausgeführte Pflichtgates dürfen anhand unveränderter aktueller Rohbelege **desselben Produktpaars und Artefakthashes** verifiziert werden. Alte SHAs, alte Bilder oder Zusammenfassungen sind kein Ersatz. Plattformspezifische CIbelege nur lesen/verifizieren, nicht ohne Freigabe einen Publishpfad starten.

## 4. Übergreifende Architekturprüfung

### 4.1 Eine Java-Sprachautorität

Suche nach neuen `.ili`-Parsern, Regex-Referenzresolvern, eigenen TypeScript-Symboltabellen, Dirty-Language-Service-Workern und kopierten C++/WASM-Compilerverträgen. Das neue TSprodukt darf Sprache darstellen, aber nicht ihre Semantik nachbauen. TextMate und statische Snippets sind keine zweite semantische Engine. Kontext-/QuickFix-/AutoCloseentscheidungen müssen auf der Java-Syntax-/Querybasis beruhen.

Prüfe LSP vs Extension konkret: `interlis-repository` entscheidet Modell-/Version-/Importauflösung; Java-Queries planen Editoperationen; LSP mappt Protokoll/Host; Extension startet Server, präsentiert Daten und wendet versionierte Edits über VS Code an. Keine Shell-out-Kompilierung der Diskdatei neben dem LSP für „Compile Current“.

### 4.2 Keine Abhängigkeit von interlis-language-tools

Prüfe Manifest, Lockfile, aufgelösten Dependencygraph, Typdeklarationen, Bundle, sourcemaps soweit ausgeliefert, scripts und Testimporte. Nicht nur `grep @ilic`. Kein Gitdownload/Submodul/sibling symlink/`workspace:`-/`file:`-Link zum Altprojekt, kein dynamisch geladenes `ilic.wasm`, kein Wrapperpaket, kein altes LanguageService als Type-only dependency.

Kontrolliert übernommene eigene Quellen sind erlaubt, mitsamt Copyright/License/Provenienz. Die blosse Erwähnung `interlis-language-tools` in Herkunftsangaben ist **kein** verbotenes Dependencyfinding. Neuer `@interlis/diagram-ui`-Baustein muss echte eigene neutrale Quellen besitzen und darf kein umbenanntes Gateway zum Altprojekt sein. Build und Tests müssen ohne alten Checkout laufen.

### 4.3 Eine Diagrammimplementierung

Neue gemeinsame Rendererquelle liegt in CORE/frontend/diagram-ui; bisheriger Core-Browserpfad und Extension konsumieren sie. Verifiziere, dass keine dauerhafte zweite aktive Vendorimplementierung bleibt. Fachliche Beziehungen stammen aus `DiagramDocument`, nicht aus Labelstrings. Echte Sprotty-Views und Pointerinteraktion prüfen; `toSprottyModel()` allein ist kein Interaktionsnachweis.

N-äre Assoziationen nicht zu falschen binären Kanten reduzieren. Herkunft geerbter Member, Kardinalitäten, Diamanten am richtigen Ende, Domain-/Struktur-/Constraint-/Viewdetails erhalten. Logischer Graph und Viewzustand getrennt. Ein Knotendrag oder Routinghandle darf weder Core-Snapshot noch Source/Buffer ändern. Semantisches Reconnect/Edit ist in dieser Version nicht implementiert; keine versteckten Mutationmessages.

### 4.4 Quellen-, Versions- und Sicherheitsgrenzen

VS-Code-Dokumentversion, Core-SourceRevision, SnapshotId, ServerInstance und Anfragegeneration sind verschiedene Werte. Prüfe schnelle Änderungen, Serverrestart, Panelwechsel und externe Änderungen. Alte Ergebnisse dürfen sichtbar als stale bleiben, aber keine alte Sourceposition als aktuellen Navigationsanker ausgeben.

Externe Quellen bleiben read-only, auch nach Öffnen. Doppelte Modellnamen dürfen nicht zufällig durch Dateisortierung aufgelöst werden. Rename über geschlossene Dateien darf seinen realen LSP-Rennschutz nicht als unfehlbare Dateisystemtransaktion darstellen.

CSP, lokale Ressourcen, untrusted Workspace, erlaubte URI-Schemes, Exportzielwahl, Grösse/Timeout/Cancel und sichere Texte prüfen. Keine automatischen Command-URIs aus Kommentaren. Keine Credentials in Logs. JSON-RPC bleibt ANSI-frei und protokollrein.

## 5. Phasenspezifischer Prüfauftrag

### V0 – V0-01 bis V0-07

Prüfe beide realen Repositories, aktuelle CLI1–3-Baseline, Featureaudit und kontrollierte Quellenübernahme. Manifest/Serverlauncher, gepinnte lokale Distribution, eigenes VSIX und echte installierte GUI-01–03. Ein fehlender Core/Java/Handshake muss klar scheitern. Workbenchbedienung/Problems/F12/Formatierung wenigstens als echter Vertikalpfad belegen; restliche Features noch nicht als fertig ausgeben.

**Eigene Gegenprobe:** anderer Unicode-/Leerzeichenworkspace oder fehlerhafter Serverpfad; danach korrektes Paket im frischen Profil. Prüfe, dass vorhandene alte Extension nicht unbemerkt den Sprachdienst liefert. Keine volle Compiler-/UMLsuite verlangen, die V0 noch nicht liefern soll.

### V1 – V1-01 bis V1-10

Prüfe Source-/Revision-/Readonlyfluss und vollständige standardisierte Editorfunktionen. Textformatter statt messageKey, tatsächliche RelatedInformation, globale Fehler nicht verloren. Outline hierarchisch, Current-Rootcompile vs expliziter Workspacecompile. Echte transitive Repositories und Cache/Offline/Mehrdeutigkeit.

GUI-01–11 nach Matrix, betroffene Java-/LSPtransporttests. **Eigene Gegenprobe:** offener ungespeicherter Import gewinnt gegen geschlossene Diskkopie; externer importierter Typ bleibt nach F12 read-only; unbeteiligtes defektes Modell wird nicht Root. Nicht genau Codex' Fixture wiederverwenden. Bei renamed closed source Änderungskonflikt explizit prüfen.

### V2 – V2-01 bis V2-10

Dies ist kein Review eines Screenshots, sondern des ersten **interaktiven Modell→LSP→Sprotty-Pfads**. Neutralen Paketvertrag und bestehenden Browserconsumer prüfen. Richtige Roots/Optionen/Revisionsdaten, keine doppelte JSONstringhülle als neuer angeblich typisierter Vertrag. Mindestens ein n-äres oder Self-/Parallelbeispiel unabhängig prüfen.

GUI-12–18 plus Editor-Smoke. **Selbst** Knoten/Container und Routinghandle durch echte Pointeraktionen bewegen; Vorher/Nachherbilder und Geometrie-/Source-/Bufferbelege. **Eigene Gegenprobe:** verzögerte Layoutantwort nach Editor-/Panelwechsel oder zwei gleichnamige Symbole in verschiedenen Topics. Kein falscher Sprung, keine Sourceänderung.

### V3 – V3-01 bis V3-12

Prüfe vollständige UMLkomfort-/Exportparität, nicht nur Anzahl Toolbarbuttons. Filterbaum All/None/Reset, orphan stubs, direkte/indirekte Imports, geerbte Details; Settle/Pins vs Reset; drei wirklich verschiedene Routingmodi; Undo/Viewpersistenz; Zoom/Scrollbars/Tastatur; Quellselektion; Themes und sichere Labels.

GUI-12–28 und betroffene Sprachregression. SVG-/PNG-/Inkscapeausgaben tatsächlich parsen/öffnen und Inhalt/Dimensionen/Clipping mit aktueller Ansicht vergleichen. **Eigene Gegenprobe:** manuell gebogene Selbstkante + ausgeblendete importierte Klasse + sichtbarer Ausschnitt bei Zoom; exportiere und prüfe keine verlorenen Endmarker/abgeschnittenen Labels. Änderungen bleiben view-only. Keine unbegründete komplette Compilerneuabnahme.

### V4 – V4-01 bis V4-09

Prüfe Editorhilfe in Java und reine UIantwort in TS. MODEL-/CLASS-/DOMAIN-/UNIT-/VIEW-TOPIC-Placeholders, Tab/Enter/Navigation, AutoClose erst bei passender Syntax, kein Effekt in Kommentaren/Strings/Zuordnungen. QuickFixes revisionsgebunden und ohne riskante Heuristik.

Dokumentationsprojektion nutzt vorhandene Semantik, nicht fremden AST. Labelsprachen DE/FR/IT/EN, Headeroverrides, geerbte/rekursive Strukturen, echte Markdown-/HTML-/DOCX-/GraphML-/Mermaid-/PlantUMLausgaben. Sichere Vorschau/Dateidialoge/Cancel. GUI-29–35 plus Regression laut Matrix.

**Eigene Gegenprobe:** mehrzeiliger ABSTRACT-Blockkopf mit Kommentar und Emoji, plus rekursive Struktur-/Vererbungsdokumentation. Alle Daten aus aktuellem Snapshot; Docs dürfen nicht fälschlich vollständige Validität behaupten. Eigene OOXML-/HTML-/Graph-Mutation zum Test des Artefaktcheckers ist sinnvoll, aber nur in separater Kopie.

### V5 – V5-01 bis V5-08 und kumulativ alle vorherigen ACs

Prüfe das finale Produktpaar, alle 60 Featurezeilen und alle **56** Kriterien. Neue saubere Installation ohne alte Repos oder JVM im PATH, richtige gebündelte Runtime, Licence-/Bundle-/Protokollidentität, Offline, echte Plattformsmokes und echter Remotehost. Keine universelle Plattformbehauptung aus Crossbuild.

Primärplattform vollständige GUI-01–42 mit frischen überprüfbaren Rohbelegen; weitere Pflichtplattformen und Remote nach Matrix. Selbst erneut Installation/Editor/UMLdrag/Kantenroute/Filter/Export/Restart bedienen. Code-/Test-/Bundle-/Dokuanalyse kumulativ vom assignmentBase bis candidate, nicht nur letzter kleiner Diff.

**Mindestens zwei eigene neue Gegenproben:** eine sichtbare Crossfeature-GUIkombination (Dirtyedit + readonly Import + manuelles Layout + Export/Restart) und eine falsche Paket-/Schema-/Serverversion oder fehlerhafte Sicherheits-/Harnessannahme. Negative Testkopie muss tatsächlich abgelehnt werden; Originalpaar bleibt sauber.

Keine automatische full-Core-Abnahme ohne Auswirkungsbegründung. Keine fehlenden GUI-/Plattform-/Remotechecks nachträglich optional erklären. Fehlende Pflichtausführung führt zu BLOCKED.

## 6. Echte GUIbelege und Bilderprüfung

Du musst die relevanten Screenshots öffnen und visuell prüfen. Notiere wesentliche Feststellungen: richtiger Quellbezug, passende Knoten/Labels/Marker, lesbare Rollen-/Kardinalitätslabels, sichtbare Filter-/Leerzustände, keine abgeschnittenen Controls, passende Auswahl und Fokus. Eine Bilddatei mit erwarteten Abmessungen kann trotzdem falsch sein.

Steuerung via ExTester/PageObjects/WebDriver, nicht controller methods oder state-changing Eval. Read-only DOMmessung und produktneutrale Dateivorbereitung sind erlaubt. Positive Tests mit echtem Java-LSP; ein Fakeprozess ist nur als ausdrücklich negativer Start-/Mismatchfall zulässig.

Screenshots sind Teil, nicht Gesamtheit des Orakels: zusätzlich Codes/Ranges, Geometrie vor/nach Drag, Source-/Bufferunverändertheit, echte Datei-/XML-/PNG-/OOXMLprüfung. Keine selbst erzeugten Mockupbilder oder übernommenen Referenzscreenshots als aktuelle Produktbelege.

Wähle und führe mindestens eine **neue** relevante GUIvariante pro Phase aus. Bei V0 reichen Start/Editor, ab V2 ist echte Diagramminteraktion Pflicht. Falls Anzeige/Toolrechte fehlen, früh BLOCKED mit konkretem Grund; keinen „erfolgreichen Review“ allein aus Codelektüre berichten.

## 7. Reviewbericht und maschinenlesbares Urteil

Nach tatsächlicher Prüfung im vorgegebenen Evidenceordner schreiben:

- `review.md` mit untenstehender Gliederung;
- `verdict.json` gemäss Plan §11.5;
- eigene Gegenprobeinputs/-outputs sowie GUI-/Testbelege und Pfade.

**Keine Kandidatendateien ändern.** Noch vor Abschluss in beiden Worktrees HEAD und tracked Sauberkeit erneut prüfen. Ein durch den Build geänderter getrackter Lock/Schema/Source ist offenzulegen und verhindert einen unveränderten Kandidatennachweis; nicht einfach wegresetten und verschweigen.

```markdown
# Unabhängiger Review V<N> – INTERLIS VS Code

## 1. Identität
Phase / kumulative Abnahme:
OpenCode-Version / Provider / API-Modell / APIhost / Nachweis Aliaszuordnung:
Core: assignmentBase, phaseBase, candidate, tatsächlicher HEAD:
Extension: assignmentBase, phaseBase, candidate, tatsächlicher HEAD:
Tracked Zustand vorher/nachher:
VSIX-/Server-/Schema-/UI-/Runtimehash, VSCode/Driver/OS/Architektur:

## 2. Eigene Ziel-, Code- und Architekturprüfung
Relevante Änderungen/Consumers:
Keine zweite Semantik / keine Altdependency / einzige Rendererquelle:
Fachliche und UI-Verträge, Source-/Snapshot-/Readonlygrenzen:

## 3. Jede fällige Muss-AC
| AC-ID | erfüllt / verletzt / nicht prüfbar | eigener Code-/Test-/GUIbeleg | Finding |
|---|---|---|---|

## 4. Featureparität
Betroffene F-IDs / Implementierung / tatsächlicher Benutzerpfad / Grenze:
V5: jede F01–F60 einzeln zu Nachweis oder expliziter zulässiger Abgrenzung.

## 5. Risikobasierte Tests
| Gate/Case | fällig warum / nicht fällig warum | ausgeführtes Kommando und cwd | Exit / Tests / Fehler / Skips | eigener Lauf oder geprüftes Artefakt | Rohbeleg |
|---|---|---|---|---|---|
Keine fälligen fehlenden Prüfungen verstecken.

## 6. Echte GUI und Sichtprüfung
Aktionen / sichtbare Reaktion / passende Bildpfade:
Welche Bilder tatsächlich angesehen, welche visuelle Qualität beobachtet:
Node-/Routebewegung und Source-/Bufferunverändertheit:
Exportinhalt / Dialog-/Cancelverhalten / Plattform-/Remoteidentität:

## 7. Neue Gegenproben
Hypothese und warum Codex' Tests sie nicht bereits beweisen:
Neue Fixture/Aktionen, erwartetes vs tatsächliches Ergebnis, Exit:
Falsifizierbarkeit, gegebenenfalls bewusst fehlschlagende Harnessprobe:

## 8. Findings / Blocker
ID, Muss-AC, Schwere, Quellpfad, Reproduktion, Erwartung/Beobachtung:
Notwendige Korrektur; optionale Verbesserung klar getrennt:
Fehlende Pflichtnachweise und konkrete Entblockung:

## 9. Urteil
PASS / FAIL / BLOCKED
Begründung und nächster erlaubter Schritt:
```

`verdict.json` enthält die echte Phase und beide Identitätspaare, `verdict`, `reviewer`, jede AC als `fulfilled|violated|unverified` mit eigener Evidenz, `executedChecks`, `guiEvidence`, `counterprobes`, `openMandatoryFindings`, `missingRequiredChecks` und `report`. Keine Platzhalter, keine unbekannte AC auslassen, keine PASS-Felder aus Codex' request übernehmen.

Dein Bericht darf nur den in deiner Session sichtbaren Prozesszustand beschreiben. Den **äusseren endgültigen OpenCode-/Guardexit** kann Codex erst nach deinem Prozessende feststellen; er ist zusätzliche Freigabebedingung. Behaupte nicht schon aus der laufenden Session, dass dein eigener äusserer Prozess erfolgreich beendet sei.

**Arbeite jetzt selbständig an der bezeichneten Phase.** Lies die Quellen und den Diff, bewerte die Testauswahl, führe notwendige eigene Tests und echte GUI-Gegenproben aus, prüfe jede Muss-AC und liefere ein belastbares Urteil. Keine Implementierung, keine Publikation und keine Selbstfreigabe durch den Auftraggeberagenten.
