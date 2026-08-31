export default function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="theme-map-first min-h-screen">{children}</div>;
}
