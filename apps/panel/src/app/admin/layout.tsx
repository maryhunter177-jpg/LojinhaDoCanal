import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Área da Mary — Lojinha do Canal',
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
