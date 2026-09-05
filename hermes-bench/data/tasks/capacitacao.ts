import { TaskDefinition } from "@/lib/types";

export const capacitacaoTasks: TaskDefinition[] = [
  {
    id: "C01",
    agent: "capacitacao",
    title: "Criação de competição",
    description:
      "O agente deve criar uma competição completa para engajamento de estudantes em IA, definindo modalidades, regras, critérios de avaliação e premiação.",
    difficulty: "medio",
    context:
      "O CIIA promove competições internas para estimular o aprendizado prático. A competição deve ser relevante para o contexto de IA aplicada e acessível a estudantes de diferentes níveis.",
    input:
      "Crie uma competição de IA para estudantes universitários com foco em modelos de linguagem. O evento deve ocorrer em 3 semanas e acomodar de 5 a 20 equipes.",
    tools: ["search_file", "create_folder"],
    expected_behavior:
      "O agente deve estruturar a competição com nome, objetivos, cronograma, regras, critérios de avaliação e premiação clara.",
    expected_output:
      "Documento com: nome da competição, objetivo, datas, modalidades, regras completas, critérios de avaliação (técnico, originalidade, apresentação), premiação e instruções de inscrição.",
    evaluation_criteria: [
      "Completude da estrutura da competição",
      "Clareza das regras e critérios",
      "Viabilidade do cronograma",
      "Adequação para o contexto universitário de IA",
      "Presença de todos os elementos obrigatórios",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C02",
    agent: "capacitacao",
    title: "Criação de desafio técnico",
    description:
      "O agente deve criar um desafio técnico prático para avaliar habilidades específicas em IA/ML.",
    difficulty: "dificil",
    context:
      "O CIIA precisa selecionar candidatos para uma vaga de pesquisador. O desafio técnico deve discriminar candidatos por nível de habilidade.",
    input:
      "Crie um desafio técnico de 48 horas para selecionar um pesquisador de IA focado em NLP. Nível: sênior. Tecnologias: Python, transformers, avaliação de LLMs.",
    tools: [],
    expected_behavior:
      "O agente deve criar um desafio técnico detalhado, com enunciado claro, critérios de avaliação objetivos e rubrica de pontuação.",
    expected_output:
      "Desafio com enunciado, dataset fornecido (descrição), tarefas específicas (mínimo 3), critérios de avaliação com pesos, rubrica detalhada, entregáveis esperados e instruções de submissão.",
    evaluation_criteria: [
      "Relevância técnica das tarefas",
      "Clareza do enunciado",
      "Critérios de avaliação objetivos e completos",
      "Adequação ao nível sênior solicitado",
      "Viabilidade dentro de 48 horas",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C03",
    agent: "capacitacao",
    title: "Trilha de capacitação",
    description:
      "O agente deve criar uma trilha de aprendizagem estruturada e progressiva para capacitar membros do CIIA em um tema específico.",
    difficulty: "medio",
    context:
      "Novos membros do CIIA precisam ser capacitados rapidamente. A trilha deve ser autocontida, com recursos curados e marcos claros de progresso.",
    input:
      "Crie uma trilha de capacitação em IA Generativa para membros iniciantes do CIIA. Duração: 8 semanas. Disponibilidade: 5 horas por semana.",
    tools: ["search_file", "read_file"],
    expected_behavior:
      "O agente deve montar uma trilha semanal com objetivos, recursos, exercícios práticos e critérios de conclusão para cada semana.",
    expected_output:
      "Trilha com 8 módulos semanais, cada um contendo: objetivos de aprendizagem, recursos recomendados (artigos, vídeos, tutoriais), exercício prático e critério de conclusão. Mais uma lista de pré-requisitos e glossário.",
    evaluation_criteria: [
      "Progressão lógica do conteúdo",
      "Adequação da carga horária semanal",
      "Qualidade e relevância dos recursos sugeridos",
      "Presença de exercícios práticos",
      "Critérios de conclusão claros e mensuráveis",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C04",
    agent: "capacitacao",
    title: "Adaptação para iniciantes",
    description:
      "O agente deve adaptar um conteúdo técnico avançado para uma audiência iniciante sem conhecimento prévio.",
    difficulty: "medio",
    context:
      "O CIIA recebe frequentemente estudantes de cursos não relacionados à computação que querem aprender sobre IA. É necessário adaptar materiais complexos.",
    input:
      'Adapte este conteúdo técnico para iniciantes sem background em programação:\n\n"Transformers utilizam mecanismos de atenção multi-head para capturar dependências de longo alcance em sequências de tokens. O encoder-decoder cross-attention permite ao modelo atender ao contexto completo do input ao gerar cada token do output."',
    tools: [],
    expected_behavior:
      "O agente deve reescrever o conteúdo usando analogias, exemplos do cotidiano e linguagem acessível, sem perder a essência técnica.",
    expected_output:
      "Versão adaptada do texto com: explicação em linguagem simples, pelo menos uma analogia com o cotidiano, exemplos concretos, definição de termos técnicos inevitáveis e sugestão de próximos passos para aprendizado.",
    evaluation_criteria: [
      "Clareza e acessibilidade da linguagem",
      "Uso de analogias ou exemplos do cotidiano",
      "Fidelidade ao conteúdo técnico original",
      "Ausência de jargão inexplicado",
      "Engajamento e didática",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C05",
    agent: "capacitacao",
    title: "Dinâmica de integração",
    description:
      "O agente deve criar uma dinâmica de integração que combina aprendizado sobre IA com socialização entre novos membros.",
    difficulty: "facil",
    context:
      "O CIIA está recebendo novos membros no início do semestre. É necessário criar uma dinâmica que seja ao mesmo tempo divertida e educativa.",
    input:
      "Crie uma dinâmica de integração de 2 horas para 20 novos membros do CIIA. Objetivo: conhecer os outros membros e aprender conceitos básicos de IA de forma lúdica.",
    tools: [],
    expected_behavior:
      "O agente deve criar uma dinâmica com estrutura clara, atividades sequenciais bem definidas, materiais necessários e instruções para o facilitador.",
    expected_output:
      "Plano da dinâmica com: roteiro temporal detalhado (2h), descrição de cada atividade, materiais necessários, instruções para o facilitador, variações para diferentes números de participantes e critérios de sucesso.",
    evaluation_criteria: [
      "Viabilidade em 2 horas",
      "Equilíbrio entre socialização e aprendizado",
      "Clareza das instruções para o facilitador",
      "Criatividade e engajamento das atividades",
      "Adequação para grupos de 20 pessoas",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C06",
    agent: "capacitacao",
    title: "Desafio baseado em tecnologias",
    description:
      "O agente deve criar um desafio prático centrado em uma tecnologia específica emergente em IA.",
    difficulty: "dificil",
    context:
      "O CIIA quer manter seus membros atualizados com as tecnologias mais recentes. Os desafios devem ser hands-on e estimular experimentação.",
    input:
      "Crie um desafio prático de 72 horas sobre agentes de IA com uso de ferramentas (tool calling). Os participantes devem ter nível intermediário em Python e conhecimento básico de LLMs.",
    tools: ["search_file"],
    expected_behavior:
      "O agente deve criar um desafio que envolva implementação real de um agente com tool calling, com critérios técnicos claros e rubrica de avaliação.",
    expected_output:
      "Desafio completo com: contexto do problema, especificação do agente a ser construído, lista de ferramentas que o agente deve usar, critérios de avaliação técnica, exemplos de entradas e saídas esperadas, e rubrica detalhada.",
    evaluation_criteria: [
      "Relevância técnica do desafio",
      "Especificidade dos requisitos de tool calling",
      "Clareza dos exemplos de entrada/saída",
      "Adequação ao nível intermediário",
      "Completude da rubrica de avaliação",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C07",
    agent: "capacitacao",
    title: "Avaliação de proposta",
    description:
      "O agente deve avaliar criticamente uma proposta de projeto de IA, identificando pontos fortes, fraquezas e sugestões de melhoria.",
    difficulty: "muito_dificil",
    context:
      "Membros do CIIA submetem propostas de projetos para obter recursos e orientação. O agente deve fornecer feedback construtivo e detalhado.",
    input:
      'Avalie esta proposta de projeto:\n\nTítulo: "Sistema de Resumo Automático de Papers Científicos"\nObjetivo: Criar um sistema que resume papers de IA em português\nMetodologia: Fine-tuning de GPT-2 em dataset de papers\nCronograma: 2 meses\nEquipe: 2 pessoas (iniciantes em ML)\nResultado esperado: Sistema com 90% de accuracy',
    tools: [],
    expected_behavior:
      "O agente deve identificar problemas técnicos, metodológicos e de planejamento, e sugerir correções específicas e construtivas.",
    expected_output:
      "Avaliação estruturada com: pontos positivos, problemas identificados (técnicos, metodológicos, de cronograma), sugestões de melhoria específicas para cada problema, recomendação final (aprovar/revisar/reprovar) com justificativa.",
    evaluation_criteria: [
      "Identificação de problemas técnicos reais (ex: GPT-2 vs modelos modernos, métrica inadequada)",
      "Identificação de problemas de planejamento",
      "Qualidade e especificidade das sugestões",
      "Tom construtivo e profissional",
      "Recomendação final justificada",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C08",
    agent: "capacitacao",
    title: "Divulgação de competição",
    description:
      "O agente deve criar materiais de divulgação para uma competição, adaptados para diferentes canais de comunicação.",
    difficulty: "facil",
    context:
      "O CIIA organiza uma hackathon de IA e precisa divulgar amplamente para maximizar a participação.",
    input:
      "Crie materiais de divulgação para a CIIA Hackathon 2025 (tema: IA para sustentabilidade, premiação: R$5.000, data: 15-16 de novembro, inscrições até 10 de novembro). Criar versões para: Instagram (legenda), e-mail para professores e WhatsApp.",
    tools: [],
    expected_behavior:
      "O agente deve criar três versões do material de divulgação, cada uma adaptada ao canal e audiência específicos.",
    expected_output:
      "Três materiais distintos: (1) Legenda para Instagram com hashtags e call-to-action, (2) E-mail formal para professores com detalhes completos, (3) Mensagem para WhatsApp concisa e direta. Cada um com tom e formato adequados ao canal.",
    evaluation_criteria: [
      "Adequação do tom para cada canal",
      "Presença das informações essenciais em todas as versões",
      "Efetividade do call-to-action",
      "Formatação adequada para cada canal",
      "Criatividade e engajamento",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C09",
    agent: "capacitacao",
    title: "Plano de acompanhamento",
    description:
      "O agente deve criar um plano de acompanhamento para monitorar o progresso de membros em capacitação.",
    difficulty: "medio",
    context:
      "O CIIA precisa garantir que membros em capacitação estejam progredindo adequadamente e recebendo suporte quando necessário.",
    input:
      "Crie um plano de acompanhamento para 10 membros que estão cursando a trilha de IA Generativa de 8 semanas. Inclua: checkpoints, métricas de progresso, mecanismos de suporte e ações para quem está atrasado.",
    tools: ["create_folder", "search_file"],
    expected_behavior:
      "O agente deve criar um plano estruturado com pontos de verificação claros, métricas objetivas e protocolos de suporte.",
    expected_output:
      "Plano com: calendário de checkpoints semanais, métricas de progresso mensuráveis, template de relatório de progresso individual, protocolo de suporte para membros atrasados, plano de recuperação e critérios de conclusão.",
    evaluation_criteria: [
      "Clareza dos checkpoints e marcos",
      "Objetividade das métricas de progresso",
      "Qualidade do protocolo de suporte",
      "Viabilidade do plano de recuperação",
      "Cobertura de diferentes cenários de progresso",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "C10",
    agent: "capacitacao",
    title: "Baixa participação",
    description:
      "O agente deve analisar e propor soluções para um problema de baixa participação em atividades de capacitação.",
    difficulty: "muito_dificil",
    context:
      "O CIIA identificou que menos de 30% dos membros completam as trilhas de capacitação. É necessário diagnosticar o problema e propor soluções baseadas em dados.",
    input:
      "A taxa de conclusão da trilha de capacitação caiu de 70% para 28% nos últimos 3 semestres. Dados disponíveis: maior abandono na semana 4, pico de desistências em período de provas, feedback qualitativo: 'conteúdo muito teórico'. Proponha um plano de melhoria.",
    tools: ["search_file", "read_file"],
    expected_behavior:
      "O agente deve diagnosticar as causas raiz do problema com base nos dados fornecidos e propor soluções específicas, mensuráveis e viáveis.",
    expected_output:
      "Diagnóstico com causas raiz identificadas, plano de melhoria com: mudanças de conteúdo (semana 4 especificamente), adaptações ao calendário acadêmico, estratégias de engajamento, métricas de sucesso e cronograma de implementação.",
    evaluation_criteria: [
      "Profundidade do diagnóstico baseado nos dados",
      "Especificidade das soluções (não genéricas)",
      "Conexão entre causas e soluções propostas",
      "Viabilidade das propostas",
      "Métricas de sucesso mensuráveis",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
];
