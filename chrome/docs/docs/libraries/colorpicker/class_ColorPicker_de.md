<<< class ColorPicker

# class ColorPicker

```fnpreview
constructor ColorPicker();
```
Erzeugt eine ```ColorPicker```-Instanz.

```fnpreview
void fireOnChange();
```
Führt den ```change```-Callback aus.

```fnpreview
int clamp(int v);
```
Gibt den angegebenen Wert ```v``` zurück, falls dieser sich in dem Bereich 0-255 befindet. Ansonsten die entsprechend naheliegendste Grenze.

```fnpreview
Array<int> getColor();
```
Gibt den aktuell ausgewählten Farbwert als RGB-Werte in einem Array ```[r, g, b]``` aus.

```fnpreview
void setColorRGB(int r, int g, int b);
```
Setzt die aktuelle Auswahl auf den angegebenen RGB-Wert.

```fnpreview
void setColorHSL(int h, int s, int l);
```
Setzt die aktuelle Auswahl auf den angegebenen HSL-Wert

```fnpreview
ColorPicker build(HTMLElement/XULElement/jQueryObject cont, [opt] bool fA) {
```
Erstellt in dem angegebenen Container einen Color Picker.

* **cont:**
  Container-Element welches den Color Picker enthalten soll.
* **fA:**
  Falls ```true```, so lassen sich auch Alphawerte einstellen.

```fnpreview
void updatePickArea();
```
Aktualisiert die Darstellung des Farbauswahlbereiches auf den ausgewählten Farbwert.

## Attribute

Bei den Attributen handelt es sich um die Eigenschaften des Headers der C4Group-Dateien.

| Name | Typ | Beschreibung |
|------|-----|--------------|
| onchange | function | Callback der bei Veränderung aufgerufen wird. Der aktuell ausgewählte Farbwert wird dabei als ersten Parameter übergeben. |
| hasAlpha | bool | Gibt an, ob der Color Picker über eine Auswahl für den Alphakanal verfügt. |
| alpha | int | Der aktuell eingestellte Alphawert. |
| hue | int | Aktuell ausgewählter Farbwert des HSL-Farbraumes. |
| white | int | Entspricht dem umgekehrten Sättigungswert der aktuellen Farbauswahl. (1 = keine Sättigung, 0 = volle Sättigung) Dieser Wert wird nur zur Positionsbestimmung des Carets auf dem Color Picker verwendet. |
| black | int | [!INFO]. Dieser Wert wird nur zur Positionsbestimmung des Carets auf dem Color Picker verwendet. |