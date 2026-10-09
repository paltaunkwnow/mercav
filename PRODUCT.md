# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: owners of small and medium businesses in Latin America (a café, a bakery, a shop, a clinic, a services firm) who run the business themselves and need to operate it and grow it without hiring a technology team. They reach Mercav by evaluating whether one account can replace a handful of separate tools, spreadsheets, and WhatsApp groups.

Secondary audiences with their own pages:
- Freelancers and candidates who publish services or look for jobs.
- Investors who read the pitch and the investor page.
- The Kosher community that uses the Kosher atlas (kosher.mercav.lat).

## Product Purpose

Mercav is a single account for operating and growing a business in Latin America. Success is a business owner who signs up, opens the app at app.mercav.lat, and runs their real work there: their team and payroll, their customer loyalty program, their advertising and hiring, and their everyday tools.

## Positioning

One account to operate and grow a business in Latin America: advertising, talent, jobs, team and payroll, customer loyalty, tools, and cybersecurity, in Spanish, with the prices and rules of the region.

Competitors are single-purpose (loyalty only, payroll only, a classifieds site) or built for other markets and translated. Mercav is built for Latin America from the start: 20 countries with their own holidays and currencies, Bolivian payroll rules already in force, and Spanish copy.

## Operating Context

- Two hosts. mercav.lat is public: landing, Quiénes somos, Pitch, Inversores, legal pages, and pricing. app.mercav.lat is the logged-in product, styled like a mobile app with sections: Inicio, Business, Herramientas, Pwn, Calendario, Mensajes. pwn.mercav.lat redirects to app.mercav.lat/pwn. kosher.mercav.lat is the Kosher atlas.
- Business owners invite their team. The roles are Dueño, RR. HH., Encargado, and Empleado. Employees use the app on their phones: their own record, payslips, and the Sellar screen at the counter.
- Customers of a business join its loyalty card from a QR code at the counter, with no Mercav account. The card works in the browser, and Apple Wallet and Google Wallet support is planned.

## Capabilities and Constraints

Live modules:
- **Business:** company, workers, and payroll. The Bolivian payroll engine has 2025 and 2026 parameters, with Excel and PDF export, and personal data is stored encrypted.
- **Fidelización:** stamp and points cards for 19 business types, with rewards, tiers, birthday and referral bonuses, campaigns, a self-service kiosk, and a printable QR poster.
- **Publicidad:** advertising spaces.
- **Servicios:** freelance services.
- **Empleos:** job posts.
- **Herramientas:** everyday tools such as PDF and image utilities.
- **Pwn:** defensive cybersecurity intelligence built on public sources (HIBP, NVD, CISA KEV, and public feeds).
- **Calendario:** holidays for 20 Latin American countries plus the Hebrew calendar, each selectable.
- **Kosher atlas:** places across the region.

Terminology:
- Always "calendario hebreo", never "calendario judío".
- The product is "Mercav Business", no longer "POS".
- Each module is named in Spanish.

Decided:
- Pricing: one Free tier with limits and one subscription, Mercav Pro, at 9.99 USD per month or 95.88 USD per year (20 % off, 7.99 USD per month). Empresa and Elite are no longer sold; accounts that have them keep Pro access until they expire. Pwn, Kosher, and Calendario stay free with no limits.

Undecided:
- Wallet passes ship after the Apple and Google accounts are approved.

## Brand Commitments

- Name: Mercav, with the existing logo and the mercav.lat domains.
- Voice:
  - Spanish with Rioplatense voseo ("Creá tu cuenta", "Probá").
  - Plain words and short sentences.
  - No jargon or invented hype.
- Region: all of Latin America, not only Bolivia.
- Faith wording: Hashem, el Creador, Di-s. Never «Dios». Never label the founder with «soy judío» or «comunidad judía».
- Mascot: **Mervi**, the official mascot, confirmed by the user on 2026-10-08.
  - Look: a tuxedo cat (black fur with white face, chest and paws) with big amber eyes, a pink nose and pink inner ears.
  - Outfit: a black hoodie with gold drawstrings and the gold Mercav isotype on the chest, and a black kippah with a gold rim and a small M.
  - Personality: curious, smart, friendly, entrepreneurial, supportive and fun.
  - Art direction:
    - authentic pixel art on a 96 × 96 logical grid, scaled only by integer nearest-neighbor
    - 1 px black outline and cel shading with 3–4 tones per material
    - eyes built pixel by pixel; no blur, no anti-aliasing
  - Brand rules:
    - always keep the black and white fur, the amber eyes, the cat silhouette, the hoodie and the gold logo
    - the logo keeps Mercav's original geometry
    - the kippah is a respectful, consistent element; religious symbols are never mere decoration
  - The 12 official poses: normal, saludando, celebrando, programador, smartphone, comunidad, pensativo, cool, sorprendido, durmiendo, libro and emprendedor.
  - Uses: empty states, welcome messages, support, campaigns, promotions, loyalty and community content.

## Evidence on Hand

- The team, presented on `/nosotros`, `/pitch` and `/inversores` (`lib/data/team.ts`). It is the only human proof allowed:
  - Vinicius Salazar is the founder, CEO, head of cybersecurity ("encargado de Ciberseguridad") and face of the company, and always comes first.
  - Sebastian Rojas Cespedes is a cofounder: frontend development and endpoint analysis.
  - Alejandro Ismael Mendoza Diaz is the CTO: backend development, passive web scanning and endpoint scanning, done non-intrusively and only with authorization.
  - Marco Sánchez is Mercav's representative in Costa Rica: he lives there, is the face of Mercav in that country, leads its expansion, brand image and marketing there, and reports to Vinicius. Do not call him a founder. Profile photo: public/images/marco-sanchez.jpg.
- Product facts that describe capabilities may be stated:
  - 20 countries in the calendar.
  - Payroll rules by year.
  - 19 loyalty business types.
  - The public sources Pwn reads.
- Mervi sprites (official assets): `public/mervi/<pose>.png` (transparent), `public/mervi/web/<pose>.png` (animation strips with a sticker border), and `public/mervi/mervi-character-sheet.png`. They are generated by `scripts/mervi/mervi.py`.
- Absent, and must not be fabricated:
  - Customer logos, testimonials, case studies, or press.
  - Usage metrics or growth numbers.
- Live platform counts were not chosen as proof. Do not feature them as social proof.
- No real product screenshots are approved for marketing yet. Product visuals must be built from the real components (for example the loyalty card) or kept abstract, never as fake screenshots with invented data presented as real.

## Product Principles

1. One account, many jobs: every surface should make the breadth feel like a single, coherent product, not a bundle of apps.
2. Built for the region: prices, currencies, holidays, laws, and language from Latin America come first, never as a translation.
3. Plain and honest: claim only what the product does today, and mark what is coming as coming.
4. Respect the owner's time: the shortest path from landing to a working account and app.
5. Privacy by default: business and customer data are protected, and the product says so plainly.

## Accessibility & Inclusion

- Spanish-first copy.
- Every surface works on phones, because owners and employees mostly use phones.
- Reduced-motion preferences must be honored across all animation, including animated icons.
- Target WCAG 2.2 AA contrast in both light (cream and gold) and dark (black and gold) themes.
