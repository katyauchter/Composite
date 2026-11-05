# Composite

Nutrition, training and body composition in one place. Expo (React Native) app + Supabase backend.

## What's here

- `src/app/` – screens (Expo Router): sign-in, Today, Log, Health
- `src/lib/health.ts` – Apple Health sync (weight, body fat, lean mass, BMI, workouts, steps, active energy)
- `supabase/migrations/` – database schema with row-level security
- `supabase/functions/parse-screenshot/` – reads a nutrition screenshot with Claude and logs the day's totals

## Setup

1. **Supabase** – create a project in an **EU region**. Then:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npx supabase db push                                   # creates tables, policies, storage bucket
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   npx supabase functions deploy parse-screenshot
   ```
   In Supabase → Authentication → Email, set the email template to send the 6-digit code (`{{ .Token }}`).
2. **Env** – `cp .env.example .env` and fill in the project URL and anon key.
3. **Install** – `npm install`
4. **Run on your iPhone** (Apple Health needs a development build, not Expo Go):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --profile development --platform ios
   npx expo start --dev-client
   ```

## Checks

```bash
npm run typecheck
```
