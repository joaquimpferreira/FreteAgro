# Como publicar esta Wiki no GitHub

Esta pasta (`wiki/`) contém **todas as páginas do Wiki** prontas para copiar. Cada arquivo `.md` vira uma página no GitHub Wiki.

## Mapeamento arquivo → página

| Arquivo | Título da página no Wiki |
|---------|--------------------------|
| `Home.md` | **Home** (página inicial obrigatória) |
| `Requisitos.md` | Requisitos |
| `Gestão-do-Projeto.md` | Gestão do Projeto |
| `Análise-e-Projeto-do-Software.md` | Análise e Projeto do Software |
| `Testes-e-Qualidade.md` | Testes e Qualidade |
| `DevOps.md` | DevOps |
| `Conclusão.md` | Conclusão |
| `_Sidebar.md` | Barra lateral de navegação (especial) |
| `_Footer.md` | Rodapé de todas as páginas (especial) |

> No GitHub Wiki, **espaços no título viram hífens** na URL. Ao criar a página "Gestão do Projeto", o GitHub gera a URL `Gestão-do-Projeto` — que é exatamente o que os links internos usam.

## Opção A — Copiar e colar (mais simples)

1. No repositório do GitHub, abra a aba **Wiki** e clique em **Create the first page**.
2. Cole o conteúdo de `Home.md`, salve.
3. Clique em **New Page** e crie cada página usando **exatamente** o título da tabela acima; cole o conteúdo do arquivo correspondente.
4. Crie as páginas especiais `_Sidebar` e `_Footer` (com o underscore no nome) para navegação e rodapé.

## Opção B — Via Git (recomendado, mantém histórico)

O GitHub Wiki é um repositório Git próprio (`.wiki.git`):

```bash
git clone https://github.com/<usuario>/<repo>.wiki.git
cp wiki/*.md <repo>.wiki/
cd <repo>.wiki
git add .
git commit -m "docs: publica wiki do FreteAgro"
git push origin master
```

## Antes de publicar — ajustes pendentes

Procure por `⟨preencher⟩` e `🔧 Ação necessária` e complete:

- **Prints das telas** (Home): faça upload das imagens e ajuste os caminhos `img/...`.
- **Nomes dos integrantes e papéis** (Gestão do Projeto) — lembre de marcar **um PO**.
- **Figuras do Jira** (Gestão do Projeto): roadmap, burndown, quadro de sprint.
- **Cobertura da web** (Testes e Qualidade): rode `pnpm --filter fretagro-web test --coverage`.
- **Prints de deploy** (DevOps): Vercel e EAS.

> Os diagramas Mermaid já são renderizados nativamente pelo GitHub Wiki — nenhuma ação necessária para eles.
