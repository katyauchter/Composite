# Explanation: How syncing avoids duplicates

Composite re-reads the last few days of Apple Health every time the app opens, and the same screenshot can be parsed more than once. Without care, that would multiply every workout and weigh-in.

The rule that prevents this: **every record from an outside system carries that system's own ID**, stored as `external_id`, and the database refuses a second row with the same user, source and ID. Saving is an "upsert": insert if new, update if already there. So syncing the same week ten times leaves exactly one copy of each workout.

- **Apple Health** gives every sample and workout a permanent UUID; that becomes the `external_id`.
- **Screenshots** use `screenshot:<id>`, so re-parsing a screenshot replaces its entry instead of adding another.
- **Manual entries** have no outside ID and are always new rows, which is intended: two snacks are two entries.

Daily steps and active energy work differently. Apple Health may hold overlapping step counts from both an iPhone and an Apple Watch; summing raw samples would double-count. Composite asks HealthKit for its own daily statistics, which already merge overlapping sources, and stores one row per day per source.

### Why re-sync recent days at all

Data arrives late. A watch may sync hours after a workout, or a scale reading may be edited. Re-reading a short window on every open catches these late changes at little cost, and the upsert rule makes it safe.

### Known limitation

If a sample is *deleted* in Apple Health, Composite doesn't currently remove its copy. HealthKit's anchored queries report deletions and are the planned fix.
