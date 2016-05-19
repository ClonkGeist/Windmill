<<<addFileTreeEntry

# addFileTreeEntry

```fnpreview
Task addFileTreeEntry(nsIFile entry, HTMLULElement parentobj, [opt] bool sort_container)
```
Fügt einen Eintrag für die angegebene Datei in dem angegebenen Container hinzu.

* **entry:**
  ```nsIFile```-Instanz der Datei dessen Eintrag hinzugefügt werden soll.
* **parentobj:**
  Container-Element welches den Eintrag erhalten soll.
* **sort_container:**
  Falls ```true```, so wird die Sortierung der Einträge nach Hinzufügen aktualisiert. (Ansonsten wird der Eintrag ganz unten dran hinzugefügt)