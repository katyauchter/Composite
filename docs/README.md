# Composite documentation

Organized with [Diátaxis](https://diataxis.fr/). Each page is exactly one type; if a page starts doing another type's job, that content belongs on a different page.

## Tutorials: learning by doing
- [Your first day of data in Composite](tutorials/first-day-of-data.md)

## How-to guides: getting a task done
- [Set up the Supabase backend](how-to/set-up-supabase.md)
- [Install a development build on your iPhone](how-to/install-on-iphone.md)
- [Deploy or update the screenshot parser](how-to/deploy-screenshot-parser.md)
- [Change the database schema](how-to/change-the-schema.md)

## Reference: facts to look up
- [Database](reference/database.md)
- [Environment variables and secrets](reference/environment.md)
- [Apple Health data](reference/apple-health.md)
- [Project structure and scripts](reference/project-structure.md)

## Explanation: understanding the design
- [Product scope and the modular report](explanation/product-scope.md)
- [Architecture and stack choices](explanation/architecture.md)
- [How syncing avoids duplicates](explanation/sync-and-deduplication.md)
- [Privacy and health data](explanation/privacy.md)

## Writing new docs
Before adding a page, decide its type with two questions:
1. Is the reader **acting** (tutorial, how-to) or **seeking knowledge** (reference, explanation)?
2. Are they **learning** (tutorial, explanation) or **working** (how-to, reference)?

Then follow that type's rules:
- **Tutorial**: one guaranteed path to a visible result for a newcomer. Steps only, no detours or options, minimal explanation (link to explanation instead).
- **How-to**: a goal-titled recipe ("How to …") for someone who already knows the basics. Steps, prerequisites and branches are fine; teaching is not.
- **Reference**: neutral, complete, structured like the code it describes (tables, lists). No instructions, no opinions.
- **Explanation**: the why: context, trade-offs, alternatives considered. No step-by-step instructions.
