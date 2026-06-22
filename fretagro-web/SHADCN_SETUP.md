# shadcn/ui Initialization Summary

## Setup Completed ✅

### 1. **components.json** — Configuration File
Created `/fretagro-web/components.json` with:
- **Component Library**: Radix UI
- **Preset**: Custom (no pre-built style override)
- **CSS Variables**: Enabled ✓
- **Aliases**:
  - `@/components` → `/components`
  - `@/lib/utils` → `/lib/utils` (compatibility with shadcn `cn` utility)
  - `@/ui` → `/components/ui`
  - `@/lib` → `/lib`
  - `@/hooks` → `/hooks`

### 2. **lib/utils.ts** — Utility Compatibility
Created a thin wrapper that exports the existing `cn()` function from `lib/utils/cn.ts`.
shadcn components import from `@/lib/utils` automatically—this maintains compatibility.

### 3. **app/globals.css** — CSS Variables Block
Added a complete shadcn/ui CSS variable palette in HSL channels, mapped to FreteAgro colors:
```css
:root, .dark {
  --background:          60 16% 4%;      /* #0b0b08  */
  --foreground:         210 20% 98%;     /* #f9fafb  */
  --primary:            141 79% 40%;     /* #16b84f  */
  --destructive:          2 74% 48%;     /* #d42620  */
  --border:             218 18% 34%;     /* #475367  */
  --ring:               141 79% 40%;     /* #16b84f  */
  --radius:                        0.5rem;
  /* ... and 20+ more tokens */
}
```

### 4. **tailwind.config.ts** — Extended Theme
Added shadcn color utilities to Tailwind theme:
- `bg-primary`, `text-foreground`, `border-border`, etc. ✓
- `border-radius.lg` → `var(--radius)` (supports `rounded-lg` on components) ✓
- All semantic tokens support opacity modifiers: `bg-primary/90`
- Design-system tokens (`colors.primary`, `colors.grey`) remain unchanged

---

## Result
FreteAgro can now:
1. **Install any shadcn component** via `npx shadcn@latest add <component>`
2. **Use Radix UI primitives** under the hood
3. **Keep dark-mode-only design** (CSS variables always dark)
4. **Maintain design-system consistency** (colors map to existing tokens)
5. **Add opacity variants** thanks to HSL CSS variables

Example:
```bash
npx shadcn@latest add button
# → creates /components/ui/button.tsx using Radix + design-system colors
```

---

## Available Component Categories (shadcn/ui v4)

### Layout & Navigation
- `accordion` — Expandable panels
- `sidebar` — Collapsible sidebar nav
- `tabs` — Tab navigation
- `breadcrumb` — Path breadcrumbs
- `navigation-menu` — Complex nav structure

### Form & Input
- `button` — Interactive button (variants: solid, outline, ghost)
- `input` — Text field
- `textarea` — Multi-line text
- `checkbox` — Toggle checkbox
- `radio-group` — Radio buttons
- `select` — Dropdown select
- `label` — Form label
- `form` — React Hook Form integration
- `switch` — Toggle switch
- `slider` — Range slider
- `date-picker` — Date selection

### Feedback & Status
- `badge` — Status label
- `alert` — Alert message
- `alert-dialog` — Confirmable alert
- `progress` — Progress bar
- `toast` — Toast notification
- `tooltip` — Inline tooltip
- `popover` — Content popover

### Data Display
- `table` — Data table
- `card` — Card container
- `carousel` — Image carousel
- `separator` — Divider line

### Dialog & Modal
- `dialog` → Modal dialog
- `sheet` → Drawer/side panel
- `dropdown-menu` → Context menu
- `hover-card` → Quick preview card
- `command` → Command palette / search

### Special / Advanced
- `code-block` — Code snippet display
- `avatar` — User profile image
- `calendar` — Calendar picker
- `charts` — Recharts integration (Line, Bar, Pie, etc.)

---

## Next Steps

1. **Install a button** to test:
   ```bash
   npx shadcn@latest add button
   ```

2. **Use in your components**:
   ```tsx
   import { Button } from '@/components/ui/button'
   
   export function MyComponent() {
     return <Button variant="primary">Click me</Button>
   }
   ```

3. **Mix with existing FreteAgro components** (no conflicts)

---

## CSS Variable Reference

Full list of shadcn variables in `app/globals.css`:
- `--background`, `--foreground` (base)
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--muted`, `--muted-foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--border`, `--input`, `--ring`
- `--chart-1` through `--chart-5`
- `--sidebar-*` (7 tokens for sidebar styling)
- `--radius` (base border radius)

All values are **HSL channels** (e.g., `141 79% 40%`) for opacity support in Tailwind.

---

## Architecture Notes

- **Dark mode only**: `<html class="dark">` is the canonical default (see `app/globals.css` html base rule)
- **CSS variables are tied to `:root, .dark`** so both light and dark classes show dark theme
- **No light-mode fallback** per FreteAgro Principle III
- **Radix UI** provides unstyled, accessible primitives
- **shadcn styles them** with Tailwind + CSS variables
- **Design-system tokens** (primary/secondary/grey) remain for non-shadcn components
