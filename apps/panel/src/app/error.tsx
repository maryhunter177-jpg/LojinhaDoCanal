'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="loading-page">
      <span className="brand-mark">✳</span>
      <h1>Vamos tentar de novo?</h1>
      <p>Não conseguimos carregar as descobertas agora.</p>
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
      <a href="/">Voltar para o início</a>
    </main>
  );
}
