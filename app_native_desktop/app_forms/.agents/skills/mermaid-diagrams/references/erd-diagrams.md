# Entity Relationship Diagrams (ERD)

ERDs model database and data schema relationships, showing tables/entities, their attributes, and relationships.

## Basic Syntax

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
```

## Attribute Constraints

- `PK` - Primary Key
- `FK` - Foreign Key
- `UK` - Unique Key
- `NN` - Not Null

## Cardinality Symbols

- `||` - Exactly one
- `|o` - Zero or one
- `}{` - One or many
- `}o` - Zero or many

## AppForms Data Model Example

```mermaid
erDiagram
    ROOM_CODE_REGISTRY ||--o{ ROOM_CODE_MAPPING : contains
    FORMAT_SCHEMA ||--o{ SCHEMA_FIELD_RULE : defines
    APP_SETTINGS ||--|| FORMAT_SCHEMA : "references active"

    ROOM_CODE_REGISTRY {
        string version PK
        datetime last_updated
    }

    ROOM_CODE_MAPPING {
        string room_code PK
        string standardized_name
        string building
    }

    FORMAT_SCHEMA {
        string id PK
        string name
        string category
        string template_pattern
        boolean is_builtin
    }

    SCHEMA_FIELD_RULE {
        string field_name PK
        string regex_pattern
        boolean is_mandatory
    }

    APP_SETTINGS {
        string default_schema_id FK
        boolean auto_copy_enabled
        boolean show_debug_console
        string hotkey_combination
    }
```
