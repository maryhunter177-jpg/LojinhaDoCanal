import Link from 'next/link';
export const metadata = {
  title: 'Link em atualização — Lojinha da Mary Hunter',
  robots: { index: false, follow: false },
};
export default function LinkUnavailable() {
  return (
    <main className="loading-page">
      <span className="brand-mark">✳</span>
      <span className="eyebrow">ESSA DESCOBERTA ESTÁ EM ATUALIZAÇÃO</span>
      <h1>Vamos encontrar outro achado?</h1>
      <p>
        O link deste item ainda não está disponível ou foi retirado do catálogo.
      </p>
      <Link className="button primary" href="/">
        Voltar para a lojinha
      </Link>
    </main>
  );
}
