# Mermaid Diagrams Skill

A comprehensive guide for creating professional software diagrams using Mermaid's text-based syntax. This skill enables you to visualize system architecture, document code structure, model databases, and communicate technical concepts through diagrams.

## Purpose

Transform complex technical concepts into clear, maintainable diagrams that can be version-controlled alongside your code. Mermaid diagrams are rendered from simple text definitions, making them easy to update, review in pull requests, and maintain over time.

## When to Use This Skill

Use this skill when you need to:

- **Document architecture** - Visualize system context, containers, components, and deployment
- **Model domains** - Create domain models with entities, relationships, and behaviors
- **Explain flows** - Show API interactions, user journeys, authentication sequences
- **Design databases** - Document table relationships, keys, and schema structure
- **Plan processes** - Map workflows, decision trees, algorithms, and pipelines
- **Communicate designs** - Align stakeholders on technical decisions before coding

### Trigger Phrases

The skill activates when you mention:

- "diagram", "visualize", "model", "map out", "show the flow"
- "architecture diagram", "class diagram", "sequence diagram", "flowchart"
- "database schema", "ERD", "entity relationship"
- "system design", "data model", "domain model"

## How It Works

1. **Choose the right diagram type** based on what you want to communicate
2. **Start with core elements** - entities, actors, or components
3. **Add relationships** - connections, flows, interactions
4. **Refine incrementally** - add details, styling, notes
5. **Export or embed** - use in documentation, PRs, wikis

Mermaid syntax is intuitive and follows a consistent pattern across all diagram types:

```mermaid
diagramType
  definition content
```

## Key Features

### 9 Diagram Types Supported

1. **Class Diagrams** - Domain models, OOP design, entity relationships
2. **Sequence Diagrams** - API flows, user interactions, temporal sequences
3. **Flowcharts** - User journeys, processes, decision logic, pipelines
4. **Entity Relationship Diagrams** - Database schemas, table relationships
5. **C4 Architecture Diagrams** - System context, containers, components
6. **State Diagrams** - State machines, lifecycle states
7. **Git Graphs** - Branching strategies, version control flows
8. **Gantt Charts** - Project timelines, scheduling
9. **Pie/Bar Charts** - Data visualization, metrics

### Advanced Capabilities

- **Themes and styling** - Default, forest, dark, neutral, base themes
- **Custom theming** - Configure colors, fonts, and layout
- **Layout options** - Dagre (balanced) or ELK (advanced)
- **Look options** - Classic or hand-drawn sketch style
- **Subgraphs** - Group related elements for clarity
- **Notes and comments** - Add context and explanations
- **Alt/loop/opt blocks** - Complex flow control in sequences

### Integration Support

- **GitHub/GitLab** - Automatic rendering in Markdown files
- **VS Code** - Preview with Markdown Mermaid extension
- **Notion, Obsidian, Confluence** - Built-in support
- **Export** - PNG, SVG, PDF via Mermaid Live or CLI

## Detailed References

For comprehensive syntax and advanced features, see:

- **[SKILL.md](SKILL.md)** - Quick start guide and diagram selection
- **[references/class-diagrams.md](references/class-diagrams.md)** - Relationships, multiplicity, methods
- **[references/sequence-diagrams.md](references/sequence-diagrams.md)** - Messages, activations, loops, alt blocks
- **[references/flowcharts.md](references/flowcharts.md)** - Node shapes, decision logic, subgraphs
- **[references/erd-diagrams.md](references/erd-diagrams.md)** - Cardinality, keys, attributes
- **[references/c4-diagrams.md](references/c4-diagrams.md)** - Context, container, component levels
- **[references/advanced-features.md](references/advanced-features.md)** - Themes, styling, configuration

## Tools and Resources

- **[Mermaid Live Editor](https://mermaid.live)** - Interactive editor with instant preview and export
- **[Official Documentation](https://mermaid.js.org)** - Comprehensive syntax reference
- **Mermaid CLI** - `npm install -g @mermaid-js/mermaid-cli` for batch exports
- **VS Code Extension** - "Markdown Preview Mermaid Support" for live preview
- **GitHub** - Native rendering in all `.md` files
