# Logging Best Practices Skill

A skill for AI coding assistants to apply structured logging best practices, wide events (canonical log lines), and Serilog multi-sink observability.

## Overview

This skill teaches the **wide events** pattern and structured logging best practices:
- Emit consolidated, context-rich events per major operation instead of scattered log lines.
- Preserve full structured metadata (objects, dictionaries, IDs) for fast log queries.
- Support 3-tier Serilog logging (Console Debug, Daily Rolling, Session Latest).

## Key Concepts

- **Wide Events**: One comprehensive event per operation, emitted in a `finally` block or on completion.
- **High Cardinality**: Queryable unique values (LeadId, SchemaId, SessionId).
- **High Dimensionality**: 15+ contextual attributes per event without performance degradation.
- **Business Context**: Customer details, schema rules applied, template parameters, conversion metrics.
- **Environment Context**: App Version, OS Version, .NET Runtime, Machine Name, Process ID.
- **Structured Message Templates**: Named parameters (`{PropertyName}`) instead of string concatenation.

## Directory Structure

```
logging-best-practices/
├── SKILL.md              # Core skill instructions and examples
├── README.md             # Overview and documentation
├── metadata.json         # Skill metadata and references
└── rules/
    ├── wide-events.md    # Wide event / canonical log line pattern (CRITICAL)
    ├── context.md        # High cardinality, business & environment context (CRITICAL)
    ├── structure.md      # Serilog multi-sink, message templates, JSON format (HIGH)
    └── pitfalls.md       # Anti-patterns and common mistakes to avoid (MEDIUM)
```

## References

- [Serilog Structured Logging](https://serilog.net)
- [Boris Tane - Observability Wide Events 101](https://boristane.com/blog/observability-wide-events-101/)
- [Stripe - Canonical Log Lines](https://stripe.com/blog/canonical-log-lines)
