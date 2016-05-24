<<<parseINIArray

# parseINIArray

```fnpreview
Array<Array<string>> parseINIArray(string text);
```
Gibt den übergebenen Inhalt einer INI-Datei in Form eines zweidimensionalen Arrays wieder. Auf die Werte der einzelnen Einträge kann anschließend über ```array["Section"]["Key"]``` bzw. ```array.Section.Key``` zugegriffen werden.