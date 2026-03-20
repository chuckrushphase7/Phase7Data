Attribute VB_Name = "modRibbonGate"
Option Compare Database
Option Explicit

Public gRibbon As IRibbonUI

Public Sub OnRibbonLoad(r As IRibbonUI)
    Set gRibbon = r
End Sub

Public Sub SafeInvalidateAll()
    On Error Resume Next
    If gRibbon Is Nothing Then Exit Sub
    gRibbon.Invalidate
    Err.Clear
End Sub

