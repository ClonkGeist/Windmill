<<<getC4GroupPath

# getC4GroupPath

```fnpreview
string getC4GroupPath();
```
Gibt den Pfad zur aktuell genutzten ```c4group```-Datei zurück. Hierbei werden sämtliche Quellen berücksichtigt: ```Global::C4GroupPath``` und - falls die dort angegebene Datei nicht existiert oder nicht ausführbar ist - wird in den Clonkverzeichnissen gesucht, ausgehend von dem aktuell aktiven Clonkverzeichnis. Die neu gefundene ```c4group```-Datei wird dann entsprechend für den Konfigurationseintrag ```Global::C4GroupPath``` gesetzt.