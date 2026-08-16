# Flowcharts

Flowcharts visualize processes, algorithms, decision trees, and user journeys.

## Basic Syntax

```mermaid
flowchart TD
    A[Start] --> B{Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Error]
```

## Node Shapes

- `[Rectangle]` - Standard step / action
- `([Stadium])` - Start / End boundary
- `[[Subroutine]]` - Predefined process
- `[(Cylinder)]` - Database or file storage
- `((Circle))` - Connector / State
- `{Rhombus}` - Decision / Condition
- `[/Parallelogram/]` - Input / Output

## AppForms Clipboard Processing Flowchart Example

```mermaid
flowchart TD
    Start([User Copies Text to Clipboard]) --> ClipEvent[Win32ClipboardListener Intercepts WM_CLIPBOARDUPDATE]
    ClipEvent --> ReadText[Extract Text from Clipboard]
    ReadText --> ValidateEmpty{Text is empty or same?}
    ValidateEmpty -->|Yes| Ignore([Ignore and Return])
    ValidateEmpty -->|No| Detect[SchemaDetectorService.DetectSchema]
    
    Detect --> MatchFound{Matching Schema Found?}
    MatchFound -->|No| Fallback[Apply Default Generic Schema]
    MatchFound -->|Yes| Parse[MessageParserService.Parse Lead Data]
    Fallback --> Parse

    Parse --> RoomLookup[IRoomCodeRepository Standardize Room Code]
    RoomLookup --> Render[TemplateEngineService.Render Output]
    
    Render --> UpdateUI[LeadConverterStateHook fires ConversionCompleted]
    UpdateUI --> Invoke[FormStateObserver.InvokeOnUI to Update Controls]
    Invoke --> End([Ready for User / Auto-copied])
```

## Link Rules & Critical Syntax Guards

- Always wrap link labels with parentheses in double quotes: `A -->|"Parse (Fallback)"| B`.
- Never use unquoted `<` or `>` inside node text; use tildes `Result~T~` instead.
- Use exactly two hyphens for standard arrows `-->` or dotted `-.->`.
