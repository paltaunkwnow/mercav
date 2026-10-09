---
version: 1
slug: "app-chrome"
primary_target: "app/inicio/page.tsx"
related_targets: ["app/globals.css","components/layout/Header.tsx","components/layout/BottomNav.tsx","components/app-shell/AppPage.tsx","components/site/primitives.tsx","components/kosher/KosherShell.tsx","components/kosher/KosherAtlas.tsx","app/kosher/page.tsx"]
---

# La app de Mercav (app.mercav.lat y kosher.mercav.lat)

## Scope and mode
Operate. Every non-marketing route: inicio, Business, Pwn, Tools, Calendario, anuncios, empleos, servicios, perfil, mensajes, Kosher.

## Direction contract
THESIS: The app is what the phones on the landing show. The user asked on 2026-10-09 that the real app look "lo más parecido" to those phone screens. The public site's chrome (the cartel header) stays the same across the app.
- **Chrome:** the header is the landing's cartel bar: MERCAV wordmark in Big Shoulders, condensed caps links with a yellow underline on the active one, and a yellow "Creá tu cuenta".
- **Mobile bottom bar:** the phone's bar. It is a solid rounded bar with Inicio, Business, a gold "+" (Publicar), Calendario and Perfil.
- **Content:** the phone screens.
  - Ground #111216. Solid tiles #1b1d24 at 1.25rem with no border in dark. In light, white tiles with a hairline and a short shadow on #F4F3EF.
  - Gold #D4AF37 for icons in 12% gold wells and for the primary action. Gold ink #E0BD4F (#8B6914 in light).
  - Small uppercase gold labels (`mv-kicker`, like "TU NEGOCIO").
  - System font, semibold titles.
  - No glass, no auras, no gradient text.
- **Kosher world (`.k-world`):** the atlas phone.
  - Ground #0D1B2E, tiles #122440, accent tejelet #8DB4EC.
  - The pixel map (`components/home/PixelMap.tsx`), city pills, place cards with a green "Certificado".
  - Light variant on #EEF3FA with #2F5FA8.
- **Tokens:** the system lives in tokens and `mv-*` classes (globals.css), so all 127 pages inherit it. Hand-built screens follow the phones one to one: inicio is the phone home; /kosher is the phone atlas.

## Open
- **Pwn:** the phone shows Pwn in night with phosphor green. A `.p-world` like `.k-world` is pending.
- **Remaining pages:** pages that still build their own hero (anuncios, empleos, explorar) use the compact `PageHero`. A one-to-one pass per section is still to do.

// creado por pato dev y askforvini
