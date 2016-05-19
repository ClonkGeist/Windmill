<<<handleTreeEntry

# handleTreeEntry

```fnpreview
bool handleTreeEntry(HTMLLIElement/HTMLULElement/jQueryObject obj, [opt] bool open_sidedeck);
```
Versucht die Datei des jeweiligen Eintrages zu öffnen. Falls es sich bei dem Eintrag um eine \*.ocs-Datei handelt, so wird OpenClonk mit den entsprechenden Startparametern ausgeführt.

* **obj:**
  Eintrag dessen Datei versucht wird zu öffnen.
* **open_sidedeck:**
  Falls ```true```, so wird versucht die Datei im Nebendeck zu öffnen. (Entwicklermodus)