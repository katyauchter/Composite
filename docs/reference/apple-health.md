# Reference: Apple Health data

Library: `@kingstinct/react-native-healthkit`. Code: `src/lib/health.ts`. Read-only; Composite writes nothing to Apple Health.

| HealthKit type | Stored in | Unit stored | Notes |
|---|---|---|---|
| `HKQuantityTypeIdentifierBodyMass` | `body_metrics.weight_kg` | kg | each sample |
| `HKQuantityTypeIdentifierBodyFatPercentage` | `body_metrics.body_fat_pct` | percent | fraction × 100 |
| `HKQuantityTypeIdentifierLeanBodyMass` | `body_metrics.lean_mass_kg` | kg | each sample |
| `HKQuantityTypeIdentifierBodyMassIndex` | `body_metrics.bmi` | count | each sample |
| `HKWorkoutTypeIdentifier` | `workouts` | min, kcal, m | each workout |
| `HKQuantityTypeIdentifierStepCount` | `daily_activity.steps` | count | daily sum |
| `HKQuantityTypeIdentifierActiveEnergyBurned` | `daily_activity.active_energy_kcal` | kcal | daily sum |

## Sync triggers

| Trigger | Days synced |
|---|---|
| Opening the app (Today tab focus) | last 3 |
| Health → Sync last 14 days | 14 |
| Health → Backfill last 90 days | 90 |

## Permission strings (`app.json`)

| Key | Text |
|---|---|
| `NSHealthShareUsageDescription` | Composite reads your workouts, weight and body composition to build your daily and weekly health picture. |
| `NSHealthUpdateUsageDescription` | Composite can save nutrition you log to Apple Health. |
