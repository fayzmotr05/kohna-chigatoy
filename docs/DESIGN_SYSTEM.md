# Design System — Ko'hna Chig'atoy Oilaviy Restoran
**Version:** 2.0 | **Date:** March 2026

Based on the restaurant logo (three arches with Islamic geometric patterns)
and building exterior. Warm brown and sand palette — earthy, inviting, premium traditional.

---

## 1. Design Direction

**Tone:** Warm, family-oriented luxury — premium but approachable.
Not cold/corporate, not rustic/cheap. Think: a beautiful family home that happens to serve incredible food.

**Mood:** Warm, earthy, inviting, heritage, elegant
**The memorable thing:** The warm terracotta tones and arch motifs make you feel the Uzbek hospitality before you even visit.

---

## 2. Color Palette

Extracted from the logo:

```css
:root {
  /* Brown — from logo text and columns */
  --brown-deep: #6D3520;        /* Primary headings, nav, strong text */
  --brown: #8B4A2B;             /* Secondary headings, links */
  --brown-medium: #A46B4F;      /* Hover states, icons */
  --brown-light: #C49A7E;       /* Subtle accents, borders */

  /* Sand & Tan — from logo pattern fill */
  --tan: #D4B896;               /* Buttons, badges, highlights */
  --sand: #E8D5C0;              /* Card backgrounds, dividers */
  --sand-light: #F2E8DA;        /* Alternate section backgrounds */

  /* Cream — page base */
  --cream: #FAF6F0;             /* Main background */
  --white-warm: #FFFDF9;        /* Card backgrounds, inputs */

  /* Text */
  --text-primary: #3D2117;      /* Body text — warm near-black */
  --text-secondary: #7A6355;    /* Muted text, descriptions */
  --text-on-dark: #FAF6F0;      /* Text on dark backgrounds */

  /* Dark — for footer, hero overlay */
  --bg-dark: #2A1810;           /* Footer, hero overlay */
  --bg-dark-soft: #3D261A;      /* Navbar solid state */
}
```

### Usage Rules
- **NO pure black or pure white** — always warm tones
- **Deep brown** = structure (nav, headings, footer)
- **Tan/sand** = warmth (buttons, highlights, featured badges)
- **Cream** = base (backgrounds, breathing room)
- The palette is monochromatic (all browns) — this gives it sophistication. Don't add random accent colors.

---

## 3. Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Source Sans 3', 'Segoe UI', sans-serif;
}
```

### Rules
- **Headings**: Playfair Display (serif) — always
- **Body**: Source Sans 3 (sans) — always
- **Prices**: Playfair Display + `--brown-deep` color — premium feel
- **Logo text**: Use the actual logo image, don't recreate in CSS
- Small labels ("TAVSIYA", "AR"): Source Sans 3, uppercase, letter-spacing 0.1em

---

## 4. Arch Motif

The logo's three-arch design is the signature element. Use sparingly:

- **Hero section** — subtle arch-shaped decorative frame (CSS border-radius)
- **Section dividers** — gentle arch SVG between content blocks
- **AR modal** — arch-shaped top frame
- **Featured cards** — subtle arch on image area

DON'T put arches on every element. They're decorative accents, not structural.

---

## 5. Decorative Elements

### Geometric Pattern
From the logo's Islamic geometric fill — use at very low opacity as texture:
```css
.pattern-overlay {
  /* Diamond/star geometric pattern */
  opacity: 0.04;
  background-size: 40px 40px;
}
```

### Dividers
```css
/* Thin warm line divider */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--brown-light), transparent);
}

/* Short accent bar under headings */
.heading-accent {
  height: 2px;
  width: 50px;
  background: var(--tan);
}
```

---

## 6. Component Styles

### Buttons
```css
/* Primary CTA — warm tan */
.btn-primary {
  background: var(--brown-deep);
  color: var(--cream);
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-weight: 600;
}
.btn-primary:hover {
  background: var(--brown);
  box-shadow: 0 4px 20px rgba(109,53,32,0.2);
}

/* Secondary — outlined */
.btn-secondary {
  background: transparent;
  color: var(--brown);
  border: 1.5px solid var(--brown-light);
  padding: 0.75rem 2rem;
  border-radius: 4px;
}

/* AR button */
.btn-ar {
  background: var(--brown-deep);
  color: var(--tan);
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
}
```

### Menu Cards
```css
.menu-card {
  background: var(--white-warm);
  border: 1px solid var(--sand);
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(61,33,23,0.08);
}
.menu-card .price {
  font-family: var(--font-display);
  color: var(--brown-deep);
}
```

### Navigation
```css
nav {
  background: var(--bg-dark-soft);  /* or transparent on hero */
}
nav .logo { /* use actual logo image */ }
nav a { color: var(--text-on-dark); }
nav a.active { border-bottom: 2px solid var(--tan); }
```

---

## 7. Page Layouts

### Landing Page
```
NAV — transparent → solid brown-dark on scroll
HERO — dark overlay on restaurant photo, logo centered, arch frame
ABOUT — cream bg, centered text, subtle pattern
FEATURED — sand-light bg, 3-4 featured cards
LOCATION — cream bg, info + map
FOOTER — bg-dark, warm divider at top
```

### Menu Page
```
NAV — solid
HEADER — brown-deep bg, search bar, page title
CATEGORY TABS — horizontal scroll, tan underline on active
GRID — 2-3-4 column responsive, menu cards
AR MODAL — dark overlay, arch-topped modal
```

---

## 8. Animations
- All transitions: 200ms max, ease-out
- Cards: translateY(-4px) on hover
- Navbar: smooth background transition on scroll
- Page sections: subtle fade-in on scroll (IntersectionObserver)
- NO bounce, NO spring, NO parallax — elegant and smooth
- Respect prefers-reduced-motion

---

## 9. Responsive
- Menu grid: 1 col (mobile) → 2 (sm) → 3 (lg) → 4 (xl)
- Hero text scales with clamp()
- Category tabs: horizontal scroll on mobile
- Nav: hamburger on mobile
- AR modal: fullscreen on mobile, centered on desktop

---

## 10. Admin Panel
- Sidebar: `--bg-dark-soft` background, logo, tan-colored active link
- Content: `--cream` background
- Tables: `--sand` borders, hover rows in `--sand-light`
- Charts: brown color scheme (light to dark)
- Keep it professional — no decorative arches (save for public site)

---

## 11. Do's and Don'ts

### Do
- Use warm tones everywhere
- Let the brown palette carry the whole design (monochromatic = sophisticated)
- Use the actual logo image prominently
- Make food photos warm-toned
- Use arch shapes as subtle accents

### Don't
- Add blue, green, or other accent colors — stay in the brown/sand family
- Use pure black or pure white
- Overdo patterns (max 4-5% opacity)
- Put arches on everything
- Use pill-shaped buttons (keep 4px border-radius)
