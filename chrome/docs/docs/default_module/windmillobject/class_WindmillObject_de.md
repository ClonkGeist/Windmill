<<<class WindmillObject

# class WindmillObject

```fnpreview
constructor WindmillObject();
```
Erstellt eine ```WindmillObject```-Instanz.

```fnpreview
void hook(string eventName, function fn);
```
Bindet eine Funktion an ein bestimmtes Windmill-Event für dieses Objekt. Die Funktionen werden im Kontext des Objektes ausgeführt, d.h. ```this``` zeigt auf das jeweilige Objekt.

* **eventName:**
  Name des Events.
* **fn:**
  Funktion die bei Auslösung des Events aufgerufen werden soll.

```fnpreview
void execHook(string eventName, ...);
```
Löst ein bestimmtes Windmill-Event für dieses Objekt aus.

* **eventName:**
  Name des Events.
* **...:**
  Parameter, die an die durch [hook()](#) gebundenen Funktionen weitergegeben werden.

## Attribute

| Attrbute | Typ | Beschreibung |
|----------|-----|--------------|
| **_HOOKS** | Array<Array<function>> | Auflistung aller gebundenen Events an das Objekt. |