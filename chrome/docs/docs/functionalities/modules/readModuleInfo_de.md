<<<readModuleInfo

# readModuleInfo

```fnpreview
Promise<string> readModuleInfo(string path);
```
Laedt die Moduldefinition der angegebenen ```module.ini```-Datei ein.

Das Promise löst sich in einen String mit dem Dateiinhalt auf. ([s. OS.File.read](https://developer.mozilla.org/en/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread#OS.File.read())

* **path:**
  Pfad zu einer ```module.ini```-Datei.