# Reference: Project structure and scripts

## Files

| Path | Contents |
|---|---|
| `src/app/_layout.tsx` | Root navigator; shows `sign-in` or `(tabs)` based on session |
| `src/app/sign-in.tsx` | Email code sign-in |
| `src/app/(tabs)/index.tsx` | Today screen; triggers a 3-day Apple Health sync on focus |
| `src/app/(tabs)/log.tsx` | Manual and screenshot nutrition logging |
| `src/app/(tabs)/health.tsx` | Apple Health connect, sync, backfill; sign out |
| `src/components/ui.tsx` | `Screen`, `Card`, `Stat`, `Button`, `Field` |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/auth.tsx` | `AuthProvider`, `useAuth()` |
| `src/lib/health.ts` | `healthAvailable()`, `connectAppleHealth()`, `syncAppleHealth(userId, days)` |
| `src/lib/dates.ts` | `localDay()`, `startOfLocalDay()`, `addDays()` |
| `supabase/migrations/` | Database schema |
| `supabase/functions/parse-screenshot/` | Screenshot → nutrition entry |
| `app.json` | App name, bundle ID `com.katyauchter.composite`, plugins and permissions |
| `eas.json` | Build profiles: `development`, `preview`, `production` |

## npm scripts

| Command | Does |
|---|---|
| `npm start` | `expo start` |
| `npm run ios` | `expo start --ios` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
