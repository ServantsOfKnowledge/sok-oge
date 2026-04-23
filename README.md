# Gazette Wrapper

This app is a searchable wrapper for the `gzdl` repository layout used at [gazettes.servantsofknowledge.in/gzdl](https://gazettes.servantsofknowledge.in/gzdl/).

It merges:

- `metatags/<publication>/<date>/*.xml`
- `raw/<publication>/<date>/*`

Each result combines XML metadata, publication/state information, notification details, and the matching raw gazette file link.

## Features

- Search across XML-derived metadata such as department, subject, gazette number, notification number, and source URL.
- Filter by state, publication stream, and date range.
- Handle state-specific publication folders such as `andhra`, `andhra_extraordinary`, `andhra_weekly`, `uttarpradesh_ordinary`, and similar variants.
- Open the original XML file, raw file, and upstream source URL from one result card.
- Build the search index in the background so the app can start serving immediately from cached or partial results.
- Work either against:
  - a local mirrored `gzdl` directory, or
  - the live public directory listing over HTTP.

## Indexing Behavior

- On startup, the app begins indexing in the background.
- If a cache already exists, search uses that cached data immediately while new folders are indexed incrementally.
- Partial progress is saved to the cache, so restarts can resume instead of starting over.
- Use `GET /api/index-status` to inspect progress.
- `POST /api/reindex` now triggers a background rebuild instead of blocking the request.

## Requirements

- Python `3.10+`

## Run

```bash
cd /Users/omshivaprakash/Documents/New\ project
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server.app:app --host 0.0.0.0 --port 8000 --reload
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000).

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

## API

- `GET /api/summary`: dataset counts, states, and publications
- `GET /api/index-status`: current background indexing progress
- `GET /api/search?q=&state=&publication=&date_from=&date_to=&limit=100`
- `POST /api/reindex`: rebuild the search index and refresh the cache
- `GET /health`: runtime source configuration

## Deployment Notes

For `repo.servantsofknowledge.in`, the cleanest setup is:

1. Serve the existing mirrored `gzdl` directory at `/gzdl/`.
2. Run this FastAPI app as the wrapper UI.
3. Set `GZDL_LOCAL_ROOT` to the mirror path and `GZDL_PUBLIC_BASE_URL` to `https://repo.servantsofknowledge.in/gzdl/`.

That way the search index is built locally, while result links still open the hosted XML and raw files on the public domain.
