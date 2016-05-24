<<<UniqueFilename

# UniqueFilename

```fnpreview
function*<Promise<bool>> string UniqueFilename(string path, [opt] bool throwError, [opt] int maxAttempts);
```
Gibt den Pfad der angegebenen Datei mit einem einzigartigen Dateinamen in lesbarem Format zurück, um Duplikate umzubenennen. Der Generator gibt hierbei Promises der Funktion [OS.File.exists()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#OS.File.exists()) zurück, ist also am besten für die Benutzung in Tasks geeignet. (Mittels ```yield* UniqueFilename();```) Das Format der Dateinamen ist ```Dateiname - {Zähler}.dateiendung```.

* **path:**
  Gibt den Pfad der Datei an, für die ein einzigartiger neuer Name gesucht werden soll.
* **throwError:**
  Falls ```true```, so wird ein Fehler geworfen wenn kein neuer Name gefunden wurde, andernfalls wird nur ```undefined``` zurückgegeben.
* **maxAttempts:**
  Gibt die Anzahl der Versuche an, die durchgeführt werden sollen bis die Suche nach einem neuen Namen aufgegeben werden soll. **Standardwert:** 100.