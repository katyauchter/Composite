# Reference: Environment variables and secrets

## App (`.env`, read at build time)

| Variable | Required | Value |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Supabase → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase → Project Settings → API → anon public key |

`EXPO_PUBLIC_` values are bundled into the app and are not secret. `.env` is git-ignored; `.env.example` is the template.

## Edge Function secrets (`npx supabase secrets set`)

| Secret | Required | Default | Used by |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | | `parse-screenshot` |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-5-5` | `parse-screenshot` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | set by Supabase | | `parse-screenshot` |
