<<<createWorkEnvironment

# createWorkEnvironment

```fnpreview
WorkEnvironment createWorkEnvironment(string path, int type, bool forceload, object options);
```
Erzeugt ein ```WorkEnvironment```-Objekt der Arbeitsumgebung mit den angegebenen Parametern. Hierbei ist zu beachten, dass dadurch auf der Festplatte keine neue Arbeitsumgebung erzeugt wird. Dafuer sollte [createNewWorkEnvironment](#) verwendet werden.

* **path:**
  Pfad zum Hauptverzeichnis der Arbeitsumgebung. (Welches die .windmillheader-Datei enthaelt)
* **type:**
  Art der Arbeitsumgebung. (```WORKENV_TYPE_ClonkPath``` oder ```WORKENV_TYPE_Workspace```)
* **forceload:**
  Falls ```true```, so wird die Arbeitsumgebung auch geladen, wenn im Header ```Unloaded``` auf ```true``` gesetzt ist. Andernfalls wird das erstellte Objekt entfernt und die Funktion gibt ```undefined``` zurueck.
* **options:**
  Weitere Optionen der Arbeitsumgebung. s. [class WorkEnvironment](#)