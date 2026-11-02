# V4 attempt02 – unveränderte Originale und äussere Validierung

Originalreview und Verdict: unabhängiges PASS auf Core6983baf / Extension36b87bc.
Die äussere Prüfung akzeptiert alle9 ACs erst nach tatsächlichem Prozess-/Guardende.
Originale sind bytegleich kopiert; archive-integrity.json nennt alle Hashes.
Vollständige Rohlogs, Bilder, JUnit, Sessionexport und Fehlversuche bleiben extern
unter /Users/stefan/sources/interlis-vscode-evidence/reviews/V4-r2.

23 tatsächliche Bildreads decken23 Sichtungsangaben mit einer expliziten
identischen Archivkopie ab. OpenCode verkleinert PNGs beim Lesen; Sourcehash
und tatsächlich übertragener Bildinhalt sind deshalb getrennt dokumentiert.
Eine Probe des äusseren Auditors mit fälschlicher Original-/Transfer-Bytegleichheit
wurde korrigiert; Rohprobe bleibt extern erhalten.

Der Originalbericht verweist irrtümlich auf logs/python-free.log. Dieser Pfad
existiert nicht. Die tatsächliche erfolgreiche unabhängige Ausführung steht in
opencode.jsonl Zeile561 und ist unverändert in outer-python-free-tool-result.json
extrahiert. Kein Test und kein vermeintliches Original-Log wurden nacherfunden.
Die drei gescheiterten neuen Counterprobe-Harnessläufe bleiben erhalten; nur
der finale tatsächliche 4/4-Lauf zählt.
