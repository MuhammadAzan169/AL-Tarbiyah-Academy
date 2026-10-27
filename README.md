# Al Tarbiyah

An online Islamic Studies academy for children in Grades 1–6. The website explains the programme, collects detailed parent interest surveys, and provides role-based workspaces for academy staff, teachers and families.

## What is implemented

- Responsive public site with grade themes, class information, a sample lesson rhythm, parent guidance, frequently asked questions and a teacher application. Layouts are tuned for phones, tablets and desktop screens, with reduced-motion support.
- A short Qur’an passage and a sahih hadith on the homepage, with Arabic, English wording and links to the full references ([Qur’an 20:114](https://quran.com/20/114) and [Sahih al-Bukhari 5027](https://sunnah.com/bukhari:5027)).
- Parent interest survey based on the supplied questionnaire. Additional children repeat the age, grade and English-language questions. Each published form has a shareable `/survey/<slug>` URL and an editable QR design for PNG or SVG download.
- Admin form builder, response review and CSV export, child enrollments, class groups, teacher and student account assignment, manual payment ledger, and teacher applications.
- Influencer codes and individual commission percentages. Links use `/survey/<slug>?ref=<CODE>` and can be shared as editable QR artwork. Codes and future rates can be edited in admin. The code is resolved in the database when a form is submitted; the rate is copied to the enrollment so later edits do not rewrite past commissions. The dashboard estimates one commission per student from that enrollment's first paid record. After changing a form slug or influencer code, distribute the new URL or QR code; previously printed QR codes still point to their original destination.
- Admin metrics for interested children, enrollments, students with paid records, referral sources, recorded revenue and commission balances.
- Separate admin, teacher, parent and student portals with role-specific navigation. Teachers can create classes, plan a weekly timetable and live lessons, mark attendance for each learner in each class, assign homework, create exams, grade submissions, write progress notes and announce class updates. Parents see the timetable, post-class summaries, attendance, homework, results, progress, news and manual payment records. Students submit homework and exams from their own workspace.
- Supabase Google OAuth and email magic-link sign-in, with database row-level security. Public sign-in at `/login` offers parent, student and teacher demo previews. Admin sign-in and demo are available only from the direct `/admin/login` URL; that route is not linked from the public site. The URL is not a security boundary: the real admin portal checks the database role. One-click **interactive demo previews** use sample records shared between school roles in browser storage. Sign out to choose a different demo role. The admin demo also previews forms, QR designs and influencer links. Use **Reset sample data** in the admin demo to start over. Demo records cannot write to real records.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

The public site and interactive demo previews render without Supabase. Form submission, teacher applications, real sign-in and the real portals require a connected Supabase project.

## Connect Supabase

1. Create a Supabase project. In its SQL editor, run [`supabase/migrations/202610230001_academy.sql`](supabase/migrations/202610230001_academy.sql), then [`supabase/migrations/202610230002_school_portal.sql`](supabase/migrations/202610230002_school_portal.sql), then [`supabase/migrations/202610260003_qr_settings.sql`](supabase/migrations/202610260003_qr_settings.sql), in that order. Apply each migration once.
2. Copy the project URL and **publishable/anon** key to `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put a service-role key in a `VITE_` variable.
3. In Supabase Authentication, enable Google and add your Google OAuth client ID and secret. Set the Site URL and add both local and production `/login` **and** `/admin/login` URLs to the redirect allow list. Email magic links require a working email provider in production.
4. Visit `/admin/login` directly and sign in once with the intended admin email. Then run this **one-time** SQL in the Supabase SQL editor, replacing the address:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where lower(email) = lower('owner@example.com'));
   ```

5. Sign out and back in. You can now use `/portal/admin` to create forms, codes, classes, enrollments and payment records. For teachers, review the public application, ask the applicant to sign in, then use **Grant teacher role** in the admin workspace. For a student, create an enrollment, enter a learner name and unique student login email, ask the student to sign in once, then use **Grant student access**. Student accounts should use an email separate from the parent's account.
6. Set the two `VITE_` environment variables in your deployment platform and redeploy. Use the production domain in Supabase's Auth URL settings.

The seeded parent form is at `/survey/parent-interest`. The URL is shareable after deployment; `localhost` links work only on your computer.

## Important operational boundaries

- Payments and influencer payouts are **manual records**. This app does not charge cards or transfer money. Record a payment as paid only after confirming it outside the app.
- Survey submission expresses interest; it does not guarantee a place. Fees and final class schedules need to be set by the academy.
- The RLS policies protect real school records. Student accounts see only the enrollment linked to their login email; parents see records for the email used in the survey. Demo previews use sample browser data only. The Supabase anon key is safe to expose because access is governed by RLS; keep service-role credentials server-side and out of this project.
- Before collecting real families' information, replace the example contact/domain values in `src/config/brand.ts`, add your approved privacy and retention terms, and configure a production email sender. Review the child-data rules for the countries where you operate.

## Checks

```bash
npx tsc --noEmit
npm run build
```
