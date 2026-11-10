# Veroxa — Reproducible Setup Guide

This guide is a starting point for running the matching component locally. Confirm the repository's current folder names, dependency file, and package exports before relying on the commands below.

## 1. Get the repository
```bash
git clone https://github.com/SPSQZ/Veroxa.git
cd Veroxa
```

## 2. Locate the backend and install dependencies
If the backend folder contains a `requirements.txt`, use:
```bash
cd Backend
python -m venv .venv
```

Activate the environment:

Windows:
```bash
.venv\Scripts\activate
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install dependencies if `requirements.txt` exists:
```bash
python -m pip install -r requirements.txt
```

If the project uses `pyproject.toml`, Poetry, or another dependency manager, follow that file instead.

## 3. Offline-friendly matching configuration
For a local test run, the reviewed code supports these environment settings:
```bash
VEROXA_ENABLE_EMBEDDINGS=false
VEROXA_CATALOG_CACHE_PATH=:memory:
```

The code excerpts also indicate that an explicit `HashingEmbedder()` can be used for an offline/demo setup. Confirm the constructor and import path in the integrated repository.

## 4. Run the project tests
Use the test instructions already present in the repository. If it uses pytest, a typical command is:
```bash
python -m pytest
```

Do not assume this command is correct until the repository's test layout and dependencies have been checked.

## 5. Run the live case demo
Review `live_case_demo_script.py` and adjust its import path to the final package structure if needed. The sample expects the matching package to expose `MatchingService`, `DisputeInput`, `Product`, and `HashingEmbedder`.

## 6. Reproducibility checklist
- Record Python version and operating system.
- Install the exact pinned dependencies used by the project.
- Record environment variables used for the run.
- Keep test input data synthetic and clearly labelled.
- Save actual output and measured latency; do not invent benchmark values.
- Record the commit hash used for the demonstration.

## Important
This guide is not a guarantee that the commands have been tested against the final repository. Verify paths and imports after the team merges the files.
