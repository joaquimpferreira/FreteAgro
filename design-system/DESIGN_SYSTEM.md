# Design System — Rayna UI v1.0

Fonte Figma: [Rayna UI v1.0](https://www.figma.com/design/7nT1oJXd6OPArzemqVvhJB)  
Arquivos de tokens: [`tokens.ts`](./tokens.ts) · [`tokens.css`](./tokens.css)

---

## Índice

1. [Como usar](#como-usar)
2. [Cores](#cores)
   - [Primary](#primary-verde)
   - [Secondary](#secondary-azul)
   - [Success](#success)
   - [Warning](#warning)
   - [Error](#error)
   - [Grey](#grey)
   - [Shade](#shade)
   - [OfficeBrown](#officebrown)
3. [Dark Mode — Superfícies](#dark-mode--superfícies)
4. [Gradientes](#gradientes)
5. [Tipografia](#tipografia)
   - [Família e Pesos](#família-e-pesos)
   - [Escala de Tipos](#escala-de-tipos)
6. [Sombras e Efeitos](#sombras-e-efeitos)
7. [Glassmorphism e Blur](#glassmorphism-e-blur)
8. [Espaçamento](#espaçamento)
9. [Border Radius](#border-radius)
10. [Componentes](#componentes)
11. [Identidade Visual do Dashboard](#identidade-visual-do-dashboard)
12. [Classes CSS Utilitárias](#classes-css-utilitárias)

---

## Como usar

### TypeScript / JavaScript

```ts
import tokens, {
  colors,
  darkSurface,
  gradients,
  fontFamily,
  fontWeight,
  typeScale,
  shadows,
  blur,
  glass,
  spacing,
  borderRadius,
} from './design-system/tokens';

// Exemplos
const primary = colors.primary[400];       // '#16b84f'
const h1Size  = typeScale.h1.fontSize;     // 40
const shadow  = shadows.medium;            // string CSS pronto
const radius  = borderRadius.card;         // '10px'
```

### CSS Custom Properties

```css
/* No entry point da aplicação */
@import './design-system/tokens.css';

/* Uso direto */
.card {
  background: var(--color-white);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-small);
}

/* Dark mode — adicionar class="dark" no <html> ou em qualquer container */
<html class="dark">
```

---

## Cores

### Primary (Verde)

Cor de ação principal. Botões primários, links ativos, indicadores de status positivo.

| Token | CSS Variable | Hex | Amostra |
|---|---|---|---|
| `colors.primary[50]` | `--color-primary-50` | `#e8fff0` | ![](https://placehold.co/20x20/e8fff0/e8fff0) |
| `colors.primary[75]` | `--color-primary-75` | `#adffc9` | ![](https://placehold.co/20x20/adffc9/adffc9) |
| `colors.primary[100]` | `--color-primary-100` | `#6cffa0` | ![](https://placehold.co/20x20/6cffa0/6cffa0) |
| `colors.primary[200]` | `--color-primary-200` | `#1ef76a` | ![](https://placehold.co/20x20/1ef76a/1ef76a) |
| `colors.primary[300]` | `--color-primary-300` | `#1bde5f` | ![](https://placehold.co/20x20/1bde5f/1bde5f) |
| `colors.primary[400]` | `--color-primary-400` | `#16b84f` ★ base | ![](https://placehold.co/20x20/16b84f/16b84f) |
| `colors.primary[500]` | `--color-primary-500` | `#0e7833` | ![](https://placehold.co/20x20/0e7833/0e7833) |
| `colors.primary[600]` | `--color-primary-600` | `#0a6229` | ![](https://placehold.co/20x20/0a6229/0a6229) |
| `colors.primary[700]` | `--color-primary-700` | `#0a4d21` | ![](https://placehold.co/20x20/0a4d21/0a4d21) |
| `colors.primary[800]` | `--color-primary-800` | `#073818` | ![](https://placehold.co/20x20/073818/073818) |
| `colors.primary[900]` | `--color-primary-900` | `#021d0b` | ![](https://placehold.co/20x20/021d0b/021d0b) |

```css
/* Exemplos de uso */
.btn-primary     { background: var(--color-primary-400); }
.badge-success   { background: var(--color-primary-50); color: var(--color-primary-600); }
.accent-bar      { background: var(--color-primary-400); }
```

---

### Secondary (Azul)

Informativo, links secundários, badges de status informacional.

| Token | CSS Variable | Hex |
|---|---|---|
| `colors.secondary[50]` | `--color-secondary-50` | `#e3effc` |
| `colors.secondary[75]` | `--color-secondary-75` | `#c6ddf7` |
| `colors.secondary[100]` | `--color-secondary-100` | `#b6d8ff` |
| `colors.secondary[200]` | `--color-secondary-200` | `#80bbff` |
| `colors.secondary[300]` | `--color-secondary-300` | `#3d89df` |
| `colors.secondary[400]` | `--color-secondary-400` | `#1671d9` ★ base |
| `colors.secondary[500]` | `--color-secondary-500` | `#0d5eba` |
| `colors.secondary[600]` | `--color-secondary-600` | `#034592` |
| `colors.secondary[700]` | `--color-secondary-700` | `#04326b` |
| `colors.secondary[800]` | `--color-secondary-800` | `#012657` |
| `colors.secondary[900]` | `--color-secondary-900` | `#001633` |

---

### Success

Estados de confirmação, operações concluídas, indicadores positivos.

| Token | CSS Variable | Hex |
|---|---|---|
| `colors.success[50]` | `--color-success-50` | `#e7f6ec` |
| `colors.success[75]` | `--color-success-75` | `#b5e3c4` |
| `colors.success[100]` | `--color-success-100` | `#91d6a8` |
| `colors.success[200]` | `--color-success-200` | `#5fc381` |
| `colors.success[300]` | `--color-success-300` | `#40b869` |
| `colors.success[400]` | `--color-success-400` | `#0f973d` ★ base |
| `colors.success[500]` | `--color-success-500` | `#099137` |
| `colors.success[600]` | `--color-success-600` | `#04802e` |
| `colors.success[700]` | `--color-success-700` | `#036b26` |
| `colors.success[800]` | `--color-success-800` | `#015b20` |
| `colors.success[900]` | `--color-success-900` | `#004617` |

---

### Warning

Alertas, ações pendentes, atenção necessária.

| Token | CSS Variable | Hex |
|---|---|---|
| `colors.warning[50]` | `--color-warning-50` | `#fef6e7` |
| `colors.warning[75]` | `--color-warning-75` | `#fbe2b7` |
| `colors.warning[100]` | `--color-warning-100` | `#f7d394` |
| `colors.warning[200]` | `--color-warning-200` | `#f7c164` |
| `colors.warning[300]` | `--color-warning-300` | `#f5b546` |
| `colors.warning[400]` | `--color-warning-400` | `#f3a218` |
| `colors.warning[500]` | `--color-warning-500` | `#dd900d` |
| `colors.warning[600]` | `--color-warning-600` | `#ad6f07` |
| `colors.warning[700]` | `--color-warning-700` | `#865503` |
| `colors.warning[800]` | `--color-warning-800` | `#664101` |
| `colors.warning[900]` | `--color-warning-900` | `#523300` |

---

### Error

Erros, ações destrutivas, estados inválidos.

| Token | CSS Variable | Hex |
|---|---|---|
| `colors.error[50]` | `--color-error-50` | `#fbeae9` |
| `colors.error[75]` | `--color-error-75` | `#f2bcba` |
| `colors.error[100]` | `--color-error-100` | `#eb9b98` |
| `colors.error[200]` | `--color-error-200` | `#e26e6a` |
| `colors.error[300]` | `--color-error-300` | `#dd524d` |
| `colors.error[400]` | `--color-error-400` | `#d42620` ★ base |
| `colors.error[500]` | `--color-error-500` | `#cb1a14` |
| `colors.error[600]` | `--color-error-600` | `#ba110b` |
| `colors.error[700]` | `--color-error-700` | `#9e0a05` |
| `colors.error[800]` | `--color-error-800` | `#800501` |
| `colors.error[900]` | `--color-error-900` | `#591000` |

---

### Grey

Paleta neutra — textos, bordas, backgrounds, divisores.

| Token | CSS Variable | Hex | Uso típico |
|---|---|---|---|
| `colors.grey[50]` | `--color-grey-50` | `#f9fafb` | Page background (light) |
| `colors.grey[75]` | `--color-grey-75` | `#f7f9fc` | Surface alternada |
| `colors.grey[100]` | `--color-grey-100` | `#f0f2f5` | Input background, hover |
| `colors.grey[200]` | `--color-grey-200` | `#e4e7ec` | Borda padrão, divider |
| `colors.grey[300]` | `--color-grey-300` | `#d0d5dd` | Borda enfatizada |
| `colors.grey[400]` | `--color-grey-400` | `#98a2b3` | Placeholder, ícone inativo |
| `colors.grey[500]` | `--color-grey-500` | `#667185` | Texto secundário |
| `colors.grey[600]` | `--color-grey-600` | `#475367` | Texto auxiliar |
| `colors.grey[700]` | `--color-grey-700` | `#344054` | Texto de suporte |
| `colors.grey[800]` | `--color-grey-800` | `#1d2739` | Dark nav card, surface elevado |
| `colors.grey[900]` | `--color-grey-900` | `#101928` | Sidebar, header dark, texto principal |

---

### Shade

| Token | CSS Variable | Hex | Uso |
|---|---|---|---|
| `colors.shade.white` | `--color-white` | `#ffffff` | Superfícies, cards light |
| `colors.shade.black` | `--color-black` | `#000000` | Texto em fundos claros |
| `colors.shade.background500` | `--color-background-500` | `#121212` | Background dark médio |
| `colors.shade.background900` | `--color-background-900` | `#0b0b08` | Background dark profundo |

---

### OfficeBrown

Acento neutro quente, usado em avatares e elementos decorativos.

| Token | CSS Variable | Hex |
|---|---|---|
| `colors.officeBrown[50]` | `--color-office-brown-50` | `#fbf1f1` |
| `colors.officeBrown[100]` | `--color-office-brown-100` | `#e4dbdb` |
| `colors.officeBrown[200]` | `--color-office-brown-200` | `#cdc4c4` |
| `colors.officeBrown[300]` | `--color-office-brown-300` | `#b7afaf` |
| `colors.officeBrown[400]` | `--color-office-brown-400` | `#a29999` |
| `colors.officeBrown[500]` | `--color-office-brown-500` | `#8d8484` |
| `colors.officeBrown[600]` | `--color-office-brown-600` | `#787070` |
| `colors.officeBrown[700]` | `--color-office-brown-700` | `#645d5d` |
| `colors.officeBrown[800]` | `--color-office-brown-800` | `#514a4a` |
| `colors.officeBrown[900]` | `--color-office-brown-900` | `#3e3838` |

---

## Dark Mode — Superfícies

Tokens semânticos extraídos diretamente dos templates **Fintech** e **Solar** do Figma.  
Aplicados como variáveis CSS através da classe `.dark` no elemento raiz.

### Hierarquia de superfícies

```
page (mais escuro)
 └── nav card
      └── card
           └── cardBase (mais profundo)
```

| Token TS | CSS Variable | Valor dark | Valor light | Onde usar |
|---|---|---|---|---|
| `darkSurface.page` | `--surface-page` | `#101928` | `#f9fafb` | Sidebar, header, page bg |
| `darkSurface.nav` | `--surface-nav` | `#1d2739` | `#f0f2f5` | Nav featured card |
| `darkSurface.card` | `--surface-card` | `#232323` | `#ffffff` | Cards elevados |
| `darkSurface.cardBase` | `--surface-base` | `#040404` | `#f0f2f5` | Balance card, feature card |
| `darkSurface.overlay` | — | `rgba(0,0,0,0.20)` | — | Overlay de profundidade |
| `darkSurface.texture` | — | `#0c0b0b` | — | Camada SOFT_LIGHT (glassmorphism) |
| `darkSurface.canvas` | `--surface-canvas` | `#1d2739` | `#ffffff` | Painel de conteúdo interno |

### Tokens semânticos de texto e borda

| CSS Variable | Valor light | Valor dark |
|---|---|---|
| `--text-primary` | `#101928` | `#ffffff` |
| `--text-secondary` | `#475367` | `#98a2b3` |
| `--text-muted` | `#98a2b3` | `#667185` |
| `--text-inverse` | `#ffffff` | `#101928` |
| `--border-default` | `#e4e7ec` | `rgba(255,255,255,0.10)` |
| `--border-subtle` | `#f0f2f5` | `rgba(255,255,255,0.06)` |

### Exemplo de uso

```tsx
// React + Tailwind (ou className manual)
<html className="dark">
  <body style={{ background: 'var(--surface-page)', color: 'var(--text-primary)' }}>
    <aside className="dashboard-sidebar">…</aside>
    <main>
      <div className="dashboard-card">…</div>
      <div className="dashboard-balance-card">…</div>
    </main>
  </body>
</html>
```

---

## Gradientes

Extraídos dos templates Fintech e Solar do Figma.

| Token | CSS Variable | Valor | Uso |
|---|---|---|---|
| `gradients.brandBlue` | `--gradient-brand-blue` | `linear-gradient(135deg, rgba(15,22,36,0) 0%, #0640b5 100%)` | Feature card hero (Solar Sales) |
| `gradients.brandGreen` | `--gradient-brand-green` | `linear-gradient(135deg, #e8fff0 0%, #16b84f 100%)` | Banner CTA, destaque primário |
| `gradients.darkCard` | `--gradient-dark-card` | `linear-gradient(180deg, #232323 0%, #040404 100%)` | Balance card, card escuro profundo |

```css
/* Exemplos */
.feature-hero   { background: var(--gradient-brand-blue); }
.cta-banner     { background: var(--gradient-brand-green); }
.balance-card   { background: var(--gradient-dark-card); }
```

---

## Tipografia

### Família e Pesos

| Token TS | CSS Variable | Valor |
|---|---|---|
| `fontFamily.sans` | `--font-family-sans` | `'Inter', system-ui, -apple-system, sans-serif` |
| `fontWeight.regular` | `--font-weight-regular` | `400` |
| `fontWeight.medium` | `--font-weight-medium` | `500` |
| `fontWeight.semibold` | `--font-weight-semibold` | `600` |
| `fontWeight.bold` | `--font-weight-bold` | `700` |

> **Fonte:** Inter. Variantes disponíveis no Figma: Regular, Medium, Semi Bold, Bold, Italic.

---

### Escala de Tipos

#### Display

Textos heroicos, usados em landing pages e cabeçalhos de seção amplos.

| Token | Classe CSS | Tamanho | Line-height | Letter-spacing | Peso sugerido |
|---|---|---|---|---|---|
| `typeScale.displayLarge` | `.display-large` | 56px | 1.0 (100%) | −0.04em | Semibold / Bold |
| `typeScale.displaySmall` | `.display-small` | 48px | 1.0 (100%) | −0.04em | Semibold / Bold |

```css
--font-size-display-large:      56px;
--line-height-display-large:    1;
--letter-spacing-display-large: -0.04em;

--font-size-display-small:      48px;
--line-height-display-small:    1;
--letter-spacing-display-small: -0.04em;
```

---

#### Headings

| Token | Classe CSS | Tamanho | Line-height | Letter-spacing |
|---|---|---|---|---|
| `typeScale.h1` | `.heading-h1` | 40px | 1.2 (120%) | −0.04em |
| `typeScale.h2` | `.heading-h2` | 36px | 1.2 (120%) | −0.04em |
| `typeScale.h3` | `.heading-h3` | 32px | 1.2 (120%) | −0.02em |
| `typeScale.h4` | `.heading-h4` | 28px | 1.2 (120%) | −0.02em |
| `typeScale.h5` | `.heading-h5` | 24px | 1.2 (120%) | −0.02em |
| `typeScale.h6` | `.heading-h6` | 20px | 1.2 (120%) | −0.02em |

```css
--font-size-h1: 40px;  --line-height-h1: 1.2;  --letter-spacing-h1: -0.04em;
--font-size-h2: 36px;  --line-height-h2: 1.2;  --letter-spacing-h2: -0.04em;
--font-size-h3: 32px;  --line-height-h3: 1.2;  --letter-spacing-h3: -0.02em;
--font-size-h4: 28px;  --line-height-h4: 1.2;  --letter-spacing-h4: -0.02em;
--font-size-h5: 24px;  --line-height-h5: 1.2;  --letter-spacing-h5: -0.02em;
--font-size-h6: 20px;  --line-height-h6: 1.2;  --letter-spacing-h6: -0.02em;
```

---

#### Paragraph (Body)

Texto de conteúdo geral. Disponível em variantes Regular, Medium, Semibold, Underline, Strikethrough, Italic.

| Token | Tamanho | Line-height | Letter-spacing |
|---|---|---|---|
| `typeScale.paragraphLarge` | 18px | 1.45 (145%) | 0 |
| `typeScale.paragraphMedium` | 16px | 1.45 (145%) | 0 |
| `typeScale.paragraphSmall` | 14px | 1.45 (145%) | 0 |
| `typeScale.paragraphXSmall` | 12px | 1.45 (145%) | 0 |

```css
--font-size-paragraph-large:   18px;  --line-height-paragraph-large:   1.45;
--font-size-paragraph-medium:  16px;  --line-height-paragraph-medium:  1.45;
--font-size-paragraph-small:   14px;  --line-height-paragraph-small:   1.45;
--font-size-paragraph-xsmall:  12px;  --line-height-paragraph-xsmall:  1.45;
```

---

#### Caption / Overline

Labels em maiúsculas com tracking largo — etiquetas de seção, rótulos de formulário, badges de status.

| Token | Classe CSS | Tamanho | Line-height | Letter-spacing | Peso |
|---|---|---|---|---|---|
| `typeScale.captionLarge` | `.caption-large` | 14px | 1.2 (120%) | 0.12em | Semibold |
| `typeScale.captionSmall` | `.caption-small` | 12px | 1.2 (120%) | 0.12em | Semibold |
| `typeScale.captionXSmall` | `.caption-xsmall` | 10px | 1.2 (120%) | 0.16em | Semibold |

```css
--font-size-caption-large:       14px;   --letter-spacing-caption-large:   0.12em;
--font-size-caption-small:       12px;   --letter-spacing-caption-small:   0.12em;
--font-size-caption-xsmall:      10px;   --letter-spacing-caption-xsmall:  0.16em;
```

> Todas as classes `.caption-*` aplicam `text-transform: uppercase` automaticamente.

---

## Sombras e Efeitos

### Elevação (box-shadow)

Sistema de sombras em duas camadas para profundidade realista. Usar o token CSS diretamente no `box-shadow`.

| Token TS | CSS Variable | Valor CSS | Uso típico |
|---|---|---|---|
| `shadows.softXXSmall` | `--shadow-soft-xxsmall` | `0 1.5px 4px -1px rgba(16,25,40,0.07)` | Cards em repouso, inputs |
| `shadows.xsmall` | `--shadow-xsmall` | dual layer sutil | Hover de botão |
| `shadows.small` | `--shadow-small` | dual layer leve | Dropdowns, tooltips |
| `shadows.medium` | `--shadow-medium` | dual layer médio | Modais, popovers |
| `shadows.large` | `--shadow-large` | dual layer amplo | Drawers, painéis |
| `shadows.xlarge` | `--shadow-xlarge` | dual layer profundo | Overlays full-screen |
| `shadows.xxlarge` | `--shadow-xxlarge` | dual layer máximo | Sobreposições críticas |

```css
--shadow-soft-xxsmall: 0 1.5px 4px -1px rgba(16,25,40,0.07);

--shadow-xsmall:
  0 5px 3px -2px rgba(0,0,0,0.02),
  0 3px 2px -2px rgba(0,0,0,0.06);

--shadow-small:
  0 2px 4px -2px rgba(0,0,0,0.04),
  0 4px 8px -2px rgba(0,0,0,0.08);

--shadow-medium:
  0 4px 6px -2px rgba(0,0,0,0.06),
  0 12px 16px -4px rgba(0,0,0,0.10);

--shadow-large:
  0 8px 8px -4px rgba(0,0,0,0.04),
  0 20px 24px -4px rgba(0,0,0,0.10);

--shadow-xlarge:
  0 8px 10px -6px rgba(16,24,40,0.10),
  0 20px 25px -5px rgba(16,24,40,0.10);

--shadow-xxlarge:
  0 12px 16px -6px rgba(16,24,40,0.10),
  0 24px 48px -12px rgba(16,24,40,0.18);
```

---

### Focus Rings (Acessibilidade)

| Token TS | CSS Variable | Valor CSS | Uso |
|---|---|---|---|
| `shadows.focus` | `--shadow-focus` | `0 0 0 4px #3069fe, 0 0 0 2px #ffffff` | Foco de teclado (azul) |
| `shadows.focusHover` | `--shadow-focus-hover` | anel cinza + sombra | Hover em campos |
| `shadows.focusLine` | `--shadow-focus-line` | `0 0 0 4px #fbf1f1` | Anel em estado de erro |
| `shadows.outlineWhite2px` | `--shadow-outline-white-2px` | `0 0 0 2px #ffffff` | Stacking de avatares |

---

### Sombras para Dark Mode

| Token TS | CSS Variable | Uso |
|---|---|---|
| `shadows.darkCardMedium` | `--shadow-medium` | Cards flutuando sobre bg escuro |
| `shadows.darkNavCard` | — | Card de navegação no sidebar escuro |

---

## Glassmorphism e Blur

### Escala de Blur

| Token TS | CSS Variable | Valor | Uso |
|---|---|---|---|
| `blur.sm` | `--blur-sm` | `8px` | Nav bars, top headers |
| `blur.md` | `--blur-md` | `16px` | Cards, modais sobre dark bg |
| `blur.lg` | `--blur-lg` | `32px` | Painéis de overlay |
| `blur.xl` | `--blur-xl` | `48px` | Sidebar frosted glass |

---

### Presets de Glassmorphism

O efeito glass do dashboard é obtido por duas técnicas combinadas:
1. **Camada SOFT_LIGHT** — pseudo-elemento com `mix-blend-mode: soft-light` e cor `#0c0b0b`, criando textura de vidro sem `backdrop-filter`.
2. **`backdrop-filter: blur()`** — opcional para suporte nativo em navegadores modernos.

#### Glass Dark — `.glass-dark`

Para cards escuros sobre fundos escuros (balance card, feature cards).

```css
.glass-dark {
  background: rgba(35, 35, 35, 0.72);
  backdrop-filter: blur(16px);           /* --blur-md */
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-card);     /* 10px */
}

/* Camada de textura SOFT_LIGHT (replica Figma) */
.glass-dark::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #0c0b0b;
  mix-blend-mode: soft-light;
  border-radius: inherit;
  pointer-events: none;
}
```

#### Glass Light — `.glass-light`

Para cards em modo claro ou sobre imagens.

```css
.glass-light {
  background: rgba(255, 255, 255, 0.64);
  backdrop-filter: blur(8px);            /* --blur-sm */
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-card);
}
```

#### Glass Sidebar — `.glass-sidebar`

Para painéis flutuantes sobre o sidebar escuro.

```css
.glass-sidebar {
  background: rgba(29, 39, 57, 0.90);   /* grey-800 @ 90% */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);       /* 8px */
}
```

#### Presets TypeScript

```ts
import { glass, blur } from './design-system/tokens';

// glass.dark.background     → 'rgba(35, 35, 35, 0.72)'
// glass.dark.backdropFilter → 'blur(16px)'
// glass.dark.border         → '1px solid rgba(255, 255, 255, 0.08)'

// glass.light.background    → 'rgba(255, 255, 255, 0.64)'
// glass.sidebar.background  → 'rgba(29, 39, 57, 0.90)'
```

---

## Espaçamento

Grade de **4px**. Chave = múltiplo → `spacing[2]` = 8px, `spacing[4]` = 16px.

| Token TS | CSS Variable | Valor |
|---|---|---|
| `spacing[0]` | `--spacing-0` | `0px` |
| `spacing[0.5]` | `--spacing-0-5` | `2px` |
| `spacing[1]` | `--spacing-1` | `4px` |
| `spacing[1.5]` | `--spacing-1-5` | `6px` |
| `spacing[2]` | `--spacing-2` | `8px` |
| `spacing[2.5]` | `--spacing-2-5` | `10px` |
| `spacing[3]` | `--spacing-3` | `12px` |
| `spacing[3.5]` | `--spacing-3-5` | `14px` |
| `spacing[4]` | `--spacing-4` | `16px` |
| `spacing[5]` | `--spacing-5` | `20px` |
| `spacing[6]` | `--spacing-6` | `24px` |
| `spacing[7]` | `--spacing-7` | `28px` |
| `spacing[8]` | `--spacing-8` | `32px` |
| `spacing[9]` | `--spacing-9` | `36px` |
| `spacing[10]` | `--spacing-10` | `40px` |
| `spacing[11]` | `--spacing-11` | `44px` |
| `spacing[12]` | `--spacing-12` | `48px` |
| `spacing[14]` | `--spacing-14` | `56px` |
| `spacing[16]` | `--spacing-16` | `64px` |
| `spacing[20]` | `--spacing-20` | `80px` |
| `spacing[24]` | `--spacing-24` | `96px` |
| `spacing[28]` | `--spacing-28` | `112px` |
| `spacing[32]` | `--spacing-32` | `128px` |

---

## Border Radius

| Token TS | CSS Variable | Valor | Uso no Dashboard |
|---|---|---|---|
| `borderRadius.none` | `--radius-none` | `0px` | Sem arredondamento |
| `borderRadius.xs` | `--radius-xs` | `2px` | Tags micro, chips pequenos |
| `borderRadius.sm` | `--radius-sm` | `4px` | Badges, nav items, nav sidebar |
| `borderRadius.md` | `--radius-md` | `6px` | Botões secundários |
| `borderRadius.lg` | `--radius-lg` | `8px` | Botões primários, nav featured card |
| `borderRadius.card` | `--radius-card` | `10px` | ★ Cards do dashboard (balance, stat, tabela) |
| `borderRadius.xl` | `--radius-xl` | `12px` | Inputs, dropdowns |
| `borderRadius['2xl']` | `--radius-2xl` | `16px` | Modais pequenos |
| `borderRadius['3xl']` | `--radius-3xl` | `24px` | ★ Painel de conteúdo interno (canvas) |
| `borderRadius['4xl']` | `--radius-4xl` | `28px` | ★ Frame da tela (Solar/Fintech page clip) |
| `borderRadius.full` | `--radius-full` | `9999px` | Avatares, pills, botões redondos |

> Os três tokens marcados com ★ são específicos da identidade dos dashboards no Figma.

---

## Componentes

Lista completa de componentes do Rayna UI v1.0, organizados por nível atômico.

### Foundations

| Componente |
|---|
| Colors |
| Typography |
| Icons |
| Shadows & Blurs |
| Spacing & Grids |

### Atoms

| Componente | Descrição |
|---|---|
| Avatars | Imagens de perfil em tamanhos variados, com stacking e badge de status |
| Badges | Labels de status e contagem com variantes de cor |
| Buttons | Primário, secundário, ghost, destructive — com e sem ícone |
| Button Groups | Agrupamento de ações relacionadas |
| Chips | Tags selecionáveis e filtros removíveis |
| Empty States | Ilustrações e CTAs para estados vazios |
| Inputs | Text, password, search, textarea com labels e mensagens de erro |
| Loading & Progress Indicators | Spinner, skeleton, progress bar, step progress |
| Tabs | Navegação por abas — underline e contained |

### Application Components

| Componente | Descrição |
|---|---|
| Activity Feed | Lista de eventos cronológicos com avatares e timestamps |
| Alerts & Notification | Banners e toasts de info, sucesso, aviso e erro |
| Breadcrumbs | Trilha de navegação hierárquica |
| Calendar & Date Selectors | Seletor de data single e range, input de data |
| Charts | Gráficos de linha, barra, donut e área |
| Code Snippets | Bloco de código com syntax highlight e botão de cópia |
| Dividers | Separadores horizontais e verticais, com e sem label |
| Dropdowns | Select, menu contextual, multi-select |
| File Upload | Drag-and-drop, seleção de arquivo, lista de upload |
| Footers | Rodapé simples e completo |
| Form Controls | Checkbox, radio, toggle, switch, rating |
| Headers | Barra de navegação superior com busca e ações |
| Messaging | Balões de chat, input de mensagem, lista de conversas |
| Media | Galeria de imagens, player de vídeo |
| Metrics | Cards de KPI, stat cards com variação (positiva/negativa) |
| Navigation | Sidebar, top nav, bottom nav mobile |
| Pagination | Paginação numérica e de próximo/anterior |
| Sidebars | Sidebar colapsável com seções e itens de menu |
| Stepper | Indicador de etapas em formulários multi-passo |
| Tables | Tabela com sort, filtro, paginação e seleção de linhas |
| Tooltip | Dica de contexto em hover, com posicionamento automático |

### Templates de Aplicação

| Template | Descrição |
|---|---|
| Authentication | Login, cadastro, recuperação de senha |
| Telehealth | Dashboard de saúde, agendamentos, consultas |
| Ecommerce | Loja, produto, carrinho, checkout |
| Marketing | Landing page, pricing, blog |

---

## Identidade Visual do Dashboard

Padrões visuais identificados nos templates **Fintech** e **Solar** do Figma, que definem a identidade do dashboard.

### Paleta de Superfícies Dark

```
Página / Sidebar      #101928   (grey-900)
Nav card sidebar      #1d2739   (grey-800)
Card elevado          #232323   + overlay rgba(0,0,0,0.20)
Balance card base     #040404   (near-black)
Textura SOFT_LIGHT    #0c0b0b   (mix-blend-mode: soft-light)
Canvas interno        #fdfdfd   (near-white, radius 24px)
```

### Accent Bar

Linha de 4px na cor primária (`#16b84f`) no topo do header, separando o sidebar do conteúdo.

```css
.accent-bar {
  height: 4px;
  background: var(--color-primary-400); /* #16b84f */
  width: 100%;
}
```

### Estrutura de Tela

```
┌─────────────────────────────────────────────────────────────┐  border-radius: 28px (--radius-4xl)
│  ┌───────────┐  ┌──────────────────────────────────────────┐│
│  │  Sidebar  │  │  Header + accent bar (#16b84f, 4px)      ││
│  │ #101928   │  │  ─────────────────────────────────────── ││
│  │           │  │                                          ││
│  │ Nav card  │  │  ┌──────────┐  ┌──────────┐  ┌────────┐ ││
│  │ #1d2739   │  │  │  Card    │  │  Card    │  │ Card   │ ││
│  │ r: 8px    │  │  │ #ffffff  │  │ #ffffff  │  │#232323 │ ││
│  │           │  │  │ r: 10px  │  │ r: 10px  │  │r: 10px │ ││  ← balance card
│  │           │  │  └──────────┘  └──────────┘  └────────┘ ││
│  │           │  │                                          ││
│  └───────────┘  └──────────────────────────────────────────┘│
│                  Canvas interno: #fdfdfd, r: 24px            │
└─────────────────────────────────────────────────────────────┘
```

### Gradiente de Feature Card

Usado nos cards hero (Solar Sales, Fintech):

```
rgba(15,22,36, 0)  →  #0640b5
    dark/transparent        brand blue
         0%                   100%   (135deg)
```

---

## Classes CSS Utilitárias

Todas disponíveis via `@import './design-system/tokens.css'`.

### Tipografia

| Classe | Aplicação |
|---|---|
| `.display-large` | Display 56px, lh 1.0, ls −0.04em |
| `.display-small` | Display 48px, lh 1.0, ls −0.04em |
| `.heading-h1` | H1 40px, lh 1.2, ls −0.04em |
| `.heading-h2` | H2 36px, lh 1.2, ls −0.04em |
| `.heading-h3` | H3 32px, lh 1.2, ls −0.02em |
| `.heading-h4` | H4 28px, lh 1.2, ls −0.02em |
| `.heading-h5` | H5 24px, lh 1.2, ls −0.02em |
| `.heading-h6` | H6 20px, lh 1.2, ls −0.02em |
| `.paragraph-large` | Body 18px, lh 1.45 |
| `.paragraph-medium` | Body 16px, lh 1.45 |
| `.paragraph-small` | Body 14px, lh 1.45 |
| `.paragraph-xsmall` | Body 12px, lh 1.45 |
| `.caption-large` | Caption 14px, semibold, ls 0.12em, uppercase |
| `.caption-small` | Caption 12px, semibold, ls 0.12em, uppercase |
| `.caption-xsmall` | Caption 10px, semibold, ls 0.16em, uppercase |

### Glassmorphism

| Classe | Descrição |
|---|---|
| `.glass-dark` | Card escuro com blur + textura SOFT_LIGHT. Requer `position: relative; overflow: hidden` |
| `.glass-light` | Card claro com blur e borda branca translúcida |
| `.glass-sidebar` | Painel no sidebar escuro, blur suave |

### Layout do Dashboard

| Classe | Descrição |
|---|---|
| `.dashboard-screen` | Container raiz — `border-radius: 28px`, `overflow: hidden`, bg `--surface-page` |
| `.dashboard-sidebar` | Sidebar — bg `--color-grey-900`, cor `white` |
| `.dashboard-nav-card` | Card nav no sidebar — bg `grey-800`, radius `8px`, shadow medium |
| `.dashboard-card` | Card padrão — bg `--surface-card`, radius `10px`, borda `--border-subtle` |
| `.dashboard-balance-card` | Card feature escuro — gradient dark, radius `10px`, textura SOFT_LIGHT |
| `.dashboard-feature-gradient-card` | Card hero gradiente azul — bg `--gradient-brand-blue` |
| `.dashboard-panel` | Painel de conteúdo — bg `--surface-canvas`, radius `24px` |
| `.accent-bar` | Linha verde `4px` — `background: --color-primary-400` |

### Modo escuro

```html
<!-- Ativar globalmente -->
<html class="dark">

<!-- Ativar por seção -->
<section class="dark" style="padding: 24px;">
  <div class="dashboard-card">…</div>
</section>
```

---

*Fonte: Figma [Rayna UI v1.0](https://www.figma.com/design/7nT1oJXd6OPArzemqVvhJB) — tokens extraídos programaticamente via Figma Plugin API.*
