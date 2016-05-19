<<<fileSorting

# fileSorting

```fnpreview
int fileSorting(Array<string> t, Array<string> t2, string fexta, string fextb);
```
Gibt einen für die Benutzung von [Array.prototype.sort()](#) angemessen Wert zur Sortierung zweier Dateien zurück. Hierbei werden Verzeichnisse sowie Prioritäten zwischen Dateiendungen berücksichtigt.

* **t:**
  Dateiname der ersten Datei, der mittels [String.prototype.split()](#) und Punkten (".") als Seperator aufgeteilt worden ist.
* **t2:**
  Dateiname der zweiten Datei, der mittels [String.prototype.split()](#) und Punkten (".") als Seperator aufgeteilt worden ist.
* **fexta:**
  Dateiendung der ersten Datei. Falls es sich um ein Verzeichnis handelt, soll nichts weitergegeben werden.
* **fextb:**
  Dateiendung der zweiten Datei. Falls es sich um ein Verzeichnis handelt, soll nichts weitergegeben werden.