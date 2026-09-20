# Gokarna Connect — Design System ("Deep Water Cartography")

> Contract for the 2026 overhaul of `website/client`. Every color, size, spacing, motion value, and primitive in the codebase MUST trace to this file. Extend this file FIRST when a new token is needed.

## 0. Research Log

- Embedded refs: shortlisted `airbnb.md` / `mastercard.md` / `starbucks.md` → picked **`redesign-skill.md` (Layer A)** + **`airbnb.md` (Layer B)**: travel-marketplace semantics (search-first, photography-led hierarchy, sticky booking panel, 3-layer stacked elevation, 4:3 listing cards) match this product; brand tokens re-keyed to an ocean/sand editorial identity instead of Airbnb coral. Motion mechanics anchored to **beui.dev** (`interaction-skill.md`): button, tabs, command-palette, theme-toggle, marquee, tilt-card mechanisms.
- Lazyweb: skipped — redesign branch (audit-first), not greenfield concept generation.
- Imagen drafts: skipped — existing codebase with a defined content model; no image-gen lane required.
- Skipped lanes: lazyweb, imagen (redesign-branch rationale above).

## 1. Atmosphere & Identity

Gokarna Connect feels like a **modern coastal field guide** — chart-paper light surfaces with fine grain, deep-water dark surfaces with caustic light, data rendered like tide tables and survey coordinates. Calm, confident, quietly luxurious: the calm of a cliff at dusk, not the noise of a beach party.

**Signature: the Tide Line** — a thin luminous cyan line that runs through the interface as the page-progress indicator, the active-nav underline, and the section divider.
**Signature moment: the hero Sun Arc** — a scroll-driven sun that sets across the hero like an inked survey chart, with the tide line rising/falling in sync. Reduced-motion users get the composed static chart.

## 2. Color

OKLCH-first with hex fallbacks. CSS custom properties in `:root` (light "Chart Paper") and `.dark` (dark "Deep Water"). P3 wide-gamut where supported via `@supports (color: color(display-p3 0 0 0))`.

### Light — Chart Paper

| Role | Token | Value (OKLCH / hex fallback) | Usage |
|---|---|---|---|
| Surface/base | `--c-paper` | `oklch(0.985 0.006 95)` / `#FCFBF7` | Page background |
| Surface/raised | `--c-paper-2` | `oklch(0.972 0.008 92)` / `#F6F3EA` | Cards, wells, subsections |
| Surface/elevated | `--c-elevated` | `oklch(0.995 0.002 90)` / `#FDFCF9` | Modals, popovers |
| Text/primary | `--c-ink` | `oklch(0.235 0.028 258)` / `#16222E` | Headings, body |
| Text/secondary | `--c-ink-2` | `oklch(0.43 0.024 254)` / `#4C5A68` | Captions, metadata |
| Text/muted | `--c-ink-3` | `oklch(0.60 0.018 252)` / `#7E8B97` | Disabled, hints |
| Border/hairline | `--c-line` | `oklch(0.885 0.012 92)` / `#E2DDD1` | Dividers, card edges |
| Border/strong | `--c-line-2` | `oklch(0.80 0.015 94)` / `#C9C2B4` | Inputs, active edges |
| Accent/tide | `--c-tide` | `oklch(0.52 0.12 197)` / `#00756F` | Interactive elements, links (AA on paper) |
| Accent/hover | `--c-tide-2` | `oklch(0.47 0.11 197)` / `#00635E` | Hover state |
| Accent/glow | `--c-tide-glow` | `oklch(0.80 0.13 195)` / `#62C5BC` | Decorative fills, underlines, halo |
| Warm/ember | `--c-ember` | `oklch(0.60 0.16 35)` / `#C4452F` | Prices, ratings, warmth accents |
| Warm/gold | `--c-gold` | `oklch(0.72 0.14 85)` / `#B8860B` | Star ratings, sun shimmer |
| Status/success | `--c-ok` | `oklch(0.55 0.13 155)` / `#1B7A4B` | Confirmations |
| Status/error | `--c-err` | `oklch(0.55 0.19 27)` / `#C33B2E` | Errors, destructive |
| Status/warning | `--c-warn` | `oklch(0.68 0.16 80)` / `#A06A00` | Cautions |

### Dark — Deep Water

| Role | Token | Value (OKLCH / hex fallback) | Usage |
|---|---|---|---|
| Surface/base | `--c-paper` | `oklch(0.165 0.025 262)` / `#0B141E` | Page background |
| Surface/raised | `--c-paper-2` | `oklch(0.21 0.028 262)` / `#12202E` | Cards, wells |
| Surface/elevated | `--c-elevated` | `oklch(0.25 0.03 262)` / `#182838` | Modals, popovers |
| Text/primary | `--c-ink` | `oklch(0.95 0.008 95)` / `#F2F0EA` | Headings, body |
| Text/secondary | `--c-ink-2` | `oklch(0.80 0.012 250)` / `#C2CDD8` | Captions, metadata |
| Text/muted | `--c-ink-3` | `oklch(0.66 0.015 250)` / `#93A1AF` | Disabled, hints |
| Border/hairline | `--c-line` | `oklch(0.32 0.02 260)` / `#2A3A4A` | Dividers |
| Border/strong | `--c-line-2` | `oklch(0.42 0.025 260)` / `#3E5268` | Inputs, active edges |
| Accent/tide | `--c-tide` | `oklch(0.80 0.12 195)` / `#5FC9C2` | Interactive (AA on abyss) |
| Accent/hover | `--c-tide-2` | `oklch(0.85 0.12 195)` / `#8FE0DA` | Hover |
| Accent/glow | `--c-tide-glow` | `oklch(0.68 0.13 195)` / `#2FA9A2` | Halos, underlines |
| Warm/ember | `--c-ember` | `oklch(0.72 0.16 35)` / `#E2694F` | Prices, ratings |
| Warm/gold | `--c-gold` | `oklch(0.80 0.13 88)` / `#D9A62E` | Star ratings |
| Status/success | `--c-ok` | `oklch(0.72 0.13 155)` / `#4FBE7E` | Confirmations |
| Status/error | `--c-err` | `oklch(0.72 0.17 27)` / `#EF6A5B` | Errors |
| Status/warning | `--c-warn` | `oklch(0.80 0.14 85)` / `#E0A93C` | Cautions |

### Rules

- Accent is for **interactive elements and data emphasis only**. Never purely decorative.
- Ember is reserved for price/rating/warmth semantics. Gold only for ratings/sun moments.
- No color outside this table may appear in code. Extend the table first.

## 3. Typography

### Families (3, loaded as variable fonts from Google Fonts)

- **Display:** Fraunces (variable, opsz 9..144, wght 300..700; SOFT=0, WONK=0) — headlines, wordmark, numerals in display contexts.
- **UI/Body:** Instrument Sans (400 / 500 / 600 / 700) — everything else.
- **Data:** JetBrains Mono (400 / 500) — prices, tide tables, coordinates, reference codes, timestamps. Always `font-variant-numeric: tabular-nums`.

### Scale (fluid, clamp-based)

| Level | Size | Weight/Family | Line-height | Tracking | Usage |
|---|---|---|---|---|---|
| Display XL | `clamp(2.75rem, 6vw, 5.5rem)` | 600 Fraunces | 1.02 | -0.03em | Hero |
| Display | `clamp(2.25rem, 4.5vw, 4rem)` | 600 Fraunces | 1.05 | -0.025em | Page titles |
| H1 | `clamp(1.75rem, 3vw, 2.5rem)` | 600 Fraunces | 1.15 | -0.02em | Section heads |
| H2 | `clamp(1.4rem, 2.2vw, 1.9rem)` | 600 Fraunces | 1.2 | -0.015em | Subsection |
| H3 | `1.15rem` | 600 Instrument Sans | 1.3 | 0 | Card titles |
| Body LG | `1.125rem` | 400 Instrument Sans | 1.65 | 0 | Lead paragraphs |
| Body | `1rem` | 400 Instrument Sans | 1.6 | 0 | Default |
| Body SM | `0.875rem` | 400 Instrument Sans | 1.5 | 0 | Secondary |
| Caption | `0.8125rem` | 500 Instrument Sans | 1.45 | 0 | Metadata |
| Overline | `0.6875rem` | 600 JetBrains Mono | 1.3 | +0.14em | Section labels, uppercase |
| Data | `0.8125rem` | 500 JetBrains Mono | 1.5 | 0 | Prices, tide data, refs |

### Rules

- `text-wrap: balance` on all headings, `pretty` on body paragraphs.
- Body measure capped at 65ch. Body text never below 0.875rem; captions min 0.8125rem.
- All prices/dates/ref-codes in JetBrains Mono with tabular-nums.

## 4. Spacing & Layout

### Base unit: 4px

`--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64 · `-20` 80 · `-24` 96

### Grid

- Max content width **1280px** (`max-w-7xl`); wide sections 1440px.
- 12-column; gutters 24px desktop / 16px mobile. Bento/asymmetric grids encouraged (never 3 equal cards).
- Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536.
- Section vertical rhythm: 96px desktop, 64px mobile; bottom padding ~1.25x top for optical weight.

### Rules

- Tokenize intent (steps, gutters, section gaps); keep mechanics raw (`clamp()`, `minmax(min(16rem,100%),1fr)`, container units, `auto`, `%`).
- Asymmetry is intentional and documented in code comments.

## 5. Components (primitives — build these FIRST, showcase before product screens)

All primitives live in `src/components/ui/`. Every one ships default, hover, active, focus-visible, disabled, loading/empty states; reduced-motion path; and 44px touch targets.

1. **Button** — variants: primary (tide fill), secondary (hairline), ghost, icon (44px round). States: spring press (beui.dev `button`: idle→loading→success morph, scale 0.97 active). Focus ring: 2px `--c-tide` offset 2px.
2. **Card** — `ListingCard` (4:3 photo, 14px radius, NO shadow on paper, metadata stack 4px gaps); `ElevatedCard` (3-layer shadow, hairline, 16px radius, 24px padding).
3. **Badge** — solid / outline / status-dot; 6px radius; overline-style mono label.
4. **Input / SearchField / Select / DateRangeGroup** — hairline border → `--c-line-2` focus + 2px tide ring; error state with `--c-err` border + inline message (never `alert()`).
5. **Tabs** — beui.dev `tabs`: spring `layoutId` underline/pill indicator; keyboard arrows.
6. **Dialog** — beui.dev `center-morph-modal`: surface unfolds from center; esc + focus-trap + scroll-lock + backdrop blur.
7. **Sheet** — bottom sheet w/ snap points + drag (mobile booking/checkout).
8. **ThemeToggle** — beui.dev `theme-toggle`: full-page clip-path reveal via View Transitions API; auto (system) + light + dark.
9. **CommandPalette** — Cmd+K; fuzzy filter; spring-animated active row (beui.dev `command-palette`); full keyboard nav.
10. **Reveal** — scroll-driven entrance (translateY 24px + opacity, mask wipe for images); IntersectionObserver; reduced-motion → static.
11. **SpotlightCard** — cursor-tracked border glow (radial-gradient on `--x/--y` custom props); disabled for touch.
12. **MagneticButton** — cursor pull within 8px radius, spring return; pointer-fine only.
13. **TideLine** — fixed reading-progress hairline in `--c-tide-glow`, 2px, top of viewport.
14. **GrainOverlay** — fixed full-screen SVG feTurbulence noise, opacity 0.03 light / 0.05 dark, pointer-events-none, aria-hidden.
15. **Skeleton** — shimmer blocks matching real layout shape (card, table row, avatar).
16. **EmptyState / ErrorState** — composed icon + overline + headline + action, never a bare "nothing here".
17. **Marquee** — infinite horizontal ticker, pause on hover, reduced-motion → static wrap.
18. **SectionHeading** — overline (mono, tide) + Fraunces headline + optional lede; left-aligned by default.
19. **Navbar / Footer** — see shell specs below.
20. **Rating** — ember numeral (Fraunces) + gold star row; adapted from Airbnb "Guest Favorite" lockup, no laurels.

## 6. Motion & Interaction

### Timing tokens

| Type | Value | Usage |
|---|---|---|
| Micro | 120ms `ease-out` | Press, toggle, focus ring |
| Standard | 240ms `cubic-bezier(0.2,0,0,1)` | Panels, tabs, modals |
| Emphasis | 480ms `cubic-bezier(0.16,1,0.3,1)` | Page/hero entry |
| Spring A | `{ stiffness: 400, damping: 30 }` | Small spatial (buttons, rows, indicators) |
| Spring B | `{ stiffness: 260, damping: 26 }` | Panels, drawers, palette |
| Scroll-driven | linear, `scroll()`/`view()` timelines | Sun arc, reveals, parallax, tide progress |

### Rules

- **GPU-composited only**: `transform`, `opacity`, `filter`. Never animate layout props; morph via measured height / `layoutId`.
- **Springs move, easings tint.** Spatial motion uses springs (interruptible); color/opacity/blur use short tweens.
- **Motion serves meaning.** Every animation maps to a state change or affordance. No decorative motion on non-interactive elements (exceptions: hero Sun Arc, TideLine — the two signature moments).
- **Interruptibility**: a press/hover-out/route change mid-animation must retarget smoothly.
- **Reduced motion**: `prefers-reduced-motion: reduce` disables transforms/scroll-driven; keeps ≤150ms opacity fades. Every component ships this path.
- **View Transitions API** for route changes (React Router `viewTransition`) and theme toggle (clip-path reveal). Guard with `@supports (view-transition-name: none)`.
- Library: `motion` (framer-motion successor) for springs + shared layout, bundled cost recorded (~14KB gzip tree-shaken with `LazyMotion`).

## 7. Depth & Surface

**Strategy: MIXED.** Light mode = chart paper: hairline borders + flat cards (photography carries depth — Airbnb lesson). Dark mode = deep water: tonal shift + luminous glow. Glass is reserved for floating chrome (navbar, booking panel, palette).

- **True glass recipe** (floating chrome): `backdrop-filter: blur(20px) saturate(140%)` + `1px` inner border (`--c-line` light / `rgba(255,255,255,0.08)` dark) + inset top highlight + 3-layer shadow. Never a lone blur.
- **Elevation:** L0 none · L1 `0 1px 2px rgb(22 34 46 / 0.04)` · L2 stacked 3-layer: `0 0 0 1px rgb(22 34 46 / 0.02), 0 2px 6px rgb(22 34 46 / 0.04), 0 4px 8px rgb(22 34 46 / 0.10)` (dark: `0 0 0 1px rgb(0 0 0 / 0.2), 0 2px 6px rgb(0 0 0 / 0.3), 0 8px 24px rgb(0 0 0 / 0.5)`).
- **Focus ring:** `0 0 0 2px var(--c-paper), 0 0 0 4px var(--c-tide)` (double ring on imagery).
- **Grain:** SVG feTurbulence overlay (opacity 0.03 light / 0.05 dark).
- **Spotlight borders** on premium cards (hover only, pointer-fine).

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- **WCAG 2.2 AA.** Contrast floors: 4.5:1 body text, 3:1 large text/UI components — verified for BOTH themes against Section 2 ramps.
- Visible focus on every interactive element; full keyboard reachability; skip-to-content link; landmarks (`header/nav/main/footer`); unique `<title>` per route; `lang="en"`; form labels + `aria-describedby` errors.
- `prefers-reduced-motion` respected (Section 6). Touch targets ≥44px. Alt text on every meaningful image.
- No emojis as icons — Lucide SVG set only.

### Accepted Debt

| Item | Location | Why accepted | Exit |
|---|---|---|---|
| Lucide icons retained (not migrated to Phosphor) | whole app | Bundle churn vs differentiation gain; stroke width standardized to 1.75 | Icon-system rebuild |
| Tailwind 3.4 retained (not v4) | build | v4 is a build-tool migration, not a design method; v3 supports the token layer via CSS vars | Dep upgrade cycle |
| Leaflet map chrome is third-party | CoastalMapView | Restyled via CSS overrides only | Map provider swap |
| react-scan/grab/react-doctor install | devDeps | Installed only if registry reachable; recorded if install fails | — |
| Old `coastal-*` Tailwind tokens | legacy pages | Removed as each page is rewritten to `c-*` tokens | Full page pass complete |
