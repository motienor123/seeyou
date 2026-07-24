# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (catches type errors)
npx tsc --noEmit # type-check without building
npm run lint     # eslint
```

No test suite. Use `npm run build` or `npx tsc --noEmit` to verify correctness before committing.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4. **All persistence is localStorage — no backend, no database.**

> This version of Next.js may have breaking changes vs. training data. Read `node_modules/next/dist/docs/` when unsure. Pages under `src/app/` use the App Router. Params are Promises — always unwrap with `use(params)` from React, not direct destructuring.

## Architecture

### Data flow
`src/lib/storage.ts` is the single source of truth. It exposes typed `load`/`persist` helpers and a `storage` object with `getGroups`, `saveGroups`, `getEvents`, `saveEvents`, `getSnaps`, `saveSnaps`. Every page reads and writes through this module directly — there is no global state manager or context for data.

### Key data types (`storage.ts`)
- `Group` — `{ id, name, avatar?, createdAt }` — avatar is a base64 data URL
- `CalendarEvent` — `{ id, groupId, title, date, endDate?, time, location, description, locked, colorIndex?, createdAt }` — `endDate` omitted for single-day events; `colorIndex` indexes into `EVENT_PALETTE` in `colors.ts`
- `Snap` — `{ id, eventId, dataUrl, addedAt }` — photos stored as base64

### Routing
```
/                          → src/app/page.tsx          (group list)
/group/[id]                → src/app/group/[id]/page.tsx (year calendar + events)
/group/[id]/event/[eventId]→ src/app/group/[id]/event/[eventId]/page.tsx (snaps)
```

### Internationalisation
`src/lib/i18n.ts` exports an `en` and `lt` (Lithuanian) translation object. `src/lib/LangContext.tsx` provides `LangProvider`, `useLang()` hook, and `LangToggle` component. Every client component calls `const { t } = useLang()` to access strings. `LangProvider` and `LangToggle` are mounted in `layout.tsx`.

### Colors & seasons
`src/lib/colors.ts` — `EVENT_PALETTE` (8 colours), `getColor(colorIndex?)` returns `{ stripe, circle, card }` hex values used as inline styles (not Tailwind classes) to avoid purge issues. `Calendar.tsx` defines `SEASON` and `getSeason(month)` for per-month background tints (winter=blue, spring=green, summer=yellow, autumn=amber).

### Calendar
`src/components/Calendar.tsx` renders a full-year grid (12 months). Internal state manages two-click range selection (`selStart`, `hovDate`). When the user completes a selection the parent's `onSelect(start, end)` is called; if start===end it's a single-day event. Hover over a day with events shows a fixed-position tooltip with smooth CSS animation (`fadeInTooltip` keyframe in `globals.css`).

### Rules
- Do not add external npm packages without asking.
- All dynamic colours must use inline styles, not dynamic Tailwind class strings.
- `colorIndex` is assigned at event creation time as `events.length % EVENT_PALETTE.length`.
- `isPast(event)` must use `event.endDate ?? event.date` so multi-day events stay "upcoming" until the last day.
- localStorage keys: `seeyou-groups-v1`, `seeyou-events-v1`, `seeyou-snaps-v1`, `seeyou-lang`.
