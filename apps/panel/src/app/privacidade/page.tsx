import Link from 'next/link';
export const metadata = {
  title: 'Privacidade e links de afiliada — Mary Hunter',
};
export default function Privacy() {
  return (
    <main className="legal-page">
      <Link className="back-link" href="/">
        ← Voltar à vitrine
      </Link>
      <span className="eyebrow">TRANSPARÊNCIA</span>
      <h1>Suas escolhas, com clareza.</h1>
      <h2>Links de afiliada</h2>
      <p>
        Alguns links desta vitrine são links de afiliada. Se você comprar por
        eles, a Mary poderá receber uma comissão, sem custo adicional para você.
        A compra é concluída no site da plataforma indicada, que define preço,
        disponibilidade, entrega, acesso e condições.
      </p>
      <h2>Preços e disponibilidade</h2>
      <p>
        Quando um preço é exibido, ele corresponde ao valor cadastrado e
        confirmado na data indicada. Valores antigos deixam de ser exibidos. O
        valor final e as condições válidas são sempre os apresentados na página
        de compra da plataforma.
      </p>
      <h2>Favoritos neste dispositivo</h2>
      <p>
        Ao salvar um item, o identificador dele é armazenado no armazenamento
        local do seu navegador. Não é necessário criar uma conta para navegar ou
        salvar favoritos. Você pode remover os itens salvos pela vitrine ou
        limpar os dados deste site no navegador.
      </p>
      <h2>Navegação e plataformas externas</h2>
      <p>
        A vitrine não recebe seus dados de pagamento. Ao sair para Hotmart ou
        Shopee, passam a valer as políticas dessas plataformas. Não há
        formulário de coleta de dados pessoais ou ferramenta de análise de
        visitantes nesta versão. A infraestrutura de hospedagem pode manter
        registros técnicos necessários ao funcionamento e à segurança.
      </p>
      <h2>Acesso administrativo</h2>
      <p>
        O login é reservado à administração do catálogo e utiliza autenticação
        do Supabase. Visitantes não precisam se autenticar.
      </p>
    </main>
  );
}
