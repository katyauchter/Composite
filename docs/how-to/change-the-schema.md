# How to change the database schema

Never edit tables by hand in the Supabase dashboard; the migration files are the source of truth.

1. Create a new migration:
   ```bash
   npx supabase migration new <short_description>
   ```
2. Write the SQL in the new file under `supabase/migrations/`. For a new user-owned table, include:
   - `user_id uuid not null default auth.uid() references auth.users (id) on delete cascade`
   - `alter table … enable row level security;`
   - a policy `for all using (user_id = auth.uid()) with check (user_id = auth.uid())`
3. Apply it: `npx supabase db push`
4. Update [reference/database.md](../reference/database.md) in the same commit.
