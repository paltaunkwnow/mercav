import type { Metadata } from "next";
import { PrivacyFooter, PrivacyHeader } from "@/components/privacy/PrivacyChrome";
import { PRIVACY_NAME, privacyUrl } from "@/components/privacy/site";
import { X_HANDLE } from "@/lib/seo/site";

const TITLE = "Mercav Privacy — billeteras frías y celulares con sistema reforzado";
const DESCRIPTION =
  "Billeteras frías selladas de fábrica y Google Pixel con un sistema reforzado basado en GrapheneOS, Mullvad VPN y Session. A pedido, con envíos a toda Bolivia. Pagás en SOL, XRP o con QR en bolivianos.";

// Mercav Privacy vive en privacy.mercav.lat (servido desde /privacy): los links relativos de los metadatos se arman
// contra ese origen, que canonicalFor ya conoce.
export const metadata: Metadata = {
  metadataBase: new URL(new URL(privacyUrl("/")).origin),
  title: { absolute: TITLE, template: `%s · ${PRIVACY_NAME}` },
  description: DESCRIPTION,
  applicationName: PRIVACY_NAME,
  keywords: [
    "billetera fría",
    "hardware wallet",
    "Ledger",
    "Trezor",
    "Tangem",
    "GrapheneOS",
    "Google Pixel",
    "celular privado",
    "Mullvad VPN",
    "Session",
    "privacidad",
    "Bolivia",
  ],
  category: "shopping",
  openGraph: { type: "website", locale: "es_419", siteName: PRIVACY_NAME, url: privacyUrl("/"), title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", site: X_HANDLE, title: TITLE, description: DESCRIPTION },
  appleWebApp: { capable: true, title: PRIVACY_NAME, statusBarStyle: "black-translucent" },
};

/** Marco de la tienda: el cartel en blanco y negro, con su propio header y pie. */
export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cartel c-mono flex min-h-dvh w-full flex-col overflow-x-clip">
      <PrivacyHeader />
      <div className="flex w-full flex-1 flex-col">{children}</div>
      <PrivacyFooter />
    </div>
  );
}
// creado por pato dev y askforvini
