"""CLI entry point for running Zalo Message Classification Pipeline."""

import argparse
import sys
from src.config import Config
from src.pipeline import ClassificationPipeline


def main() -> None:
    """Parse CLI arguments and launch classification pipeline."""
    parser = argparse.ArgumentParser(description="Zalo Message Classification Pipeline")
    parser.add_argument("--config", type=str, default="config.yaml", help="Path to YAML config file")
    args = parser.parse_args()

    config = Config.load_from_yaml(args.config)
    pipeline = ClassificationPipeline(config)
    print("🚀 Starting Zalo Message Classification Pipeline...")
    res = pipeline.run()

    print("✅ Pipeline execution completed successfully!")
    print(f"📊 Total messages processed: {res.total_loaded}")
    print(f"📈 Long messages: {res.analysis_report.long_count}")
    print(f"📉 Short messages: {res.analysis_report.short_count}")


if __name__ == "__main__":
    main()
