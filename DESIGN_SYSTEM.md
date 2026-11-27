# Design system

## Composition

The homepage uses one large ceramic study, a bilingual headline and two primary journeys. It proceeds to the digital menu, the story, gallery, visitor feedback and location. Data-dependent sections appear when the relevant published content exists. The public menu uses content-led rows or image cards, search and category selection. The location page groups the address and hours; the contact page shows available verified channels.

## Tokens

| Purpose | Value |
|---|---|
| Background | #F8F6F0 |
| Surface | #EDEAE1 |
| Primary text | #22261F |
| Secondary text | #56594E |
| Primary action | #313D32 with white text |
| Secondary action | Transparent with #777B6C border and primary text |
| Border | #C9C9BB |
| Focus | #276B9A |
| Error | #882E2B |
| Success | #31553B |
| Disabled text | #65665C |

The public CSS defines these tokens in web/assets/site.css. Body copy starts at 16 CSS pixels. Logical padding and margin adapt to the document direction, and headings scale with available width. The main layout collapses to one column below 44rem. Native menu disclosure replaces desktop navigation below 60rem. Form controls keep native semantics, while local JavaScript adds printing, optional clipboard and sharing interactions, size price updates and Escape handling.

## Typography assessment

Noto Sans Arabic was available under a redistributable license and retained Arabic shaping tables after subsetting. IBM Plex Sans Arabic and Alexandria were considered as contemporary alternatives; DIN Next LT Arabic requires commercial licensing. Tajawal has an airier, more geometric character than the selected Arabic face. For English, Inter, Manrope and DM Sans could support navigation if the owner licenses and supplies a preferred asset. Helvetica Neue availability varies by device. The implemented Latin stack uses Arial for interface text and Georgia for editorial headings, with system fallbacks. Arabic uses the locally hosted Noto font followed by Tahoma or sans-serif.

## Images, motion and print

The original local still-life studies have small and large WebP variants and intrinsic dimensions. Browser srcset selects an appropriate source. The first hero image loads eagerly; secondary images lazy-load. The mobile hero, editorial images and public gallery reserve aspect ratio. Product and gallery images from CMS use local files. Entrance movement is 0.35rem and reduced-motion preferences disable it. The print stylesheet suppresses navigation, controls and photography and keeps each menu entry together.

## Accessibility review scope

See ACCESSIBILITY_REPORT.md and QA_RESULTS.md for actual browser coverage. A design token or automated pass does not certify WCAG conformance.
