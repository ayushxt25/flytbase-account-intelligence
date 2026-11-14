import {
  Account,
  Blocker,
  Contact,
  Evidence,
  EvidenceStatus,
  Opportunity,
  Stage,
} from "./types";
import { extractAccounts, extractFiles } from "./account-extract";

type Row = Record<string, unknown>;

const status = (x: unknown): EvidenceStatus => {
  const value = String(x).toLowerCase();

  if (value === "verified") return "verified";
  if (value === "told") return "told";
  if (value === "claim") return "claim";

  return "unknown";
};

const stage = (x: unknown): Stage => {
  const value = String(x);

  return ["identified", "qualified", "cleared", "agreed"].includes(value)
    ? (value as Stage)
    : "unknown";
};

const asNumber = (x: unknown): number | undefined => {
  if (typeof x === "number") return x;

  if (typeof x === "string" && x.trim() !== "") {
    return Number(x.replace(/[^0-9.-]/g, ""));
  }

  return undefined;
};

const rows = (x: unknown): Row[] =>
  Array.isArray(x)
    ? x.filter(
        (v): v is Row =>
          !!v && typeof v === "object" && !Array.isArray(v)
      )
    : [];

const ids = (x: unknown): string[] =>
  Array.isArray(x)
    ? x.filter((v): v is string => typeof v === "string")
    : typeof x === "string"
      ? [x]
      : [];

const blockers = (x: unknown): Blocker[] => {
  if (typeof x === "string") {
    return x.trim()
      ? [{ description: x.trim(), status: "unknown", sourceIds: [] }]
      : [];
  }

  if (Array.isArray(x)) {
    return x.flatMap(blockers);
  }

  if (x && typeof x === "object") {
    const r = x as Row;
    const description = String(r.text ?? r.description ?? "").trim();

    if (!description) return [];

    const s = String(r.status ?? "").toLowerCase();

    return [
      {
        description,
        status:
          s === "open"
            ? "open"
            : s === "cleared"
              ? "cleared"
              : "unknown",
        sourceIds:
          typeof r.source_id === "string" ? [r.source_id] : [],
      },
    ];
  }

  return [];
};

const deadline = (x: unknown): string | undefined => {
  if (typeof x === "string") return x;

  if (x && typeof x === "object" && !Array.isArray(x)) {
    const text = (x as Row).text;
    return typeof text === "string" ? text : undefined;
  }

  return undefined;
};

export function normalize(
  accountsRaw: unknown,
  paperworkRaw: unknown,
  additionalRaw: unknown[] = []
): Account[] {
  const paperwork = rows(paperworkRaw);
  const files = [...extractFiles(accountsRaw), ...additionalRaw.flatMap(extractFiles)];

  const records = [...extractAccounts(accountsRaw), ...additionalRaw.flatMap(extractAccounts)];
  return records.filter((raw, i, all) => all.findIndex(x => String(x.id ?? x.name) === String(raw.id ?? raw.name)) === i).map((raw, i) => {
    const facts = rows(raw.facts);

    const evidence: Evidence[] = facts.map((f, j) => ({
      id: String(f.id ?? `fact-${i}-${j}`),
      type: "account fact",
      status: status(f.status),
      summary: String(f.text ?? "Untitled fact"),
      saidBy:
        typeof f.said_by === "string" ? f.said_by : undefined,
      raw: f,
    }));

    const documentEvidence = [...paperwork, ...files].map((p, j) => ({
      id:
        typeof p.id === "string"
          ? p.id
          : `paperwork-${j}`,
      type: String(p.type ?? "paperwork"),
      status: "unknown" as EvidenceStatus,
      summary: String(p.text ?? p.name ?? "Paperwork record"),
      raw: p,
    }));

    const opportunities: Opportunity[] = rows(raw.opportunities).map(
      (o, j) => {
        const refs = ids(o.evidence);
        const potential = asNumber(o.worth_up_to);

        const d =
          o.deadline &&
          typeof o.deadline === "object" &&
          !Array.isArray(o.deadline)
            ? (o.deadline as Row)
            : undefined;

        return {
          id: String(o.id ?? `opportunity-${i}-${j}`),
          name: String(o.title ?? "Untitled opportunity"),
          stage: stage(o.stage),

          value:
            potential !== undefined && Number.isFinite(potential)
              ? potential
              : undefined,

          currency:
            typeof o.currency === "string"
              ? o.currency
              : "USD",

          evidenceIds: refs,
          valueStatus: "unknown",
          blockers: blockers(o.blocker),
          deadline: deadline(o.deadline),

          deadlineMeta: d
            ? {
                soon: d.soon === true,
                passed: d.passed === true,
                met: d.met === true,
                movesLeft:
                  typeof d.moves_left === "number"
                    ? d.moves_left
                    : null,
              }
            : undefined,
        };
      }
    );

    const referenced = new Set(
      opportunities.flatMap((o) => o.evidenceIds)
    );

    const sources: Evidence[] = [
      ...evidence,
      ...documentEvidence.filter((e) => referenced.has(e.id)),
    ];

    const contacts: Contact[] = rows(raw.stakeholders).map((s, j) => ({
      id: String(s.id ?? `stakeholder-${i}-${j}`),
      name: String(s.name ?? "Unknown stakeholder"),
      role: String(s.role ?? "Unknown decision role"),

      relationship: (
        ["guarded", "neutral", "warm", "ally"] as string[]
      ).includes(String(s.relationship))
        ? (s.relationship as Contact["relationship"])
        : "unknown",

      available:
        typeof s.available === "boolean"
          ? s.available
          : undefined,

      dealIds: ids(s.opportunity_id),
      evidenceIds: ids(s.evidence),
    }));

    const deadlines = rows(raw.deadlines);

    for (const d of deadlines) {
      const id = `deadline-${i}-${sources.length}`;

      sources.push({
        id,
        type: "deadline",
        status: "verified",
        summary: String(d.text ?? "Account deadline"),
        raw: d,
      });
    }

    return {
      id: String(raw.id ?? `account-${i}`),
      name: String(raw.name ?? "Unknown account"),
      opportunities,
      contacts,
      evidence: sources,
      actions: [],
      risks: [],
      gaps: [],
      raw,
    };
  });
}
