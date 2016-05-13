<<< C4GroupEntryCore

# C4GroupEntryCore

```fnpreview
constructor C4GroupEntryCore();
```
Erzeugt eine ```C4GroupEntryCore```-Instanz.

## Attribute

Bei den Attributen handelt es sich (mit Ausnahme von ```data```) um die Eigenschaften der Einträge des Inhaltsverzeichnis der C4Group-Dateien. Für genaueres zum Aufbau von C4Group-Dateien siehe den [C4Group Wikieintrag](http://wiki.nosebud.de/wiki/C4Group).

| Name | Typ | Beschreibung |
|------|-----|--------------|
| filename | string | Dateiname. (0x0000; 260 Bytes) |
| packed | int | Reserviert. (0x0104; 4 Bytes) |
| childgroup | int | (0x0108; 4 Bytes) |
| size | int | Dateigröße. (0x010c; 4 Bytes) |
| reserved1 | Array<PRUint8> | Reserviert. (0x0110; 4 Bytes) |
| offset | int | Abstand des Dateiinhalts vom Ende des Inhaltsverzeichnisses. (0x0114; 4 Bytes) |
| reserved2 | Array<PRUint8> | Reserviert. (0x0118; 4 Bytes) |
| reserved3 | Array<PRUint8> | Reserviert. (0x011c; 1 Byte) |
| reserved4 | Array<PRUint8> | Reserviert. (0x011d; 4 Bytes) |
| executable | PRUint8 | Gibt an, ob die Datei ausführbar ist. (0x0121; 1 Byte) |
| buffer | Array<PRUint8> | Reserviert. (0x0122; 26 Bytes) |
| data | Array<PRUint8> | Dateiinhalt. |