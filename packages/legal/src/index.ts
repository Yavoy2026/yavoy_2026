export type { LegalDocument, LegalSection } from "./types";
export { PLACEHOLDER, findPlaceholders } from "./types";
export { offer } from "./offer";
export { privacy } from "./privacy";

import { offer } from "./offer";
import { privacy } from "./privacy";

export type LegalDocId = "offer" | "privacy";

export const LEGAL_DOCS = { offer, privacy } as const;
