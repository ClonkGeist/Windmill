<<<parseHierarchicalINI

# parseHierarchicalINI

```fnpreview
Array<INISection> parseHierarchicalINI(string text);
```
Liest den angegebenen String einer über Einrückung hierarchisch sortierten INI-Datei (Beispiel: Informationen des Clonk-Masterservers) ein und gibt diesen als Array mit ```INISection```-Instanzen zurück.