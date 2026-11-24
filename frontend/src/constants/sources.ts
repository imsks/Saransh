/**
 * Official Sources whose site is not on gov.in or nic.in, matched on the
 * Story's `source_label` (case-insensitive). Keep it short: only government
 * bodies, never a newspaper or news agency.
 */
export const OFFICIAL_SOURCE_LABELS = [
  "Reserve Bank of India",
  "RBI",
  "Press Information Bureau",
  "PIB",
];

/** Government domains. A host on one of these, or a sub-domain, is an Official Source. */
export const OFFICIAL_SOURCE_DOMAINS = ["gov.in", "nic.in"];
