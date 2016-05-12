<<<Locale

# Locale

```fnpreview
string Locale(string str, [opt] string/int prefix, ...);
```
Durchsucht den angegebenen String nach Strings, die lokalisiert werden sollen. (Kenntlich gemacht durch umschließende Dollarzeichen)

* **str:**
  String dessen Inhalte ggf. übersetzt werden sollen.
* **prefix:**
  Lokalisierungspräfix dessen Lokalisierungen untersucht werden sollen. Falls nicht angegeben, wird der jeweilige Lokalisierungspräfix des aktuellen Moduls verwendet, der auch in der Variable ```MODULE_LPRE``` enthalten ist.
  Integer werden hierbei nicht wirklich akzeptiert (bzw. werden als String geparst), jedoch gibt es den speziellen Wert **-1**, bei dem Lokalisierungen aus dem Hauptfenster (das über kein wirkliches Lokalisierungspräfix verfügt) geladen werden. (Alternativ kann ein leerer String "" angegeben werden.)
* **...:**
  Zusätzliche Formatierungsmöglichkeiten. Siehe [sprintf](#).