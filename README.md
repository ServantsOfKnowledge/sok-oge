# Official Gazette Explorer

This app is a searchable wrapper for the `gzdl` repository layout used at [gazettes.servantsofknowledge.in/gzdl](https://gazettes.servantsofknowledge.in/gzdl/).

It merges:

- `metatags/<publication>/<date>/*.xml`
- `raw/<publication>/<date>/*`

Each result combines XML metadata, publication/state information, notification details, and direct links to the matching XML and raw gazette files.

## Features

- Search across XML-derived metadata such as department, subject, gazette number, notification number, and other extracted fields.
- Filter by state, publication stream, and date range.
- Pre-populate the state filter with Indian states and union territories.
- Show per-state indexed record counts in the left sidebar.
- Render direct links for:
  - XML file
  - PDF or raw file
  - original source URL
- Show breadcrumb-style context on every result card for easier scanning.
- Paginate results at 25 items per page.
- Keep visible totals and result cards updating while background indexing continues.
- Build the search index in the background so the app can serve immediately from cached or partial results.
- Retry transient network/SSL fetch failures and skip malformed XML instead of pausing the whole indexer.
- Parallelize indexing across publication folders and date folders for faster crawling.
- Work either against:
  - a local mirrored `gzdl` directory, or
  - the live public directory listing over HTTP.

## Indexing Behavior

- On startup, the app begins indexing in the background.
- If a cache already exists, search uses that cached data immediately while new folders are indexed incrementally.
- Partial progress is saved to the cache, so restarts can resume instead of starting over.
- Malformed XML files are skipped automatically.
- Missing folders/files and transient SSL/network fetch failures are handled gracefully instead of stopping the crawl.
- Parallel indexing uses a worker pool to discover publication folders and process date folders concurrently.
- Date-folder scheduling is interleaved across publication/state folders so more states start appearing earlier instead of one large state dominating the queue.
- Use `GET /api/index-status` to inspect progress.
- `POST /api/reindex` triggers a background rebuild instead of blocking the request.

## Requirements

- Python `3.9+`

## Run

```bash
cd /Users/omshivaprakash/Documents/sok-oge
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn server.app:app --host 0.0.0.0 --port 8008
```

Common URLs:

- Local: [http://127.0.0.1:8008](http://127.0.0.1:8008)
- LAN: `http://192.168.68.101:8008`

## Configuration

### Recommended: local mirror

If the wrapper is hosted on the same server that already exposes `/gzdl/`, point the app at the filesystem copy:

```bash
export GZDL_LOCAL_ROOT=/path/to/gzdl
export GZDL_PUBLIC_BASE_URL=https://repo.servantsofknowledge.in/gzdl/
```

`GZDL_LOCAL_ROOT` should contain the `metatags/` and `raw/` folders directly inside it.

### Remote mode

If you want the wrapper to fetch from the existing public source instead:

```bash
export GZDL_BASE_URL=https://gazettes.servantsofknowledge.in/gzdl/
export GZDL_PUBLIC_BASE_URL=https://gazettes.servantsofknowledge.in/gzdl/
```

## Optional environment variables

- `GZDL_LOCAL_ROOT`: local mirror root containing `metatags/` and `raw/`
- `GZDL_BASE_URL`: upstream base URL for remote indexing
- `GZDL_PUBLIC_BASE_URL`: base URL used when generating XML/raw links in the UI
- `GZDL_CACHE_PATH`: JSON cache path for the built index
- `GZDL_INDEX_WORKERS`: number of parallel indexing workers. Default: `8`

## API

- `GET /api/summary`: dataset counts, states, per-state record counts, and publications
- `GET /api/index-status`: current background indexing progress
- `GET /api/search?q=&state=&publication=&date_from=&date_to=&limit=25&page=1`
- `POST /api/reindex`: trigger a background rebuild
- `GET /health`: runtime source configuration and index status

## Deployment Notes

For `repo.servantsofknowledge.in`, the cleanest setup is:

1. Serve the existing mirrored `gzdl` directory at `/gzdl/`.
2. Run this FastAPI app as the wrapper UI.
3. Set `GZDL_LOCAL_ROOT` to the mirror path and `GZDL_PUBLIC_BASE_URL` to `https://repo.servantsofknowledge.in/gzdl/`.

That way the search index is built locally, while result links still open the hosted XML and raw files on the public domain.
