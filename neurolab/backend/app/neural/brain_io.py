import json
import time
import uuid
from pathlib import Path

BRAIN_DIR = Path(__file__).resolve().parent.parent.parent / "brains"
BRAIN_DIR.mkdir(exist_ok=True)


def save_brain(name, genome, meta=None):
    brain_id = uuid.uuid4().hex[:12]
    record = {
        "id": brain_id,
        "name": name or f"brain-{brain_id}",
        "createdAt": time.time(),
        "meta": meta or {},
        "genome": genome,
    }
    (BRAIN_DIR / f"{brain_id}.json").write_text(json.dumps(record))
    return _summary(record)


def list_brains():
    out = []
    for f in sorted(BRAIN_DIR.glob("*.json")):
        try:
            out.append(_summary(json.loads(f.read_text())))
        except (json.JSONDecodeError, KeyError):
            continue
    return sorted(out, key=lambda r: r["createdAt"], reverse=True)


def load_brain(brain_id):
    f = BRAIN_DIR / f"{brain_id}.json"
    if not f.exists():
        return None
    return json.loads(f.read_text())


def delete_brain(brain_id):
    f = BRAIN_DIR / f"{brain_id}.json"
    if f.exists():
        f.unlink()
        return True
    return False


def _summary(record):
    return {
        "id": record["id"],
        "name": record["name"],
        "createdAt": record["createdAt"],
        "meta": record.get("meta", {}),
    }
