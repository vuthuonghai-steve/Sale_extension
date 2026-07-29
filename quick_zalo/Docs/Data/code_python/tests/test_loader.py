"""Unit tests for DataLoader module."""

from src.config import Config
from src.loader import DataLoader


def test_loader_load_all() -> None:
    config = Config()
    loader = DataLoader()
    messages = loader.load_all(config.raw_dir)
    assert len(messages) == 3167
    assert messages[0].id is not None
    assert messages[0].data_raw is not None
