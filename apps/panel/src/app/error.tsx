'use client';
import { MaryAvatar } from '@/components/mary-avatar';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="loading-page">
      <MaryAvatar size={72} />
      <h1>Vamos tentar de novo?</h1>
      <p>Não conseguimos carregar as descobertas agora.</p>
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
      <a href="/">Voltar para o início</a>
    </main>
  );
}
