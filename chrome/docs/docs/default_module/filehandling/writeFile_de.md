<<<writeFile

# writeFile

```fnpreview
string writeFile(string path, string text, [opt] bool fCreateIfNonexistent);
```
Schreibt eine Datei mit dem angegebenen Inhalt unter dem angegebenen Pfad. (Von der Benutzung dieser Funktion ist abzuraten, da die Ausführung auf dem Main-Thread verläuft. Stattdessen sollte [OS.File](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm) verwendet werden. (Siehe [OS.File.writeAtomic()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#OS.File.writeAtomic()))

* **path:**
  Pfad der zu Schreibenden Datei.
* **text:**
  Textinhalt der zu Schreibenden Datei.
* **fCreateIfNonexistent:**
  Falls ```true```, so wird die Datei neu erstellt wenn nicht vorhanden. Ansonsten wird ein Fehler zurückgegeben.