<<<loadDirectory

# loadDirectory

```fnpreview
Task/bool loadDirectory(string path, [opt] HTMLULElement parentobj, [opt] bool autosearch_parent, [opt] bool no_async, [opt] Array<string> blacklist);
```
Lädt den Inhalt des angegebenen Verzeichnisses und zeigt diesen in dem angegebenen Element an.

* **path:**
  Pfad des Verzeichnisses, dessen Inhalt geladen werde soll.
* **parentobj:**
  Elternelement, in das der Inhalt reingeladen werden soll. Wird keines angegeben, so wird das HTMLULElement des Hauptverzeichnisses verwendet.
* **autosearch_parent:**
  Falls ```true```, so wird das Container-Element für das angegebene Verzeichnis automatisch gesucht. Sollte keines gefunden werden, gibt die Funktion ```false``` zurück und bricht ab.
* **no_async:**
  Falls ```true```, so ist der Ladevorgang semi-asynchron. Da einige Komponenten mittlerweile voll asynchron funktionieren, garantiert diese Methode nicht, dass der Inhalt komplett geladen worden ist nachdem die Funktion abgeschlossen worden ist, weshalb von der Verwendung abzuraten ist.
* **blacklist:**
  Ein Array das Strings enthält mit Datei- und Verzeichnisnamen die übersprungen werden sollen. (Bspw. ".git")