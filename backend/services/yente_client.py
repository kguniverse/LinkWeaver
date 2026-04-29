import httpx


YENTE_URL = "http://localhost:8001"
DEFAULT_DATASET = "default"
# LegalEntity is the FtM parent of both Organization and Person — covers
# universities, companies, public bodies, and individuals in one query.
DEFAULT_SCHEMA = "LegalEntity"
DEFAULT_LIMIT = 10


# Preferred classifier: OpenSanctions emits semantic `topics` per entity. These
# are far cleaner than guessing from dataset slugs.
RESTRICTED_TOPICS = frozenset({
    "sanction",
    "sanction.linked",
    "debarment",
    "export.control",
    "export.risk",
    "crime",
    "crime.fin",
    "crime.fraud",
    "crime.theft",
    "crime.war",
    "crime.boss",
    "crime.terror",
    "crime.traffick",
    "crime.cyber",
    "wanted",
    "asset.frozen",
})

INFORMATIONAL_TOPICS = frozenset({
    "role.pep",
    "role.pol",
    "role.rca",
    "role.spy",
    "role.judge",
    "role.diplo",
})


# Fallback classifier: when the entity record isn't fetched (e.g. /match returns
# only summary data without topics), guess from dataset slugs. Kept in sync with
# backend/test/yente_match_test.py.
RESTRICTED_DATASET_KEYWORDS = (
    "sdn", "ofac", "bis_entity", "bis_denied", "trade_csl",
    "section_1260", "military_end_user", "end_user_list",
    "sanction", "embargo", "denied", "restrict", "fsf", "consol", "hmt",
    "meti_eul",
    "named_research",
    "uk_research",
    "au_dfat",
)

INFORMATIONAL_DATASET_KEYWORDS = (
    "rusi_reports",
    "wd_curated",
    "everypolitician",
)


def classify_topics(topics: list[str] | None) -> str | None:
    """Return 'restricted' | 'informational' from semantic topics, or None if no signal."""
    if not topics:
        return None
    topic_set = set(topics)
    if topic_set & RESTRICTED_TOPICS:
        return "restricted"
    if topic_set & INFORMATIONAL_TOPICS:
        return "informational"
    return None


def classify_dataset(name: str) -> str:
    n = name.lower()
    if any(kw in n for kw in INFORMATIONAL_DATASET_KEYWORDS):
        return "informational"
    if any(kw in n for kw in RESTRICTED_DATASET_KEYWORDS):
        return "restricted"
    return "neutral"


def classify_match(datasets: list[str], topics: list[str] | None = None) -> str:
    """Prefer topic-based classification; fall back to dataset keywords."""
    by_topic = classify_topics(topics)
    if by_topic is not None:
        return by_topic
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
    """Search Yente for fuzzy/prefix-matched entities; return a classified list.

    Uses Yente's /search endpoint (relevance-ranked full-text), not /match (which
    expects full-name lookups against a known entity record). For an analyst
    typing a partial name, /search is what surfaces useful candidates.
    """
    params = [
        ("q", name),
        ("limit", str(limit)),
        ("schema", schema),
    ]
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{YENTE_URL}/search/{DEFAULT_DATASET}",
            params=params,
            timeout=30.0,
        )
        r.raise_for_status()
        results = r.json().get("results", []) or []

    out = []
    for entry in results:
        props = entry.get("properties", {}) or {}
        datasets = entry.get("datasets", []) or []
        topics = props.get("topics") or []
        country = (props.get("country") or [None])[0]
        out.append(
            {
                "id": entry.get("id"),
                "caption": entry.get("caption"),
                "schema": entry.get("schema"),
                "datasets": datasets,
                "topics": topics,
                "country": country,
                "hit_class": classify_match(datasets, topics),
            }
        )
    return out


# Each entry: relationship property on center entity → (edge label, field on
# the nested relationship entity that points to the *other* side of the edge).
# Yente returns these properties when an entity participates in a known FtM
# relationship schema (Ownership, Directorship, Succession, etc.).
ONE_HOP_RELATIONS: dict[str, tuple[str, str]] = {
    "ownershipOwner": ("owns", "asset"),
    "ownershipAsset": ("owned by", "owner"),
    "directorshipDirector": ("director of", "organization"),
    "directorshipOrganization": ("has director", "director"),
    "successors": ("succeeded by", "successor"),
    "predecessors": ("predecessor of", "predecessor"),
    "associates": ("associate of", "associate"),
    "family": ("family", "relative"),
    "membershipMember": ("member of", "organization"),
    "membershipOrganization": ("has member", "member"),
}


def _node_summary(entity: dict) -> dict:
    """Project a Yente entity into the lean node shape the frontend uses."""
    props = entity.get("properties", {}) or {}
    datasets = entity.get("datasets", []) or []
    topics = props.get("topics") or []
    return {
        "id": entity.get("id"),
        "caption": entity.get("caption"),
        "schema": entity.get("schema"),
        "datasets": datasets,
        "topics": topics,
        "country": (props.get("country") or [None])[0],
        "hit_class": classify_match(datasets, topics),
    }


async def fetch_entity(entity_id: str) -> dict:
    """Fetch a full Yente entity record (with nested 1-hop relationships)."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{YENTE_URL}/entities/{entity_id}",
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()


def build_one_hop_graph(entity: dict) -> dict:
    """Turn a full Yente entity record into a {center, neighbors, edges} graph."""
    center = _node_summary(entity)
    center_id = center["id"]
    neighbors: dict[str, dict] = {}
    edges: list[dict] = []

    props = entity.get("properties", {}) or {}
    for prop_name, (label, target_field) in ONE_HOP_RELATIONS.items():
        for relation_obj in props.get(prop_name, []) or []:
            if not isinstance(relation_obj, dict):
                continue
            relation_props = relation_obj.get("properties", {}) or {}
            for target in relation_props.get(target_field, []) or []:
                if not isinstance(target, dict) or not target.get("id"):
                    continue
                target_node = _node_summary(target)
                neighbors[target_node["id"]] = target_node
                edges.append(
                    {
                        "id": f"{center_id}-{prop_name}-{target_node['id']}",
                        "source": center_id,
                        "target": target_node["id"],
                        "label": label,
                    }
                )

    return {
        "center": center,
        "neighbors": list(neighbors.values()),
        "edges": edges,
    }
