import './globals.css';

export const metadata = {
  title: 'Kısalt — linkini yapıştır, kısalt',
  description: 'Üyeliksiz, hızlı, Türkçe link kısaltıcı. Tıklama istatistiği ve süreli linkler.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
