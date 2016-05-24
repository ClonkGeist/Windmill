<<<OSFileRecursive

# OSFileRecursive

```fnpreview
Task<object> OSFileRecursive(string sourcepath, string destpath, [opt] function callback, [opt] string operation, [opt] int noOverwrite, [opt] object options, [opt] bool __rec);
```
Ermöglicht es, ganze Verzeichnisse mittels OS.File inklusive ihrer Inhalte asynchron zu verschieben oder zu kopieren. Die Funktion beschränkt sich hierbei nicht nur auf Verzeichnisse, sondern erlaubt es auch, Dateien zu verschieben/kopieren. (Unterscheidet sich jedoch kaum von [OS.File.copy()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#OS.File.copy()) bzw. [OS.File.move()](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#OS.File.move()))

* **sourcepath:**
  Pfad zu der Datei/dem Verzeichnis, welche(s) verschoben/kopiert werden soll.
* **destpath:**
  Neuer Pfad der Datei/des Verzeichnisses.
* **callback:**
  Callback der beim Kopier-/Verschiebungsvorgang aufgerufen wird. Siehe [Callbacks](#Callbacks) für weitere Informationen.
* **operation:**
  Gibt an, ob die Datei/das Verzeichnis kopiert ("copy") oder verschoben ("move") werden soll. **Standardwert:** "copy".
* **noOverwrite:**
  Falls der Wert ```1``` übergeben wird, so werden Dateien die im Zielpfad bereits vorhanden sind ignoriert. Wird der Wert ```2``` übergeben, so wird ein Fehler ausgegeben der den ganzen Task abbricht, falls eine Datei bereits im Zielpfad vorhanden ist. Wird der Wert ```0``` übergeben, so wird stattdessen versucht, eine Datei mit Namenszusatz (```" - {Nummer}"```) zu erstellen. **Standardwert:** ```1```.
* **options:**
  Weitere Optionen.
  * **checkIfFileExist:**
    Falls ```true```, so wird bei Erstellung eines Verzeichnisses geprüft, ob eine Datei mit dem gleichen Namen bereits existiert. Gilt nur, wenn ```noOverwrite``` ungleich ```0``` ist.
* **__rec:**
  Interner Hilfsparameter zur Bestimmung ob es sich um einen rekursiven Aufruf handelt und nicht um den allerersten Call. Dieser Parameter soll nicht gesetzt werden.

Der Task löst sich in ein Objekt mit folgenden Eigenschaften auf:
* **path:**
  Enthält den neuen Pfad zu der Datei/dem Verzeichnis.
* **f:**
  Enthält eine ```nsIFile```-Instanz der Datei/des Verzeichnisses an der neuen Position.

## Callbacks

```fnpreview
callback: function(string name, string path);
```
Falls angegeben, wird der Callback bei jedem Schritt kurz bevor eine Datei verschoben/kopiert wird, aufgerufen. (Im Falle von Verzeichnissen existiert das neue Verzeichnis bereits und es werden die untergeordneten Dateien/Verzeichnisse dann weiterbearbeitet)

* **name:**
  Name der Datei/des Verzeichnisses, das aktuell bearbeitet wird.
* **path:**
  Voller (Quell)Pfad zu der Datei/dem Verzeichnis.