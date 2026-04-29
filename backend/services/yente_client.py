import httpx


YENTE_URL = "http://localhost:8001"
DEFAULT_DATASET = "default"
DEFAULT_SCHEMA = "Organization"
DEFAULT_LIMIT = 10


# OpenSanctions dataset slugs that are *actionable* restricted/control lists for
# research-security triage. Mirrors the classification used in
# backend/test/yente_match_test.py — keep in sync if either is updated.
RESTRICTED_DATASET_KEYWORDS = (
    "sdn", "ofac", "bis_entity", "bis_denied", "trade_csl",
    "section_1260", "military_end_user", "end_user_list",
    "sanction", "embargo", "denied", "restrict", "fsf", "consol", "hmt",
    "meti_eul",
    "named_research",
    "uk_research",
    "au_dfat",
)

# Datasets that surface in matches but should display as soft "mention" badges,
# not actionable hits.
INFORMATIONAL_DATASET_KEYWORDS = (
    "rusi_reports",
    "wd_curated",
    "everypolitician",
)


def classify_dataset(name: str) -> str:
    """Return 'restricted' | 'informational' | 'neutral' for a dataset slug."""
    n = name.lower()
    if any(kw in n for kw in INFORMATIONAL_DATASET_KEYWORDS):
        return "informational"
    if any(kw in n for kw in RESTRICTED_DATASET_KEYWORDS):
        return "restricted"
    return "neutral"


def classify_match(datasets: list[str]) -> str:
    """Aggregate a match's overall class. Restricted dominates informational."""
    classes = {classify_dataset(d) for d in datasets}
    if "restricted" in classes:
        return "restricted"
    if "informational" in classes:
        return "informational"
    return "neutral"


async def match_entity(
    name: str,
    limit: int = DEFAULT_LIMIT,
    schema: str = DEFAULT_SCHEMA,
) -> list[dict]:
    """Query Yente for fuzzy entity matches; return a simplified, classified list."""
    payload = {
        "queries": {
            "q1": {
                "schema": schema,
                "properties": {"name": [name]},
            }
        }
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{YENTE_URL}/match/{DEFAULT_DATASET}",
            json=payload,
            timeout=30.0,
        )
        r.raise_for_status()
        results = r.json().get("responses", {}).get("q1", {}).get("results", [])

    results.sort(key=lambda x: x.get("score", 0.0), reverse=True)
    out = []
    for r in results[:limit]:
        datasets = r.get("datasets", []) or []
        out.append(
            {
                "id": r.get("id"),
                "caption": r.get("caption"),
                "score": r.get("score", 0.0),
                "schema": r.get("schema"),
                "datasets": datasets,
                "hit_class": classify_match(datasets),
            }
        )
    return out
