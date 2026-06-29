# Supabase Setup For Meditation Portal

Linking Supabase to GitHub does not automatically configure local `.env.local`, apply SQL migrations, or deploy Edge Functions. Do these steps once per Supabase project.

## 1. Add Environment Variables

In Supabase, open **Project Settings > API** and copy:

- Project URL
- anon public key
- service_role key

Add these to `.env.local`:

```bash
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SITE_URL=http://localhost:8080

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SITE_URL=http://localhost:8080
```

Restart `npm run dev` after changing env vars.

## 2. Apply The Database Schema

Open **Supabase > SQL Editor**, paste the full contents of:

```text
supabase/migrations/202606280001_meditation_accountability.sql
```

Run it once. This creates the cohort, member, buddy, content, practice log, streak, progress, notification, RLS, and trigger logic.

## 3. Configure Auth URLs

Open **Authentication > URL Configuration**:

- Site URL: `http://localhost:8080`
- Redirect URLs:
  - `http://localhost:8080/dashboard`
  - `http://localhost:8080/login`

For production, add the production versions too.

## 4. Create Chris As Admin

In **Authentication > Users**, create/invite your admin user.

Then in **Table Editor > members**, add a row:

```text
id: the auth.users id for Chris
email: Chris's email
full_name: Chris Soll
timezone: Australia/Sydney or the correct timezone
role: admin
onboarded: true
```

After that, Chris can log in at `/login` and open `/admin`.

## 5. Deploy Edge Functions

Deploy these functions from the Supabase CLI or Supabase dashboard workflow:

```text
auto-pair-cohort
practice-log-inserted
send-reminders
weekly-summary
```

Then create a Database Webhook:

- Table: `practice_logs`
- Event: Insert
- Function/URL: `practice-log-inserted`

## 6. Minimal Test Flow

1. Start the app: `npm run dev`
2. Open `http://localhost:8080/login`
3. Sign in as Chris.
4. Open `/admin`.
5. Create a cohort.
6. Add two test members.
7. Add Day 1 audio content.
8. Click auto-pair.
9. Sign in as each member in separate browsers/incognito windows.
10. Complete the Day 1 audio past 90% for both members.
11. Confirm the streak increments and Day 2 unlock behavior is queued.

## Current Email Limitation

Supabase Auth can send invite, OTP, and password reset emails. Buddy nudges, missed-day reminders, and weekly summaries are queued in `notification_events` for now. The notification adapter is isolated so SMTP, Resend, SendGrid, or Twilio SMS can be added later without restructuring the portal.
