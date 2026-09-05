import { TaskDefinition } from "@/lib/types";

export const driveTasks: TaskDefinition[] = [
  {
    id: "D01",
    agent: "drive",
    title: "Classificação de documento",
    description:
      "O agente deve classificar um documento recebido e movê-lo para a pasta correta no Google Drive do CIIA.",
    difficulty: "facil",
    context:
      "O Drive do CIIA possui uma estrutura hierárquica: /CIIA/Administrativo, /CIIA/Projetos, /CIIA/Capacitacao, /CIIA/Comunicacao, /CIIA/Financeiro, /CIIA/Pesquisa.",
    input:
      'Novo arquivo recebido: "ata_reuniao_board_2025_03.pdf"\nConteúdo resumido: Ata da reunião do conselho administrativo do CIIA realizada em março de 2025, com deliberações sobre orçamento e novos projetos.\nTarefa: Classificar e mover para a pasta correta.',
    tools: ["search_file", "read_file", "move_file", "list_folder"],
    expected_behavior:
      "O agente deve identificar que a ata de reunião administrativa pertence a /CIIA/Administrativo, usar as ferramentas na ordem correta e mover o arquivo.",
    expected_output:
      'Arquivo movido para /CIIA/Administrativo/Atas/2025/ com confirmação da operação. Justificativa clara da classificação.',
    evaluation_criteria: [
      "Identificação correta da categoria (Administrativo)",
      "Uso correto das ferramentas na sequência adequada",
      "Destino correto (/CIIA/Administrativo/Atas/2025/)",
      "Justificativa da classificação presente",
      "Ausência de erros de ferramenta",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D02",
    agent: "drive",
    title: "Identificação de projeto",
    description:
      "O agente deve identificar a qual projeto um documento pertence e organizá-lo na subpasta correta.",
    difficulty: "medio",
    context:
      "O CIIA possui múltiplos projetos ativos: Projeto Atlas (visão computacional), Projeto Hermes (agentes de IA), Projeto Lyra (NLP para português), Projeto Daedalus (MLOps).",
    input:
      'Arquivo: "relatorio_sprint_4_nlp_modelos_bert.pdf"\nConteúdo: Relatório técnico sobre experimentos com BERT e RoBERTa para classificação de textos em português. Contém métricas de F1-score e análise de erros.\nTarefa: Identificar o projeto e organizar corretamente.',
    tools: ["search_file", "read_file", "list_folder", "move_file"],
    expected_behavior:
      "O agente deve identificar que o documento pertence ao Projeto Lyra (NLP para português) baseado no conteúdo técnico e movê-lo para a pasta correta.",
    expected_output:
      "Arquivo movido para /CIIA/Projetos/Lyra/Sprints/ com justificativa detalhada da identificação do projeto baseada no conteúdo.",
    evaluation_criteria: [
      "Identificação correta do projeto (Lyra)",
      "Uso das ferramentas read_file para analisar conteúdo",
      "Destino correto (/CIIA/Projetos/Lyra/)",
      "Justificativa baseada no conteúdo técnico",
      "Não mover para projetos incorretos",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D03",
    agent: "drive",
    title: "Arquivo ambíguo",
    description:
      "O agente deve lidar com um arquivo cujo conteúdo é ambíguo e pode pertencer a múltiplas categorias.",
    difficulty: "muito_dificil",
    context:
      "Alguns documentos do CIIA são interdisciplinares e podem se encaixar em múltiplas categorias. O agente deve tomar uma decisão justificada e criar referências cruzadas quando necessário.",
    input:
      'Arquivo: "workshop_agentes_ia_capacitacao_pesquisa.pdf"\nConteúdo: Material de um workshop que serviu tanto como capacitação interna quanto como publicação de resultados de pesquisa do Projeto Hermes. Contém tutoriais técnicos e dados de experimentos.\nTarefa: Classificar e organizar adequadamente.',
    tools: [
      "search_file",
      "read_file",
      "list_folder",
      "move_file",
      "create_folder",
    ],
    expected_behavior:
      "O agente deve reconhecer a ambiguidade, tomar uma decisão principal justificada e criar uma referência cruzada ou cópia na categoria secundária.",
    expected_output:
      "Decisão de classificação primária com justificativa, ação tomada (mover + criar referência/cópia), e nota sobre a ambiguidade documentada.",
    evaluation_criteria: [
      "Reconhecimento explícito da ambiguidade",
      "Decisão de classificação justificada",
      "Tratamento da categoria secundária (referência ou cópia)",
      "Uso adequado das ferramentas",
      "Documentação da decisão",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D04",
    agent: "drive",
    title: "Definição do caminho",
    description:
      "O agente deve definir o caminho completo de destino para um documento, incluindo a criação de subpastas necessárias.",
    difficulty: "medio",
    context:
      "O Drive do CIIA está em expansão. Novas categorias precisam ser criadas quando necessário. O agente deve determinar o caminho mais lógico e criar a estrutura se não existir.",
    input:
      'Arquivo: "proposta_parceria_empresa_xyz_2025.pdf"\nConteúdo: Proposta formal de parceria entre o CIIA e a Empresa XYZ para desenvolvimento conjunto de soluções de IA. Inclui termos financeiros e técnicos.\nEstrutura atual do Drive não possui pasta de Parcerias.\nTarefa: Definir o caminho correto e organizar.',
    tools: ["list_folder", "create_folder", "move_file", "search_file"],
    expected_behavior:
      "O agente deve listar a estrutura atual, identificar a ausência de uma pasta de Parcerias, criar a estrutura adequada e mover o arquivo.",
    expected_output:
      "Nova estrutura criada (/CIIA/Administrativo/Parcerias/ ou equivalente), arquivo movido, justificativa da escolha do local e estrutura criada.",
    evaluation_criteria: [
      "Uso de list_folder para verificar estrutura existente",
      "Criação adequada da nova pasta",
      "Decisão lógica do local de inserção",
      "Arquivo movido corretamente",
      "Justificativa da estrutura criada",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D05",
    agent: "drive",
    title: "Detecção de possíveis duplicatas",
    description:
      "O agente deve identificar possíveis arquivos duplicados ou muito similares e recomendar a ação adequada.",
    difficulty: "dificil",
    context:
      "O Drive do CIIA acumulou arquivos ao longo de anos. Existem casos de documentos duplicados com nomes ligeiramente diferentes. O agente deve detectar e resolver duplicatas.",
    input:
      "Ao tentar salvar 'relatorio_anual_ciia_2024_v2.pdf', o agente encontrou os seguintes arquivos existentes:\n- relatorio_anual_ciia_2024.pdf (criado em jan/2025, 2.3MB)\n- relatorio_anual_ciia_2024_final.pdf (criado em jan/2025, 2.3MB)\n- relatorio_anual_ciia_2024_v2.pdf (criado em fev/2025, 2.4MB)\nTarefa: Detectar e resolver as duplicatas.",
    tools: ["search_file", "read_file", "list_folder"],
    expected_behavior:
      "O agente deve analisar os arquivos, identificar prováveis duplicatas baseado em metadados, recomendar qual manter e como proceder.",
    expected_output:
      "Análise de duplicatas com: comparação dos arquivos, recomendação de qual manter (justificada), sugestão de ação para os demais e relatório de raciocínio.",
    evaluation_criteria: [
      "Análise sistemática dos arquivos",
      "Identificação correta de provável duplicata",
      "Recomendação justificada (manter versão mais recente/completa)",
      "Cautela antes de deletar (recomendar arquivo antes de excluir)",
      "Relatório claro de raciocínio",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D06",
    agent: "drive",
    title: "Padronização de nomes",
    description:
      "O agente deve padronizar os nomes de arquivos seguindo uma convenção definida.",
    difficulty: "facil",
    context:
      "O CIIA adotou uma convenção de nomenclatura: [tipo]_[projeto/area]_[descricao]_[AAAA-MM]. Exemplos: 'ata_admin_reuniao-board_2025-03', 'relatorio_lyra_sprint4_2025-02'.",
    input:
      "Padronize os nomes dos seguintes arquivos:\n1. 'Ata Reunião Março.pdf'\n2. 'SPRINT 5 HERMES RESULTADOS FINAIS v3.pdf'\n3. 'material workshop agentes (1).pdf'\n4. 'Proposta Parceria XYZ - Abril 2025.pdf'\n5. 'backup relatorio atlas 2024.pdf'",
    tools: [],
    expected_behavior:
      "O agente deve aplicar a convenção de nomenclatura a todos os 5 arquivos, gerando os novos nomes corretos.",
    expected_output:
      "Lista com os 5 novos nomes padronizados seguindo a convenção definida, com explicação de cada escolha.",
    evaluation_criteria: [
      "Todos os 5 arquivos renomeados",
      "Aplicação correta da convenção [tipo]_[area]_[descricao]_[AAAA-MM]",
      "Remoção de espaços e caracteres especiais",
      "Lowercase correto",
      "Preservação do sentido do nome original",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D07",
    agent: "drive",
    title: "Classificação em lote",
    description:
      "O agente deve classificar e organizar um lote de múltiplos arquivos de uma vez.",
    difficulty: "dificil",
    context:
      "O CIIA recebeu um lote de 8 arquivos de diferentes naturezas que precisam ser classificados e movidos para as pastas corretas.",
    input:
      "Classifique e organize os seguintes arquivos:\n1. nota_fiscal_servidor_aws_2025_03.pdf\n2. slides_apresentacao_tcc_membro_joao.pdf\n3. contrato_bolsa_pesquisa_maria_2025.pdf\n4. dataset_tweets_português_100k.csv\n5. ata_reuniao_projeto_atlas_sprint3.pdf\n6. logotipo_ciia_novo_horizontal.png\n7. artigo_llm_portugues_submetido_sbsi.pdf\n8. planilha_controle_presenca_capacitacao.xlsx",
    tools: ["list_folder", "move_file", "create_folder", "search_file"],
    expected_behavior:
      "O agente deve classificar cada arquivo, definir o destino correto e mover todos, registrando cada operação.",
    expected_output:
      "Lista completa com classificação de cada arquivo, destino definido, operações realizadas e registro de eventuais arquivos problemáticos.",
    evaluation_criteria: [
      "Classificação correta de todos os 8 arquivos",
      "Destinos adequados à estrutura do Drive",
      "Registro detalhado de cada operação",
      "Tratamento de casos ambíguos",
      "Ausência de erros de ferramenta",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D08",
    agent: "drive",
    title: "Utilização de ferramenta",
    description:
      "O agente deve demonstrar uso correto e eficiente de múltiplas ferramentas em sequência para completar uma tarefa complexa.",
    difficulty: "muito_dificil",
    context:
      "Esta tarefa avalia especificamente a capacidade do modelo de usar ferramentas em sequência lógica, verificar resultados intermediários e adaptar a estratégia.",
    input:
      "Tarefa complexa: Encontre todos os relatórios de sprint do Projeto Hermes do ano de 2024, verifique se estão na pasta correta, crie uma pasta de arquivo para 2024 se não existir, mova todos os sprints de 2024 para o arquivo e gere um índice dos documentos arquivados.",
    tools: ["search_file", "read_file", "list_folder", "move_file", "create_folder"],
    expected_behavior:
      "O agente deve executar a tarefa em múltiplas etapas: buscar, verificar, criar pasta se necessário, mover e gerar índice. Cada etapa deve verificar o resultado antes de prosseguir.",
    expected_output:
      "Relatório de execução com: arquivos encontrados, estrutura de arquivo criada, operações realizadas, índice dos documentos arquivados e confirmação de cada etapa.",
    evaluation_criteria: [
      "Sequência lógica de chamadas de ferramentas",
      "Verificação de resultados intermediários",
      "Criação correta da estrutura de arquivo",
      "Índice gerado com informações corretas",
      "Tratamento de casos de erro",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D09",
    agent: "drive",
    title: "Arquivo sem categoria",
    description:
      "O agente deve lidar com um arquivo que genuinamente não se encaixa em nenhuma categoria existente.",
    difficulty: "dificil",
    context:
      "Ocasionalmente o CIIA recebe arquivos que não pertencem claramente a nenhuma categoria existente. O agente deve decidir entre criar nova categoria ou usar uma miscellaneous.",
    input:
      'Arquivo: "ideias_random_possivel_projeto_futuro_ia_saude.txt"\nConteúdo: Arquivo de texto com ideias soltas sobre um possível projeto de IA na área de saúde. Não é um documento formal, não está relacionado a nenhum projeto ativo, mas pode ser relevante no futuro.\nNão existe categoria adequada no Drive atual.',
    tools: ["list_folder", "create_folder", "move_file", "search_file"],
    expected_behavior:
      "O agente deve reconhecer que o arquivo não se encaixa claramente, explorar opções, tomar uma decisão justificada e documentar o raciocínio.",
    expected_output:
      "Decisão sobre onde colocar o arquivo com justificativa clara, ação tomada, e possível sugestão de criar uma categoria de Ideias/Pipeline de Projetos.",
    evaluation_criteria: [
      "Reconhecimento da falta de categoria adequada",
      "Exploração das opções disponíveis",
      "Decisão justificada",
      "Sugestão construtiva para o futuro",
      "Não deixar o arquivo sem destino",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
  {
    id: "D10",
    agent: "drive",
    title: "Organização completa",
    description:
      "O agente deve realizar uma reorganização completa de uma pasta desorganizada, aplicando todas as boas práticas.",
    difficulty: "muito_dificil",
    context:
      "A pasta /CIIA/Inbox acumulou 15 arquivos misturados durante um mês. O agente deve organizar tudo aplicando: classificação, padronização de nomes, detecção de duplicatas e criação de estrutura adequada.",
    input:
      "Organize a pasta /CIIA/Inbox que contém:\n1. Ata reunião.pdf\n2. ata_reuniao_v2.pdf\n3. SPRINT6_ATLAS_FINAL.pdf\n4. material_capacitacao_nlp.pdf\n5. NF_AWS_Marco_2025.pdf\n6. NF_AWS_Marco_2025 (1).pdf\n7. foto_evento_hackathon.jpg\n8. post_instagram_draft.docx\n9. contrato_novo_membro.pdf\n10. dataset_v1.csv\n11. dataset_v2.csv\n12. ideias_novo_projeto.txt\n13. apresentacao_tcc.pdf\n14. logo_ciia.png\n15. backup_dados.zip",
    tools: ["list_folder", "search_file", "read_file", "move_file", "create_folder"],
    expected_behavior:
      "O agente deve processar todos os 15 arquivos, detectar duplicatas (itens 1/2 e 5/6), classificar cada um, padronizar nomes e executar todas as operações necessárias.",
    expected_output:
      "Relatório completo de reorganização: lista de duplicatas encontradas e ação tomada, classificação de cada arquivo, novos nomes padronizados, destinos definidos e confirmação de todas as operações.",
    evaluation_criteria: [
      "Detecção das 2 duplicatas (ata reunião e NF AWS)",
      "Classificação correta de todos os 15 arquivos",
      "Padronização de nomes aplicada",
      "Relatório completo e auditável",
      "Estrutura resultante lógica e organizada",
    ],
    prompt_version: "1.0",
    task_version: "1.0",
  },
];
