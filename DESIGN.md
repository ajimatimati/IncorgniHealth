---
version: alpha
name: IncogniCare
description: >
  A private, confidential telehealth platform for Nigeria.
  The design system is built on warmth, trust, and clinical clarity —
  presenting privacy not as a hacker concept, but as a basic human right.
  The aesthetic is premium dark-mode with soft violet and blue accents,
  designed to feel supportive rather than secretive.

colors:
  # ── Core surfaces ──────────────────────────────────────
  background:               "#131313"
  surface:                  "#131313"
  surface-dim:              "#131313"
  surface-bright:           "#393939"
  surface-container-lowest: "#0e0e0e"
  surface-container-low:    "#1c1b1b"
  surface-container:        "#201f1f"
  surface-container-high:   "#2a2a2a"
  surface-container-highest:"#353534"
  surface-variant:          "#353534"

  # ── Content ────────────────────────────────────────────
  on-background:            "#e5e2e1"
  on-surface:               "#e5e2e1"
  on-surface-variant:       "#cbc3d7"
  inverse-surface:          "#e5e2e1"
  inverse-on-surface:       "#313030"

  # ── Primary — soft violet (trust, calm) ───────────────
  primary:                  "#d0bcff"
  primary-container:        "#a078ff"
  primary-fixed:            "#e9ddff"
  primary-fixed-dim:        "#d0bcff"
  on-primary:               "#3c0091"
  on-primary-container:     "#340080"
  surface-tint:             "#d0bcff"

  # ── Secondary — slate-blue (informational) ────────────
  secondary:                "#bac8dc"
  secondary-container:      "#3a4859"
  on-secondary:             "#243141"
  on-secondary-container:   "#a8b6ca"

  # ── Tertiary — sky-blue (status, links) ───────────────
  tertiary:                 "#8ccdff"
  tertiary-container:       "#2899d8"
  on-tertiary:              "#00344e"
  on-tertiary-container:    "#002d44"

  # ── Error — warm red (critical only) ──────────────────
  error:                    "#ffb4ab"
  error-container:          "#93000a"
  on-error:                 "#690005"
  on-error-container:       "#ffdad6"

  # ── Outline ────────────────────────────────────────────
  outline:                  "#958ea0"
  outline-variant:          "#494454"

  # ── Semantic aliases ───────────────────────────────────
  success:                  "#4caf7d"
  success-container:        "#1e3a2f"
  warning:                  "#f0b429"
  warning-container:        "#3a2a00"

typography:
  h1:
    fontFamily: Manrope
    fontSize: clamp(1.875rem, 6vw, 2.75rem)
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.025em
  h2:
    fontFamily: Manrope
    fontSize: clamp(1.375rem, 4vw, 1.875rem)
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  h3:
    fontFamily: Manrope
    fontSize: clamp(1.0625rem, 2.5vw, 1.25rem)
    fontWeight: 600
    lineHeight: 1.2
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.625rem
    fontWeight: 600
    letterSpacing: 0.12em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 0.6875rem
    fontWeight: 500
    letterSpacing: 0.08em

rounded:
  sm:   0.5rem
  md:   1rem
  lg:   2rem
  xl:   3rem
  full: 9999px

spacing:
  xs:  0.25rem
  sm:  0.5rem
  md:  1rem
  lg:  1.5rem
  xl:  2rem
  2xl: 3rem

components:
  btn-primary:
    backgroundColor: "linear-gradient(135deg, {colors.primary}, {colors.primary-container})"
    textColor:       "{colors.on-primary}"
    typography:      "{typography.label-sm}"
    rounded:         "{rounded.full}"
    height:          48px
    padding:         "0 1.5rem"
  btn-primary-hover:
    backgroundColor: "filter: brightness(1.08)"
  btn-secondary:
    backgroundColor: "{colors.surface-container-high}"
    textColor:       "{colors.on-surface}"
    rounded:         "{rounded.full}"
    height:          48px
  btn-ghost:
    backgroundColor: "transparent"
    textColor:       "{colors.outline}"
    rounded:         "{rounded.full}"
    height:          48px

  card:
    backgroundColor: "{colors.surface-container-low}"
    rounded:         "{rounded.md}"
    padding:         "1.25rem"
  card-hover:
    backgroundColor: "border-color: rgba(208,188,255,0.2)"

  input:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor:       "{colors.on-surface}"
    typography:      "{typography.body-md}"
    height:          52px
    rounded:         0
  input-focus:
    backgroundColor: "border-bottom: 2px solid {colors.primary}"

  badge:
    typography:      "{typography.label-caps}"
    rounded:         "{rounded.full}"
    padding:         "0.2rem 0.6rem"

  nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor:       "{colors.on-primary}"
    rounded:         "{rounded.full}"

  wallet-card:
    backgroundColor: "linear-gradient(135deg, #1c1b22, #121115)"
    rounded:         2rem
    padding:         "1.5rem 2rem"
---

## Overview

**Design Philosophy: Supportive Confidentiality**

IncogniCare exists because millions of Nigerians avoid healthcare out of fear of judgement and social exposure. The design must communicate safety, warmth, and clinical trust — not surveillance or secrecy.

The UI should feel like a premium private clinic: calm, clean, authoritative, and deeply human. Every design decision should ask: *does this make a vulnerable person feel safe and supported?*

---

## Tone & Voice

The language throughout the app must be **warm and empowering**, never alarming or militaristic.

### ✅ Use
- "Your health information is safe and confidential"
- "Supportive. Confidential. Yours."
- "Available for care"
- "Secure Verification"
- "Professional, confidential care"
- "Two-step verification"
- "Industry standard security"

### ❌ Avoid
- "Zero social exposure"
- "Zero-Knowledge Identity"
- "Absolute clinical confidentiality"
- "Security Protocol"
- "AES-256 Encryption" (use "Industry Standard Security" instead)
- "Biometric Auth Ready"
- "HIPAA Compliant" (unverified claim — avoid)
- "Data Sold to Third Parties" (reframe as "Data Shared Without Consent")
- "Care Vault" (use "Wallet Balance")
- "Manage vault" (use "Manage wallet")

---

## Colors

The palette is rooted in dark, near-black surfaces with a single warm violet primary accent and a cool blue tertiary for status and information.

- **Background (#131313):** Near-black canvas. Soft enough to avoid harsh contrast with text.
- **Surface containers:** A scale of 6 dark grays from `#0e0e0e` to `#393939` for layering cards and modals without bright borders.
- **Primary (#d0bcff):** Soft lavender-violet. Conveys calm trust and approachability. Used for CTAs, active states, and brand moments.
- **Primary Container (#a078ff):** Used in gradients for buttons and wallet cards.
- **Tertiary (#8ccdff):** Soft sky blue. Reserved for status indicators, informational badges, and secondary links.
- **Error (#ffb4ab):** Warm rose-red. Used only for genuine errors and the SOS/emergency flow. Not to be used decoratively.
- **Success (#4caf7d):** Muted emerald. Used for confirmation and positive health indicators.
- **Warning (#f0b429):** Warm amber. Used for pharmacy roles and cautionary states.

### Gradient Usage
Gradients are allowed only on:
1. **CTA buttons** — `primary` to `primary-container`
2. **Wallet Balance card** — deep dark gradient with ambient glow orbs
3. **Hero atmospheric overlays** — soft, large-radius blurs at very low opacity (≤ 0.12)

Never use harsh gradients on text.

---

## Typography

Three font families, each with a specific role:

| Font | Role | Feel |
|------|------|------|
| **Manrope** | Headings (h1–h3), brand name, hero titles | Premium, editorial, confident |
| **Inter** | Body copy, descriptions, form labels | Neutral, readable, approachable |
| **Space Grotesk** | Micro-labels, badges, nav items, button text | Technical clarity, uppercase only |

### Rules
- **Never** use `Space Grotesk` for long-form text — it is uppercase only at `label-caps` size.
- `letter-spacing` on labels should be `0.08em`–`0.2em`. Never exceed `0.2em`.
- `font-headline` (`Manrope`) should always pair with `tracking-tight` (`-0.025em`) at display sizes.
- Body text should be `Inter` with `line-height: 1.5`–`1.6` for comfortable reading.

---

## Spacing & Layout

- **Base unit:** `1rem` (16px)
- The app uses an `8px` spacing grid throughout.
- Cards use `1.25rem` padding on mobile and `1.75rem` on desktop.
- The top app bar is always `4rem` tall.
- The bottom navigation bar has `2rem 2rem 0 0` border radius (pill-top pill).
- Safe-area insets are always respected via `env(safe-area-inset-bottom)`.

---

## Border Radius

The app uses rounded-xl (`2rem`) and rounded-full (`9999px`) heavily. Sharp rectangles are avoided entirely. The minimum border radius for any interactive element is `0.5rem`.

| Usage | Radius |
|-------|--------|
| Cards, modals | `1rem` |
| Stat cards, service tiles | `1rem`–`2rem` |
| Buttons | `9999px` (full pill) |
| Badges | `9999px` (full pill) |
| Wallet card | `2rem` |
| Input fields | `0` on sides, `2px` bottom border only |

---

## Component Guidelines

### Buttons
- Always pill-shaped (`rounded-full`).
- `btn-primary` uses a gradient and is the sole strong CTA per screen.
- Icon buttons should be at least `48px` in diameter (accessibility tap target).
- Button text uses `Space Grotesk`, uppercase, `tracking-[0.08em]`.
- Active state: `scale(0.97)`. Hover state: `brightness(1.08)` or shadow increase.

### Cards
- Background: `surface-container-low` (`#1c1b1b`)
- Border: `1px solid rgba(73,68,84,0.1)`
- Hover: border shifts to `rgba(208,188,255,0.2)`
- No card should have a drop shadow stronger than `0 4px 24px rgba(0,0,0,0.4)`.

### Input Fields
- Underline-only style: no full border box.
- Background: `surface-container-lowest` (`#0e0e0e`)
- Focus state: `2px solid primary` on bottom only.
- Placeholder text: `outline` color (`#958ea0`)
- Font: `Inter`, `0.9375rem`.

### Wallet Balance Card
- The wallet card is a featured fintech-style component.
- Uses a deep dark gradient background with ambient soft glow orbs.
- The ₦ currency symbol should be rendered smaller and subdued, with the numeric value large and bold.
- Two action buttons: "Add Funds" (primary, solid) and "History" (ghost, frosted border).
- The "Available for care" pill indicator uses the tertiary color with a glowing pulse dot.

### Modals
- All modals use `backdrop-filter: blur(20px)` on the overlay.
- Modal containers are `glass-panel` style: `rgba(28,27,27,0.5)` with `border: 1px solid rgba(255,255,255,0.05)`.
- Bottom sheet modals slide up from `translateY(100%)`.

### Navigation
- Bottom nav uses a pill-top design with `backdrop-filter: blur(24px)`.
- Active nav item uses `primary` background with `on-primary` text and a wider pill.
- Nav labels use `Space Grotesk`, uppercase, `0.625rem`.

---

## SOS / Emergency UI

The emergency flow (SOS, Crisis Line, Safe Haven) is an intentional exception to the calm palette. It uses `error` (`#ffb4ab`) and `error-container` (`#93000a`).

**Rules:**
- The SOS button must always be visible in the patient layout.
- Emergency screens must communicate *immediate help is available*, not panic.
- Copy should be warm: "Help is nearby", "You are not alone", "Reach out now."
- Never use red for decorative purposes outside of the emergency flow.

---

## Atmospheric Effects

Subtle ambient glow orbs are allowed as background decoration:
- Max opacity: `0.12`
- Min blur radius: `60px`
- Always `pointer-events: none`
- Only use `primary` or `tertiary` colors for glow orbs
- Maximum **2 orbs** per screen

Scanlines, holographic overlays, and neon grid patterns are **explicitly forbidden**.

---

## Accessibility

- All text must meet WCAG AA contrast (4.5:1 for body, 3:1 for large text).
- Minimum tap target size: `48px × 48px`.
- Focus rings: `2px solid {colors.primary}`, `2px offset`, `6px border-radius`.
- All interactive elements must have a visible `:focus-visible` state.
- `text-size-adjust: 100%` is set globally.
- `-webkit-tap-highlight-color: transparent` is set globally for mobile.
