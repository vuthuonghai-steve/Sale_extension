"""DataLoader module for ingesting raw JSON message files."""

import json
import os
from typing import List
from src.models import Message


class DataLoader:
    """Loads Zalo messages from raw JSON files in specified directory."""

    def load_from_file(self, file_path: str, source_label: str) -> List[Message]:
        """Load messages from a single JSON file."""
        if not os.path.isfile(file_path):
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            messages = []
            for msg_dict in data.get("messages", []):
                msg_id = msg_dict.get("id", "")
                raw_text = msg_dict.get("data_raw", "")
                if msg_id and raw_text is not None:
                    messages.append(Message(id=msg_id, data_raw=raw_text, source_file=source_label))
            return messages
        except Exception:
            return []

    def load_all(self, raw_dir: str) -> List[Message]:
        """Scan raw directory structure and load all messages."""
        if not os.path.exists(raw_dir):
            return []
        all_msgs: List[Message] = []
        group_names = sorted(os.listdir(raw_dir))
        for group in group_names:
            group_path = os.path.join(raw_dir, group)
            if not os.path.isdir(group_path):
                continue
            json_files = sorted([f for f in os.listdir(group_path) if f.endswith(".json")])
            for fname in json_files:
                fpath = os.path.join(group_path, fname)
                source_label = f"{group}/{fname}"
                msgs = self.load_from_file(fpath, source_label)
                all_msgs.extend(msgs)
        return all_msgs
