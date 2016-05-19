<<<selectTreeEntryCrs

# selectTreeEntryCrs

```fnpreview
bool selectTreeEntryCrs(int val);
```
Wählt ausgehend vom aktuell ausgewählten Eintrag den nächsten Eintrag aus, der um ```val``` Schritte vom aktuell ausgewählten Eintrag entfernt ist. Hierbei werden alle Ebenen sowie nur sichtbare Elemente berücksichtigt. Negative Werte weisen auf eine Bewegung nach oben hin, während positive Werte eine Bewegung nach unten bedeuten. Falls das obere/untere Ende bereits erreicht wurde, so wird vom jeweils anderen Ende von vorne angefangen.