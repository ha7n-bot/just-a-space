# Domain and ownership review

Reviewed 26 November 2026. Candidates have not been reserved, purchased or attached. No registrar, trademark or DNS account has been verified for the café.

| Candidate | Live registration and ownership check | Example first year / renewal, per year |
| --- | --- | --- |
| justaspace.sa | UNKNOWN. SaudiNIC WHOIS did not return a result for this name here | SAR 250 / 250 |
| justaspace.com.sa | UNKNOWN. Registrar eligibility and direct lookup required | SAR 250 / 250 |
| justaspace.com | UNKNOWN. Registry RDAP and ICANN Lookup did not return an accessible record | USD 11.17 / 11.17 |
| justaspace.cafe | UNKNOWN. The registry lookup was inaccessible | USD 40.20 / 40.20 |
| justaspace.coffee | UNKNOWN. The registry lookup was inaccessible | USD 33.20 / 33.20 |
| justaspace.riyadh | Exclude. RIYADH was absent from the authoritative root delegation list on the review date | N/A |

These are published extension-level comparisons. Premium pricing, applicable tax and brokered resale could change the quote. DNS or search results cannot establish availability. Confirm the exact name and checkout quote immediately before an owner-authorized transaction. [Saudi pricing](https://www.saudiahost.com/support/domain/pricing?language=english) · [General TLD prices](https://pricing.registrar.cloudflare.com/) · [IANA TLD list](https://data.iana.org/TLD/tlds-alpha-by-domain.txt)

## Owner checks

1. Ask the owner for any existing domain and proof of control. Verify access with a registrar-issued DNS challenge. Preserve the existing zone and mail records.
2. Prefer the shorter Saudi name if eligibility, trademark match and availability are confirmed. SaudiNIC lists eligible Saudi entities/individuals and certain license or registered trademark holders. Have a licensed registrar confirm the exact category requirements, registrant linkage to the spelling and supporting documents. Use a business-controlled recovery address. [SaudiNIC eligibility](https://nic.sa/en/help/general-faq) · [Registration procedure](https://www.nic.sa/en/help/procedures-for-registering-via-registrars) · [Licensed registrars](https://nic.sa/en/help/licensed-registrars)
3. Run exact and similar Arabic and Latin name searches for relevant coffee and café services. Obtain the owner's documentation and professional review for possible conflicts. Trademark clearance is pending. [SAIP trademark search](https://www.saip.gov.sa/en/services/trademarks/trademark1)
4. Compare renewal, redemption and transfer terms in writing. The Saudi vendor lists SAR 250 for transfers of the two Saudi extensions. The general TLD table lists its registration rate for transfers of the three generic extensions. Confirm transfer locks and authorization code requirements with both registrars. Saudi domains follow SaudiNIC procedures. [SaudiNIC](https://nic.sa/en/help/regulations-and-rules) · [Transfer troubleshooting](https://developers.cloudflare.com/registrar/troubleshooting/)
5. Enable owner-controlled MFA and recovery codes. Record renewal dates and escalation contacts. Configure renewal alerts 60, 30 and 7 days in advance.

## DNS and HTTPS cutover

Export the existing zone and record its TTL before any change. No IP address or verification token has been allocated.

| Name | Type | Target |
| --- | --- | --- |
| Apex | A, and AAAA only with working IPv6, or a provider-supported apex alias | Host-assigned public destination |
| www | CNAME or other host-specified record | Host-assigned hostname |
| Host validation | TXT or CNAME | Exact challenge issued by the host |
| Search Console | TXT at apex | Domain property verification value |

Issue certificates for apex and www and verify automatic renewal at the TLS endpoint. Redirect HTTP to HTTPS. Select one canonical host and permanently redirect the other, retaining path and query. Set SITE_ORIGIN to the canonical HTTPS origin. Keep staging on a separate authenticated hostname and database. Preserve MX, SPF and existing mail-related records. No mailboxes have been provisioned.

After launch approval inspect both localized homepages in Search Console, submit /sitemap.xml, verify the redirect chain, reciprocal language alternates and crawlability. Run the Rich Results Test with the verified address and final business data. [Localized URLs](https://developers.google.com/search/docs/specialty/international/localized-versions) · [Business markup](https://developers.google.com/search/docs/appearance/structured-data/local-business)
