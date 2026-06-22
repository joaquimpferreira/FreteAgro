# 📋 Componentes shadcn/ui Disponíveis (Completo)

## Instalar qualquer componente:
```bash
npx shadcn@latest add <nome>
```

---

## 🎨 **Componentes de Formulário** (11)

| Componente | Descrição | Variantes |
|------------|-----------|-----------|
| **button** | Botão interativo | default, outline, ghost, destructive, secondary, link |
| **input** | Campo de texto | text, email, password, number |
| **textarea** | Texto multi-linha | - |
| **checkbox** | Caixa de seleção | - |
| **radio-group** | Botões de opção | - |
| **select** | Dropdown de seleção | - |
| **label** | Rótulo de campo | - |
| **switch** | Interruptor toggle | - |
| **slider** | Seletor de intervalo | - |
| **date-picker** | Seletor de data | - |
| **form** | React Hook Form wrapper | - |

**Instalar rápido:**
```bash
npx shadcn@latest add button input textarea checkbox label switch
```

---

## 🧭 **Layout & Navegação** (5)

| Componente | Descrição |
|------------|-----------|
| **tabs** | Navegação por abas |
| **accordion** | Painéis expansíveis |
| **sidebar** | Barra lateral retrátil |
| **breadcrumb** | Migalhas de navegação |
| **navigation-menu** | Menu de navegação avançado |

---

## 💬 **Feedback & Notificações** (7)

| Componente | Descrição | Variantes |
|------------|-----------|-----------|
| **badge** | Etiqueta de status | default, outline, secondary, destructive |
| **alert** | Mensagem de alerta | default, destructive |
| **alert-dialog** | Alerta confirmável | - |
| **progress** | Barra de progresso | - |
| **toast** | Notificação em toast | - |
| **tooltip** | Dica de ferramenta | - |
| **popover** | Conteúdo em popover | - |

---

## 📊 **Exibição de Dados** (5)

| Componente | Descrição |
|------------|-----------|
| **card** | Container de cartão |
| **table** | Tabela de dados |
| **carousel** | Carrossel de imagens |
| **avatar** | Imagem de perfil/avatar |
| **separator** | Linha divisória |

---

## 🪟 **Dialog & Modal** (5)

| Componente | Descrição |
|------------|-----------|
| **dialog** | Modal dialog |
| **sheet** | Painel lateral/drawer |
| **dropdown-menu** | Menu de contexto |
| **hover-card** | Cartão de preview rápido |
| **command** | Paleta de comandos / busca |

---

## 📈 **Avançado** (8)

| Componente | Descrição |
|------------|-----------|
| **code-block** | Exibição de código com syntax |
| **calendar** | Seletor de calendário |
| **chart-pie** | Gráfico de pizza (Recharts) |
| **chart-bar** | Gráfico de barras |
| **chart-line** | Gráfico de linhas |
| **chart-area** | Gráfico de área |
| **chart-composed** | Gráfico composto |
| **sonner** | Toast notifications (alternativa) |

---

## ✨ **Utilitários** (4)

| Componente | Descrição |
|------------|-----------|
| **skeleton** | Placeholder de carregamento |
| **spinner** | Indicador de carregamento |
| **kbd** | Estilo de tecla de teclado |
| **resizable** | Painel redimensionável |

---

## 🔧 **Exemplo de Uso Completo**

```tsx
// 1. Instalar componente
// npx shadcn@latest add button input

// 2. Importar e usar
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [email, setEmail] = React.useState('')

  return (
    <form className="space-y-4">
      <Input 
        type="email" 
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  )
}
```

---

## 📚 **Como Escolher Componentes**

### Para um Painel de Administração:
```bash
npx shadcn@latest add \
  button input select checkbox \
  table card badge progress \
  tabs dialog dropdown-menu
```

### Para um Formulário Complexo:
```bash
npx shadcn@latest add \
  form input textarea checkbox radio-group \
  select label button alert
```

### Para Dashboard com Gráficos:
```bash
npx shadcn@latest add \
  card badge progress \
  chart-line chart-bar chart-pie \
  table tabs
```

### Para App Mobile-First:
```bash
npx shadcn@latest add \
  button card sheet navigation-menu \
  breadcrumb tabs accordion
```

---

## 🎯 **Status do Projeto FreteAgro**

✅ **Configurado**: Radix UI + Design System  
✅ **CSS Variables**: Mapeadas para cores da marca (verde #16b84f)  
✅ **Dark Mode**: Sempre ativado  
✅ **TypeScript**: Todos os componentes tipados  

**Próximos passos**: `npx shadcn@latest add button` para começar!

---

## 📖 **Documentação Oficial**

- 📌 **UI Components**: https://ui.shadcn.com/
- 📌 **Radix UI Docs**: https://www.radix-ui.com/docs
- 📌 **shadcn CLI**: `npx shadcn@latest --help`
