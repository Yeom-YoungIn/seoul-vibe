# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Visitors discovering Seoul, especially people new to the city, browsing curated place guides and community posts.
- Community members who share short reviews of restaurants, cafés, and other spots with photos and a map location.
- Operators (admin role) who publish editorial articles, manage users, and moderate the feed.

## Product Purpose

Seoul Vibe introduces local places in Seoul from two angles: curated editorial articles ("Seoul Vibes") and a community feed of user posts. Success is a visitor finding a place worth going to, and a member being able to share one in under a minute.

## Positioning

Curation and community side by side: operator-written guides sit next to first-hand posts with photos and pinned locations, in English and Korean.

## Capabilities and Constraints

- Auth: signup, login, email verification; JWT with refresh.
- Articles: list and detail, translated per language (EN / KO), title and body only (no cover image field).
- Posts: content, up to several images, category (`restaurant`, `cafe`, `etc`), optional location name and lat/lng picked on a Leaflet map.
- Admin: overview counts, users, articles (with translations), post moderation (hide / delete).
- Stack: React 18, TypeScript, Vite, React Router, Leaflet. Plain global CSS in `src/styles.css`.

## Brand Commitments

- Name: Seoul Vibe.
- Visual reference made binding by the owner (2026-11-07): follow the editorial magazine style of the-edit.co.kr closely (split layout, neon lime panel, heavy Pretendard headlines, off-white paper, black footer), applied to every surface including admin.

## Evidence on Hand

- No logo asset, no testimonials, no press. Do not fabricate them.
- Article records have no images; imagery comes only from community post uploads.
