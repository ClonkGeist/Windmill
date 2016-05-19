<<<removeTreeEntry

# removeTreeEntry

```fnpreview
Task removeTreeEntry(HTMLLIElement/HTMLULElement/jQueryObject obj, [opt] bool forced, [opt] bool ignoreFile);
```
Versucht, den angegebenen Eintrag inkl. damit verbundenen Dateien zu löschen. Wird ein Arbeitsverzeichnis angegeben, so wird ein Dialog erstellt über den sich die Löschung bestätigen lässt.

* **obj:**
  Eintrag, der inkl. zugehöriger Datei gelöscht werden soll.
* **forced:**
  Falls ```true```, so wird beim Löschen der Arbeitsverzeichnisse der Bestätigungsdialog übersprungen.
* **ignoreFile:**
  Falls ```true```, so wird nur der Eintrag, nicht aber die damit verbundene Datei gelöscht.