<<<createNewWorkEnvironment

# createNewWorkEnvironment

```fnpreview
WorkEnvironment createNewWorkEnvironment(string path, int type, object options);
```
Erstellt eine neue Arbeitsumgebung auf der Festplatte.

* **path:**
  Pfad zum Hauptverzeichnis der Arbeitsumgebung, in der die .windmillheader hinterlegt wird.
* **type:**
  Art der Arbeitsumgebung. (```WORKENV_TYPE_ClonkPath``` oder ```WORKENV_TYPE_Workspace```)
* **options:**
  Weitere Optionen der Arbeitsumgebung. s. [class WorkEnvironment](#)