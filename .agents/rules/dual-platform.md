# Development Rules for Garage SaaS

## Dual-Platform Development (Web + Android)
From this point forward, **every feature, enhancement, data model change, or bugfix must be implemented in parallel for both platforms**:

1. **Web Application (`app/`, `components/`, `lib/`)**:
   - Next.js 15 (App Router, Tailwind CSS, TypeScript).
   - Desktop and responsive tablet/mobile web experiences.

2. **Android Application (`mobile/`)**:
   - React Native + Expo (TypeScript).
   - Native mobile UI/UX, Touch interactions, Safe Area, and Mobile API connectivity (`mobile/src/services/api.ts`).

## Checklist for Any New Feature / Change:
- [ ] Backend API / Prisma Schema update (if applicable) in `prisma/schema.prisma` and `app/api/`.
- [ ] Web implementation in `app/dashboard/...`.
- [ ] Android implementation in `mobile/src/screens/...` or components.
- [ ] Theme / design alignment (Gold & Dark Slate luxury design system preserved on both platforms).
- [ ] TypeScript verification across both `.` and `mobile/`.
