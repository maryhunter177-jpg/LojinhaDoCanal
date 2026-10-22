import { MaryAvatar } from '@/components/mary-avatar';
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="loading-page">
      <MaryAvatar size={72} />
      <p className="eyebrow">PÁGINA NÃO ENCONTRADA</p>
      <h1>Essa descoberta mudou de lugar.</h1>
      <Link className="button primary" href="/">
        Explorar a vitrine
      </Link>
    </main>
  );
}
