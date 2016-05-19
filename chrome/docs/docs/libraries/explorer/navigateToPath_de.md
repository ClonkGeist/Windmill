<<<navigateToPath

# navigateToPath

```fnpreview
Task navigateToPath(string path, [opt] bool open_and_select);
```
Navigiert asynchron zu dem angegebenen Pfad im Explorer.

* **path:**
  Pfad zu der Datei/dem Verzeichnis der geöffnet werden soll. Falls dieser auf "/" endet und es sich beim letzten Element um ein Verzeichnis handelt, wird dieses auch noch geöffnet.
* **open_and_select:**
  Falls ```true```, so wird die Datei/das Verzeichnis zu dem navigiert werden soll, am Ende ausgewählt und (falls es sich dabei um ein Verzeichnis handelt) auch geöffnet.