import { MaryAvatar } from '@/components/mary-avatar';
export default function Loading() {
  return (
    <main className="loading-page" aria-busy="true">
      <MaryAvatar size={72} />
      <p>Preparando suas próximas descobertas…</p>
    </main>
  );
}
