"use client";

import type { MatchHitClass } from "@/services/node-service";
import { datasetLabel, topicLabel } from "@/lib/labels";

type HitConfig = { label: string; className: string };

const HIT_BADGE: Record<MatchHitClass, HitConfig | null> = {
  restricted: {
    label: "Restricted",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  informational: {
    label: "Mention",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  neutral: null,
};

export function HitBadge({
  hitClass,
  size = "sm",
}: {
  hitClass: MatchHitClass;
  size?: "sm" | "md";
}) {
  const cfg = HIT_BADGE[hitClass];
  if (!cfg) return null;
  const sizeClasses =
    size === "md" ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0.5";
  return (
    <span
      className={`inline-block uppercase tracking-wide rounded border font-medium ${sizeClasses} ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

const RESTRICTED_TOPIC_PREFIXES = [
  "sanction", "debarment", "export", "crime", "wanted", "asset.frozen", "corp.disqual",
];
const INFORMATIONAL_TOPIC_PREFIXES = ["role.", "poi"];

function topicColorClass(topic: string): string {
  if (RESTRICTED_TOPIC_PREFIXES.some((p) => topic.startsWith(p))) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (INFORMATIONAL_TOPIC_PREFIXES.some((p) => topic.startsWith(p))) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function TopicChip({ topic }: { topic: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded border ${topicColorClass(topic)}`}
    >
      {topicLabel(topic)}
    </span>
  );
}

export function DatasetChip({ slug }: { slug: string }) {
  return (
    <span
      className="inline-block text-xs px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200"
      title={slug}
    >
      {datasetLabel(slug)}
    </span>
  );
}
