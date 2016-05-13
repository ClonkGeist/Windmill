<<< getGroupContent

# getGroupContent

```fnpreview
Array<C4GroupEntryCore> getGroupContent(array<PRUint8> data, int count);
```
Liest den Inhaltsabschnitt der C4Group-Datei (alles außer GZIP-Header und GZIP-Footer sowie C4Group-Header) in Bytes ein und gibt diesen als einen Array von ```C4GroupEntryCore```-Instanzen zurück.

* **data:**
  Inhaltsabschnitt der C4Group-Datei als ein Array von Bytes.
* **count:**
  Anzahl der Einträge die eingelesen werden sollen.