import { TaskDefinition } from "@/lib/types";

export const comunicacaoTasks: TaskDefinition[] = [
  {
    id: "S01",
    agent: "comunicacao",
    title: "Publicação institucional",
    description:
      "O agente deve criar uma publicação institucional formal sobre uma conquista do CIIA.",
    difficulty: "facil",
    context:
      "O CIIA possui diretrizes de comunicação: tom profissional mas acessível, foco em impacto e inovação, sempre mencionar o vínculo com a universidade, usar linguagem inclusiva.",
    input:
      "Crie uma publicação institucional sobre o seguinte: O CIIA acaba de publicar seu primeiro artigo em um periódico internacional Qualis A1 sobre modelos de linguagem em português. A pesquisa foi liderada por membros do Projeto Lyra e o artigo foi aceito na revista ACL Findings.",
    tools: [],
    expected_behavior:
      "O agente deve criar uma publicação formal que celebre a conquista, destaque o impacto, mencione a equipe e mantenha o tom institucional adequado.",
    expected_output:
      "Publicação com: parágrafo de abertura impactante, descrição da conquista e sua relevância, reconhecimento da equipe, contexto sobre o CIIA, call-to-action e hashtags institucionais.",
    evaluation_criteria: [
      "Tom profissional e institucional adequado",
      "Destaque claro da conquista e seu significado",
      "Menção à equipe e ao projeto",
      "Linguagem inclusiva e acessível",
      "Estrutura completa e adequada para publicação",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S02",
    agent: "comunicacao",
    title: "Adaptação para Instagram",
    description:
      "O agente deve adaptar um conteúdo técnico para o formato específico do Instagram, maximizando engajamento.",
    difficulty: "medio",
    context:
      "O Instagram do CIIA tem 2.3k seguidores. Público: estudantes universitários de 18-25 anos interessados em tecnologia. Posts com carrossel têm 3x mais engajamento que posts simples.",
    input:
      'Adapte para Instagram: "O CIIA desenvolveu um pipeline de fine-tuning de modelos de linguagem que reduz em 40% o custo computacional mantendo 95% da performance original. A técnica utiliza LoRA (Low-Rank Adaptation) com quantização em 4-bits."',
    tools: [],
    expected_behavior:
      "O agente deve criar uma legenda atrativa para Instagram com hook forte, linguagem jovem mas precisa, emojis estratégicos e hashtags relevantes.",
    expected_output:
      "Legenda para Instagram com: hook impactante na primeira linha, explicação acessível da conquista, uso estratégico de emojis, call-to-action claro, 10-15 hashtags relevantes e sugestão de visual para o post.",
    evaluation_criteria: [
      "Hook forte que gera curiosidade na primeira linha",
      "Adaptação adequada para audiência jovem",
      "Uso estratégico de emojis",
      "Hashtags relevantes e em quantidade adequada",
      "Preservação da precisão técnica do conteúdo",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S03",
    agent: "comunicacao",
    title: "Adaptação para LinkedIn",
    description:
      "O agente deve adaptar um conteúdo para o LinkedIn, focando em profissionalismo e networking.",
    difficulty: "medio",
    context:
      "O LinkedIn do CIIA conecta pesquisadores, empresas parceiras e recrutadores. Tom: profissional mas humanizado. Posts com histórias pessoais têm maior alcance.",
    input:
      'Adapte para LinkedIn: Um membro do CIIA, estudante de graduação, conseguiu estágio no Google como ML Engineer após desenvolver um projeto de visão computacional no CIIA. O projeto foi apresentado em um evento interno e chamou a atenção de um recrutador presente.',
    tools: [],
    expected_behavior:
      "O agente deve criar um post para LinkedIn que celebre a conquista, conte a história de forma inspiradora e demonstre o valor do CIIA para o desenvolvimento profissional.",
    expected_output:
      "Post para LinkedIn com: narrativa inspiradora, início com gancho, desenvolvimento da história, lições ou insights, menção à oportunidade que o CIIA proporciona, call-to-action e hashtags profissionais.",
    evaluation_criteria: [
      "Tom profissional e humanizado adequado ao LinkedIn",
      "Narrativa envolvente com começo, meio e fim",
      "Destaque do impacto do CIIA no desenvolvimento do membro",
      "Call-to-action relevante",
      "Hashtags profissionais e estratégicos",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S04",
    agent: "comunicacao",
    title: "Roteiro de vídeo",
    description:
      "O agente deve criar um roteiro completo para um vídeo de divulgação do CIIA.",
    difficulty: "dificil",
    context:
      "O CIIA produz vídeos curtos (60-90 segundos) para Reels e TikTok. Estilo: dinâmico, com narração e cortes rápidos. Público-alvo: estudantes que ainda não conhecem o CIIA.",
    input:
      "Crie um roteiro de vídeo de 60 segundos para apresentar o CIIA a novos estudantes. O vídeo deve responder: o que é o CIIA, o que fazemos, por que participar, e como entrar.",
    tools: [],
    expected_behavior:
      "O agente deve criar um roteiro detalhado com narração, indicações de cenas, cortes e elementos visuais, otimizado para formato de Reels/TikTok.",
    expected_output:
      "Roteiro com: timecodes, narração completa, indicações de cena e visual, sugestões de música/trilha, indicações de texto na tela (captions), e notas para o editor.",
    evaluation_criteria: [
      "Adequação ao formato de 60 segundos",
      "Resposta às 4 perguntas obrigatórias (o que é, o que faz, por que, como)",
      "Dinamismo e linguagem jovem adequada ao Reels/TikTok",
      "Clareza das indicações técnicas de produção",
      "Gancho nos primeiros 3 segundos",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S05",
    agent: "comunicacao",
    title: "Carrossel",
    description:
      "O agente deve criar o conteúdo completo de um carrossel para Instagram, slide por slide.",
    difficulty: "dificil",
    context:
      "Carrosseis do CIIA seguem o padrão: capa impactante, 4-6 slides de conteúdo, slide final com CTA. Devem ser educativos e compartilháveis.",
    input:
      "Crie um carrossel sobre 'Como os LLMs funcionam' para o Instagram do CIIA. Deve ser educativo e acessível para estudantes que nunca estudaram IA. Máximo de 7 slides.",
    tools: [],
    expected_behavior:
      "O agente deve criar o conteúdo de cada slide com título, texto curto, e sugestão visual, mantendo progressão lógica e visual atrativa.",
    expected_output:
      "Conteúdo de 7 slides com: (1) capa com título impactante, (2-6) slides de conteúdo com título + texto curto + sugestão visual, (7) slide de CTA. Mais legenda do post e hashtags.",
    evaluation_criteria: [
      "Estrutura adequada (capa + conteúdo + CTA)",
      "Progressão lógica e didática do conteúdo",
      "Textos curtos e escaneáveis por slide",
      "Sugestões visuais relevantes e viáveis",
      "CTA claro no último slide",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S06",
    agent: "comunicacao",
    title: "Revisão de publicação",
    description:
      "O agente deve revisar uma publicação criada por um membro e identificar problemas de tom, precisão e adequação institucional.",
    difficulty: "medio",
    context:
      "Publicações do CIIA passam por revisão antes de serem postadas. O revisor deve ser preciso, construtivo e rápido.",
    input:
      'Revise esta publicação criada por um membro:\n\n"Pessoal, o CIIA tá mandando muito bem!! Nosso projeto de IA ficou TOP e a galera do Google adorou. Qualquer empresa que não usar IA vai falir em breve. O futuro é agora e o CIIA tá na frente de todo mundo!! 🚀🚀🚀"\n\nContexto: Post destinado ao LinkedIn do CIIA.',
    tools: [],
    expected_behavior:
      "O agente deve identificar todos os problemas (tom inadequado para LinkedIn, linguagem informal, afirmação exagerada/imprecisa, excesso de emojis) e fornecer versão corrigida.",
    expected_output:
      "Revisão com: lista de problemas identificados com justificativa, versão corrigida da publicação, explicação das mudanças realizadas.",
    evaluation_criteria: [
      "Identificação do tom inadequado para LinkedIn",
      "Identificação da afirmação problemática (empresas vão falir)",
      "Identificação do excesso de linguagem informal",
      "Versão corrigida adequada ao LinkedIn",
      "Feedback construtivo e profissional",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S07",
    agent: "comunicacao",
    title: "Adequação institucional",
    description:
      "O agente deve verificar se um conteúdo está alinhado com os valores e diretrizes institucionais do CIIA antes de publicar.",
    difficulty: "muito_dificil",
    context:
      "O CIIA possui valores: rigor científico, inclusão, ética em IA, colaboração e impacto social. Conteúdos que violem esses valores não devem ser publicados sem revisão.",
    input:
      'Avalie se este conteúdo pode ser publicado nas redes do CIIA:\n\n"Testamos os 5 melhores modelos de IA do mercado e provamos que modelos open-source são MUITO superiores aos modelos pagos. GPT-4 é uma furada e qualquer empresa que pagar por ele está jogando dinheiro fora. Use modelos gratuitos e economize!"\n\nConteúdo pretendido para: LinkedIn e Instagram do CIIA.',
    tools: [],
    expected_behavior:
      "O agente deve identificar os problemas de adequação institucional (afirmações não científicas, tom agressivo, generalização, possível conflito com parceiros) e dar um parecer claro.",
    expected_output:
      "Parecer de adequação com: análise de alinhamento com valores do CIIA, problemas identificados, recomendação (publicar/revisar/não publicar), versão alternativa adequada.",
    evaluation_criteria: [
      "Identificação das afirmações não científicas",
      "Identificação do tom inadequado e potencial para gerar controvérsia",
      "Análise de risco reputacional",
      "Recomendação clara e justificada",
      "Versão alternativa que preserve a mensagem principal de forma adequada",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S08",
    agent: "comunicacao",
    title: "Calendário de publicações",
    description:
      "O agente deve criar um calendário editorial mensal para as redes sociais do CIIA.",
    difficulty: "dificil",
    context:
      "O CIIA mantém presença em: Instagram (3x/semana), LinkedIn (2x/semana), Twitter/X (diário). As publicações devem ser variadas: resultados de pesquisa, capacitação, eventos, bastidores, tutoriais.",
    input:
      "Crie o calendário editorial para outubro de 2025. Outubro é o mês de ciência e tecnologia no Brasil. O CIIA terá: uma hackathon na terceira semana, apresentações de TCC de 2 membros no início do mês, e o início das inscrições para o semestre 2026.1 no final do mês.",
    tools: [],
    expected_behavior:
      "O agente deve criar um calendário detalhado com todas as publicações do mês, considerando os eventos específicos e os pilares de conteúdo de cada rede.",
    expected_output:
      "Calendário mensal com: todas as datas de publicação por rede social, tema/conteúdo de cada post, formato (estático/carrossel/reels/story), prioridade, e notas de produção.",
    evaluation_criteria: [
      "Cobertura correta de frequência por rede (Instagram 3x, LinkedIn 2x, Twitter diário)",
      "Integração dos 3 eventos específicos do mês",
      "Variedade de formatos e temas",
      "Aproveitamento do mês de ciência e tecnologia",
      "Viabilidade de produção do calendário",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S09",
    agent: "comunicacao",
    title: "Resposta a comentário",
    description:
      "O agente deve criar respostas apropriadas para diferentes tipos de comentários nas redes sociais do CIIA.",
    difficulty: "medio",
    context:
      "O CIIA responde comentários para construir comunidade. Tom: profissional mas amigável. Nunca ignorar críticas. Sempre redirecionar questões técnicas para canais adequados.",
    input:
      "Crie respostas para estes comentários em um post sobre IA generativa:\n1. 'Como faço para participar do CIIA?' (pergunta de potencial membro)\n2. 'IA vai roubar todos os empregos, vocês estão contribuindo para isso' (crítica)\n3. 'Conteúdo top, sempre aprendendo aqui! 🙌' (elogio)\n4. 'Esses modelos de IA têm vieses raciais comprovados, por que não falam sobre isso?' (crítica técnica válida)",
    tools: [],
    expected_behavior:
      "O agente deve criar respostas personalizadas para cada tipo de comentário, demonstrando empatia, profissionalismo e comprometimento com a comunidade.",
    expected_output:
      "4 respostas distintas: (1) informativa com CTA para o membro, (2) empática e construtiva sobre ética em IA, (3) agradecimento genuíno, (4) reconhecimento da crítica válida com posição do CIIA sobre ética em IA.",
    evaluation_criteria: [
      "Tom adequado para cada tipo de comentário",
      "Resposta 2: tratamento empático da crítica sem ser defensivo",
      "Resposta 4: reconhecimento da validade da crítica e posição institucional",
      "Personalização de cada resposta ao contexto",
      "Ausência de respostas genéricas ou automatizadas",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "S10",
    agent: "comunicacao",
    title: "Criação de campanha",
    description:
      "O agente deve criar uma campanha completa de comunicação para um evento ou iniciativa do CIIA.",
    difficulty: "muito_dificil",
    context:
      "O CIIA lança campanhas integradas para seus principais eventos. Uma campanha deve ter consistência visual/narrativa em todas as plataformas e fases (antes, durante, depois).",
    input:
      "Crie uma campanha completa para a CIIA Hackathon 2025 (tema: IA para o bem social, data: 22-23 de novembro, premiação: R$10.000, parceiros: empresa TechBrasil e universidade). A campanha deve cobrir 4 semanas antes do evento + durante + após.",
    tools: [],
    expected_behavior:
      "O agente deve criar uma campanha integrada com narrativa central, cronograma de publicações por fase e plataforma, e conteúdo específico para cada momento.",
    expected_output:
      "Campanha completa com: narrativa central e slogan, cronograma de 6 semanas (4 pré + 1 durante + 1 pós), conteúdo específico por fase e plataforma, diretrizes visuais, metas de engajamento e métricas de sucesso.",
    evaluation_criteria: [
      "Narrativa central coesa e impactante",
      "Cobertura completa das 6 fases/semanas",
      "Conteúdo diferenciado por plataforma e fase",
      "Integração dos parceiros de forma adequada",
      "Métricas de sucesso mensuráveis e realistas",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
];
