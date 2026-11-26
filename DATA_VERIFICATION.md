# Release data verification

Review date 2026-11-26 (Asia/Riyadh). The branch has been disambiguated through its English name, Riyadh district and street. No proof of authority to launch an official website was supplied. The private staging preview may use the brief's identity and a plain-text address corroborated by directories. Official launch requires independent owner confirmation. [Machine-readable field register](data/research.json) · [Source evaluations](RESEARCH_SOURCES.md)

| Evidence status | Editorial consequence |
| --- | --- |
| VERIFIED | Matching evidence supports the specific field. The publication-permission column independently controls its use. |
| PROVISIONAL | Candidate only, use the supplied Maps fallback solely as instructed. |
| CONFLICTING | Resolve discrepancies with a dated authoritative source before display. |
| OUTDATED | Historical evidence only. Refresh before approval. |
| UNKNOWN | Keep the value empty. |
| OWNER_APPROVAL_REQUIRED | Obtain owner sign-off and rights documentation. |

## Content decisions

| Topic | Result | Next evidence |
| --- | --- | --- |
| English identity and address | Café, Al Takhassousi Street, Al Nakheel, Riyadh 12383. Directories corroborate the brief. | Official National Address, exact entrance and brand lockup. |
| Arabic name | Several transliterations circulate. The brief supplies جست أ سبيس. | Owner-approved spelling. |
| Directions | User-provided short URL. Two independent directory links identify a candidate Place ID. | Owner checks pin on a real device, optional authorized Places call. |
| Weekly and special hours | Tuesday closing and weekend schedules conflict. Special dates unknown. | Signed regular schedule, including which civil date overnight close belongs to, Ramadan and holiday exceptions. |
| Menu, pricing and nutrition | 17 candidate products in the register. **Zero items have a verified in-store price or authorized publication.** Product and search tests must use isolated fixtures. | Current outlet menu or QR/POS export, effective date, sizes, variants, where each price applies, ingredients/allergens and applicable SFDA disclosures. |
| Reviews and spend | Historical rating and count disagree across sources. Per-person spending does not identify product prices. | Use Maps link. Keep rating and spend out of permanent content. |
| Contact and ordering | Candidate Instagram repeatedly linked by directories. Profile control unverified. No matching authorized checkout found. | Owner confirms each channel with a link from a controlled account. |
| Accessibility and services | Directory labels alone cannot establish on-site conditions or contactless delivery. | Operator verifies available entrances, seating, parking and services. |
| Brand assets | No grant covers third-party photos, logo or packaging. | Artwork files, photographer identity, commercial web usage rights, permitted duration and approval for each image. |

## Owner verification procedure

1. Obtain written authority covering this branch and an effective date on each document.
2. Confirm address, naming and links against a channel controlled by the operator. Keep the approval reference private. Avoid committing personal documents, signatures or private contact details to Git.
3. Read each approved menu item against the source on screen. Confirm both languages, integer SAR minor units, serving, variants, availability, taxes, channel, allergens and disclosures. A blank price stays null. Delivery prices require separate channel evidence.
4. Record source date and verification date separately. New information supersedes the prior revision through the editorial workflow. Archive superseded items and review derived markup and print views.
5. Preview both languages and compare the public HTML, printed menu and any structured data to the approved source. Check the real destination of each visitor-facing link before release.
