# C4 Model Diagrams

The C4 model provides a hierarchical way to visualize software architecture at different levels of abstraction: Context, Containers, Components, and Code.

## C4 Model Levels

1. **System Context** - Shows the system and its users/external systems
2. **Container** - Shows applications, databases, and services within the system
3. **Component** - Shows internal structure of containers
4. **Code** - Class diagrams showing implementation details (use regular class diagrams)

## C4 Context Diagram

Shows the big picture: your system and its relationships with users and external systems.

### Basic Syntax

```mermaid
C4Context
    title System Context for Banking System

    Person(customer, "Customer", "A banking customer")
    System(banking, "Banking System", "Allows customers to manage accounts")
    System_Ext(email, "Email System", "Sends emails")

    Rel(customer, banking, "Uses")
    Rel(banking, email, "Sends emails via")
```

### Elements

**People:**

```mermaid
C4Context
    Person(user, "User", "Description")
    Person_Ext(external, "External User", "Outside organization")
```

**Systems:**

```mermaid
C4Context
    System(internal, "Internal System", "Description")
    System_Ext(external, "External System", "Description")
    SystemDb(database, "Database System", "Description")
    SystemDb_Ext(external_db, "External DB", "Description")
    SystemQueue(queue, "Message Queue", "Description")
    SystemQueue_Ext(external_queue, "External Queue", "Description")
```

**Relationships:**

```mermaid
C4Context
    Rel(from, to, "Label")
    Rel(from, to, "Label", "Optional Technology")
    BiRel(system1, system2, "Bidirectional")
```

## C4 Container Diagram

Zooms into the system to show containers (applications, databases, services).

### Basic Syntax

```mermaid
C4Container
    title Container Diagram for AppForms Desktop

    Person(user, "Sales Staff")

    Container_Boundary(appForms, "AppForms Windows Native") {
        Container(ui, "Presentation Layer (2_Frontend)", "WinForms, Custom Controls", "Screens, Components, Hooks")
        Container(backend, "Core Logic (1_Backend)", ".NET 6.0 C#", "Parsers, Formatters, Win32 Adapters")
        Container(shared, "Foundation (0_Shared)", "C# Records & Enums", "Shared Models, Result<T>, Constants")
        ContainerDb(db, "Config & Data Store", "JSON Files", "room_codes.json, appsettings.json")
    }

    Rel(user, ui, "Interacts with UI", "Win32 Message Loop")
    Rel(ui, backend, "Invokes Services via DI", "In-Process Call")
    Rel(backend, shared, "Uses types and contracts", "Direct Reference")
    Rel(backend, db, "Reads/Writes configurations", "System.Text.Json Atomic Write")
```

## C4 Component Diagram

Zooms into a container to show its internal components.

### Basic Syntax

```mermaid
C4Component
    title Component Diagram - Lead Converter Screen

    Container(mainForm, "MainForm", "WinForms")
    Container(clipboard, "Win32ClipboardListener", "C# Native Interop")

    Container_Boundary(leadConverter, "LeadConverter Screen Package") {
        Component(screen, "LeadConverterScreen", "Root Container", "Layout container <= 150 lines")
        Component(hook, "LeadConverterStateHook", "State Hook", "Manages state, invokes backend services")
        Component(editor, "LeadFieldEditor", "Sub-Component", "Edits parsed customer fields")
        Component(preview, "OutputPreviewBox", "Sub-Component", "Renders converted output text")
        Component(tabs, "SchemaSelectorTabs", "Sub-Component", "Selects active schema format")
    }

    Rel(mainForm, screen, "Hosts")
    Rel(clipboard, hook, "Fires OnClipboardChanged event")
    Rel(screen, hook, "Subscribes to events")
    Rel(screen, editor, "Embeds")
    Rel(screen, preview, "Embeds")
    Rel(screen, tabs, "Embeds")
    Rel(hook, preview, "Updates output text on UI thread")
```

## Best Practices

1. **Use appropriate level** - Context for stakeholders, Container for architects, Component for developers
2. **Keep it focused** - One system per Context diagram, one container per Component diagram
3. **Show key relationships** - Don't clutter with every possible connection
4. **Use consistent naming** - Same names across all diagram levels
5. **Add technology details** - Specify frameworks, languages, protocols
