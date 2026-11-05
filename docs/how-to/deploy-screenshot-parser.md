# How to deploy or update the screenshot parser

The parser is the Supabase Edge Function in `supabase/functions/parse-screenshot/`.

**Prerequisites:** the project is linked (`npx supabase link`), and you have an Anthropic API key.

1. Set the secrets (first time, or when rotating the key):
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   # optional: pin a different model
   npx supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5-5
   ```
2. Deploy:
   ```bash
   npx supabase functions deploy parse-screenshot
   ```
3. Test: in the app, **Log → Choose screenshot**, and pick a screenshot of a day's totals. The parsed numbers appear under the button.

**If it fails:** check **Supabase → Edge Functions → parse-screenshot → Logs**, and the `error` column on the row in the `screenshots` table.

**To change what it extracts:** edit `PROMPT` in `index.ts` and redeploy. If you add a new field, add a column with [a schema change](change-the-schema.md) or put it in `extra`.
