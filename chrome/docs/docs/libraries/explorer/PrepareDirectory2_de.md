<<<PrepareDirectory2

# PrepareDirectory2

```fnpreview
bool PrepareDirectory2(nsIFile c4group, string path, nsISimpleEnumerator entries, [opt] function call);
```
Bereitet das angegebene Verzeichnis für Windmill vor. (Gepackte Elemente werden mittels c4group zerlegt) Diese Funktion dient für den tatsächlichen Zerlegungs-Vorgang, der möglichst über die Funktion [PrepareDirectory](#) eingeleitet werden sollte.

* **c4group:**
  ```nsIFile```-Instanz der c4group-Executable die zum Zerlegen genutzt wird.
* **path:**
  Verzeichnis das vorbereitet werden soll.
* **entries:**
  ```nsISimpleEnumerator```-Instanz der einzelnen Dateieinträge des Verzeichnisses. (Z.B. Erhältlich über das ```directoryEntries```-Attribut von ```nsIFile```)
* **call:**
  Wird aufgerufen, wenn die Vorbereitungen abgeschlossen sind.