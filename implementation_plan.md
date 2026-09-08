# Estruturação e Padronização do Repositório para a Etapa 1 de IHC

Este plano detalha as alterações necessárias para adequar o repositório e a documentação do projeto aos rigorosos requisitos de avaliação apontados na verificação. O objetivo é criar a estrutura de arquivos pendentes, atualizar as configurações do MkDocs e padronizar tabelas, históricos e citações.

> [!IMPORTANT]
> **User Review Required**
> 
> 1. **Fotos dos Integrantes:** Preciso saber se vocês já possuem um link para a foto de cada um (por ex., foto do perfil do GitHub) para usar na página da Equipe. Posso usar as fotos do GitHub provisoriamente?
> 2. **Processo de Design:** Vocês já decidiram qual Processo de Design utilizarão (ex: Engenharia de Usabilidade de Mayhew, Ciclo de Vida em Estrela)?
> 3. **Vídeos e Gravações:** Vocês já possuem os links "não listados" no YouTube para a Reunião 1 e para a Apresentação da Etapa 1?

## Open Questions
- Como vocês preferem dividir as funções de **Autor** e **Revisor** dos artefatos? Eu posso pré-preencher com base no histórico atual (ex: Gustavo como autor e outro integrante como revisor), mas precisaremos revisar isso juntos.

---

## Proposed Changes

### Configuração do Site (MkDocs)

Adicionar configuração de acessibilidade (paleta de cores/contraste) e atualizar a estrutura de navegação para os novos documentos.

#### [MODIFY] [mkdocs.yml](file:///e:/IHC/2026.2-Grupo08/mkdocs.yml)
- Inclusão de `palette` para toggle de tema claro, escuro e alto contraste.
- Atualização da seção `nav` para abrigar a nova pasta `Planejamento`, `Conteúdo Teórico` e índice de `Atas`.

---

### Páginas Principais

Atualizar a formatação para atender aos requisitos de Introdução, Histórico de Versão e Tabela de Contribuição no início.

#### [MODIFY] [README.md](file:///e:/IHC/2026.2-Grupo08/README.md)
- Inserir Tabela de Contribuição padrão (todos os membros) no início.
- Padronizar Histórico de Versão.
- Adicionar Seção de Agradecimentos (IA Generativa).

#### [MODIFY] [docs/index.md](file:///e:/IHC/2026.2-Grupo08/docs/index.md)
- Mesmas atualizações do README.

---

### Artefatos de Planejamento

Criação dos artefatos faltantes, garantindo que todos contenham introdução, tabela de contribuição no início, histórico de versão com revisores, bibliografia e legendas nas tabelas/imagens.

#### [NEW] [docs/planejamento/equipe.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/equipe.md)
- Apresentação da equipe com foto e nome (sem matrícula).

#### [NEW] [docs/planejamento/cronograma-planejado.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/cronograma-planejado.md)
- Tabelas detalhadas por etapa, prevendo datas de início/fim, período de revisão pós-feedback, gravação de apresentação e autores/revisores esperados.

#### [NEW] [docs/planejamento/cronograma-executado.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/cronograma-executado.md)
- Tabela para acompanhamento real do cronograma.

#### [NEW] [docs/planejamento/sites-avaliados.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/sites-avaliados.md)
- Extração da matriz de decisão de sites da Ata 1 para este documento oficial, com chamadas e legendas adequadas.

#### [NEW] [docs/planejamento/site-selecionado.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/site-selecionado.md)
- Motivação e critérios específicos da escolha do Portal Domínio Público.

#### [NEW] [docs/planejamento/ferramentas.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/ferramentas.md)
- Lista das ferramentas que serão utilizadas (Figma, MkDocs, Miro, GitHub, etc.) com suas finalidades.

#### [NEW] [docs/planejamento/processo-de-design.md](file:///e:/IHC/2026.2-Grupo08/docs/planejamento/processo-de-design.md)
- Esqueleto para justificar a escolha do ciclo de vida, com placeholder para foto da referência bibliográfica.

---

### Atas e Registros

#### [NEW] [docs/atas/index.md](file:///e:/IHC/2026.2-Grupo08/docs/atas/index.md)
- Página de índice contendo as atas e acessos diretos às gravações em vídeo.

#### [MODIFY] [docs/atas/ata1.md](file:///e:/IHC/2026.2-Grupo08/docs/atas/ata1.md)
- Inclusão dos campos faltantes: Horário de Início/Fim, Participantes Presentes, Objetivo da Reunião e Tabela de Atividades Definidas.
- Atualização para o novo padrão de Tabela de Contribuição e Histórico de Versão.

---

### Conteúdo Teórico e Extras

#### [NEW] [docs/conteudo-teorico/index.md](file:///e:/IHC/2026.2-Grupo08/docs/conteudo-teorico/index.md)
- Espaço preparado para os integrantes publicarem itens teóricos da disciplina (com as respectivas fotos de fontes e referências).

---

## Verification Plan
1. Iniciar o servidor local `mkdocs serve` para verificar a navegação e opções de alto contraste.
2. Conferir se todos os links internos estão funcionando corretamente e se a renderização do markdown das tabelas (Contribuição, Histórico, Cronograma) está padronizada e legível.
