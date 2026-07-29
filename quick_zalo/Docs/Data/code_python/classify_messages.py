#!/usr/bin/env python3
"""
classify_messages.py
Phân loại tin nhắn Zalo raw data dựa trên độ dài + pattern.
Input: 5 file JSON trong /Docs/Data/Raw/
Output: JSON chi tiết theo category vào /Docs/Data/result/

Cách phân loại:
  - LONG (>= 120 chars): thông tin phòng (có thể template hoặc text tự do)
  - SHORT (< 120 chars): reaction, follow-up, trạng thái, admin, v.v.

Mỗi category xuất ra:
  - Tổng số lượng
  - Danh sách messages kèm: id, source_file, data_raw (đầy đủ)
  - Pattern phát hiện được
"""

import json
import os
import re
from collections import defaultdict

# ============ CONFIG ============
RAW_DIR = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/Raw"
OUTPUT_DIR = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/result"
CODE_DIR = "/home/stveve/Documents/workspace/Sales/extension/quick_zalo/Docs/Data/code_python"

LONG_THRESHOLD = 120  # chars: >= là LONG (room info), < là SHORT

# ============ LOAD ALL FILES ============
def load_all_messages(raw_dir):
    """Đọc tất cả JSON files, trả về list of dicts với source file info."""
    all_msgs = []
    group_names = sorted(os.listdir(raw_dir))
    for group in group_names:
        group_path = os.path.join(raw_dir, group)
        if not os.path.isdir(group_path):
            continue
        json_files = sorted([f for f in os.listdir(group_path) if f.endswith('.json')])
        for fname in json_files:
            fpath = os.path.join(group_path, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for msg in data.get('messages', []):
                msg['source_file'] = f"{group}/{fname}"
                all_msgs.append(msg)
    return all_msgs

# ============ CLASSIFIER ============
def classify_message(msg):
    """
    Phân loại 1 message.
    Trả về dict: {category, sub_category, details, is_long}
    """
    raw = msg.get('data_raw', '')
    length = len(raw)
    is_long = length >= LONG_THRESHOLD
    raw_stripped = raw.strip()

    result = {
        'length': length,
        'is_long': is_long,
        'category': None,
        'sub_category': None,
        'patterns': []
    }

    # --- LONG: Room Listing ---
    if is_long:
        result['category'] = 'room_listing'
        patterns_found = []

        # Kiểm tra các pattern template
        if re.search(r'\bMã\s*[: ]', raw):
            patterns_found.append('has_ma_code')
        if re.search(r'Địa[ ]?chỉ', raw):
            patterns_found.append('has_dia_chi')
        if re.search(r'[🏠🕌🏡]', raw):
            patterns_found.append('has_house_emoji')
        if re.search(r'[💰💸💵]', raw):
            patterns_found.append('has_price_emoji')
        if re.search(r'[✅❌]', raw):
            patterns_found.append('has_check_cross')
        if re.search(r'Giá|giá', raw):
            patterns_found.append('has_gia')
        if re.search(r'Nội thất|nội thất', raw):
            patterns_found.append('has_noi_that')
        if re.search(r'Dịch vụ|dịch vụ|Phí dv|phí dv', raw):
            patterns_found.append('has_dich_vu')
        if re.search(r'Lưu ý|lưu ý', raw):
            patterns_found.append('has_luu_y')
        if re.search(r'Thang máy|thang máy', raw):
            patterns_found.append('has_thang_may')
        if re.search(r'/\-rose', raw):
            patterns_found.append('has_rose_slash')
        if re.search(r'🌹', raw):
            patterns_found.append('has_rose_emoji')
        if re.search(r'KHAI TRƯƠNG|khai trương|Khai trương', raw):
            patterns_found.append('has_khai_truong')
        if re.search(r'CẬP NHẬT|GIẢM GIÁ|giảm giá', raw):
            patterns_found.append('has_update_or_discount')
        if re.search(r'Trống|trống|ở được|vào ở', raw):
            patterns_found.append('has_availability')

        result['patterns'] = patterns_found
        result['pattern_count'] = len(patterns_found)
        result['sub_category'] = 'structured_template' if len(patterns_found) >= 4 else 'free_text_listing'
        return result

    # --- SHORT: Phân loại tiếp ---
    result['category'] = 'short_message'

    # 1. Heart reaction
    if '/-heart' in raw:
        result['sub_category'] = 'heart_reaction'
        result['patterns'] = ['heart_reaction']
        return result

    # 2. FULL báo hết phòng
    if re.search(r'FULL|full|Full', raw) and re.search(r'[❌❌❌❌]', raw):
        result['sub_category'] = 'full_notification'
        result['patterns'] = ['full_notification']
        return result

    # 3. Admin @All
    if raw_stripped.startswith('@All'):
        result['sub_category'] = 'admin_announcement'
        result['patterns'] = ['admin_at_all']
        return result

    # 4. Short có Giá (price indicator)
    if re.search(r'^Giá\s+\d', raw_stripped):
        result['sub_category'] = 'price_followup'
        result['patterns'] = ['price_starts']
        return result

    # 5. Giá ở dạng số (4tr1, 5tr5, 3tr5)
    if re.match(r'^[\d.,]+\s*tr', raw_stripped) or re.match(r'^[\d.,]+\s*k', raw_stripped):
        result['sub_category'] = 'price_only'
        result['patterns'] = ['bare_price']
        return result

    # 6. Mã phòng Pxxx có hoặc không kèm giá
    if re.match(r'^[Pp]\s*\d{2,4}', raw_stripped):
        if re.search(r'\d+[.,]?\s*tr', raw):
            result['sub_category'] = 'room_code_with_price'
            result['patterns'] = ['room_code_with_price']
        else:
            result['sub_category'] = 'room_code_only'
            result['patterns'] = ['room_code_only']
        return result

    # 7. Trục/Axis
    if re.match(r'^[Tt]rục', raw_stripped):
        if re.search(r'\d+[.,]?\s*tr', raw):
            result['sub_category'] = 'axis_with_price'
            result['patterns'] = ['axis_with_price']
        else:
            result['sub_category'] = 'axis_only'
            result['patterns'] = ['axis_only']
        return result

    # 8. Số phòng trần (3-4 digits)
    if re.match(r'^\d{3,4}\s*$', raw_stripped):
        result['sub_category'] = 'numeric_room_id'
        result['patterns'] = ['bare_room_number']
        return result

    # 9. Ảnh/Media description
    if re.match(r'^Ảnh|ảnh|ảnh|Video|video', raw_stripped):
        result['sub_category'] = 'media_description'
        result['patterns'] = ['photo_video_note']
        return result

    # Check FULL notification variants (no ❌ emoji)
    if re.search(r'\bFull\b|\bFULL\b', raw, re.IGNORECASE) and length < 120:
        result['sub_category'] = 'full_notification'
        result['patterns'] = ['full_notification']
        return result

    # 10. Room type (Studio, 1n1k, 2N1K, Gác xép)
    if re.match(r'^(Studio|1N1K|1n1k|2N1K|Gác xép|Giường tầng)', raw_stripped):
        result['sub_category'] = 'room_type_label'
        result['patterns'] = ['room_type']
        return result

    # 11. Tầng
    if re.match(r'^Tầng\s+\d+', raw_stripped):
        result['sub_category'] = 'floor_info'
        result['patterns'] = ['floor_number']
        return result

    # 12. Phòng...
    if re.match(r'^Phòng\s+', raw_stripped):
        result['sub_category'] = 'room_description'
        result['patterns'] = ['room_desc_short']
        return result

    # 13. Bắt đầu bằng số + tr (giá ngắn)
    if re.match(r'^\d+[.,]?\d*\s*tr', raw_stripped) or re.match(r'^\d+[.,]?\d*\s*tr', raw_stripped):
        result['sub_category'] = 'price_only'
        result['patterns'] = ['price_at_start']
        return result

    # 14. Short kiểu "Trục 01-02" hoặc "Trục 2"
    if re.match(r'^[Tt]rục\s+\d', raw_stripped):
        result['sub_category'] = 'axis_only'
        result['patterns'] = ['axis_ref']
        return result

    # 15. 2-digit room ID like "02", "04"
    if re.match(r'^\d{1,2}\s*$', raw_stripped) and raw_stripped != '':
        result['sub_category'] = 'numeric_room_id'
        result['patterns'] = ['bare_room_number_2digit']
        return result

    # 16. Admin instruction (short message without @All that contains admin directives)
    admin_phrases = ['MN sale', 'ace đẩy', 'Ace đẩy', 'Tạm thời gửi', 'mn gửi', 'đẩy mạnh']
    if any(p in raw for p in admin_phrases) and length < 120:
        result['sub_category'] = 'admin_announcement'
        result['patterns'] = ['admin_instruction']
        return result

    # 17. "Bảng giá" or "Bảng Giá" - media reference
    if re.match(r'^Bảng\s*Giá|^Bảng\s*giá', raw_stripped):
        result['sub_category'] = 'media_description'
        result['patterns'] = ['price_table_note']
        return result

    # 18. Còn lại => unknown_short
    result['sub_category'] = 'unknown_short'
    result['patterns'] = ['unrecognized']
    return result

# ============ MAIN ============
def main():
    print("=" * 70)
    print("CLASSIFY MESSAGES - ZALO RAW DATA")
    print("=" * 70)

    # Load data
    all_msgs = load_all_messages(RAW_DIR)
    print(f"\nTổng số messages: {len(all_msgs)}")

    # EDA: Length distribution
    lengths = [len(m.get('data_raw', '')) for m in all_msgs]
    print(f"\n--- PHÂN BỐ ĐỘ DÀI ---")
    print(f"  Min: {min(lengths)} chars")
    print(f"  Max: {max(lengths)} chars")
    print(f"  Median: {sorted(lengths)[len(lengths)//2]} chars")
    print(f"  Mean: {sum(lengths)/len(lengths):.0f} chars")

    # Buckets
    buckets = defaultdict(int)
    for l in lengths:
        if l < 10: buckets['<10'] += 1
        elif l < 30: buckets['10-29'] += 1
        elif l < 60: buckets['30-59'] += 1
        elif l < 120: buckets['60-119'] += 1
        elif l < 200: buckets['120-199'] += 1
        elif l < 500: buckets['200-499'] += 1
        elif l < 1000: buckets['500-999'] += 1
        else: buckets['1000+'] += 1

    print(f"\n  Length distribution:")
    for k in ['<10', '10-29', '30-59', '60-119', '120-199', '200-499', '500-999', '1000+']:
        if k in buckets:
            print(f"    {k:>8}: {buckets[k]:>5} messages ({buckets[k]/len(all_msgs)*100:.1f}%)")

    # --- PHASE 1: Phân loại theo length (threshold = 120) ---
    print(f"\n{'='*70}")
    print(f"PHASE 1: PHÂN LOẠI THEO NGƯỠNG ĐỘ DÀI (threshold = {LONG_THRESHOLD} chars)")
    print(f"{'='*70}")

    long_msgs = [m for m in all_msgs if len(m.get('data_raw', '')) >= LONG_THRESHOLD]
    short_msgs = [m for m in all_msgs if len(m.get('data_raw', '')) < LONG_THRESHOLD]

    print(f"\n  LONG (>= {LONG_THRESHOLD} chars): {len(long_msgs)} messages ({len(long_msgs)/len(all_msgs)*100:.1f}%)")
    print(f"  SHORT (< {LONG_THRESHOLD} chars): {len(short_msgs)} messages ({len(short_msgs)/len(all_msgs)*100:.1f}%)")

    # --- PHASE 2: Phân loại chi tiết ---
    print(f"\n{'='*70}")
    print("PHASE 2: PHÂN LOẠI CHI TIẾT")
    print(f"{'='*70}")

    classified = {}
    for msg in all_msgs:
        result = classify_message(msg)
        cat = result['category']
        sub = result['sub_category']
        key = f"{cat}/{sub}"
        if key not in classified:
            classified[key] = {
                'category': cat,
                'sub_category': sub,
                'count': 0,
                'messages': [],
                'pattern_summary': defaultdict(int),
                'source_files': set(),
                'length_range': [99999, 0],
            }
        classified[key]['count'] += 1
        classified[key]['messages'].append({
            'id': msg.get('id'),
            'source_file': msg.get('source_file'),
            'length': result['length'],
            'data_raw': msg.get('data_raw'),
            'patterns': result['patterns'],
            'pattern_count': result.get('pattern_count', 0),
        })
        for p in result['patterns']:
            classified[key]['pattern_summary'][p] += 1
        classified[key]['source_files'].add(msg.get('source_file'))
        classified[key]['length_range'][0] = min(classified[key]['length_range'][0], result['length'])
        classified[key]['length_range'][1] = max(classified[key]['length_range'][1], result['length'])

    # Print classification summary
    print(f"\n{'CATEGORY':<35} {'SUB_CATEGORY':<25} {'COUNT':>7} {'%':>6} {'LEN_RANGE':>12}")
    print("-" * 85)

    grand_total = 0
    for key in sorted(classified.keys()):
        c = classified[key]
        pct = c['count'] / len(all_msgs) * 100
        lr = f"{c['length_range'][0]}-{c['length_range'][1]}"
        print(f"{c['category']:<35} {c['sub_category']:<25} {c['count']:>7} {pct:>5.1f}% {lr:>12}")
        grand_total += c['count']

    print("-" * 85)
    print(f"{'TOTAL':<62} {grand_total:>7} {'100.0%':>6}")

    # --- XUẤT JSON ---
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Export: summary
    summary = {
        'total_messages': len(all_msgs),
        'threshold': LONG_THRESHOLD,
        'source_files': list(set(m['source_file'] for m in all_msgs)),
        'categories': {}
    }

    for key in sorted(classified.keys()):
        c = classified[key]
        summary['categories'][key] = {
            'category': c['category'],
            'sub_category': c['sub_category'],
            'count': c['count'],
            'percent': round(c['count'] / len(all_msgs) * 100, 1),
            'length_range': c['length_range'],
            'source_files': sorted(c['source_files']),
            'pattern_summary': dict(c['pattern_summary']),
        }

    with open(os.path.join(OUTPUT_DIR, 'classification_summary.json'), 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Đã xuất: {OUTPUT_DIR}/classification_summary.json")

    # Export: messages per category (full data)
    categories_export = {}
    for key in sorted(classified.keys()):
        c = classified[key]
        categories_export[key] = {
            'category': c['category'],
            'sub_category': c['sub_category'],
            'count': c['count'],
            'percent': round(c['count'] / len(all_msgs) * 100, 1),
            'source_files': sorted(c['source_files']),
            'pattern_summary': dict(c['pattern_summary']),
            'length_range': c['length_range'],
            'messages': c['messages'],
        }

    with open(os.path.join(OUTPUT_DIR, 'classification_all_messages.json'), 'w', encoding='utf-8') as f:
        json.dump(categories_export, f, ensure_ascii=False, indent=2)
    print(f"✅ Đã xuất: {OUTPUT_DIR}/classification_all_messages.json")

    # Export: per group summary
    print(f"\n{'='*70}")
    print("PHÂN LOẠI THEO GROUP")
    print(f"{'='*70}")

    groups_data = defaultdict(lambda: {'total': 0, 'long': 0, 'short': 0, 'categories': defaultdict(int)})
    for msg in all_msgs:
        src = msg.get('source_file', 'unknown')
        group_name = src.split('/')[0]
        groups_data[group_name]['total'] += 1
        if len(msg.get('data_raw', '')) >= LONG_THRESHOLD:
            groups_data[group_name]['long'] += 1
        else:
            groups_data[group_name]['short'] += 1
        result = classify_message(msg)
        key = f"{result['category']}/{result['sub_category']}"
        groups_data[group_name]['categories'][key] += 1

    group_summary = {}
    for g in sorted(groups_data.keys()):
        d = groups_data[g]
        print(f"\n  📁 {g}")
        print(f"     Total: {d['total']} | Long (room info): {d['long']} ({d['long']/d['total']*100:.1f}%) | Short: {d['short']} ({d['short']/d['total']*100:.1f}%)")
        top_cats = sorted(d['categories'].items(), key=lambda x: -x[1])[:5]
        for cat_name, cat_count in top_cats:
            print(f"       {cat_name:<40} {cat_count:>5}")
        group_summary[g] = {
            'total': d['total'],
            'long': d['long'],
            'short': d['short'],
            'long_percent': round(d['long'] / d['total'] * 100, 1),
            'short_percent': round(d['short'] / d['total'] * 100, 1),
        }

    with open(os.path.join(OUTPUT_DIR, 'classification_by_group.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'groups': group_summary,
            'details': {g: dict(groups_data[g]['categories']) for g in sorted(groups_data.keys())}
        }, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Đã xuất: {OUTPUT_DIR}/classification_by_group.json")

    # Export: length distribution
    len_dist = {}
    for l in lengths:
        bucket = f"{(l // 20) * 20}-{(l // 20) * 20 + 19}"
        len_dist[bucket] = len_dist.get(bucket, 0) + 1

    with open(os.path.join(OUTPUT_DIR, 'length_distribution.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'threshold': LONG_THRESHOLD,
            'distribution': {k: len_dist[k] for k in sorted(len_dist.keys(), key=lambda x: int(x.split('-')[0]))},
            'all_lengths': lengths,
        }, f, ensure_ascii=False, indent=2)
    print(f"✅ Đã xuất: {OUTPUT_DIR}/length_distribution.json")

    # Final verification
    print(f"\n{'='*70}")
    print(f"VERIFICATION")
    print(f"{'='*70}")
    classified_count = sum(classified[k]['count'] for k in classified)
    print(f"  Total raw: {len(all_msgs)}")
    print(f"  Total classified: {classified_count}")
    print(f"  Match: {'✅ 100%' if len(all_msgs) == classified_count else f'❌ DIFFERENCE: {len(all_msgs) - classified_count}'}")

    print(f"\n{'='*70}")
    print("HOÀN THÀNH PHÂN LOẠI")
    print(f"{'='*70}")
    print(f"  Script: {os.path.join(CODE_DIR, 'classify_messages.py')}")
    print(f"  Output: {OUTPUT_DIR}/")

if __name__ == '__main__':
    main()
