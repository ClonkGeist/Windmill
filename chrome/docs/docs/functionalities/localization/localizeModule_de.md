<<<localizeModule

# localizeModule

```fnpreview
void localizeModule();
```
Durchsucht das DOM des aktuell geladenen Moduls nach Textnodes oder Element-Attrbuten die Strings zur Lokalisierung (die mit Dollarzeichen umschlossen sind) enthalten und übersetzt diese. Elemente können das Attribut "data-no-localization" angeben, um eine Lokalisierung für dieses Element und allen untergeordneten Nodes zu verhindern.