# Sequence Diagrams

Sequence diagrams show interactions between participants over time (API calls, event dispatches, WinForms message handling).

## Basic Syntax

```mermaid
sequenceDiagram
    participant User
    participant System
    User->>System: Action
    System-->>User: Response
```

## AppForms Sequence Diagram Example: Clipboard Conversion Flow

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Sales Staff
    participant OS as Windows OS (Clipboard)
    participant Listener as Win32ClipboardListener
    participant Hook as LeadConverterStateHook
    participant Detector as SchemaDetectorService
    participant Parser as MessageParserService
    participant Screen as LeadConverterScreen
    participant Preview as OutputPreviewBox

    Staff->>OS: Copy text (Ctrl+C)
    OS->>Listener: Send WM_CLIPBOARDUPDATE
    Listener->>Hook: OnClipboardTextChanged(rawText)
    
    Hook->>Detector: DetectSchema(rawText)
    Detector-->>Hook: Return FormatSchema
    
    Hook->>Parser: Parse(rawText, schema)
    Parser-->>Hook: Return LeadEntity
    
    Hook->>Screen: ConversionCompleted.Invoke(leadResult)
    Screen->>Preview: InvokeOnUI(() => BindData(output))
    Preview-->>Staff: Display Formatted Message in UI
```
