# Design

Seoul Vibe follows the editorial magazine look of the-edit.co.kr, a reference the owner made binding: a split screen, a neon lime panel, heavy Pretendard headlines, off-white paper and a black footer. Tokens and components live in `src/styles.css`.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#fbfcf6` | Page ground, reading surfaces |
| `--ink` | `#000` | Text, feature panels, footer, primary buttons |
| `--lime` | `#c4ff30` | Signature panel, active states, focus ring on forms, selection |
| `--white` | `#fff` | Text on ink and on photos, input fill |
| `--danger` | `#d92d1f` | Destructive actions, errors |

Type: Pretendard Variable (jsDelivr CDN in `index.html`). Body is 500. Headlines are 800 with slightly negative tracking. Korean text uses `word-break: keep-all`.

Shape: square corners everywhere except avatars. Borders are 2px ink. No shadows, glass or gradients, except the photo scrim on feature covers.

## Layout

- `.split`: two equal columns. `.split-side` is sticky at full viewport height and holds a `FeatureCover` or a `.panel`. `.split-main` scrolls. Below 900px it stacks into one column.
- Surfaces: `.surface-paper`, `.surface-lime`, `.surface-ink`.
- `.stagger`: two-column card grid; every second card is offset 96px down. It becomes one column below 560px.
- Header: the logo sits over the page, and each page sets its tone with `useHeaderTone('light' | 'dark' | 'night')`. The fixed square menu button opens a full-screen ink menu.

## Components

- `FeatureCover`: full-bleed photo with a scrim, category label, title, excerpt, date and byline. Without an image it falls back to a flat ink or lime panel.
- `PostCard`: 4:5 image with the category label overlaid, a two-line title, location, date and byline.
- `Byline`: a round avatar, or an initial on ink/lime, with the name stacked underneath.
- Article rows: rows separated by rules. On hover the row fills with lime.
- Admin: black sidebar with a lime active item. Content sits in ink-bordered blocks split by 1px ink rules. Tables use an ink header row. Status badges are bordered, and lime means live.
