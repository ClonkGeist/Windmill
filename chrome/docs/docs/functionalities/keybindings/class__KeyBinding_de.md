<<<class _KeyBinding

# class _KeyBinding

```fnpreview
constructor _KeyBinding(string/object id, string dks, function exec, [opt] int ct, [opt] string pfx, [opt] object opt);
constructor KeyBinding(string/object id, string dks, function exec, [opt] int ct, [opt] string pfx, [opt] object opt);
```
* **id**:
  Eindeutige ID des KeyBindings. Statt einer id kann hier ein Objekt übergeben werden, dass die Werte der o.g. Parameter enthält. Die Benennung der Eigenschaften ist dabei (mit Ausnahme von ```opt```, dessen Eigenschaften einfach direkt mit angegeben werden können) gleich mit den Parametern.
* **dks:**
  Standard Tastenkombination des KeyBindings.
* **exec:**
  Funktion die ausgeführt werden soll, wenn die Tastenkombination auf dem jeweiligen Objekt gedrückt wird.
* **ct:**
  Gibt an, was für ein KeyBoard-Event genutzt werden soll. Angegeben werden können ```KB_Call_Down``` (0), ```KB_Call_Up``` (1) und ```KB_Call_Press``` (2) die für ihre entsprechenden Gegenstücke (```keydown```, ```keyup``` und ```keypress```) stehen. Da das ```keypress```-Event vom Browser anders verabeitet wird als das ```keydown```- und das ```keyup```-Event, ist davon abzuraten ```KB_Call_Press``` zu verwenden. Standardwert ist ```KB_Call_Down```.
* **pfx:**
  Lokalisierungspräfix des jeweiligen KeyBindings. Ist auch zur Zuweisung der Tastenkombination wichtig, gibt also an welchem Modul das KeyBinding gehört.
* **options:**
  Weitere Optionen. (Aktuell gibt es keine weiteren Optionen)

```fnpreview
string getIdentifier();
```
Gibt den Identifier des KeyBindings zurück. Dieser enthält das Format ```{LPX}_{ID}```, wobei {LPX} für den jeweiligen Lokalisierungspräfix steht und {ID} für die jeweilige ID steht.

## Attribute

| Attribute	| Typ | Beschreibung |
|-----------|-----|--------------|
| **identifier** | string | Eindeutige ID des KeyBindings. |
| **prefix**	| string | Lokalisierungspräfix des jeweiligen KeyBindings. Ist auch zur Zuweisung der Tastenkombination wichtig, gibt also an welchem Modul das KeyBinding gehört. |
| **calltype** | int | Gibt an, was für ein KeyBoard-Event genutzt werden soll. (Siehe Konstruktor für weitere Informationen) |
| **defaultKeys** | string | Standard Tastenkombination des KeyBindings. |
| **exec** | function | Funktion die ausgeführt werden soll, wenn die Tastenkombination auf dem jeweiligen Objekt gedrückt wird. |
| **options** | object | Weitere Optionen. (Aktuell gibt es keine weiteren Optionen) |