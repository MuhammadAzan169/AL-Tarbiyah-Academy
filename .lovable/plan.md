# BrightPath Learning flagship frontend

## Goal
Build a polished, frontend-only EdTech experience for Grades 1–4 that feels trustworthy to parents, motivating to students, and credible to tutors and administrators.

## Design direction
- Use the selected **Frosted Glass** direction: layered translucent surfaces, calm sky/mint/amber/rose accents, dimensional educational illustrations, and soft atmospheric depth.
- Retain its friendly rounded typography and optimistic tone while refining contrast, density, and composition for a premium funded-startup finish.
- Support a deliberately designed light and dark experience with reduced-motion fallbacks and WCAG AA interaction states.

## Build scope
1. Establish the central brand configuration, semantic design tokens, reusable navigation, controls, motion patterns, state views, and realistic mock-data modules.
2. Build distinct public pages for Home, How It Works, Subjects, Parents, Tutors, Pricing, About, Contact, and Login, plus a designed 404.
3. Build four realistic local-demo workspaces:
   - Parent: progress, skill map, attendance, lessons, homework, tutor match, recommendations, timeline.
   - Student: daily learning, streak, lessons, practice, exams, rewards, and library.
   - Teacher: students, attendance, schedule, messages, earnings, lesson planning, and an interactive exam builder.
   - Admin: KPIs, users, teacher verification, curriculum, exams, attendance, library, matching, schedules, payments, reports, announcements, support, and permissions.
4. Create richer product demonstrations: diagnostic journey, interactive subject explorer, learning levels, animated progress view, tutor matching, curriculum map, standards alignment, book-style library, testimonials, FAQ, and final learning-path action.
5. Make major interactions functional with local state: filters, selectors, tabs, dialogs, sorting, simulated submissions/downloads, role switching, monthly/yearly pricing, notifications, and success/error/empty/loading demonstrations.

## Technical approach
- TanStack Start + React 19 + TypeScript + Tailwind v4.
- Add Motion for React for restrained transitions; use Recharts and Lucide already present.
- Keep all demo content in `src/data/*.ts` and brand/theme values in central configuration.
- Use separate shareable routes with unique page metadata; keep role workspaces behind frontend-only demo navigation without real authentication.
- Generate a cohesive set of educational illustrations and import them as local assets.

## Quality checks
- Verify routes, interactions, keyboard focus, accessible names, contrast, overflow, and chart resizing.
- Review representative mobile, tablet, laptop, desktop, light, and dark views in the live preview.
- Confirm no dead controls, placeholder content, or unfinished template screen remains.
