import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Airbus Test Bench Catalog",
  description: "Visual catalog of Airbus test benches",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Runtime config (window.__ENV__): served statically in dev, overwritten
            by the container entrypoint in prod. `beforeInteractive` guarantees it
            runs before the app bundle, so the auth header is available to the
            first API call. */}
        <Script
          src={`${process.env.NEXT_PUBLIC_BASE_HREF ?? ""}/env-config.js`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="theme-industrial-premium">
        <Header />
        {children}
      </body>
    </html>
  );
}
