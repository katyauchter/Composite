# Explanation: Product scope and the modular report

Composite is built around one idea: **the weekly report is assembled from whatever data a person chooses to send.** Someone who logs only workouts still gets a useful report; someone who logs nutrition, steps, workouts and weigh-ins gets the full picture.

## Data streams, not a fixed form

People track different things with different tools. Rather than one form every user must fill, Composite treats data as independent **streams**: body, nutrition, steps, workouts and energy burn. Each stream can be on or off and has its own source (Apple Health, screenshot, manual entry, CSV, and later integrations). This is why every table records a `source`, and why Apple Health permission is only requested for the streams a user turns on.

## Sections that turn on from data

The report is a catalog of sections. Each section declares the inputs it *requires* (hidden without them) and the inputs that are *optional* (they add detail). A user who sends nutrition but no burn data gets a macros section but no energy-balance section, and never sees an empty chart. Users can reorder sections and pick one or two **deep dives** (running, strength, walking, cycling, yoga) for the activity they care about most.

## Why setup asks about the starting point first

Suggested calorie and macro targets only make sense relative to where someone is and where they want to go. So setup asks for current weight (pre-filled from body data when available), goal, target and pace *before* suggesting targets, and checks that the pace is realistic. Targets read directly from a source (for example a coaching app screenshot showing the day's target) take priority over suggestions.

## Why everything is stored in metric

Users choose lb or kg and mi or km, but values are stored in kg, metres and kcal. Display units can change at any time without rewriting or misreading history.

## What's deliberately deferred

Meal-level food data and exercise-level strength data (sets, reps, weight) are planned as future milestones. Apple Health doesn't record sets and reps, so the first strength deep dive works from session-level data only. Both future additions attach to existing tables rather than replacing them.

The working build plan lives in Notion (Composite — Build Plan).
