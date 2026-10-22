export interface LearningStep {
  title: string;
  slug?: string;
  practice: string;
  resource?: string;
}
export interface LearningPath {
  id: string;
  label: string;
  goal: string;
  prerequisite: string;
  steps: LearningStep[];
}
const base: LearningStep = {
  title: 'Comece pela lógica',
  slug: 'introducao-a-programacao',
  practice:
    'Prática sugerida: descreva as regras de um jogo de adivinhação e escreva condições e repetições.',
};
export const learningPaths: LearningPath[] = [
  {
    id: 'web',
    label: 'Jogos na web',
    goal: 'Da lógica ao seu primeiro jogo no navegador',
    prerequisite:
      'Comece aqui se ainda não programa. Siga a ordem e pratique antes de avançar.',
    steps: [
      base,
      {
        title: 'Estrutura da página',
        slug: 'introducao-ao-html',
        practice:
          'Monte uma página com título, instruções e uma área para o jogo.',
      },
      {
        title: 'Visual e organização',
        slug: 'html-e-css',
        practice: 'Estilize a página e adapte o layout para celular.',
      },
      {
        title: 'Interatividade com JavaScript',
        slug: 'aprendendo-javascript',
        practice:
          'Crie um jogo de adivinhação com entrada, tentativas, pontuação e reinício.',
      },
      {
        title: 'Movimento, Canvas e colisões',
        resource: 'https://developer.mozilla.org/en-US/docs/Games/Tutorials',
        practice:
          'Complemento gratuito MDN: estude Canvas e construa um jogo 2D. JavaScript sozinho não garante que o curso ensine jogos.',
      },
      {
        title: 'Projeto final: seu jogo publicado',
        practice:
          'Crie um minijogo autoral, com início, regras, vitória/derrota e reinício. Teste no celular, publique e escreva um README. Só depois escolha outra trilha.',
      },
    ],
  },
  {
    id: 'unity',
    label: 'Unity + C#',
    goal: 'Aprenda C# e construa seu projeto em Unity',
    prerequisite:
      'Escolha esta trilha para Unity. Godot e Unreal são alternativas; não é preciso fazer as três.',
    steps: [
      base,
      {
        title: 'Base em C# e projeto 2D',
        slug: 'csharp-zero-jogo-2d',
        practice:
          'Pratique variáveis, condições, funções e classes. .NET é a base de linguagem; a API da Unity é uma etapa própria.',
      },
      {
        title: 'Primeiros passos na Unity',
        slug: 'unity-iniciantes',
        practice:
          'Pratique cenas, objetos, componentes e scripts no editor. Confira na ementa a versão utilizada.',
      },
      {
        title: 'Projeto final em Unity',
        practice:
          'Produza um jogo 2D pequeno com controles, colisões e uma condição de vitória. Gere uma versão jogável e registre o processo.',
      },
    ],
  },
  {
    id: 'godot',
    label: 'Godot',
    goal: 'Da lógica ao primeiro projeto em Godot',
    prerequisite:
      'Não exige passar por Unity ou Unreal. Confira a linguagem e a versão da Godot na ementa.',
    steps: [
      base,
      {
        title: 'Aprenda a engine Godot',
        slug: 'jogos-godot',
        practice:
          'Pratique o editor e a linguagem adotada pelo curso. Faça um protótipo 2D pequeno.',
      },
      {
        title: 'Projeto final em Godot',
        practice:
          'Crie um jogo com uma fase, movimento, colisões, pontuação e reinício. Exporte uma versão para outras pessoas testarem.',
      },
    ],
  },
  {
    id: 'unreal',
    label: 'Unreal',
    goal: 'Conheça a Unreal e finalize um pequeno jogo',
    prerequisite:
      'Caminho independente. Confira se o curso usa Blueprints ou C++ e se o computador atende aos requisitos da engine.',
    steps: [
      base,
      {
        title: 'Seu primeiro jogo na Unreal',
        slug: 'game-dev-unreal',
        practice:
          'Aprenda o editor e o fluxo adotado pelo curso. Limite o primeiro protótipo a uma mecânica.',
      },
      {
        title: 'Projeto final na Unreal',
        practice:
          'Monte uma experiência curta com objetivo, interação e final. Gere uma versão executável e recolha feedback.',
      },
    ],
  },
  {
    id: 'backend',
    label: 'Back-end web',
    goal: 'Da interação no navegador aos dados no servidor',
    prerequisite:
      'Depois da base web e de JavaScript. PHP aparece abaixo como alternativa de linguagem, sem obrigação de estudar os dois.',
    steps: [
      {
        title: 'JavaScript primeiro',
        slug: 'aprendendo-javascript',
        practice:
          'Pratique funções, objetos e operações assíncronas antes de avançar.',
      },
      {
        title: 'Introdução ao Node.js',
        slug: 'nodejs-iniciantes',
        practice:
          'Use o ebook como introdução. Depois pratique HTTP e uma API de estudo; não presuma que o ebook cubra um back-end completo.',
      },
      {
        title: 'Banco de dados com SQL',
        slug: 'sql-do-zero',
        practice:
          'Modele jogadores e pontuações. Pratique consultas e validação dos dados.',
      },
      {
        title: 'Projeto final de servidor',
        practice:
          'Monte um ranking de estudo conectado ao seu jogo. Aprenda autenticação e segurança antes de aceitar dados reais de usuários.',
      },
    ],
  },
  {
    id: 'dados',
    label: 'Python e dados',
    goal: 'Uma sequência própria para explorar dados',
    prerequisite:
      'Siga esta trilha se seu objetivo é análise de dados; ela não é requisito para criar seu primeiro jogo.',
    steps: [
      base,
      {
        title: 'Programação com Python',
        slug: 'python-exemplos-praticos',
        practice:
          'Pratique funções, listas e leitura de arquivos com um conjunto de dados de exemplo.',
      },
      {
        title: 'Consultas com SQL',
        slug: 'sql-do-zero',
        practice: 'Selecione, agrupe e relacione dados em tabelas.',
      },
      {
        title: 'Análise de dados',
        slug: 'analise-de-dados',
        practice:
          'Confira as ferramentas exigidas na ementa. Analise um conjunto de dados e apresente suas conclusões.',
      },
    ],
  },
  {
    id: 'alternativas',
    label: 'Outras linguagens',
    goal: 'Escolha uma linguagem conforme seu objetivo',
    prerequisite:
      'Estas são alternativas, não uma sequência obrigatória. Kotlin básico ao avançado substitui a opção anterior de Kotlin Avançado.',
    steps: [
      {
        title: 'Opção: Java',
        slug: 'programar-java',
        practice:
          'Após lógica, use Java para praticar programação e orientação a objetos. Java e JavaScript são linguagens diferentes.',
      },
      {
        title: 'Opção: Kotlin do básico ao avançado',
        slug: 'kotlin-basico-avancado',
        practice:
          'Comece pelos fundamentos de Kotlin. Java não é um pré-requisito obrigatório; confira os pré-requisitos do curso.',
      },
      {
        title: 'Opção: PHP para web',
        slug: 'programacao-com-php',
        practice:
          'Uma alternativa ao caminho Node.js. Estude HTML, requisições e SQL conforme o projeto exigir.',
      },
    ],
  },
  {
    id: 'complementos',
    label: 'Complementos',
    goal: 'Conteúdos para avaliar conforme seu projeto',
    prerequisite:
      'Conteúdos independentes. Não são etapas obrigatórias da formação em jogos.',
    steps: [
      {
        title: 'Games Dev Pro',
        slug: 'games-dev-pro',
        practice:
          'Veja a ementa e identifique a engine, a linguagem e o nível antes de escolher. A posição nesta trilha não afirma que seja um curso avançado.',
      },
      {
        title: 'Cronogramas de engenharia',
        slug: 'cronogramas-engenharia',
        practice:
          'Material de engenharia e planejamento. Avalie a aplicação ao seu contexto; não é formação específica em game dev.',
      },
    ],
  },
];
