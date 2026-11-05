# Tutorial: Your first day of data in Composite

In this tutorial you'll get Composite running on your iPhone, sign in, pull in your Apple Health data, and log a day of nutrition. At the end, the **Today** screen will show your calories, macros, steps and latest weight.

It takes about an hour, most of it waiting for the first iPhone build.

**You'll need:** a Mac or PC with Node.js 22+, an iPhone with the Health app, an Apple Developer account, and free accounts at [supabase.com](https://supabase.com) and [expo.dev](https://expo.dev).

## 1. Get the code

```bash
git clone https://github.com/katyauchter/Composite.git
cd Composite
npm install
```

## 2. Create the backend

1. In Supabase, click **New project**. Name it `composite` and choose the region **Central EU (Frankfurt)**.
2. When it's ready, run:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   You'll see the migration `20261105000000_init.sql` applied.

## 3. Connect the app to the backend

1. In Supabase, open **Project Settings → API**.
2. Run `cp .env.example .env` and paste the **Project URL** and **anon public** key into `.env`.

## 4. Turn on email codes

In Supabase, open **Authentication → Email Templates → Magic Link** and replace the body with:

```
Your Composite code is {{ .Token }}
```

Save.

## 5. Build the app for your iPhone

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform ios
```

Answer **Yes** when it asks to log in to your Apple account and to register your device. When the build finishes, scan the QR code with your iPhone camera and install it.

## 6. Start the app

```bash
npx expo start --dev-client
```

Open **Composite** on your iPhone. It connects to your computer.

## 7. Sign in

Enter your email and tap **Email me a code**. Type the 6-digit code from the email and tap **Sign in**. You land on **Today**, mostly showing dashes.

## 8. Bring in Apple Health

1. Tap the **Health** tab, then **Connect Apple Health**.
2. In Apple's sheet, tap **Turn On All**, then **Allow**.
3. Tap **Backfill last 90 days**.

You'll see a line like "Synced 41 body measurements, 23 workouts and 91 days of activity."

## 9. Log today's nutrition

1. Tap the **Log** tab.
2. Under **Enter manually**, type your calories, protein, carbs and fat so far today.
3. Tap **Save**.

## 10. See your day

Tap **Today**. Your nutrition, steps, active energy, workouts this week, weight and body fat are all on one screen.

You've gone from an empty project to your first day of data in Composite.

**Next:**
- Read screenshots automatically: [Deploy the screenshot parser](../how-to/deploy-screenshot-parser.md)
- Understand what you just built: [Architecture and stack choices](../explanation/architecture.md)
