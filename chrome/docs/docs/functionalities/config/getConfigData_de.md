<<<getConfigData
# getConfigData

```fnpreview
any getConfigData(string section, string key, [opt] bool cfgobject);
```
Gibt den Inhalt des Eintrags bzw. den Eintrag selbst unter der Sektion ```section``` mit dem Key ```key``` zurück.

- **section:**
  Sektion, unter der sich der Eintrag befindet.
- **key:**
  Key des Eintrags.
- **[opt] cfgobject:**
  Falls ```true```, wird statt des Wertes des Eintrags der Eintrag selbst zurückgegeben.