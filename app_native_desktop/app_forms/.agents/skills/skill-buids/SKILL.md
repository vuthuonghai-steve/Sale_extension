---
name: skill-buids
description: Quy chuẩn và hướng dẫn xây dựng Agent Skills tiêu chuẩn cao cho hệ thống AI Agent trong môi trường Windows Native Desktop C# / Clean Layered.
category: meta-engineering
version: '1.0.0'
author: 'Steve Void Team'
tags: [agent-skills, meta, standard, skill-builder, guidelines]
---

# Agent Skill Builder Specification

## Mục Đích

Skill này định nghĩa chuẩn mực kiến trúc, thư mục và quy trình tạo mới một **Agent Skill** trong thư mục `.agents/skills/`.

## Cấu Trúc Chuẩn Của Một Skill (Standard Skill Anatomy)

Mỗi skill bắt buộc phải tuân theo cấu trúc mô-đun hóa:

```text
skills/[skill-name]/
├── SKILL.md                  # [BẮT BUỘC] Tuyên ngôn mục tiêu, hướng dẫn 4-Step workflow, guardrails
├── README.md                 # [TÙY CHỌN] Giới thiệu tổng quan và usage ví dụ
├── metadata.json             # [TÙY CHỌN] Metadata phiên bản, tác giả, tài liệu tham khảo
├── knowledge/                # [TRI THỨC] Tài liệu quy ước, schema, patterns phục vụ skill
│   ├── [feature]-schema.md
│   └── [feature]-patterns.md
├── loop/                     # [VÒNG LẶP & GATES] Checklist tự kiểm tra chất lượng (Pass/Fail)
│   └── [skill]-checklist.md
├── templates/                # [MẪU MÃ NGUỒN] Template sinh mã, template tài liệu
│   └── [file].template
└── references/               # [THAM CHIẾU] Cú pháp chuyên sâu, ví dụ nâng cao
    └── [topic].md
```

## Quy Trình 4 Bước Tạo Skill Chuẩn

1. **Step 1: Define Intent & Scope**: Xác định rõ trigger phrases, input, output contract và negative space (những gì skill KHÔNG làm).
2. **Step 2: Scaffolding Directory**: Tạo thư mục `skills/[skill-name]/` kèm các thư mục con `knowledge/`, `loop/`, `templates/`, `references/`.
3. **Step 3: Author High-Density Documents**: Soạn thảo với độ sâu 100%, không viết placeholder, không tóm tắt hời hợt.
4. **Step 4: Register in `index.json`**: Cập nhật file `.agents/skills/index.json` với đầy đủ `id`, `name`, `description`, `path`, `triggers`, `tags`.

## Gating Rules Cho Một Skill Mới

- ✅ Phải có frontmatter YAML hợp lệ (`name`, `description`, `version`, `tags`).
- ✅ Phải có Guardrails và Stop Conditions rõ ràng.
- ✅ Phải có Progressive Disclosure (phân tầng tài liệu nạp theo nhu cầu).
- ✅ Không chứa `TODO` hoặc placeholder chưa hoàn thiện.
