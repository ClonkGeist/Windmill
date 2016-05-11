<<<_sc.clonkpath
# _sc.clonkpath (Shortcut-Objekt)

```fnpreview
string _sc.clonkpath(int index, bool findnext);
```
Gibt einen Pfad zum Clonkverzeichnis zurück. Dabei steht der Index 0 immer für das **aktuell ausgewählte Clonkverzeichnis**.

- **index:**
  Index ausgehend von dem aktuell ausgewählten Clonkverzeichnis.
- **findnext:**
  Falls der gesuchte Eintrag leer ist, wird solange weitergesucht bis ein gültiger Pfad gefunden worden ist oder alle Einträge durchsucht worden sind. Standardwert: ```true```.
