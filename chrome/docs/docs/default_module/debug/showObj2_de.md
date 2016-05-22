<<<showObj2

# showObj2

```fnpreview
string showObj2(object obj, [opt] int depth, [opt] object options);
```
Gibt die (aufzählbaren) Eigenschaften eines Objektes in Form eines formatierten Strings in der Javascript Konsole aus. Falls unter den Optionen ```avoidErr``` gesetzt wird, wird die Ausgabe stattdessen als String zurückgegeben. Der ausgegebene String stellt das Objekt hierarchisch dar.

* **obj:**
  Objekt, das angezeigt werden soll.
* **depth:**
  Maximale Tiefe wie weit verschachtelte Objekte durchsucht werden soll. Der Wert "0" zeigt hierbei nur die Eigenschaften des angegebenen Objektes an ohne die Eigenschaften untergeordneter Objekte zu berücksichtigen. Hierbei ist zu beachten, dass Circular References nicht erkannt werden und entsprechend auch dargestellt werden. Standardwert oder falls "-1" angegeben wird: 10.
* **options:**
  Weitere Optionen.
  * **avoidErr:**
    Falls ```true```, so wird die Ausgabe als String zurückgegeben.
  * **maxArraySize:**
    Falls angegeben, so werden Arrays die mehr Einträge haben als hier angegeben nur gekürzt angezeigt. (Nur die ersten zwei und letzten zwei Einträge)
