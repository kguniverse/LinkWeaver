"""
Week 1 validation harness — does OpenSanctions (via local Yente) surface
restricted-list hits on realistic university/research-collaborator names
with enough recall to power LinkWeaver's triage MVP?

Prereqs:
    docker compose up -d
    # wait for `yente-indexer` to finish (check `docker compose logs yente-indexer`)

Run:
    python backend/test/yente_match_test.py

Week 1 gate:
    Recall on known-restricted entities (expected_hit=True) must be >= 70%.
    Below that, the matching strategy needs rework before Week 2.
"""

import httpx

YENTE_URL = "http://localhost:8001"
DATASET = "default"
SCHEMA = "Organization"
SCORE_THRESHOLD = 0.7

# OpenSanctions dataset slugs that are *actionable* restricted/control lists for
# research-security triage. Anything outside this list (e.g. research reports,
# news mentions, PEP enrichment) is informational — we do not count it as a
# "hit" for the purposes of recall, even though the product UI may still surface
# it as a soft flag.
#
# Refined 2026-04-28 from live Yente responses on civic dataset.
RESTRICTED_DATASET_KEYWORDS = (
    # US export / sanctions
    "sdn", "ofac", "bis_entity", "bis_denied", "trade_csl",
    "section_1260", "military_end_user", "end_user_list",
    # Sanctions broadly
    "sanction", "embargo", "denied", "restrict", "fsf", "consol", "hmt",
    # Allied research-security / export-control lists
    "meti_eul",            # Japan METI End User List
    "named_research",      # Canada Named Research Organizations
    "uk_research",         # UK Trusted Research equivalents (if present)
    "au_dfat",             # Australia DFAT
)

# Datasets that look hit-like but should NOT count as actionable restricted-list hits.
# We exclude these from recall calculation — but a real product would still surface
# them to the analyst as informational/soft signals.
INFORMATIONAL_ONLY_DATASETS = (
    "rusi_reports",        # RUSI think-tank reports — analytical, not a control list
    "wd_curated",          # Wikidata enrichment
    "everypolitician",
)

# (query, expected_hit, tag)
# expected_hit=True  → entity is known to appear on a restricted list (e.g. BIS Entity List)
# expected_hit=False → entity should be clean — no restricted-list match expected
TEST_CASES = [
    # --- English full names of entities historically on BIS Entity List ---
    ("Harbin Institute of Technology", True, "en-full"),
    ("Northwestern Polytechnical University", True, "en-full"),
    ("Beihang University", True, "en-full"),
    ("Beijing University of Aeronautics and Astronautics", True, "en-full"),
    ("National University of Defense Technology", True, "en-full"),
    ("University of Electronic Science and Technology of China", True, "en-full"),
    ("Beijing Institute of Technology", True, "en-full"),
    ("Nanjing University of Aeronautics and Astronautics", True, "en-full"),
    # --- English abbreviations / acronyms ---
    ("HIT Harbin", True, "en-abbrev"),
    ("NUDT", True, "en-abbrev"),
    ("UESTC", True, "en-abbrev"),
    ("BUAA", True, "en-abbrev"),
    # --- Chinese full names ---
    ("哈尔滨工业大学", True, "zh-full"),
    ("西北工业大学", True, "zh-full"),
    ("北京航空航天大学", True, "zh-full"),
    ("国防科技大学", True, "zh-full"),
    ("电子科技大学", True, "zh-full"),
    # --- Chinese colloquial / abbreviated ---
    ("哈工大", True, "zh-abbrev"),
    ("北航", True, "zh-abbrev"),
    # --- Misspellings / casual variants ---
    ("Harbin Inst. of Tech.", True, "en-misspell"),
    ("Northwest Polytechnical University", True, "en-misspell"),
    # --- Should-be-clean controls ---
    ("Stanford University", False, "clean-en"),
    ("Massachusetts Institute of Technology", False, "clean-en"),
    ("University of Cambridge", False, "clean-en"),
    ("University of Tokyo", False, "clean-en"),
    ("Tsinghua University", False, "clean-cn"),
    ("Peking University", False, "clean-cn"),
    ("Shanghai Jiao Tong University", False, "clean-cn"),
    ("Fudan University", False, "clean-cn"),
    ("清华大学", False, "clean-zh"),
    ("北京大学", False, "clean-zh"),
]


def is_restricted_dataset(dataset_name: str) -> bool:
    name = dataset_name.lower()
    if any(kw in name for kw in INFORMATIONAL_ONLY_DATASETS):
        return False
    return any(kw in name for kw in RESTRICTED_DATASET_KEYWORDS)


def query_yente(name: str) -> list[dict]:
    payload = {
        "queries": {
            "q1": {
                "schema": SCHEMA,
                "properties": {"name": [name]},
            }
        }
    }
    r = httpx.post(f"{YENTE_URL}/match/{DATASET}", json=payload, timeout=30)
    r.raise_for_status()
    results = r.json().get("responses", {}).get("q1", {}).get("results", [])
    return sorted(results, key=lambda x: x.get("score", 0.0), reverse=True)


def evaluate(results: list[dict]) -> tuple[bool, dict]:
    if not results:
        return False, {"top_score": 0.0, "top_caption": None, "datasets": []}
    top = results[0]
    score = top.get("score", 0.0)
    datasets = top.get("datasets", [])
    is_hit = score >= SCORE_THRESHOLD and any(is_restricted_dataset(d) for d in datasets)
    return is_hit, {
        "top_score": score,
        "top_caption": top.get("caption"),
        "datasets": datasets,
    }


def main() -> None:
    tp = fn = fp = tn = 0
    rows: list[tuple[str, str, bool, str, dict]] = []

    for query, expected, tag in TEST_CASES:
        try:
            results = query_yente(query)
        except Exception as e:
            print(f"ERROR on {query!r}: {e}")
            continue
        is_hit, info = evaluate(results)

        if expected and is_hit:
            outcome, tp = "TP", tp + 1
        elif expected and not is_hit:
            outcome, fn = "FN", fn + 1
        elif not expected and is_hit:
            outcome, fp = "FP", fp + 1
        else:
            outcome, tn = "TN", tn + 1

        rows.append((query, tag, expected, outcome, info))

    print(f"{'query':<55} {'tag':<12} {'exp':<5} {'res':<3} {'score':<6} top match")
    print("-" * 120)
    for query, tag, expected, outcome, info in rows:
        ds = ",".join(info["datasets"][:2]) or "—"
        print(
            f"{query:<55} {tag:<12} {str(expected):<5} {outcome:<3} "
            f"{info['top_score']:<6.2f} {info['top_caption'] or '—'} [{ds}]"
        )

    expected_hits = tp + fn
    expected_clean = fp + tn
    recall = tp / expected_hits if expected_hits else 0.0
    fpr = fp / expected_clean if expected_clean else 0.0

    print()
    print("--- Summary ---")
    print(f"Known restricted (expected_hit=True):  {expected_hits}")
    print(f"   surfaced (TP):                      {tp}")
    print(f"   missed (FN):                        {fn}")
    print(f"   recall:                             {recall:.0%}")
    print()
    print(f"Known clean (expected_hit=False):      {expected_clean}")
    print(f"   correctly cleared (TN):             {tn}")
    print(f"   false alarms (FP):                  {fp}")
    print(f"   false positive rate:                {fpr:.0%}")
    print()
    gate = "PASS" if recall >= 0.7 else "FAIL"
    print(f"Week 1 gate (recall >= 70%): {gate}")


if __name__ == "__main__":
    main()
