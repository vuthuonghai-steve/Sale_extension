---
name: Git Commit Helper
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
category: version-control
version: '1.0.0'
author: 'Steve Void Team'
tags: [git, conventional-commits, changelog, desktop-engineering]
---

# Git Commit Helper

## Quick Start

Analyze staged changes and generate commit message:

```bash
# View staged changes
git diff --staged

# Generate commit message based on changes
```

## Commit Message Format

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature (Thêm chức năng mới)
- **fix**: Bug fix (Sửa lỗi)
- **docs**: Documentation changes (Tài liệu hóa)
- **style**: Code style changes (Formatting, khoảng trắng, không ảnh hưởng logic)
- **refactor**: Code refactoring (Tái cấu trúc mã nguồn, không sửa logic hay thêm tính năng)
- **test**: Adding or updating tests (Thêm hoặc cập nhật unit test)
- **chore**: Maintenance tasks (Cập nhật build script, dependencies, rules, configs)

### Scopes Phù Hợp Cho AppForms (.NET WinForms)

- **shared**: `0_Shared/` (Enums, Types, Constants, Results)
- **backend**: `1_Backend/` (Services, Parsers, Adapters, Repositories)
- **frontend**: `2_Frontend/` (Screens, Components, Hooks, Models)
- **lead-converter**: Screen LeadConverter
- **settings**: Screen Settings
- **clipboard**: Win32 Clipboard Listener / Native interop
- **logging**: Serilog multi-sink logging
- **agents**: Agent rules, skills, hooks

### Examples

**Feature commit:**

```
feat(lead-converter): add custom schema detection for Zalo orders

Implement automatic detection of Zalo order format:
- Add regex detection rule in SchemaDetectorService
- Update LeadConverterStateHook to handle new format
- Add unit test coverage for multi-line customer data
```

**Bug fix:**

```
fix(clipboard): resolve cross-thread UI exception on copy

Wrap UI state update in FormStateObserver.InvokeOnUI to prevent
InvalidOperationException when clipboard event fires from background listener.
```

**Refactor:**

```
refactor(frontend): decouple LeadFieldEditor into standalone component

- Move field binding logic from LeadConverterScreen to LeadFieldEditor
- Reduce LeadConverterScreen size to under 120 lines
- Bind data using FormModel instead of direct control assignment
```

## Analyzing Changes

Review what's being committed:

```bash
# Show files changed
git status

# Show detailed changes
git diff --staged

# Show statistics
git diff --staged --stat

# Show changes for specific file
git diff --staged path/to/file
```

## Commit Message Guidelines

**DO:**

- Use imperative mood ("add feature" not "added feature" / "thêm tính năng" thay vì "đã thêm")
- Keep first line under 50-72 characters
- Capitalize first letter of description if following style
- No period at end of summary line
- Explain WHY not just WHAT in body
- Link to issue or task ID if applicable

**DON'T:**

- Use vague messages like "update", "fix stuff", "wip"
- Include unneeded technical noise in summary
- Write long paragraphs in the first summary line
- Use past tense ("fixed", "added")

## Multi-File Commits

When committing multiple related changes across layers:

```
refactor(backend): standardize Result<T> pattern in FormConverterService

- Replace throw Exception with Result<T>.Success() / Result<T>.Failure()
- Update IFormConverterService contract and consumer StateHooks
- Add test cases covering error propagation

BREAKING CHANGE: IFormConverterService.Convert() now returns Result<string> instead of string.
```

## Breaking Changes

Indicate breaking changes clearly with `!` or `BREAKING CHANGE:` footer:

```
feat(contracts)!: update FormatSchema entity to support multi-step regex

BREAKING CHANGE: FormatSchema now requires StepRegexList instead of single Pattern.

Migration guide: Update room_codes.json and DefaultSchemas accordingly.
```

## Interactive Commit Helper Workflow

1. **Review changes**: `git diff --staged`
2. **Identify type**: feat, fix, refactor, chore, docs, test
3. **Determine scope**: 0_Shared, 1_Backend, 2_Frontend, Screen name
4. **Write summary**: Concise imperative description
5. **Add body**: Explain why and architectural impact
6. **Note breaking changes**: If interfaces or contracts changed

## Best Practices

1. **Atomic commits** - One logical change per commit
2. **Test before commit** - Verify `dotnet build` / `dotnet test` passes
3. **Keep it focused** - Don't mix unrelated changes
4. **Write for humans & CI** - Clear history for release notes and git blame

## Commit Message Checklist

- [ ] Type is appropriate (feat/fix/docs/refactor/test/chore)
- [ ] Scope is specific and accurately reflects the layer/module
- [ ] Summary is concise (under 72 characters)
- [ ] Summary uses imperative mood
- [ ] Body explains WHY not just WHAT
- [ ] Breaking changes are clearly marked if contracts changed
