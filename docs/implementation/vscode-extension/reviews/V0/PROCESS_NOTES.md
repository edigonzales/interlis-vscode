# V0 – äussere Abschlussprüfung

Akzeptiertes unabhängiges Inhalts-PASS: Versuch02, sieben erfüllte ACs, Core `76df3815973597280845a9bb575fa399e9773ccc`, Extension `d8f8adeb89e26f8a979744b81299d51da45cf0fe`.
OpenCode2.0.28, DeepSeek direkt, Session `ses_e6829e6d3ffePmDs0M8Plx1SAp`; tatsächlicher ProzessExit0, Guard passed/Exit0, beide detached Trees unverändert.
Die Originalberichte und Verdicts wurden bytegleich kopiert; Digests in den jeweiligen archive-index.json.

Versuch01 enthielt fünf nicht belegte Bild-Lesebehauptungen und wurde operativ nicht akzeptiert. Versuch02 öffnete diese Bilder selbst, wiederholte den echten installierten Smoke und ergänzte eine eigene neue Tamper-GUIprobe. Die äussere Prüfung gleicht alle aufgeführten Bildpfade mit tatsächlichen erfolgreichen Read-Aufrufen ab.

Prozessabweichung in Versuch02: Ein versehentlich formulierter Python3-Hilfsaufruf erreichte keinen Interpreter (`command not found`); die geerbte Umgebung verhinderte Pythonausführung. Der Reviewer dokumentiert dies selbst. Es wurde kein Python ausgeführt und kein Pythonartefakt verwendet; Node-/Java-/GUIbelege und Guardabschluss sind unabhängig geprüft. Für folgende Reviews wird diese Befehlsart zusätzlich ausdrücklich auf Toolrechtebene gesperrt.

Darwin-Kernel24.6.0 in den Runnerdaten ist keine macOS-Produktversionsnummer; die Primärplattform ist macOS15.8.1 arm64. V0 verwendet explizites Temurin25.0.3 und behauptet keine gebündelte Runtime oder weitere geprüfte Plattform.
