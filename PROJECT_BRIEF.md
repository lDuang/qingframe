# Project Brief

## Project Name Candidates

- QingFrame
- LightPoster
- KindCanvas
- CommonGood Studio
- Moss Light
- Public Echo

Recommended: `QingFrame`

Reason:
- short
- light visual tone
- fits minimalist公益图片生成工具
- easy to use as product and repo name

---

## Product Positioning

A minimalist public-interest image generator for lightweight campaign visuals.

Core principles:
- web first
- no login
- one image per generation
- limited daily usage per visitor
- strong UI quality
- local-only history

This is not a general AI image platform.
This is a focused公益视觉生成工具.

---

## Goals For V1

1. Let a visitor generate one公益主题 image at a time.
2. Keep the interface visually clean, light, and quiet.
3. Avoid account complexity.
4. Keep compute costs under control with daily limits.
5. Preserve recent generation history locally in the browser.

---

## Non-Goals For V1

- native app
- login / account system
- community feed
- public gallery
- multi-image batch generation
- full prompt playground
- heavy admin system

---

## Target Users

- student clubs
- volunteers
- small NGOs
- community organizers
- campaign operators
- users who need a quick visual for public-interest communication

---

## Core User Flow

1. Open the site.
2. Enter a short description.
3. Choose a theme/style/aspect ratio.
4. Generate one image.
5. Preview and download.
6. See remaining daily quota.
7. Review previous local history.

---

## UI Direction

Keywords:
- minimalist
- lightweight
- thin
- calm
- generous whitespace
- image-first
- restrained

Avoid:
- heavy AI gradients
- over-designed glassmorphism
- stacked cards inside cards
- marketing-style hero page
- crowded control panels

Visual guidance:
- homepage is the generator page
- large result canvas
- compact input controls
- subtle borders
- weak shadows
- 8px radius
- muted neutral background
- soft accent color only where necessary

---

## Page Structure

Single-page app.

### Main layout

- Left or top: control panel
- Right or bottom: generation result
- Bottom drawer or side section: local history

### Control panel

- theme selector
- prompt textarea
- style selector
- aspect ratio selector
- generate button
- remaining quota

### Result area

- large preview image
- loading state
- error state
- download button
- regenerate button
- copy prompt button

### History area

- recent local generations
- image thumbnails
- timestamp
- prompt snippet
- click to reopen
- delete item

---

## History Strategy

History should exist, but local only.

Use browser local persistence, not account persistence.

Recommended:
- `IndexedDB`
- helper library: `Dexie` or `idb`

Store:
- id
- createdAt
- theme
- style
- prompt
- imageUrl
- thumbUrl
- status

Why:
- no login needed
- keeps the app light
- preserves continuity
- avoids backend complexity

---

## Rate Limit Strategy

No login, so the goal is not perfect identity.
The goal is fair usage and cost control.

### Primary rule

Daily quota by `(ip + device_id)` pair.

Example key:

`limit:pair:{date}:{ip}:{device_id}`

### Supporting rules

- per `device_id` cooldown, e.g. 30 seconds
- optional high-threshold per `ip` protection for obvious abuse

### Why not IP only

Many users may share one public IP.

### Why not device only

Device ID can be reset by clearing storage.

### V1 recommendation

- pair daily quota: `N`
- device cooldown: 30 seconds
- optional IP hourly cap for extreme abuse only

---

## Prompt Strategy

Do not expose raw prompt engineering as the main interaction.

Use semi-structured input:
- theme
- user short description
- style
- aspect ratio

Server composes the final prompt template.

Benefits:
- more stable quality
- safer outputs
- lower prompt burden

---

## Safety

V1 should include:
- keyword filtering
- provider moderation if available
- restrictions on explicit sexual content
- restrictions on violent graphic content
- restrictions on harmful content involving minors
- restrictions on fake official/public welfare misuse

---

## Tech Stack

### Frontend

- TypeScript
- React
- Vite
- Tailwind CSS
- optional: Framer Motion

### Backend

- TypeScript
- Hono

### Storage

- PostgreSQL for tasks, files, and rate limiting
- IndexedDB for local history

### Not needed in V1 by default

- Next.js
- native app
- self-hosted local database files inside the app container

---

## Suggested Data Model

### Local history item

```ts
type HistoryItem = {
  id: string
  createdAt: string
  theme: string
  style: string
  prompt: string
  imageUrl: string
  thumbUrl?: string
  status: "success" | "failed"
}
```

---

## API Sketch

### POST `/api/generate`

Headers:
- `x-device-id`

Body:

```json
{
  "theme": "environment",
  "prompt": "clean beach volunteer poster",
  "style": "realistic",
  "aspectRatio": "4:5"
}
```

Response:

```json
{
  "imageUrl": "https://...",
  "remainingToday": 2,
  "retryAfterSeconds": 30
}
```

---

## V1 Build Priority

1. polished generator UI
2. one-image generation flow
3. rate limit and cooldown
4. local history
5. prompt templating
6. basic safety filter

---

## Short Build Instruction For An Agent

Build a minimalist公益图片生成 web app with:
- React + TypeScript + Vite frontend
- Hono + TypeScript backend
- no login
- one image per generation
- daily quota by `(ip + device_id)` pair
- device cooldown
- local history via IndexedDB
- image-first, calm, lightweight UI

Prioritize visual quality over system breadth.
