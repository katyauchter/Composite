# Explanation: Privacy and health data

Body weight, body fat and workouts are health data. Under GDPR, health data is a "special category" with stricter rules, and Apple adds its own rules for anything read from HealthKit. Several design choices follow from that.

**EU hosting.** The database lives in an EU region because the product's first users are in the EU and moving a live database between regions later is disruptive. Keeping data in the EU simplifies GDPR obligations around international transfers.

**Isolation in the database, not the app.** Row-level security means the database itself refuses to return another user's rows, even if a bug in the app asked for them. Screenshots follow the same rule through per-user storage folders.

**Keys stay on the server.** The app ships only the Supabase "anon" key, which is designed to be public and can do nothing beyond what row-level security allows. The AI API key lives only in server secrets.

**Apple's HealthKit rules.** HealthKit data can't be used for advertising or sold, and apps that read it must have a privacy policy. Apple also requires that people can delete their account from inside the app. These aren't built yet; they're required before a public TestFlight beta.

**Collect only what's shown.** Composite reads only the Health types it displays (see [Apple Health data](../reference/apple-health.md)). Each new type is a deliberate addition with its own permission prompt, not a blanket grant.
