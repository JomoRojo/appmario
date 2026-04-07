# Design System Document: The Curated Atelier



## 1. Overview & Creative North Star: "The Digital Artisan"

The Creative North Star for this design system is **The Digital Artisan**. We are moving away from the "app as a tool" mentality and toward "app as a piece of bespoke furniture." This system rejects the sterile, flat-white aesthetic of modern tech in favor of tactile warmth, intentional asymmetry, and the quiet luxury of a custom-built walk-in closet.



The experience should feel like running your hand over polished oak. We break the "template" look by utilizing significant whitespace (negative space), overlapping elements that mimic hanging garments, and a hierarchy that prioritizes the beauty of the user's collection over the UI itself.



---



## 2. Colors: The Timber & Brass Palette

The color strategy mimics natural materials. We use wood-inspired browns for structure, soft creams for the "linen" backing, and brass accents for interactive "hardware."



### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. To separate a category from a list, transition from `surface` (#fff8ef) to `surface-container-low` (#fbf3e4).



### Surface Hierarchy & Nesting

Treat the UI as a physical cabinet.

- **The Cabinet Shell:** `surface-dim` (#e1d9cb) or `surface-container-high` (#efe7d9).

- **The Shelves:** `surface-container` (#f5edde).

- **The Jewelry Box (Nested items):** `surface-container-lowest` (#ffffff) for maximum "lift" and focus.



### The "Glass & Gradient" Rule

To add "soul," use subtle radial gradients on main CTAs (Primary #553722 to Primary-Container #6f4e37). This mimics the way light hits a finished wood grain. For overlays or navigation bars, use **Glassmorphism**: `surface` at 80% opacity with a `20px` backdrop blur to create a "frosted glass" divider effect.



---



## 3. Typography: Modern Sophistication

We pair a high-fashion Serif with a technical, readable Sans-Serif to balance heritage with modernity.



- **Display & Headlines (Epilogue):** This is our "Editorial" voice. Use `display-lg` and `headline-lg` with generous letter-spacing to announce categories (e.g., "The Winter Collection"). It should feel like a masthead in a luxury magazine.

- **Titles & Body (Manrope):** This is our "Functional" voice. Manrope provides a clean, modern contrast to the wood-heavy visuals. Use `title-md` for garment names and `body-md` for descriptions.

- **Labels (Manrope):** Use `label-md` in all-caps with `0.05rem` tracking for metadata like "LAST WORN" or "MATERIAL," mimicking the small, elegant tags found in high-end boutiques.



---



## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "digital." We achieve depth through physics-based layering.



- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in cream tones provides a "natural lift" that feels architectural rather than programmed.

- **Ambient Shadows:** If a floating element (like a FAB) is required, use a tinted shadow: `color: on-surface` (#1e1b13) at **6% opacity**, with a **32px blur** and **8px Y-offset**. This mimics soft, ambient room lighting.

- **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#d4c3ba) at **15% opacity**. It should be felt, not seen.

- **Tactile Brass:** Use `secondary` (#775a19) for interactive "hardware" elements. These should feel like the brass knobs on a drawer.



---



## 5. Components



### Buttons

- **Primary:** Background `primary` (#553722), text `on-primary` (#ffffff). Shape: `md` (0.375rem). No border.

- **Secondary (Brass Hardware):** Background `secondary-container` (#fed488), text `on-secondary-container` (#785a1a). Use for "Edit" or "Style" actions.

- **Tertiary:** Text-only in `primary`. Use for low-emphasis actions like "View Details."



### Cards & Lists

- **The "No-Divider" Rule:** Never use a line to separate garments in a list. Use `1.5rem` of vertical whitespace or alternate the background color slightly using the `surface` tiers.

- **Garment Cards:** Use `xl` (0.75rem) roundedness. The image should be the hero, sitting on a `surface-container-low` base.



### Inputs & Fields

- **Text Fields:** Use a "Minimalist Tray" style. No containing box. Only a bottom-aligned `outline-variant` at 20% opacity. Labels should be `label-md` in `on-surface-variant`.

- **Selection Chips:** Use `full` roundedness. Unselected: `surface-container-highest`. Selected: `primary` with `on-primary` text.



### Specialized Components

- **The "Hanger" Toggle:** A custom radio button that mimics a hanger hook.

- **Material Chips:** Small, circular swatches using `surface-tint` to represent different fabrics (Silk, Wool, Leather).



---



## 6. Do's and Don'ts



### Do

- **Do** use asymmetrical layouts. Place a large "Hero" outfit slightly off-center to create a dynamic, curated feel.

- **Do** use `surface-bright` for the main background to keep the "closet" feeling airy and clean.

- **Do** ensure all images have a consistent "studio" background to maintain the premium aesthetic.



### Don't

- **Don't** use pure black (#000000) or pure grey. Always use the warm neutrals provided (`on-surface` #1e1b13).

- **Don't** use sharp 90-degree corners. Even the most minimal wood furniture has a slight "sanded" edge (`sm` 0.125rem).

- **Don't** overcrowd the screen. If a user has 100 shirts, show 4 beautifully rather than 20 cramped. Luxury is space.



---



## 7. Interaction Pattern: The "Soft Glide"

All transitions should be timed at **300ms** using an **Ease-Out-Expo** curve. This mimics the heavy, smooth motion of a well-oiled wooden drawer sliding open. Avoid "snappy" or "bouncy" animations; the UI should feel weighted and expensive.```