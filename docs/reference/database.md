# Reference: Database

Postgres on Supabase. Defined in `supabase/migrations/`. Every table has row-level security; each user can only read and write rows where `user_id = auth.uid()` (`profiles`: `id = auth.uid()`).

## Enum `data_source`
`manual` · `screenshot` · `csv` · `apple_health` · `integration`

## `profiles`
Created automatically on sign-up (trigger `on_auth_user_created`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | = `auth.users.id` |
| `display_name` | text | |
| `timezone` | text | default `UTC` |
| `target_calories` | integer | |
| `target_protein_g`, `target_carbs_g`, `target_fat_g` | numeric(6,1) | |
| `created_at`, `updated_at` | timestamptz | |

## `nutrition_entries`
One row per logged entry. Unique on `(user_id, source, external_id)`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | |
| `day` | date | local calendar day |
| `source` | data_source | default `manual` |
| `label` | text | e.g. `Daily total`, `Manual entry` |
| `calories` | numeric(7,1) | kcal |
| `protein_g`, `carbs_g`, `fat_g` | numeric(6,1) | grams |
| `extra` | jsonb | source-specific details, e.g. parser confidence |
| `screenshot_id` | uuid | → `screenshots.id` |
| `external_id` | text | screenshot entries: `screenshot:<screenshots.id>` |

## `body_metrics`
One row per measurement. Unique on `(user_id, source, external_id)`.

| Column | Type | Notes |
|---|---|---|
| `metric` | text | `weight_kg` · `body_fat_pct` · `lean_mass_kg` · `bmi` · `waist_cm` |
| `value` | numeric(8,3) | body fat stored as percent (26.0), not fraction |
| `measured_at` | timestamptz | |
| `source` | data_source | |
| `external_id` | text | HealthKit sample UUID |

## `workouts`
Unique on `(user_id, source, external_id)`.

| Column | Type | Notes |
|---|---|---|
| `activity_type` | text | HealthKit activity name, e.g. `running`, `traditionalStrengthTraining` |
| `started_at`, `ended_at` | timestamptz | |
| `duration_min` | numeric(7,1) | |
| `energy_kcal` | numeric(7,1) | |
| `distance_m` | numeric(9,1) | |
| `avg_heart_rate` | numeric(5,1) | not yet populated |
| `external_id` | text | HealthKit workout UUID |

## `daily_activity`
Primary key `(user_id, day, source)`.

| Column | Type |
|---|---|
| `day` | date |
| `steps` | integer |
| `active_energy_kcal` | numeric(7,1) |
| `updated_at` | timestamptz |

## `screenshots`

| Column | Type | Notes |
|---|---|---|
| `day` | date | day the screenshot is for |
| `storage_path` | text | `<user_id>/<day>/<timestamp>.<ext>` in bucket `screenshots` |
| `status` | text | `pending` · `parsed` · `failed` |
| `parsed` | jsonb | raw parser output |
| `error` | text | |

## View `daily_summary`
`security_invoker`, so row-level security applies. One row per user per day that has nutrition or activity.

| Column | Source |
|---|---|
| `day` | |
| `calories`, `protein_g`, `carbs_g`, `fat_g` | sum of `nutrition_entries` |
| `steps`, `active_energy_kcal` | max across `daily_activity` sources |

## Storage
Bucket `screenshots` (private). Policy: a user may access objects whose first path segment is their user ID.
