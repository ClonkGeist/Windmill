<<<Windmill Interface
# Windmill Interface

Das Windmill Interface liefert grundlegende Funktionalitäten zu allen Interface-Klassen.

### class WindmillInterface

```fnpreview
void hook(string eventName, function fn);
```
Bindet eine Funktion ```fn``` an ein Event ```eventName```.

```fnpreview
void execHook(string eventName, ...);
```
Führt alle mit ```hook``` an das Event ```eventName``` gebindete Funktionen aus.

