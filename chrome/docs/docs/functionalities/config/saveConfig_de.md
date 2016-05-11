<<<saveConfig
# saveConfig

```fnpreview
Promise saveConfig([opt] array special);
```
Speichert die Konfigurationsdatei. Falls ```special``` angegeben ist, werden nur Veränderungen der angegebenen Einträgen gespeichert.

- [opt] **special:**
  Ein Array welches Sektionsnamen oder Arrays mit Sektions- und Keynamen enthalten kann. Letztere wären im Format ["Sektion", "Key1", "Key2", ...].
  Falls gesetzt, werden nur die betroffenen Sektionen/Keys gespeichert. Arrays und Strings können auch gemischt angegeben werden.

## Beispiel

```javascript
saveConfig(["HostGame", ["StartGame", "Record"]]);
```
Speichert alle Einträge unter ```HostGame```, allerdings nur den Eintrag ```Record``` unter ```StartGame```.