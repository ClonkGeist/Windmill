<<<readFile

# readFile

```fnpreview
string readFile(string/nsIFile input, [opt] bool nohtml);
```
Liest die angegebene Datei ein und gibt den Inhalt als dekodierten Text zurück. (Sollte nur für Textdateien u.ä. verwendet werden. Von der Benutzung dieser Funktion ist abzuraten, da die Ausführung auf dem Main-Thread verläuft. Stattdessen sollte [OS.File](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm) verwendet werden. (Siehe [OS.File.read()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#OS.File.read()))

* **input:**
  Datei die eingelesen werden soll. Hierbei kann die Datei als Pfad zur Datei angegeben werden oder als ```nsIFile```-Instanz.
* **nohtml:**
  Falls ```true```, so werden in der Ausgabe gefundene Treffer von dem Kleiner-Als-Zeichen (<), dem Größer-Als-Zeichen (>) sowie den doppelten Anführungszeichen (") durch die zugehörigen HTML-Entities &lt;, &gt; und &quot; ersetzt.