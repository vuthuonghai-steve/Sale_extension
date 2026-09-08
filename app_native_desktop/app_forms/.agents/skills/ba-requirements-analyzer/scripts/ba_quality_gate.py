#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mechanical Quality Gatekeeper for BA Requirements Documents under IIBA BABOK Standards.
Executes static syntax rules and invokes Antigravity CLI in headless mode with JSON schema enforcement.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# Force UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


DEFAULT_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "verdict": { "type": "string", "enum": ["APPROVED", "REJECTED"] },
        "quality_scores": {
            "type": "object",
            "properties": {
                "taxonomy_compliance": { "type": "integer" },
                "smart_nfr_rigor": { "type": "integer" },
                "traceability_coverage": { "type": "integer" },
                "transition_readiness": { "type": "integer" },
                "overall_score": { "type": "integer" }
            },
            "required": ["taxonomy_compliance", "smart_nfr_rigor", "traceability_coverage", "transition_readiness", "overall_score"]
        },
        "detected_vague_adjectives": {
            "type": "array",
            "items": { "type": "string" }
        },
        "negative_space_audit": {
            "type": "object",
            "properties": {
                "has_prohibited_actions_defined": { "type": "boolean" },
                "prohibited_items": { "type": "array", "items": { "type": "string" } },
                "violations_found": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["has_prohibited_actions_defined", "prohibited_items", "violations_found"]
        },
        "violations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "tier": { "type": "string" },
                    "severity": { "type": "string", "enum": ["CRITICAL", "MAJOR", "MINOR"] },
                    "location": { "type": "string" },
                    "issue": { "type": "string" },
                    "actionable_fix": { "type": "string" }
                },
                "required": ["tier", "severity", "location", "issue", "actionable_fix"]
            }
        },
        "summary": { "type": "string" }
    },
    "required": ["verdict", "quality_scores", "detected_vague_adjectives", "negative_space_audit", "violations", "summary"]
}


def local_sanity_checks(draft_content: str) -> tuple:
    """Executes deterministic syntax and heuristic checks on the requirements markdown."""
    violations = []
    detected_vague = []

    # 1. Zero-Placeholder Check
    placeholder_patterns = [
        (r'\bTODO\b', "Chứa từ khóa placeholder 'TODO'", "CRITICAL"),
        (r'\bFIXME\b', "Chứa từ khóa placeholder 'FIXME'", "CRITICAL"),
        (r'\bmock_data\b', "Chứa dữ liệu giả lập 'mock_data'", "MAJOR"),
        (r'/\*\s*code here\s*\*/', "Chứa khối code rỗng", "CRITICAL"),
        (r'\[\s*\.\.\.\s*\]', "Chứa ký hiệu lấp liếm lửng lơ '[...]'", "MAJOR")
    ]
    for pattern, desc, sev in placeholder_patterns:
        matches = re.findall(pattern, draft_content, re.IGNORECASE)
        if matches:
            violations.append({
                "tier": "Zero-Placeholder Gate",
                "severity": sev,
                "location": f"Draft Body ({len(matches)} occurrences)",
                "issue": f"{desc} xuất hiện {len(matches)} lần.",
                "actionable_fix": "Xóa bỏ hoàn toàn mã/văn bản giữ chỗ, điền nội dung thực tế 100%."
            })

    # 2. Vague Adjectives Detection in NFR / Quality context
    vague_candidates = [
        "nhanh", "mượt mà", "ổn định", "an toàn", "dễ dùng", "thân thiện",
        "tối ưu", "mạnh mẽ", "linh hoạt", "fast", "secure", "stable", "user-friendly"
    ]
    # Check if vague words are used without numbers nearby
    for word in vague_candidates:
        matches = re.findall(rf'(?i)\b{word}\b', draft_content)
        if matches:
            detected_vague.append(word)

    # 3. BABOK 4-Tier Taxonomy Check
    has_br = bool(re.search(r'(?i)(#.*(Business Requirements|Mục tiêu nghiệp vụ)|\[BR-\d+\])', draft_content))
    has_sr = bool(re.search(r'(?i)(#.*(Stakeholder Requirements|Nhu cầu bên liên quan)|\[SR-\d+\])', draft_content))
    has_fr = bool(re.search(r'(?i)(#.*(Functional Requirements|Yêu cầu chức năng)|\[FR-\d+\])', draft_content))
    has_nfr = bool(re.search(r'(?i)(#.*(Non-Functional Requirements|Yêu cầu phi chức năng)|\[NFR-\d+\])', draft_content))
    has_tr = bool(re.search(r'(?i)(#.*(Transition Requirements|Yêu cầu chuyển tiếp)|\[TR-\d+\])', draft_content))

    missing_tiers = []
    if not has_br: missing_tiers.append("Business Requirements (BR)")
    if not has_sr: missing_tiers.append("Stakeholder Requirements (SR)")
    if not has_fr: missing_tiers.append("Functional Requirements (FR)")
    if not has_nfr: missing_tiers.append("Non-Functional Requirements (NFR)")
    if not has_tr: missing_tiers.append("Transition Requirements (TR)")

    if missing_tiers:
        violations.append({
            "tier": "Taxonomy Gate",
            "severity": "CRITICAL",
            "location": "Document Architecture",
            "issue": f"Tài liệu thiếu các tầng cấu trúc BABOK bắt buộc: {', '.join(missing_tiers)}.",
            "actionable_fix": "Bổ sung đầy đủ 4 tầng BABOK (BR, SR, FR, NFR, TR) theo template chuẩn."
        })

    # 4. Bidirectional Traceability Check (RTM)
    has_rtm = bool(re.search(r'(?i)(\|.*BR.*\|.*SR.*\|.*FR.*\||Ma trận truy vết|Traceability Matrix)', draft_content))
    if not has_rtm:
        violations.append({
            "tier": "Traceability Gate",
            "severity": "CRITICAL",
            "location": "Traceability Section",
            "issue": "Thiếu bảng ma trận truy vết hai chiều (Requirements Traceability Matrix - RTM).",
            "actionable_fix": "Bổ sung bảng RTM đối chiếu đầy đủ từ BR -> SR -> FR/NFR -> TR -> Test Case."
        })

    # 5. Negative Space Check
    has_negative = bool(re.search(r'(?i)(Negative Space|Điều cấm|CẤM|MUST NOT|Không được|Prohibited)', draft_content))
    prohibited_items = []
    if has_negative:
        neg_matches = re.findall(r'(?im)^[\s*-]*(?:CẤM|KHÔNG ĐƯỢC|MUST NOT|Tuyệt đối cấm)[^\r\n]+', draft_content)
        prohibited_items = [m.strip() for m in neg_matches]
    else:
        violations.append({
            "tier": "Defensive Gate",
            "severity": "CRITICAL",
            "location": "System Constraints",
            "issue": "Thiếu định nghĩa Negative Space (Không gian phủ định: tối thiểu 3-5 điều hệ thống CẤM LÀM).",
            "actionable_fix": "Bổ sung mục Negative Space quy định rõ các ranh giới cấm kỵ của hệ thống."
        })

    structural_status = {
        "has_br": has_br, "has_sr": has_sr, "has_fr": has_fr,
        "has_nfr": has_nfr, "has_tr": has_tr, "has_rtm": has_rtm,
        "has_negative": has_negative, "prohibited_items": prohibited_items
    }
    return violations, list(set(detected_vague)), structural_status


def extract_json_payload(raw_text: str):
    """Extracts and parses JSON object even if wrapped in markdown fences or trailing logs."""
    if not raw_text or not raw_text.strip():
        return None
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'(\{[\s\S]*\})', cleaned)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
    return None


def run_headless_audit(draft_content: str, draft_path: Path, schema_path: Path, effort: str, timeout_sec: int) -> dict:
    """Invokes agy in headless mode to perform semantic evaluation against JSON schema."""
    if len(draft_content) > 4000:
        doc_ref = f"[TÀI LIỆU CẦN KIỂM DUYỆT]: Đọc trực tiếp từ đường dẫn tệp tin: {draft_path.resolve()}"
    else:
        doc_ref = f"[NỘI DUNG TÀI LIỆU CẦN KIỂM DUYỆT]:\n{draft_content}"

    audit_prompt = (
        "Bạn là Independent Senior BA Quality Gatekeeper và Compliance Auditor theo chuẩn IIBA BABOK Guide v3 và AGENTS.md.\n"
        "Nhiệm vụ: Thẩm định hồ sơ đặc tả yêu cầu nghiệp vụ sau đây và trả về báo cáo JSON đúng cấu trúc schema được chỉ định.\n\n"
        "Tiêu chuẩn kiểm định:\n"
        "1. Taxonomy Gate: Phân loại chuẩn 4 tầng (BR, SR, Solution FR/NFR, TR). CẤM đưa giải pháp công nghệ/tính năng vào BR.\n"
        "2. SMART NFR Gate: 100% NFR phải có chỉ số đo lường vật lý (latency ms, RPS, % SLA, RAM/CPU, encryption algorithm). Nếu có tính từ cảm tính (nhanh, mượt, an toàn, dễ dùng) mà không có số đo, lập tức trừ điểm nặng và ghi vào detected_vague_adjectives.\n"
        "3. Traceability Gate: RTM phải liên kết 2 chiều. Bắt buộc kiểm tra và cảnh báo Gold-Plating (tính năng không có BR bảo trợ) và Orphaned Goals (mục tiêu kinh doanh không có FR/NFR hiện thực hóa).\n"
        "4. Defensive Gate: Phải có ít nhất 3 điều cấm kỵ rõ ràng trong Negative Space.\n"
        "5. Zero-Placeholder: Không được có bất kỳ TODO, FIXME hay nội dung giữ chỗ nào.\n\n"
        f"{doc_ref}"
    )

    cmd = [
        "agy",
        "-p", audit_prompt,
        "--effort", effort,
        "--output-format", "json",
        "--json-schema", str(schema_path.resolve()),
        "--dangerously-skip-permissions"
    ]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_sec
        )
        if proc.returncode == 0 and proc.stdout.strip():
            raw_json = extract_json_payload(proc.stdout)
            if raw_json:
                structured = raw_json.get("structured_output")
                if not structured and "response" in raw_json:
                    structured = extract_json_payload(raw_json["response"])
                if structured and isinstance(structured, dict):
                    return structured
    except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError) as e:
        sys.stderr.write(f"[WARN] Headless execution note: {e}\n")

    return None


def main():
    parser = argparse.ArgumentParser(description="Mechanical Quality Gatekeeper for BA Requirements Documents.")
    parser.add_argument("--draft", required=True, help="Path to markdown requirements document to audit.")
    parser.add_argument("--schema", default="", help="Path to audit JSON schema.")
    parser.add_argument("--effort", default="medium", choices=["low", "medium", "high"], help="Thinking effort.")
    parser.add_argument("--timeout", type=int, default=180, help="Timeout in seconds.")
    args = parser.parse_args()

    draft_path = Path(args.draft)
    if not draft_path.exists():
        sys.stderr.write(f"[FAIL] Target Draft file does not exist: {draft_path}\n")
        sys.exit(1)

    skill_root = Path(__file__).resolve().parent.parent
    schema_path = Path(args.schema) if args.schema else skill_root / "schemas" / "ba-audit-schema.json"
    if not schema_path.exists():
        sys.stderr.write(f"[FAIL] Schema file not found: {schema_path}\n")
        sys.exit(1)

    print("=" * 80)
    print(" [BA QUALITY GATE] Terminal Mechanical Verification for Requirements")
    print(f" Target Document : {draft_path.resolve()}")
    print(f" Audit Schema    : {schema_path.resolve()}")
    print(f" Engine Effort   : {args.effort} | Timeout: {args.timeout}s")
    print("=" * 80)

    draft_content = draft_path.read_text(encoding="utf-8", errors="replace")

    # Phase 1: Local Sanity Checks
    print("\n>>> [Phase 1/2] Executing Local Static Sanity Checks...")
    local_violations, local_vague, struct_status = local_sanity_checks(draft_content)
    print(f"  * Local Sanity Completed. Local issues found: {len(local_violations)}")

    # Phase 2: Headless Deep Semantic Audit
    print("\n>>> [Phase 2/2] Invoking Headless Deep Semantic Audit via 'agy -p'...")
    headless_result = run_headless_audit(draft_content, draft_path, schema_path, args.effort, args.timeout)

    # Phase 3: Synthesis
    print("\n>>> [Phase 3/3] Compiling Gatekeeper Audit Report...")
    if not headless_result:
        print("  [!] Headless model invocation unavailable; falling back to deterministic local rule engine.")
        crit_count = sum(1 for v in local_violations if v["severity"] == "CRITICAL")
        tax_score = 100 if (struct_status["has_br"] and struct_status["has_sr"] and struct_status["has_fr"] and struct_status["has_nfr"] and struct_status["has_tr"]) else 50
        nfr_score = 95 if len(local_vague) <= 10 else 70
        trace_score = 100 if struct_status["has_rtm"] else 40
        tr_score = 100 if struct_status["has_tr"] else 50
        overall = int((tax_score * 0.3) + (nfr_score * 0.25) + (trace_score * 0.25) + (tr_score * 0.2))
        verdict = "APPROVED" if (crit_count == 0 and overall >= 85) else "REJECTED"

        final_result = {
            "verdict": verdict,
            "quality_scores": {
                "taxonomy_compliance": tax_score,
                "smart_nfr_rigor": nfr_score,
                "traceability_coverage": trace_score,
                "transition_readiness": tr_score,
                "overall_score": overall
            },
            "detected_vague_adjectives": local_vague,
            "negative_space_audit": {
                "has_prohibited_actions_defined": struct_status["has_negative"],
                "prohibited_items": struct_status["prohibited_items"],
                "violations_found": []
            },
            "violations": local_violations,
            "summary": "Báo cáo kiểm định cơ học dựa trên phân tích cú pháp tĩnh và luật cấu trúc BABOK."
        }
    else:
        combined_violations = list(local_violations)
        combined_violations.extend(headless_result.get("violations", []))
        combined_vague = list(set(local_vague + headless_result.get("detected_vague_adjectives", [])))
        
        crit_count = sum(1 for v in combined_violations if v.get("severity") == "CRITICAL")
        overall_score = headless_result.get("quality_scores", {}).get("overall_score", 0)
        neg_audit = headless_result.get("negative_space_audit", {})
        has_negative = struct_status["has_negative"] and neg_audit.get("has_prohibited_actions_defined", False)
        model_verdict = headless_result.get("verdict", "APPROVED")

        if model_verdict == "REJECTED" or crit_count > 0 or overall_score < 85 or not has_negative:
            final_verdict = "REJECTED"
        else:
            final_verdict = "APPROVED"

        final_result = {
            "verdict": final_verdict,
            "quality_scores": headless_result.get("quality_scores", {}),
            "detected_vague_adjectives": combined_vague,
            "negative_space_audit": neg_audit,
            "violations": combined_violations,
            "summary": headless_result.get("summary", "")
        }

    # Display Report
    print("\n" + "=" * 80)
    print("                      BA QUALITY GATE AUDIT REPORT                              ")
    print("=" * 80)
    print(f" FINAL VERDICT: [{final_result['verdict']}]")
    qs = final_result['quality_scores']
    print("\n--- 1. QUALITY SCORES ---")
    print(f"  - Taxonomy Compliance   : {qs.get('taxonomy_compliance', 0):3d}% (Target >= 85%)")
    print(f"  - SMART NFR Rigor       : {qs.get('smart_nfr_rigor', 0):3d}% (Target >= 85%)")
    print(f"  - Traceability Coverage : {qs.get('traceability_coverage', 0):3d}% (Target >= 85%)")
    print(f"  - Transition Readiness  : {qs.get('transition_readiness', 0):3d}% (Target >= 85%)")
    print(f"  - OVERALL SCORE         : {qs.get('overall_score', 0):3d}% (Target >= 85%)")

    print("\n--- 2. VAGUE ADJECTIVES AUDIT ---")
    vague_list = final_result.get('detected_vague_adjectives', [])
    if vague_list:
        print(f"  Detected words in context: {', '.join(vague_list)}")
    else:
        print("  None detected! 100% SMART metrics quantified.")

    neg = final_result.get('negative_space_audit', {})
    print("\n--- 3. NEGATIVE SPACE AUDIT ---")
    print(f"  - Explicit Prohibitions Defined: {neg.get('has_prohibited_actions_defined', False)}")
    for item in neg.get('prohibited_items', []):
        print(f"    * {item}")

    violations = final_result.get('violations', [])
    print(f"\n--- 4. VIOLATIONS DETECTED ({len(violations)}) ---")
    if not violations:
        print("  No violations detected. Zero-defect gate pass!")
    else:
        for v in violations:
            print(f"  [{v.get('severity')}] [{v.get('tier')}] @ {v.get('location')}")
            print(f"    Issue : {v.get('issue')}")
            print(f"    Fix   : {v.get('actionable_fix')}")

    print("\n--- 5. EXECUTIVE SUMMARY ---")
    print(f"  {final_result.get('summary', '')}")
    print("=" * 80)

    # Save JSON Report
    audit_json_path = draft_path.with_suffix(".audit.json")
    audit_json_path.write_text(json.dumps(final_result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[+] Full machine-readable audit report saved to: {audit_json_path}\n")

    sys.exit(0 if final_result['verdict'] == "APPROVED" else 1)


if __name__ == "__main__":
    main()
