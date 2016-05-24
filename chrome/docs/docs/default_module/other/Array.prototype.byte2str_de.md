<<<Array.prototype.byte2str

# Array.prototype.byte2str

```fnpreview
string Array.prototype.byte2str([opt] bool nullchars);
```
Gibt den Inhalt eines Arrays bei dessen Werten es sich um Bytes handelt als Text (mittels [String.fromCharCode()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode)) zurück.

* **nullchars:**
  Falls ```true```, so werden Nullzeichen nicht übersprungen.