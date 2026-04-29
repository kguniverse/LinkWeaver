// Human-readable labels for OpenSanctions dataset slugs and FtM topics.
// Falls back to the raw slug for unknown values — extend as we encounter them.

export const DATASET_LABELS: Record<string, string> = {
    us_trade_csl: "US Consolidated Screening List",
    us_ofac_sdn: "OFAC SDN List",
    us_ofac_enforcement_actions: "OFAC Enforcement Actions",
    us_bis_entity_list: "BIS Entity List",
    us_bis_denied: "BIS Denied Persons",
    us_dod_section_1260h: "DoD Section 1260H (Chinese Military Companies)",
    us_special_leg: "DoD Section 1286 / Special Legislation",
    us_macc_section_1286: "DoD Section 1286 List",
    jp_meti_eul: "Japan METI End User List",
    ca_named_research_orgs: "Canada Named Research Organizations",
    au_dfat_sanctions: "Australia DFAT Sanctions",
    kp_rusi_reports: "RUSI North Korea Reports",
    permid: "Refinitiv PermID",
    ext_ror: "Research Organizations Registry (ROR)",
    ann_graph_topics: "OpenSanctions Graph Annotations",
    iso9362_bic: "ISO 9362 BIC Codes",
    eu_fsf: "EU Consolidated Sanctions",
    gb_hmt_sanctions: "UK HMT Financial Sanctions",
    un_sc_sanctions: "UN Security Council Sanctions",
    wd_curated: "Wikidata (Curated)",
    everypolitician: "EveryPolitician",
};

export const TOPIC_LABELS: Record<string, string> = {
    sanction: "Sanctioned",
    "sanction.linked": "Linked to Sanctions",
    debarment: "Debarred",
    "export.control": "Export Controlled",
    "export.risk": "Export Risk",
    crime: "Criminal",
    "crime.fin": "Financial Crime",
    "crime.fraud": "Fraud",
    "crime.theft": "Theft",
    "crime.war": "War Crime",
    "crime.boss": "Crime Leader",
    "crime.terror": "Terrorism",
    "crime.traffick": "Trafficking",
    "crime.cyber": "Cybercrime",
    wanted: "Wanted",
    "asset.frozen": "Frozen Assets",
    "role.pep": "Politically Exposed",
    "role.pol": "Politician",
    "role.rca": "Politically Linked",
    "role.spy": "Intelligence",
    "role.judge": "Judge",
    "role.diplo": "Diplomat",
    poi: "Person of Interest",
    "corp.disqual": "Corporate Disqualification",
};

export function datasetLabel(slug: string): string {
    return DATASET_LABELS[slug] ?? slug;
}

export function topicLabel(t: string): string {
    return TOPIC_LABELS[t] ?? t;
}

const COUNTRY_NAMES: Record<string, string> = {
    cn: "China", us: "United States", gb: "United Kingdom", de: "Germany",
    fr: "France", jp: "Japan", kr: "South Korea", kp: "North Korea",
    ru: "Russia", ir: "Iran", ca: "Canada", au: "Australia", in: "India",
    sg: "Singapore", hk: "Hong Kong", tw: "Taiwan", il: "Israel", se: "Sweden",
    ch: "Switzerland", nl: "Netherlands", it: "Italy", es: "Spain", br: "Brazil",
    mx: "Mexico", za: "South Africa", ae: "United Arab Emirates",
};

export function countryName(code: string | null | undefined): string | null {
    if (!code) return null;
    return COUNTRY_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}
