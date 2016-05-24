<<<parseINI2

# parseINI2

```fnpreview
function*<string/object> void parseINI2(string/Array<Array<string>> value);
```
Durchgeht den Inhalt einer INI-Datei der entweder als String oder als vorher über [parseINIArray()](#) erhaltenen zweidimensionalen Array übergeben wird. Falls angefangen wird, eine Sektion durchzugehen, wird ein String mit dem Sektionsnamen weitergeleitet. Anschließend folgen Objekte zu den einzelnen Einträgen, die folgende Eigenschaften haben:

* **sect:**
  Name der Sektion in der sich der Eintrag befindet.
* **key:**
  Schlüssel des Eintrages.
* **val:**
  Wert des Eintrages.