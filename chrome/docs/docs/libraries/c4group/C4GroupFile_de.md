<<< C4GroupFile

# C4GroupFile

```fnpreview
constructor C4GroupFile(C4GroupHead header, C4GroupEntryCore content);
```
Erzeugt eine ```C4GroupFile```-Instanz mit dem angegebenen C4Group-Header und C4Group-EntryCore.

```fnpreview
C4GroupEntryCore getEntryByName(string filename);
```
Gibt eine ```C4GroupEntryCore```-Instanz der Datei mit dem angegebenen Dateinamen in der C4Group-Datei zurück.

## Attribute

Bei den Attributen handelt es sich um die Eigenschaften des Headers der C4Group-Dateien.

| Name | Typ | Beschreibung |
|------|-----|--------------|
| header   | C4GroupHead | Header der C4Group-Datei |
| content | Array<C4GroupEntryCore> | Inhalt der C4Group-Datei. |