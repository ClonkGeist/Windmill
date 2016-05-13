<<< C4GroupHead

# C4GroupHead

```fnpreview
constructor C4GroupHead();
```
Erzeugt eine ```C4GroupHead```-Instanz.

## Attribute

Bei den Attributen handelt es sich um die Eigenschaften des Headers der C4Group-Dateien. Für genaueres zum Aufbau von C4Group-Dateien siehe den [C4Group Wikieintrag](http://wiki.nosebud.de/wiki/C4Group).

| Name | Typ | Beschreibung |
|------|-----|--------------|
| id   | string | ID des C4Group-Headers. (0x0000; 25 Bytes) |
| reserved1 | Array<PRUint8> | Reserviert. (0x0019; 3 Bytes) |
| ver1 | int | Versionsnummer 1. (0x001C; 4 Bytes) |
| ver2 | int | Verisonsnummer 2. (0x0020; 4 Bytes) |
| entries | int | Anzahl der Unterordner und Dateien. (0x0024; 4 Bytes) |
| author | string | Name des Autors. (0x0028; 32 Bytes) |
| reserved2 | Array<PRUint8> | Reserviert. (0x0048; 164 Bytes) |