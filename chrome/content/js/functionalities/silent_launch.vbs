ReDim arr(WScript.Arguments.Count-1)
For i = 0 To WScript.Arguments.Count-1
  arr(i) = WScript.Arguments(i)
Next

CreateObject("Wscript.Shell").Run "" & Join(arr) & "", 0, True