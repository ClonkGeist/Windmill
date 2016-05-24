<<<class INISection

# class INISection

```fnpreview
constructor INISection(string name, [opt] INISection top);
```
Erstellt eine ```INISection```-Instanz mit den angegebenen Werten.

* **name:**
  Name der Sektion.
* **top:**
  Übergeordnete ```INISection```-Instanz.

```fnpreview
object newSection();
```
Erstellt ein Vorkommen der angegebenen Sektion. (Für INI-Dateien mit mehreren gleichnamigen Sektionen.)

## Attribute

| Attrbute | Typ | Beschreibung |
|----------|-----|--------------|
| **name** | string | Name der Sektion. |
| **top** | INISection | Übergeordnete ```INISection```-Instanz. |
| **plainstr** | string | Enthält die ausgelesene Sektion als String. |
| **length** | int | Gibt die Anzahl der Vorkommen dieser Sektion an. Die einzelnen tatsächlichen Aktionen lassen sich ähnlich einem Array dann über den Index erfassen. (0, 1, ...) |