# Menu, gallery and public content

The SQLite migration is `cms/001.sql`. The strict field types and accepted record identifiers are in `cms/schema.mjs`. No café menu or price is seeded. Research candidates are kept outside the CMS.

## Record model

Each record has a unique (kind, slug) key, revision, draft, optional live copy, workflow status, evidence URL and verification date. Slugs use lowercase ASCII letters, digits and internal hyphens. Translation fields use `{"ar":"…","en":"…"}`. Required bilingual names must contain both languages. Draft prices may be absent. Published product prices require an actual nonnegative number with at most two decimal places. A null, missing or string price cannot reach the public menu.

| Kind | Managed data |
| --- | --- |
| products | Bilingual name and description, category slug, final SAR base price, temperature (hot/cold/ambient), variants with independently priced sizes, options with additional amounts, available, featured, seasonal, image and bilingual alt, verified allergen/dietary/tax text, sort order. Slug is the stable item ID. |
| categories | Bilingual category name and sort order. A published category is required before a product in it can publish. |
| gallery | Bilingual name, local or uploaded image, bilingual alt, creator, usage rights, dimensions and sort order. |
| settings/business | Bilingual name, address, city and district, postal code, latitude/longitude, phone and WhatsApp in international format, email and HTTPS map URL. |
| hours/schedule | Riyadh weekly periods and special-date replacement periods. Weekday 0 is Sunday. Missing weekday means unknown, an empty array means closed. The schedule accepts intervals crossing midnight. |
| social | Verified HTTPS URL, bilingual channel name, sort order. |
| pages | Bilingual title and body by public page key, including home. |
| seo | Bilingual title and description by public page key. |

## Editing and publishing

1. Use the separate `/admin` route and choose a language. Add categories, then products. Use the variants field for final size-specific prices and options for surcharge amounts. The editor provides rows for Arabic, English and price. Saving creates additional empty rows. The hours editor provides weekday controls, interval fields and dated exceptions.
2. Record the source URL and date. Keep in-store and delivery prices distinct. Publish only the verified consumer price for the website's channel, including applicable VAT. Leave unverified fields empty. Per-portion variants need their own verified price.
3. Save the draft, preview it and send it for review. Saving a change retains the former live copy. A second owner action with explicit attestation publishes the candidate. A single authorized owner may perform both steps.
4. Archive a product for immediate removal. Content managers can archive products. Archive an entire category to remove all associated products from public results. Restoring an archive produces a draft requiring normal review.
5. Use Gallery or Products to upload an authorized RGB/RGBA PNG and paste the returned path into the record. Metadata, text chunks and original filename are discarded. The server exposes a new file to visitors only when a published record references it. Reviewed, bundled JPEG/PNG/WebP/AVIF files under `web/assets` can also be referenced locally.
6. Sort order uses ascending integers. The public dataset excludes products whose category is unpublished, whose base price is not numeric, or whose availability is false. Featured and seasonal flags have no impact on approval. Options and allergy text never imply availability.

The audit trail stores the prior and next revision plus publication evidence. If someone else changes a record while it is open, the stale write returns HTTP 409. Reload before reapplying the change. Ordinary content deletion uses recoverable archives. A database backup is required for disaster recovery.
