from __future__ import annotations

import json
import gzip
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CACHE_PATH = ROOT / "server" / "gazette_index_cache.json"
DOCS_DIR = ROOT / "docs"
DATA_DIR = DOCS_DIR / "data"
PUBLICATIONS_DIR = DATA_DIR / "publications"

PUBLISHED_FIELDS = [
    "id",
    "state_slug",
    "state_name",
    "publication_slug",
    "publication_title",
    "publication_kind",
    "gazette_date",
    "meta_file",
    "meta_url",
    "raw_file",
    "raw_url",
    "file_stem",
    "source_url",
    "metadata",
    "notifications",
]


def load_cache() -> dict[str, Any]:
    with CACHE_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def publication_payload(record: dict[str, Any]) -> dict[str, Any]:
    return {field: record.get(field) for field in PUBLISHED_FIELDS}


def compact_summary(cache: dict[str, Any], manifest: list[dict[str, Any]]) -> dict[str, Any]:
    summary = cache.get("summary") or {}
    states = summary.get("states", [])
    state_record_counts = summary.get("state_record_counts", {})
    indexed_states = [state for state in states if int(state_record_counts.get(state, 0)) > 0]
    return {
        "title": "Official Gazette Explorer",
        "description": (
            "Static GitHub Pages edition of the Official Gazette Explorer. "
            "It serves publication shards generated from the completed metadata index."
        ),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "record_count": summary.get("record_count", 0),
        "state_count": summary.get("state_count", 0),
        "indexed_state_count": len(indexed_states),
        "states": states,
        "indexed_states": indexed_states,
        "state_record_counts": {state: int(state_record_counts.get(state, 0)) for state in states},
        "publications": manifest,
        "publication_count": len(manifest),
    }


def build_export() -> None:
    cache = load_cache()
    records = cache.get("records") or []

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLICATIONS_DIR.mkdir(parents=True, exist_ok=True)
    for stale_file in PUBLICATIONS_DIR.glob("*"):
        if stale_file.is_file():
            stale_file.unlink()

    by_publication: dict[str, list[dict[str, Any]]] = defaultdict(list)
    state_to_publications: dict[str, set[str]] = defaultdict(set)

    for record in records:
        publication_slug = record["publication_slug"]
        by_publication[publication_slug].append(publication_payload(record))
        state_to_publications[record["state_name"]].add(publication_slug)

    latest_records = sorted(
        (publication_payload(record) for record in records),
        key=lambda item: (item.get("gazette_date") or "", item.get("publication_slug") or "", item.get("file_stem") or ""),
        reverse=True,
    )[:250]

    manifest: list[dict[str, Any]] = []
    for publication_slug, publication_records in sorted(by_publication.items()):
        publication_records.sort(
            key=lambda item: (item.get("gazette_date") or "", item.get("publication_slug") or "", item.get("file_stem") or ""),
            reverse=True,
        )
        state_name = publication_records[0]["state_name"] if publication_records else ""
        publication_title = publication_records[0]["publication_title"] if publication_records else publication_slug
        dates = [item.get("gazette_date") for item in publication_records if item.get("gazette_date")]
        manifest.append(
            {
                "slug": publication_slug,
                "title": publication_title,
                "state_name": state_name,
                "count": len(publication_records),
                "earliest_date": min(dates) if dates else None,
                "latest_date": max(dates) if dates else None,
                "path": f"./data/publications/{publication_slug}.json.gz",
            }
        )
        output_path = PUBLICATIONS_DIR / f"{publication_slug}.json.gz"
        output_path.write_bytes(
            gzip.compress(
                json.dumps(publication_records, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
                compresslevel=9,
            )
        )

    summary_payload = compact_summary(cache, manifest)
    official_states = set(summary_payload["states"])
    summary_payload["state_publications"] = {
        state_name: sorted(state_to_publications.get(state_name, set()))
        for state_name in summary_payload["states"]
    }
    summary_payload["unofficial_state_labels"] = sorted(
        state_name for state_name in state_to_publications.keys() if state_name not in official_states
    )

    (DATA_DIR / "summary.json").write_text(
        json.dumps(summary_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    legacy_latest_path = DATA_DIR / "latest.json"
    if legacy_latest_path.exists():
        legacy_latest_path.unlink()
    latest_path = DATA_DIR / "latest.json.gz"
    if latest_path.exists():
        latest_path.unlink()
    latest_path.write_bytes(
        gzip.compress(
            json.dumps(latest_records, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
            compresslevel=9,
        )
    )


if __name__ == "__main__":
    build_export()
