# Explanation: Architecture and stack choices

## The problem Composite solves

Nutrition, training and body data usually live in separate apps: a coaching or food app for macros, the Health app for workouts and weight, a smart scale for body composition. Seeing whether a week "worked" means stitching them together by hand. Composite's job is to be the one place where those streams meet, and to turn them into a daily view and a weekly verdict.

The first version was built to replace a personal workaround: a Mac script that screenshotted a nutrition app every night, a third-party app that exported Apple Health data, and an AI agent that combined them. It broke whenever any link in that chain did (a lost file permission, a sleeping computer, a background-refresh setting). The design below tries to remove as many of those links as possible.

## Shape of the system

There are three parts: the iPhone app, a hosted backend, and one server function.

- **The app** is the only thing that can read Apple Health. Apple doesn't let any server read HealthKit, so the phone has to collect that data and send it on. Doing it every time the app opens, rather than on a schedule, means there's no background job to fail silently.
- **The backend** (Supabase) is a Postgres database with built-in sign-in, file storage and serverless functions. Each piece of data is a plain row tagged with where it came from, so sources can be added without reshaping anything.
- **The screenshot parser** runs on the server rather than in the app so the AI API key never ships inside the app, where anyone could extract it.

## Why Expo / React Native rather than native Swift

Swift would give the tightest Apple Health integration, but it's iOS-only and slower to iterate on. Expo gives one TypeScript codebase that can later become an Android app and share code with a web dashboard, and its cloud build service (EAS) means no one needs Xcode to ship. The cost is that Apple Health requires a "development build" instead of the quick-preview Expo Go app, which is a one-time setup.

## Why Supabase rather than a custom backend or Firebase

Supabase is plain Postgres, so the data stays in a standard, portable database queried with SQL, which suits a product whose value is reports across time. Row-level security puts the "users only see their own data" rule in the database itself rather than relying on every screen to filter correctly. Firebase would also work, but its document model makes the cross-table weekly summaries awkward.

## Why one row per source instead of one row per day

It would be simpler to store a single "day" record. But a day's numbers can arrive from several places (a screenshot, a manual correction, a future integration) and at different times. Keeping each input as its own tagged row, and computing daily totals in a view, means nothing is overwritten, corrections are traceable, and a new source is just a new tag value.

## Where Vercel fits

Nowhere yet. Supabase covers everything the app needs. Vercel becomes useful for a marketing site and a web dashboard; it's deferred because its free plan doesn't allow commercial use.

## Related
- [How syncing avoids duplicates](sync-and-deduplication.md)
- [Privacy and health data](privacy.md)
