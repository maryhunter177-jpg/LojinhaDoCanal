import type { Metadata } from 'next';
import { getStorefrontSiteUrl } from '@ofertas/core';
import '@fontsource-variable/dm-sans';
import '@fontsource/instrument-serif/400-italic.css';
import './globals.css';
import { PageThemeControl } from '@/components/theme-toggle';
import { themeBootstrapScript } from '@/lib/theme-bootstrap';

export const metadata: Metadata = {
  metadataBase: new URL(getStorefrontSiteUrl()),
  title: 'Lojinha do Canal — Mary Hunter',
  description:
    'Um cantinho para quem gosta de aprender, programar e jogar. Explore cursos de programação e achadinhos para o seu setup na curadoria da Mary Hunter.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Mary Hunter — Seu próximo nível começa aqui',
    description: 'Cursos de programação e achadinhos tech para a comunidade.',
    locale: 'pt_BR',
    type: 'website',
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <PageThemeControl />
      </body>
    </html>
  );
}
