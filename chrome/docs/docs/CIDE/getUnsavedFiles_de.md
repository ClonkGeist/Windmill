<<<getUnsavedFiles
# getUnsavedFiles

```fnpreview
Array<object> getUnsavedFiles();
```
Gibt ein Array der Dateien des Moduls zurück, die ungespeichert sind. Das Objekt hat folgende Eigenschaften:
* **filepath:**
  Pfad zur Datei.
* **index:**
  ID des zugehörigen Tabs.
* **module:**
  Die ```Window```-Instanz des Moduls.