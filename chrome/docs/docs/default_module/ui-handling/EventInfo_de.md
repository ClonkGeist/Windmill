<<<EventInfo

# EventInfo

```fnpreview
jQueryObject EventInfo(string message, [opt] string lpre);
```
Informiert den Benutzer kurzzeitig über kleinere Aktionen. Hierbei wird eine Nachricht kurzzeitig an der unteren linken Ecke des Moduls angezeigt. Sollten mehrere EventInfos abgeschickt werden, verlängern sie die Anzeigezeit der vorherigen EventInfos und stapeln sich übereinander. Zurückgegeben wird ein in einem jQuery-Objekt gewrapptes ```div```-Element (auch bei XUL-Modulen), welches die angegebene Nachricht enthält.

* **message:**
  Nachricht die angezeigt werden soll.
* **lpre:**
  Lokalisierungspräfix dessen Lokalisierungen untersucht werden sollen. Falls nicht angegeben, wird der jeweilige Lokalisierungspräfix des aktuellen Moduls verwendet, der auch in der Variable ```MODULE_LPRE``` enthalten ist.
  Integer werden hierbei nicht wirklich akzeptiert (bzw. werden als String geparst), jedoch gibt es den speziellen Wert **-1**, bei dem Lokalisierungen aus dem Hauptfenster (das über kein wirkliches Lokalisierungspräfix verfügt) geladen werden. (Alternativ kann ein leerer String "" angegeben werden.)