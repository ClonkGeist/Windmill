<<<parseINIValue

# parseINIValue

```fnpreview
any parseINIValue(string value, string type, [opt] any default_val);
```
Wandelt den angegebenen String-Wert in den angegebenen Datentyp um, um mit den Ausgaben der INI-Dateien besser arbeiten zu können.

* **value:**
  String-Wert, dessen Datentyp umgewandelt werden soll.
* **type:**
  Neuer Datentyp des Wertes. Aktuell werden nur "int", "bool" und "boolean" unterstüzt.
* **default_val:**
  Falls der String-Wert value ```undefined``` ist, wird stattdessen der hier angegebene Wert zurückgegeben. Dies dient als Shorthand beim Einlesen von INI-Dateien für Werte, die nicht zwingend existieren müssen.