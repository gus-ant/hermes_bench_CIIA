# HERMES-BENCH — Plataforma de Benchmark para Agentes de IA do CIIA

HERMES-BENCH é a plataforma de avaliação e benchmark reproduzível desenvolvida para analisar o desempenho de múltiplos modelos de inteligência artificial (LLMs) aplicados às tarefas e perfis reais dos agentes autônomos do projeto **HERMES** do **CIIA** (Centro de Inteligência Artificial).

---

## 1. Visão Geral e Objetivo

O sistema responde à pergunta central de engenharia e negócios:

> **"Qual modelo de IA apresenta o melhor desempenho para executar as tarefas reais dos agentes do HERMES considerando qualidade, custo, latência, confiabilidade e utilização de ferramentas?"**

A plataforma permite cadastrar modelos de linguagem (OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Google Gemini 1.5 Pro, Meta Llama 3, DeepSeek, etc.), executar suítes de tarefas padronizadas por agente, calcular pontuações multidimensionais e visualizar comparativos em um dashboard moderno.

---

## 2. Agentes Avaliados e Perfis

O HERMES-BENCH avalia os três agentes fundamentais do ecossistema HERMES:

### 1. Jo (Capacitação e Engajamento)
- **Perfil**: Tutor de aprendizagem interativo e socrático.
- **Foco**: Capacitação contínua de equipes, esclarecimento pedagógico de dúvidas e engajamento sem respostas diretas simplistas.
- **Diretórios de Origem**: `profiles/jo/` (`SOUL.md`, `config.yaml`).

### 2. Vini (Drive e Processamento de Dados)
- **Perfil**: Analista técnico de dados e integração de arquivos.
- **Foco**: Manipulação e consulta de dados no Google Drive, leitura e atualização de planilhas estruturadas.
- **Ferramentas**: Chamada de funções de plugins (`profiles/jo/plugins/google_drive/tools.py`).
- **Diretórios de Origem**: `profiles/vini/`.

### 3. Larissa (Comunicação e Disseminação)
- **Perfil**: Especialista em comunicação institucional e difusão do CIIA.
- **Foco**: Síntese de notícias, criação de relatórios, adequação ao tom de voz institucional e redação de comunicados.
- **Diretórios de Origem**: `profiles/larissa/`.

---

## 3. Métricas e Sistema de Pontuação

A pontuação global de cada modelo (0 a 100) é composta por uma média ponderada de 5 dimensões principais:

| Dimensão | Peso | Descrição |
| :--- | :---: | :--- |
| **Qualidade da Resposta** | **40%** | Precisão técnica, profundidade, tom institucional e alinhamento às diretrizes do `SOUL.md`. |
| **Uso de Ferramentas (Tool Call)** | **25%** | Assertividade na escolha da função, argumentos corretos e cumprimento do fluxo de chamadas. |
| **Confiabilidade & Resiliência** | **15%** | Ausência de alucinações, cumprimento do formato solicitado e taxa de conclusão sem erros. |
| **Latência** | **10%** | Desempenho de tempo total de execução e tempo para o primeiro token (TTFT). |
| **Custo e Eficiência** | **10%** | Custo financeiro por milhão de tokens de entrada e saída. |

---

## 4. Arquitetura do Sistema

```
hermes_bench_CIIA/
├── hermes-bench/             # Aplicação Next.js (Dashboard + API Core + Runner)
│   ├── app/                  # App Router do Next.js 16 (Páginas e API Routes)
│   │   ├── agents/           # Detalhes e métricas por agente
│   │   ├── api/              # Endpoints REST (benchmarks, runs, leaderboard, export)
│   │   ├── benchmark/        # Interface de inicialização de execuções
│   │   ├── compare/          # Comparador lado a lado entre modelos
│   │   ├── costs/            # Análise detalhada de custos e consumo
│   │   ├── errors/           # Registro e diagnóstico de falhas em execuções
│   │   ├── leaderboard/      # Ranking geral e filtrado dos modelos
│   │   └── runs/             # Detalhamento de cada run individual
│   ├── components/           # Componentes de interface e navegação
│   ├── data/                 # Definições de modelos, agentes e tarefas padronizadas
│   ├── lib/
│   │   ├── db/               # Conexão Mongoose e Schemas MongoDB
│   │   ├── evaluator/        # AutoEvaluator (LLM-as-a-Judge)
│   │   ├── runner/           # BenchmarkRunner (Executores Real e Mock)
│   │   └── scorer/           # Calculadora de pontuações ponderadas
│   └── scripts/              # Scripts auxiliares de população (seed)
├── hermes_fotos_agentes/     # Imagens dos avatares dos agentes
└── profiles/                 # Perfis institucionais e diretrizes (SOUL.md)
```

---

## 5. Módulos e Páginas do Dashboard

1. **Dashboard Principal (`/`)**: Visão consolidada com KPIs de execuções, modelos avaliados, taxa de sucesso, agentes e tabelas de líderes.
2. **Leaderboard (`/leaderboard`)**: Ranking comparativo completo com filtros por agente, tipo de tarefa e ordena de acordo com a dimensão desejada.
3. **Executar Benchmark (`/benchmark`)**: Painel interativo para selecionar o modelo, o agente alvo, a suíte de tarefas e o modo de execução (Real ou Mock).
4. **Detalhes das Execuções (`/runs` & `/runs/[id]`)**: Inspeção profunda de uma execução, incluindo prompt exato, resposta do modelo, log de tool calls, latência, consumo de tokens e pontuação por critério.
5. **Comparação Lado a Lado (`/compare`)**: Comparação direta entre 2 ou mais modelos sob o mesmo prompt e conjunto de avaliação.
6. **Análise de Custos (`/costs`)**: Gráficos e tabelas comparativas de custo ($/1M tokens) e eficiência econômica entre provedores.
7. **Diagnóstico de Erros (`/errors`)**: Histórico de falhas, exceções de API, estouramento de timeout e respostas fora do formato esperado.
8. **Exportação de Relatórios (`/api/export`)**: Download dos dados de avaliação nos formatos JSON e CSV.

---

## 6. Como Executar o Projeto

### Pré-requisitos

- **Node.js**: v18.17.0 ou superior
- **npm**: v9.0.0 ou superior
- **MongoDB**: Instância local (`mongodb://localhost:27017/hermes_bench`) ou URI remota (MongoDB Atlas).

### Passos de Instalação

1. Clone o repositório:
```bash
git clone https://github.com/gus-ant/hermes_bench_CIIA.git
cd hermes_bench_CIIA/hermes-bench
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo de ambiente `.env.local` na pasta `hermes-bench`:
```env
MONGODB_URI=mongodb://localhost:27017/hermes_bench
OPENAI_API_KEY=sua_chave_openai_aqui
ANTHROPIC_API_KEY=sua_chave_anthropic_aqui
GOOGLE_API_KEY=sua_chave_google_aqui
```

4. Popule o banco de dados com a massa de dados inicial (tarefas, modelos e execuções de demonstração):
```bash
npm run seed
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse a aplicação no seu navegador: `http://localhost:3000`

---

## 7. Scripts Disponíveis

Dentro do diretório `hermes-bench/`:

- `npm run dev`: Executa a aplicação em modo de desenvolvimento.
- `npm run build`: Compila a aplicação para produção.
- `npm start`: Inicia o servidor otimizado de produção.
- `npm run lint`: Executa a verificação estática do ESLint.
- `npm run seed`: Popula a base MongoDB com modelos, tarefas e suítes iniciais.
- `npm run cli`: Executa o CLI Runner standalone (ver seção 9).
- `npm run cli:mock`: Executa o CLI em modo Mock (sem API keys).
- `npm run cli:list`: Lista todos os modelos disponíveis.

---

## 8. Licença e Créditos

Desenvolvido para o **CIIA (Centro de Inteligência Artificial)** no âmbito do projeto **HERMES**. Todos os direitos reservados.

---

## 9. CLI Runner (Modo Terminal) ⚡

O **CLI Runner** é um executável standalone que roda o benchmark **sem servidor Next.js e sem MongoDB**. Ideal para uso em máquinas com recursos limitados, automações e CI/CD.

### Características

- **~50 MB de RAM** (vs ~2 GB do servidor Next.js + MongoDB)
- Persiste resultados em **SQLite** (`cli-results/results.db`)
- **Execução paralela** por modelo (mais rápido)
- Suporte a **LLM-as-a-Judge** real (`--judge-model`)
- Barra de progresso e leaderboard direto no terminal
- Exportação em **JSON** e **CSV**
- Graceful shutdown com `Ctrl+C`

### Instalação das dependências extras

```bash
cd hermes-bench
npm install
```

### Uso

```bash
# Modo Mock (sem chaves de API)
npm run cli:mock

# Modo Mock com agente e judge específicos
npm run cli -- --mock --agents capacitacao --judge-model deepseek-v3

# Modo Real com modelos específicos
npm run cli -- --models deepseek-v3,qwen-max --agents capacitacao --mode real --trials 2

# Modo Real — todos os modelos, todos os agentes
npm run cli -- --mode real

# Exportar resultados em CSV
npm run cli -- --mock --output csv

# Verbose (mostra cada run individualmente)
npm run cli -- --mock --verbose

# Listar modelos disponíveis
npm run cli:list

# Listar agentes disponíveis
npm run cli -- --list-agents

# Ajuda completa
npm run cli -- --help
```

### Configuração de Ambiente

Crie (ou edite) o arquivo `.env.local` em `hermes-bench/`:

```env
# Provedores Ocidentais
MONGODB_URI=mongodb://localhost:27017/hermes_bench
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
MISTRAL_API_KEY=...
TOGETHER_API_KEY=...
OPENROUTER_API_KEY=sk-or-...

# Provedores Chineses
DEEPSEEK_API_KEY=sk-...        # api.deepseek.com
SILICONFLOW_API_KEY=sk-...     # api.siliconflow.cn (Qwen-Max, Yi Lightning)
MOONSHOT_API_KEY=sk-...        # api.moonshot.cn (Kimi)
ZHIPU_API_KEY=...              # open.bigmodel.cn (GLM-4-Plus)
```

> Modelos sem chave configurada são ignorados automaticamente (não causam erro).

### Onde os resultados ficam

```
hermes-bench/
└── cli-results/
    ├── results.db           ← SQLite com todos os runs
    ├── bench-XXXX-...json   ← Exportação JSON (--output json)
    └── bench-XXXX-...csv    ← Exportação CSV (--output csv)
```

Use qualquer visualizador SQLite (ex: [DB Browser for SQLite](https://sqlitebrowser.org/)) para explorar `results.db`.

---

## 10. Modelos de IA Chineses

O HERMES-BENCH agora suporta nativamente os principais modelos de IA chineses:

| Modelo | Provedor | ID no CLI | Thinking Tags | Preço In/Out (/1M) |
|---|---|---|---|---|
| DeepSeek V3 | DeepSeek | `deepseek-v3` | — | \$0.27 / \$1.10 |
| DeepSeek R1 | DeepSeek | `deepseek-r1` | 🧠 Sim | \$0.55 / \$2.19 |
| Qwen-Max (72B) | SiliconFlow | `qwen-max` | — | \$0.40 / \$1.20 |
| Kimi 32K | Moonshot AI | `moonshot-v1-32k` | — | \$0.12 / \$0.12 |
| GLM-4-Plus | Zhipu AI | `glm-4-plus` | — | \$0.14 / \$0.14 |
| Yi Lightning | SiliconFlow | `yi-lightning` | — | \$0.14 / \$0.14 |

> 🧠 **Thinking Tags**: modelos como o DeepSeek-R1 retornam raciocínio interno entre tags `<think>...</think>`. O HERMES-BENCH remove essas tags automaticamente antes de avaliar a resposta final.

Todos usam a **API OpenAI-compatible** — basta configurar a chave no `.env.local`.
