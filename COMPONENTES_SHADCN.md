# Componentes shadcn/ui Disponíveis

Instale qualquer componente com:
```bash
npx shadcn@latest add <nome>
```

## Componentes de Formulário
- **button** — Botão interativo
- **input** — Campo de texto
- **textarea** — Campo de texto multi-linha  
- **checkbox** — Caixa de seleção
- **radio-group** — Botões de opção (radio)
- **select** — Dropdown de seleção
- **label** — Rótulo de formulário
- **switch** — Interruptor (toggle)
- **slider** — Seletor de intervalo
- **date-picker** — Seletor de data
- **form** — Integração com React Hook Form

## Componentes de Layout
- **tabs** — Navegação por abas
- **accordion** — Painéis expansíveis
- **sidebar** — Barra lateral retrátil
- **breadcrumb** — Migalhas de pão (navegação)
- **navigation-menu** — Menu de navegação complexo

## Componentes de Feedback
- **badge** — Etiqueta de status
- **alert** — Mensagem de alerta
- **alert-dialog** — Alerta confirmável
- **progress** — Barra de progresso
- **toast** — Notificação em toast
- **tooltip** — Dica de ferramenta
- **popover** — Conteúdo em popover

## Componentes de Exibição
- **card** — Container de cartão
- **table** — Tabela de dados
- **carousel** — Carrossel de imagens
- **avatar** — Imagem de perfil
- **separator** — Linha divisória

## Componentes de Dialog/Modal
- **dialog** — Modal dialog
- **sheet** — Painel lateral/drawer
- **dropdown-menu** — Menu de contexto
- **hover-card** — Cartão de preview rápido
- **command** — Paleta de comandos / busca

## Componentes Avançados
- **code-block** — Exibição de código
- **calendar** — Seletor de calendário
- **charts** — Integração com Recharts
  - `chart-pie` — Gráfico de pizza
  - `chart-line` — Gráfico de linhas
  - `chart-bar` — Gráfico de barras
  - E mais...

## Exemplo de Uso

```tsx
// 1. Instalar o componente
// npx shadcn@latest add button

// 2. Importar e usar
import { Button } from '@/components/ui/button'

export function MyComponent() {
  return (
    <Button variant="default">
      Clique aqui
    </Button>
  )
}
```

## Variantes Comuns

A maioria dos componentes shadcn suporta variantes (configuráveis):

- **button**:
  - `variant="default"` — Padrão (cor primária)
  - `variant="outline"` — Contorno
  - `variant="ghost"` — Fantasma (transparente)
  - `variant="destructive"` — Vermelho (ação destrutiva)

- **badge**:
  - `variant="default"`
  - `variant="outline"`
  - `variant="secondary"`

Ver componente instalado em `/components/ui` para todas as variantes.

---

**Status**: ✅ shadcn/ui configurado com Radix UI + design-system da FreteAgro  
**Dark Mode**: Sempre ativado  
**CSS Variables**: Mapeadas para tokens do design system
