export type { LegalDocument, LegalSection } from "./types";
export { PLACEHOLDER, findPlaceholders } from "./types";
export { offer } from "./offer";
export { partnerOffer } from "./partnerOffer";
export { privacy } from "./privacy";

import { offer } from "./offer";
import { partnerOffer } from "./partnerOffer";
import { privacy } from "./privacy";

/** partner_offer — отдельный документ: у площадки и организатора другие обязательства */
export type LegalDocId = "offer" | "partner_offer" | "privacy";

export const LEGAL_DOCS = { offer, partner_offer: partnerOffer, privacy } as const;
