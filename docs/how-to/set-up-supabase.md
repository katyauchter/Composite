# How to set up the Supabase backend

Use this when creating a new environment (for example a second, staging project) or rebuilding one.

**Prerequisites:** a Supabase account and the repo cloned with `npm install` done.

1. Create a project in an **EU region** (see [Privacy and health data](../explanation/privacy.md) for why).
2. Link and apply the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. Set the email template so sign-in sends a code: **Authentication → Email Templates → Magic Link**, body containing `{{ .Token }}`.
4. Copy **Project URL** and **anon** key into `.env` (see [Environment variables](../reference/environment.md)).
5. Optional, for screenshots: [deploy the screenshot parser](deploy-screenshot-parser.md).

**Check it worked:** in Supabase **Table Editor**, you should see `profiles`, `nutrition_entries`, `body_metrics`, `workouts`, `daily_activity` and `screenshots`, and a private `screenshots` bucket under **Storage**.
