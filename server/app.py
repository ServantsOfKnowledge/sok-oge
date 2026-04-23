import json
import os
import re
import threading
from dataclasses import dataclass
from datetime import date, datetime, timezone
from functools import lru_cache
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_BASE_URL = "https://gazettes.servantsofknowledge.in/gzdl/"
DEFAULT_CACHE_PATH = BASE_DIR / "gazette_index_cache.json"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"
)
RAW_EXTENSIONS = {".pdf", ".html", ".htm", ".txt", ".doc", ".docx"}
INDIA_STATE_OPTIONS = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]

app = FastAPI(title="Gazette Wrapper")


def env_path(name: str) -> Optional[Path]:
    value = os.getenv(name, "").strip()
    return Path(value).expanduser().resolve() if value else None


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_key(key: str) -> str:
    key = key.strip().lower()
    key = re.sub(r"[^a-z0-9]+", "_", key)
    return key.strip("_")


def publication_parts(publication_slug: str) -> tuple[str, str]:
    tokens = publication_slug.split("_")
    suffix = {"extraordinary", "weekly", "daily", "ordinary", "egaz", "govpress", "compose", "dsa"}
    kind_tokens: list[str] = []
    while tokens and tokens[-1] in suffix:
        kind_tokens.insert(0, tokens.pop())
    state_slug = "_".join(tokens) if tokens else publication_slug
    publication_kind = " ".join(kind_tokens) if kind_tokens else "standard"
    return state_slug, publication_kind


def humanize_slug(slug: str) -> str:
    alias = {
        "andhra": "Andhra Pradesh",
        "arunachal": "Arunachal Pradesh",
        "cg": "Chhattisgarh",
        "csl": "Central Secretariat Library",
        "delhi": "Delhi",
        "himachal": "Himachal Pradesh",
        "madhyapradesh": "Madhya Pradesh",
        "odisha": "Odisha",
        "tamilnadu": "Tamil Nadu",
        "uttarpradesh": "Uttar Pradesh",
        "wbsl": "West Bengal State Library",
        "westbengal": "West Bengal",
        "punjabdsa": "Punjab DSA",
        "keralacompose": "Kerala Compose",
        "dadranagarhaveli": "Dadra and Nagar Haveli and Daman and Diu",
        "jammuandkashmir": "Jammu and Kashmir",
    }
    if slug in alias:
        return alias[slug]
    return " ".join(part.capitalize() for part in slug.split("_"))


class DirectoryListingParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        if tag != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self.links.append(href)


@dataclass
class GazetteIndexConfig:
    local_root: Optional[Path]
    base_url: str
    public_base_url: str
    cache_path: Path


class GazetteSource:
    def list_dirs(self, relative_path: str) -> list[str]:
        raise NotImplementedError

    def list_files(self, relative_path: str) -> list[str]:
        raise NotImplementedError

    def read_text(self, relative_path: str) -> str:
        raise NotImplementedError

    def public_url(self, relative_path: str) -> str:
        raise NotImplementedError


class LocalGazetteSource(GazetteSource):
    def __init__(self, root: Path, public_base_url: str) -> None:
        self.root = root
        self.public_base_url = public_base_url.rstrip("/") + "/"

    def _target(self, relative_path: str) -> Path:
        return (self.root / relative_path).resolve()

    def list_dirs(self, relative_path: str) -> list[str]:
        target = self._target(relative_path)
        if not target.exists():
            return []
        return sorted(item.name for item in target.iterdir() if item.is_dir())

    def list_files(self, relative_path: str) -> list[str]:
        target = self._target(relative_path)
        if not target.exists():
            return []
        return sorted(item.name for item in target.iterdir() if item.is_file())

    def read_text(self, relative_path: str) -> str:
        return self._target(relative_path).read_text(encoding="utf-8")

    def public_url(self, relative_path: str) -> str:
        return urljoin(self.public_base_url, relative_path)


class RemoteGazetteSource(GazetteSource):
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/") + "/"

    def _fetch(self, relative_path: str, missing_ok: bool = False) -> str:
        url = self.public_url(relative_path)
        request = Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", "ignore")
        except HTTPError as exc:
            if missing_ok and exc.code == 404:
                return ""
            raise

    def _listing_links(self, relative_path: str) -> list[str]:
        parser = DirectoryListingParser()
        parser.feed(self._fetch(relative_path, missing_ok=True))
        return parser.links

    def list_dirs(self, relative_path: str) -> list[str]:
        items = []
        for href in self._listing_links(relative_path):
            if href in {"../", "./"} or not href.endswith("/"):
                continue
            items.append(href.rstrip("/"))
        return sorted(items)

    def list_files(self, relative_path: str) -> list[str]:
        items = []
        for href in self._listing_links(relative_path):
            if href in {"../", "./"} or href.endswith("/"):
                continue
            items.append(href)
        return sorted(items)

    def read_text(self, relative_path: str) -> str:
        return self._fetch(relative_path)

    def public_url(self, relative_path: str) -> str:
        return urljoin(self.base_url, relative_path)


class GazetteIndexer:
    def __init__(self, config: GazetteIndexConfig) -> None:
        self.config = config
        self.source: GazetteSource = (
            LocalGazetteSource(config.local_root, config.public_base_url)
            if config.local_root
            else RemoteGazetteSource(config.base_url)
        )
        self._lock = threading.Lock()
        self._index: list[dict[str, Any]] = []
        self._summary: dict[str, Any] = self._build_summary(self._index)
        self._completed_dates: set[str] = set()
        self._is_building = False
        self._builder_thread: Optional[threading.Thread] = None
        self._last_error: Optional[str] = None
        self._progress: dict[str, Any] = {
            "started_at": None,
            "updated_at": None,
            "finished_at": None,
            "publications_total": 0,
            "publications_done": 0,
            "dates_total": 0,
            "dates_done": 0,
            "mode": "idle",
        }
        cached = self._load_cache()
        if cached is not None:
            self._index = cached
            self._summary = self._build_summary(self._index)

    def get_index(self, force_refresh: bool = False) -> list[dict[str, Any]]:
        if force_refresh:
            self.start_background_reindex(force_refresh=True)
        elif not self._index and not self._is_building:
            self.start_background_reindex(force_refresh=False)
        with self._lock:
            return list(self._index)

    def get_summary(self) -> dict[str, Any]:
        self.get_index()
        with self._lock:
            return dict(self._summary)

    def _write_cache(self, records: list[dict[str, Any]], summary: dict[str, Any]) -> None:
        payload = {
            "source_signature": self._source_signature(),
            "records": records,
            "summary": summary,
            "progress": self._status_payload_locked(include_completed_dates=True),
        }
        self.config.cache_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    def _load_cache(self) -> Optional[list[dict[str, Any]]]:
        if not self.config.cache_path.exists():
            return None
        try:
            payload = json.loads(self.config.cache_path.read_text(encoding="utf-8"))
            if payload.get("source_signature") != self._source_signature():
                return None
            progress = payload.get("progress") or {}
            self._completed_dates = set(progress.get("completed_dates", []))
            self._progress.update(
                {
                    "started_at": progress.get("started_at"),
                    "updated_at": progress.get("updated_at"),
                    "finished_at": progress.get("finished_at"),
                    "publications_total": progress.get("publications_total", 0),
                    "publications_done": progress.get("publications_done", 0),
                    "dates_total": progress.get("dates_total", 0),
                    "dates_done": progress.get("dates_done", len(self._completed_dates)),
                    "mode": "ready" if payload.get("records") else "idle",
                }
            )
            self._summary = payload.get("summary", {})
            return payload.get("records", [])
        except (OSError, json.JSONDecodeError):
            return None

    def _build_index(self, force_refresh: bool = False) -> None:
        with self._lock:
            if force_refresh:
                self._index = []
                self._summary = self._build_summary(self._index)
                self._completed_dates = set()
            self._is_building = True
            self._last_error = None
            self._progress.update(
                {
                    "started_at": self._now_iso(),
                    "updated_at": self._now_iso(),
                    "finished_at": None,
                    "publications_total": 0,
                    "publications_done": 0,
                    "dates_total": 0,
                    "dates_done": len(self._completed_dates),
                    "mode": "building",
                }
            )

        metatag_publications = self.source.list_dirs("metatags")
        raw_publications = set(self.source.list_dirs("raw"))
        publications = sorted(set(metatag_publications) | raw_publications)
        publication_dates = {publication_slug: self.source.list_dirs(f"metatags/{publication_slug}") for publication_slug in publications}
        total_dates = sum(len(date_dirs) for date_dirs in publication_dates.values())

        with self._lock:
            self._progress["publications_total"] = len(publications)
            self._progress["dates_total"] = total_dates
            self._progress["dates_done"] = min(len(self._completed_dates), total_dates)
            self._progress["updated_at"] = self._now_iso()
            self._persist_locked()

        for publication_index, publication_slug in enumerate(publications, start=1):
            publication_records: list[dict[str, Any]] = []
            new_dates: list[str] = []
            for date_dir in publication_dates[publication_slug]:
                date_key = self._date_key(publication_slug, date_dir)
                if date_key in self._completed_dates:
                    continue
                publication_records.extend(self._records_for_date(publication_slug, date_dir))
                new_dates.append(date_key)
                with self._lock:
                    self._index.extend(publication_records)
                    publication_records.clear()
                    self._completed_dates.update(new_dates)
                    new_dates.clear()
                    self._summary = self._build_summary(self._index)
                    self._progress["dates_done"] = len(self._completed_dates)
                    self._progress["updated_at"] = self._now_iso()
                    self._persist_locked()

            with self._lock:
                self._index.sort(
                    key=lambda item: (item["gazette_date"] or "", item["publication_slug"], item["file_stem"]),
                    reverse=True,
                )
                self._summary = self._build_summary(self._index)
                self._progress["publications_done"] = publication_index
                self._progress["updated_at"] = self._now_iso()
                self._persist_locked()

        with self._lock:
            self._summary = self._build_summary(self._index)
            self._is_building = False
            self._progress["finished_at"] = self._now_iso()
            self._progress["mode"] = "ready"
            self._progress["publications_done"] = len(publications)
            self._progress["dates_done"] = len(self._completed_dates)
            self._progress["updated_at"] = self._now_iso()
            self._persist_locked()

    def start_background_reindex(self, force_refresh: bool = False) -> bool:
        with self._lock:
            if self._is_building:
                return False
            self._is_building = True
            self._last_error = None
            self._progress["mode"] = "building"
            self._progress["updated_at"] = self._now_iso()
            self._builder_thread = threading.Thread(
                target=self._run_background_build,
                kwargs={"force_refresh": force_refresh},
                daemon=True,
            )
            self._builder_thread.start()
            return True

    def _run_background_build(self, force_refresh: bool) -> None:
        try:
            self._build_index(force_refresh=force_refresh)
        except Exception as exc:  # pragma: no cover
            with self._lock:
                self._is_building = False
                self._last_error = str(exc)
                self._progress["mode"] = "error"
                self._progress["updated_at"] = self._now_iso()
                self._persist_locked()

    def get_status(self, include_completed_dates: bool = False) -> dict[str, Any]:
        with self._lock:
            return self._status_payload_locked(include_completed_dates=include_completed_dates)

    def _persist_locked(self) -> None:
        self._write_cache(list(self._index), dict(self._summary))

    def _date_key(self, publication_slug: str, date_dir: str) -> str:
        return f"{publication_slug}/{date_dir}"

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _source_signature(self) -> dict[str, Any]:
        return {
            "local_root": str(self.config.local_root) if self.config.local_root else None,
            "base_url": self.config.base_url,
            "public_base_url": self.config.public_base_url,
        }

    def _status_payload_locked(self, include_completed_dates: bool = False) -> dict[str, Any]:
        payload = {
            "is_building": self._is_building,
            "last_error": self._last_error,
            "mode": self._progress["mode"],
            "started_at": self._progress["started_at"],
            "updated_at": self._progress["updated_at"],
            "finished_at": self._progress["finished_at"],
            "publications_total": self._progress["publications_total"],
            "publications_done": self._progress["publications_done"],
            "dates_total": self._progress["dates_total"],
            "dates_done": self._progress["dates_done"],
            "cached_records": len(self._index),
        }
        if include_completed_dates:
            payload["completed_dates"] = sorted(self._completed_dates)
        return payload

    def _records_for_date(self, publication_slug: str, date_dir: str) -> list[dict[str, Any]]:
        meta_dir = f"metatags/{publication_slug}/{date_dir}"
        raw_dir = f"raw/{publication_slug}/{date_dir}"
        raw_files = self.source.list_files(raw_dir)
        raw_by_stem = {Path(filename).stem: filename for filename in raw_files}
        records: list[dict[str, Any]] = []

        for meta_file in self.source.list_files(meta_dir):
            if not meta_file.lower().endswith(".xml"):
                continue
            relative_meta = f"{meta_dir}/{meta_file}"
            try:
                xml_text = self.source.read_text(relative_meta)
            except (FileNotFoundError, HTTPError):
                continue
            records.append(self._record_from_xml(publication_slug, date_dir, meta_file, raw_by_stem, xml_text))

        return records

    def _record_from_xml(
        self,
        publication_slug: str,
        date_dir: str,
        meta_file: str,
        raw_by_stem: dict[str, str],
        xml_text: str,
    ) -> dict[str, Any]:
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as exc:
            raise RuntimeError(f"Failed to parse XML for {publication_slug}/{date_dir}/{meta_file}") from exc

        state_slug, publication_kind = publication_parts(publication_slug)
        state_name = humanize_slug(state_slug)
        file_stem = Path(meta_file).stem
        raw_name = raw_by_stem.get(file_stem)
        raw_relative = f"raw/{publication_slug}/{date_dir}/{raw_name}" if raw_name else None

        metadata = self._flatten_xml(root)
        notifications = self._extract_notifications(root)
        gazette_date = metadata.get("date_iso") or date_dir
        search_blob_parts = [
            state_name,
            publication_kind,
            publication_slug,
            meta_file,
            date_dir,
            *(f"{key} {value}" for key, value in metadata.items() if isinstance(value, str)),
        ]
        for notification in notifications:
            search_blob_parts.extend(f"{key} {value}" for key, value in notification.items())

        return {
            "id": f"{publication_slug}:{date_dir}:{meta_file}",
            "state_slug": state_slug,
            "state_name": state_name,
            "publication_slug": publication_slug,
            "publication_title": f"{state_name} {publication_kind.title()}".strip(),
            "publication_kind": publication_kind,
            "gazette_date": gazette_date,
            "meta_file": meta_file,
            "meta_url": self.source.public_url(f"metatags/{publication_slug}/{date_dir}/{meta_file}"),
            "raw_file": raw_name,
            "raw_url": self.source.public_url(raw_relative) if raw_relative else None,
            "file_stem": file_stem,
            "source_url": metadata.get("url"),
            "metadata": metadata,
            "notifications": notifications,
            "search_blob": normalize_whitespace(" ".join(search_blob_parts)).lower(),
        }

    def _flatten_xml(self, root: ET.Element) -> dict[str, str]:
        flattened: dict[str, str] = {}

        date_node = root.find("date")
        if date_node is not None:
            day = normalize_whitespace(date_node.findtext("day", ""))
            month = normalize_whitespace(date_node.findtext("month", ""))
            year = normalize_whitespace(date_node.findtext("year", ""))
            if day and month and year:
                try:
                    flattened["date_iso"] = date(int(year), int(month), int(day)).isoformat()
                except ValueError:
                    pass

        for child in root:
            if child.tag in {"date", "notifications"}:
                continue
            key = normalize_key(child.tag)
            value = normalize_whitespace(" ".join(child.itertext()))
            if value:
                flattened[key] = value
        return flattened

    def _extract_notifications(self, root: ET.Element) -> list[dict[str, str]]:
        notifications: list[dict[str, str]] = []
        for node in root.findall("notifications"):
            payload: dict[str, str] = {}
            for child in node:
                key = normalize_key(child.tag)
                value = normalize_whitespace(" ".join(child.itertext()))
                if value:
                    payload[key] = value
            if payload:
                notifications.append(payload)
        return notifications

    def _build_summary(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        indexed_states = sorted({record["state_name"] for record in records})
        publications = sorted({record["publication_slug"] for record in records})
        return {
            "record_count": len(records),
            "state_count": len(INDIA_STATE_OPTIONS),
            "indexed_state_count": len(indexed_states),
            "states": list(INDIA_STATE_OPTIONS),
            "indexed_states": indexed_states,
            "publications": publications,
        }


@lru_cache(maxsize=1)
def get_indexer() -> GazetteIndexer:
    config = GazetteIndexConfig(
        local_root=env_path("GZDL_LOCAL_ROOT"),
        base_url=os.getenv("GZDL_BASE_URL", DEFAULT_BASE_URL),
        public_base_url=os.getenv("GZDL_PUBLIC_BASE_URL", DEFAULT_BASE_URL),
        cache_path=Path(os.getenv("GZDL_CACHE_PATH", str(DEFAULT_CACHE_PATH))).expanduser().resolve(),
    )
    return GazetteIndexer(config)


@app.on_event("startup")
def startup() -> None:
    get_indexer().start_background_reindex(force_refresh=False)


def serialize_record(record: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in record.items() if key != "search_blob"}


def search_records(
    records: list[dict[str, Any]],
    q: str = "",
    state: str = "",
    publication: str = "",
    date_from: str = "",
    date_to: str = "",
) -> list[dict[str, Any]]:
    q_norm = normalize_whitespace(q).lower()
    state_norm = normalize_whitespace(state).lower()
    publication_norm = normalize_whitespace(publication).lower()
    output: list[dict[str, Any]] = []

    for record in records:
        if q_norm and q_norm not in record["search_blob"]:
            continue
        if state_norm and state_norm not in {record["state_slug"].lower(), record["state_name"].lower()}:
            continue
        if publication_norm and publication_norm != record["publication_slug"].lower():
            continue
        gazette_date = record.get("gazette_date") or ""
        if date_from and gazette_date and gazette_date < date_from:
            continue
        if date_to and gazette_date and gazette_date > date_to:
            continue
        output.append(record)
    return output


def html_escape(value: Any) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def render_select_options(values: list[str]) -> str:
    parts = ['<option value="">All</option>']
    parts.extend(
        f'<option value="{html_escape(value)}">{html_escape(value)}</option>'
        for value in values
    )
    return "".join(parts)


def render_state_chips(states: list[str]) -> str:
    parts = ['<button class="chip active" onclick="setStateFilter(\'\')">All states</button>']
    parts.extend(
        f"<button class=\"chip\" onclick='setStateFilter({json.dumps(value)})'>{html_escape(value)}</button>"
        for value in states
    )
    return "".join(parts)


def status_message(status: dict[str, Any]) -> str:
    if status.get("mode") == "building":
        dates_total = int(status.get("dates_total", 0))
        dates_done = int(status.get("dates_done", 0))
        return (
            f"Index building in background: {dates_done:,} / {dates_total:,} date folders processed. "
            "Search uses cached and newly indexed records as they arrive."
        )
    if status.get("mode") == "error":
        return f"Index build paused due to an error: {status.get('last_error') or 'unknown error'}"
    if int(status.get("cached_records", 0)) > 0:
        return f"Index ready with {int(status.get('cached_records', 0)):,} cached records."
    return "Preparing index..."


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    indexer = get_indexer()
    summary = indexer.get_summary()
    status = indexer.get_status()
    record_count = f"{int(summary['record_count']):,}"
    state_count = f"{int(summary['state_count']):,}"
    state_options_html = render_select_options(summary["states"])
    publication_options_html = render_select_options(summary["publications"])
    state_chips_html = render_state_chips(summary["states"])
    initial_status_line = html_escape(status_message(status))
    initial_summary_json = json.dumps(summary, ensure_ascii=False)
    initial_status_json = json.dumps(status, ensure_ascii=False)
    html = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Official Gazette Explorer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    :root {
      --bg: #f6f2ea;
      --ink: #18212c;
      --muted: #566271;
      --line: #d5cfbf;
      --panel: rgba(255, 252, 246, 0.92);
      --panel-strong: #fffaf0;
      --accent: #0d6b5f;
      --accent-soft: #dcefe8;
      --warm: #b86a2b;
      --shadow: 0 22px 60px rgba(24, 33, 44, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(205, 227, 217, 0.9), transparent 30%),
        radial-gradient(circle at top right, rgba(240, 210, 171, 0.8), transparent 24%),
        linear-gradient(180deg, #f8f3ea 0%, #efe6d9 100%);
      min-height: 100vh;
    }
    .wrap {
      max-width: 1320px;
      margin: 0 auto;
      padding: 24px 16px 40px;
    }
    .hero {
      background: linear-gradient(135deg, rgba(255,250,240,0.9), rgba(232,245,240,0.88));
      border: 1px solid rgba(213, 207, 191, 0.95);
      border-radius: 26px;
      box-shadow: var(--shadow);
      padding: 24px;
      display: grid;
      gap: 18px;
    }
    .hero-head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(30px, 4vw, 54px);
      line-height: 0.96;
      letter-spacing: -0.03em;
      font-family: "Iowan Old Style", "Palatino Linotype", serif;
      max-width: 9ch;
    }
    .subtitle {
      max-width: 70ch;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.55;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(120px, 1fr));
      gap: 12px;
      min-width: min(100%, 360px);
    }
    .stat {
      background: rgba(255,255,255,0.55);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 14px;
    }
    .stat b {
      display: block;
      font-size: 22px;
      margin-bottom: 4px;
    }
    .filters {
      display: grid;
      grid-template-columns: 2.3fr 1fr 1fr 1fr 1fr auto;
      gap: 10px;
      align-items: end;
    }
    label {
      display: grid;
      gap: 6px;
      font-size: 13px;
      color: var(--muted);
    }
    input, select, button {
      width: 100%;
      border-radius: 14px;
      border: 1px solid var(--line);
      padding: 12px 14px;
      font: inherit;
      color: var(--ink);
      background: var(--panel-strong);
    }
    button {
      width: auto;
      min-width: 120px;
      cursor: pointer;
      border: none;
      background: var(--accent);
      color: white;
      font-weight: 700;
      box-shadow: 0 12px 30px rgba(13, 107, 95, 0.18);
    }
    button.secondary {
      background: #e7ece5;
      color: var(--ink);
      box-shadow: none;
    }
    .content {
      margin-top: 18px;
      display: grid;
      grid-template-columns: minmax(240px, 300px) 1fr;
      gap: 16px;
      align-items: start;
    }
    .panel {
      background: var(--panel);
      border: 1px solid rgba(213, 207, 191, 0.95);
      border-radius: 24px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
    }
    .sidebar {
      padding: 18px;
      position: sticky;
      top: 16px;
    }
    .sidebar h2, .results-head h2 {
      margin: 0 0 10px;
      font-size: 18px;
    }
    .sidebar-list {
      display: grid;
      gap: 8px;
      max-height: 70vh;
      overflow: auto;
      padding-right: 4px;
    }
    .chip {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.65);
      border-radius: 999px;
      padding: 8px 12px;
      color: var(--ink);
      text-align: left;
      cursor: pointer;
    }
    .chip.active {
      background: var(--accent-soft);
      border-color: rgba(13, 107, 95, 0.3);
      color: #0c4d45;
    }
    .results {
      padding: 18px;
    }
    .results-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: end;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .results-meta {
      color: var(--muted);
      font-size: 14px;
    }
    .cards {
      display: grid;
      gap: 14px;
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 18px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,249,240,0.92));
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: start;
      flex-wrap: wrap;
    }
    .eyebrow {
      color: var(--warm);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 11px;
      font-weight: 700;
    }
    .card h3 {
      margin: 5px 0 0;
      font-size: 22px;
      line-height: 1.15;
      font-family: "Iowan Old Style", "Palatino Linotype", serif;
    }
    .card p {
      margin: 10px 0 0;
      color: var(--muted);
      line-height: 1.55;
    }
    .pill-row, .link-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .pill {
      border-radius: 999px;
      background: #f2ede1;
      border: 1px solid #ddd2bd;
      padding: 7px 11px;
      font-size: 12px;
      color: #4b5765;
    }
    .link-row a {
      text-decoration: none;
      color: #0c4d45;
      border-bottom: 1px solid rgba(12,77,69,0.25);
      font-weight: 700;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 14px;
      margin-top: 14px;
    }
    .meta-grid div {
      border-top: 1px solid rgba(213, 207, 191, 0.8);
      padding-top: 9px;
      font-size: 14px;
    }
    .meta-grid strong {
      display: block;
      margin-bottom: 4px;
      color: #415062;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .notifications {
      margin-top: 14px;
      display: grid;
      gap: 8px;
    }
    .notification {
      padding: 11px 12px;
      border-radius: 14px;
      background: #faf5ea;
      border: 1px solid #e3d7c0;
      font-size: 14px;
    }
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--muted);
      border: 1px dashed var(--line);
      border-radius: 20px;
      background: rgba(255,255,255,0.48);
    }
    @media (max-width: 1080px) {
      .filters { grid-template-columns: 1fr 1fr; }
      .content { grid-template-columns: 1fr; }
      .sidebar { position: static; }
    }
    @media (max-width: 700px) {
      .filters { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr; }
      .meta-grid { grid-template-columns: 1fr; }
      .wrap { padding-inline: 12px; }
      .hero, .sidebar, .results { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="hero-head">
        <div>
          <div class="eyebrow">repo.servantsofknowledge.in wrapper</div>
          <h1>Official Gazette Explorer</h1>
          <div class="subtitle">
            Browse the merged view of <code>metatags</code> and <code>raw</code> gazette folders,
            filter by state or publication stream, and search across metadata extracted from each XML file.
          </div>
          <div id="indexStatus" class="results-meta" style="margin-top:10px;">{initial_status_line}</div>
        </div>
        <div class="stats">
          <div class="stat"><b id="recordCount">{record_count}</b><span>Total records</span></div>
          <div class="stat"><b id="stateCount">{state_count}</b><span>States and UTs</span></div>
          <div class="stat"><b id="visibleCount">0</b><span>Visible results</span></div>
        </div>
      </div>

      <form class="filters" onsubmit="event.preventDefault(); loadResults();">
        <label>
          Search metadata, departments, gazette number, subject, notification number
          <input id="q" type="text" placeholder="Try: deputy commissioner, change of names, GAZETTE/2021" />
        </label>
        <label>
          State
          <select id="state">{state_options_html}</select>
        </label>
        <label>
          Publication
          <select id="publication">{publication_options_html}</select>
        </label>
        <label>
          Date from
          <input id="dateFrom" type="date" />
        </label>
        <label>
          Date to
          <input id="dateTo" type="date" />
        </label>
        <div style="display:flex; gap:10px; align-items:end;">
          <button type="submit">Search</button>
          <button type="button" class="secondary" onclick="resetFilters()">Reset</button>
        </div>
      </form>
    </section>

    <section class="content">
      <aside class="panel sidebar">
        <h2>States</h2>
        <div class="results-meta">Quick filter by state or territory.</div>
        <div id="stateChips" class="sidebar-list">{state_chips_html}</div>
      </aside>

      <div class="panel results">
        <div class="results-head">
          <div>
            <h2>Results</h2>
            <div id="resultsMeta" class="results-meta">Loading results...</div>
          </div>
        </div>
        <div id="cards" class="cards"></div>
      </div>
    </section>
  </div>

  <script>
    window.__INITIAL_SUMMARY__ = {initial_summary_json};
    window.__INITIAL_STATUS__ = {initial_status_json};

    const state = {
      summary: window.__INITIAL_SUMMARY__,
      results: [],
      limit: 100,
      status: window.__INITIAL_STATUS__,
      pollTimer: null,
    };

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    async function fetchJson(url) {
      const res = await fetch(url);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Request failed");
      }
      return res.json();
    }

    function paramsFromForm() {
      const params = new URLSearchParams();
      const mappings = [
        ["q", document.getElementById("q").value.trim()],
        ["state", document.getElementById("state").value],
        ["publication", document.getElementById("publication").value],
        ["date_from", document.getElementById("dateFrom").value],
        ["date_to", document.getElementById("dateTo").value],
      ];
      for (const [key, value] of mappings) {
        if (value) params.set(key, value);
      }
      params.set("limit", String(state.limit));
      return params;
    }

    function renderSelect(id, values, labelFn = (v) => v) {
      const el = document.getElementById(id);
      const current = el.value;
      el.innerHTML = '<option value="">All</option>' + values.map(value =>
        `<option value="${escapeHtml(value)}">${escapeHtml(labelFn(value))}</option>`
      ).join("");
      if (values.includes(current)) el.value = current;
    }

    function renderStateChips() {
      const wrap = document.getElementById("stateChips");
      const selected = document.getElementById("state").value;
      const buttons = ['<button class="chip ' + (selected === "" ? 'active' : '') + '" onclick="setStateFilter(\'\')">All states</button>'];
      for (const value of (state.summary?.states || [])) {
        const active = selected === value ? "active" : "";
        buttons.push(`<button class="chip ${active}" onclick="setStateFilter(${JSON.stringify(value)})">${escapeHtml(value)}</button>`);
      }
      wrap.innerHTML = buttons.join("");
    }

    function updateIndexStatus() {
      const status = state.status || {};
      const line = document.getElementById("indexStatus");
      if (status.mode === "building") {
        const datesTotal = status.dates_total || 0;
        const datesDone = status.dates_done || 0;
        line.textContent = `Index building in background: ${datesDone.toLocaleString()} / ${datesTotal.toLocaleString()} date folders processed. Search uses cached and newly indexed records as they arrive.`;
      } else if (status.mode === "error") {
        line.textContent = `Index build paused due to an error: ${status.last_error || "unknown error"}`;
      } else if ((status.cached_records || 0) > 0) {
        line.textContent = `Index ready with ${status.cached_records.toLocaleString()} cached records.`;
      } else {
        line.textContent = "Preparing index…";
      }
    }

    function setStateFilter(value) {
      document.getElementById("state").value = value;
      renderStateChips();
      loadResults();
    }

    function summarizeCard(record) {
      const meta = record.metadata || {};
      return meta.subject || meta.department || meta.gzetteid || meta.notification_num || "Gazette metadata available";
    }

    function metaEntries(record) {
      const preferred = [
        ["Gazette No.", record.metadata.gznum],
        ["Gazette Type", record.metadata.gztype],
        ["Department", record.metadata.department],
        ["Subject", record.metadata.subject],
        ["Notification No.", record.metadata.notification_num],
        ["Part", record.metadata.partnum],
        ["Original Source", record.source_url],
      ];
      return preferred.filter(([, value]) => value);
    }

    function renderCards() {
      const cards = document.getElementById("cards");
      const results = state.results;
      document.getElementById("visibleCount").textContent = results.length;

      if (!results.length) {
        cards.innerHTML = '<div class="empty">No gazettes matched these filters. Try a broader state selection or a simpler metadata search.</div>';
        return;
      }

      cards.innerHTML = results.map(record => {
        const metaHtml = metaEntries(record).map(([label, value]) => `
          <div><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</div>
        `).join("");

        const notifications = (record.notifications || []).map(item => {
          const bits = Object.entries(item).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`);
          return `<div class="notification">${escapeHtml(bits.join(" | "))}</div>`;
        }).join("");

        return `
          <article class="card">
            <div class="card-top">
              <div>
                <div class="eyebrow">${escapeHtml(record.state_name)} • ${escapeHtml(record.publication_kind)}</div>
                <h3>${escapeHtml(record.gazette_date || "Undated")} · ${escapeHtml(record.publication_title)}</h3>
              </div>
              <div class="pill-row">
                <span class="pill">${escapeHtml(record.publication_slug)}</span>
                <span class="pill">${escapeHtml(record.meta_file)}</span>
                ${record.raw_file ? `<span class="pill">${escapeHtml(record.raw_file)}</span>` : ""}
              </div>
            </div>
            <p>${escapeHtml(summarizeCard(record))}</p>
            <div class="link-row">
              <a href="${escapeHtml(record.meta_url)}" target="_blank" rel="noreferrer">Open XML</a>
              ${record.raw_url ? `<a href="${escapeHtml(record.raw_url)}" target="_blank" rel="noreferrer">Open raw file</a>` : ""}
              ${record.source_url ? `<a href="${escapeHtml(record.source_url)}" target="_blank" rel="noreferrer">Open source site</a>` : ""}
            </div>
            ${metaHtml ? `<div class="meta-grid">${metaHtml}</div>` : ""}
            ${notifications ? `<div class="notifications">${notifications}</div>` : ""}
          </article>
        `;
      }).join("");
    }

    async function loadSummary() {
      state.summary = await fetchJson("/api/summary");
      document.getElementById("recordCount").textContent = state.summary.record_count.toLocaleString();
      document.getElementById("stateCount").textContent = state.summary.state_count.toLocaleString();
      renderSelect("state", state.summary.states);
      renderSelect("publication", state.summary.publications);
      renderStateChips();
    }

    async function loadStatus() {
      state.status = await fetchJson("/api/index-status");
      updateIndexStatus();
      if (state.status.is_building && !state.pollTimer) {
        state.pollTimer = window.setInterval(async () => {
          state.status = await fetchJson("/api/index-status");
          updateIndexStatus();
          if (!state.status.is_building) {
            window.clearInterval(state.pollTimer);
            state.pollTimer = null;
            loadSummary();
            loadResults();
          }
        }, 5000);
      }
    }

    async function loadResults() {
      const params = paramsFromForm();
      const payload = await fetchJson(`/api/search?${params.toString()}`);
      state.results = payload.results;
      document.getElementById("resultsMeta").textContent =
        `${payload.total.toLocaleString()} result(s)` +
        (payload.truncated ? ` shown, limited to ${payload.limit}` : "") +
        ". Each record merges XML metadata with the matching raw gazette file when available." +
        (payload.index_status?.is_building ? " Background indexing is still in progress." : "");
      if (payload.summary) {
        state.summary = payload.summary;
        document.getElementById("recordCount").textContent = state.summary.record_count.toLocaleString();
        document.getElementById("stateCount").textContent = state.summary.state_count.toLocaleString();
        renderSelect("state", state.summary.states);
        renderSelect("publication", state.summary.publications);
      }
      state.status = payload.index_status || state.status;
      updateIndexStatus();
      renderStateChips();
      renderCards();
    }

    function resetFilters() {
      document.getElementById("q").value = "";
      document.getElementById("state").value = "";
      document.getElementById("publication").value = "";
      document.getElementById("dateFrom").value = "";
      document.getElementById("dateTo").value = "";
      renderStateChips();
      loadResults();
    }

    updateIndexStatus();
    renderStateChips();

    loadStatus()
      .then(loadSummary)
      .then(loadResults)
      .catch(err => {
        document.getElementById("resultsMeta").textContent = err.message;
        document.getElementById("cards").innerHTML = '<div class="empty">The index could not be loaded. Check the server configuration for the gazette source path or base URL.</div>';
      });
  </script>
</body>
</html>
    """
    return (
        html.replace("{initial_status_line}", initial_status_line)
        .replace("{record_count}", record_count)
        .replace("{state_count}", state_count)
        .replace("{state_options_html}", state_options_html)
        .replace("{publication_options_html}", publication_options_html)
        .replace("{state_chips_html}", state_chips_html)
        .replace("{initial_summary_json}", initial_summary_json)
        .replace("{initial_status_json}", initial_status_json)
    )


@app.get("/api/summary")
def summary() -> dict[str, Any]:
    indexer = get_indexer()
    return {
        **indexer.get_summary(),
        "index_status": indexer.get_status(),
    }


@app.get("/api/search")
def search(
    q: str = Query(default=""),
    state: str = Query(default=""),
    publication: str = Query(default=""),
    date_from: str = Query(default=""),
    date_to: str = Query(default=""),
    limit: int = Query(default=100, ge=1, le=1000),
) -> dict[str, Any]:
    indexer = get_indexer()
    records = indexer.get_index()
    matches = search_records(records, q=q, state=state, publication=publication, date_from=date_from, date_to=date_to)
    sliced = matches[:limit]
    return {
        "total": len(matches),
        "limit": limit,
        "truncated": len(matches) > limit,
        "summary": indexer.get_summary(),
        "index_status": indexer.get_status(),
        "results": [serialize_record(item) for item in sliced],
    }


@app.post("/api/reindex")
def reindex() -> dict[str, Any]:
    started = get_indexer().start_background_reindex(force_refresh=True)
    return {"ok": True, "started": started, "summary": get_indexer().get_summary(), "index_status": get_indexer().get_status()}


@app.get("/api/index-status")
def index_status() -> dict[str, Any]:
    return get_indexer().get_status()


@app.get("/health")
def health() -> dict[str, Any]:
    indexer = get_indexer()
    source = "local" if indexer.config.local_root else "remote"
    return {
        "ok": True,
        "source": source,
        "local_root": str(indexer.config.local_root) if indexer.config.local_root else None,
        "base_url": None if indexer.config.local_root else indexer.config.base_url,
        "index_status": indexer.get_status(),
    }
