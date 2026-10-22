import { StorefrontPage } from '@/components/storefront-page';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cursos e trilhas — Mary Hunter' };
export default function Page() {
  return <StorefrontPage section="courses" />;
}
