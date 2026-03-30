# SUPERNOVA Admin Engine

`СУПЕРНОВА | ЯПОН УЛСЫН ЖИШИГ ЭМНЭЛЭГ` төслийн энэ хувилбар нь `Next.js App Router + TypeScript + Tailwind CSS + Supabase` дээр суурилсан бөгөөд Super Admin dashboard-ийг системийн үндсэн өгөгдлийн хөдөлгүүр болгож зохион байгуулсан.

## Гол зарчим

- Public landing, diagnosis, result, appointment, consultation урсгалууд Supabase дахь admin-managed өгөгдлөөс уншина.
- CRM рүү орж буй лид, үнэлгээ, цаг, зөвлөгөөний хүсэлтүүд нь хоорондоо холбоотой relational өгөгдөл байна.
- Super Admin dashboard нь CMS, эмч, үйлчилгээ, багц, урамшуулал, diagnosis систем, CRM notes/status-ийг нэг төвөөс удирдана.
- Next.js 16.2.1 ашиглаж байгаа тул `proxy.ts`, async `searchParams`, `turbopack.root` зэрэг шинэ конвенцуудыг дагаж байгаа.

## Tech stack

- `next@16.2.1`
- `react@19`
- `typescript`
- `tailwindcss@4`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `xlsx`

## Route structure

### Public

- `/`
- `/check`
- `/result`
- `/appointment`
- `/consultation`

### Dashboards

- `/dashboard`
- `/dashboard/admin`
- `/dashboard/admin/accounts`
- `/dashboard/admin/cms`
- `/dashboard/admin/doctors`
- `/dashboard/admin/services`
- `/dashboard/admin/packages`
- `/dashboard/admin/promotions`
- `/dashboard/admin/diagnosis`
- `/dashboard/admin/crm`
- `/dashboard/assistant`
- `/dashboard/doctor`

## Key implementation files

- [app/dashboard/admin/actions.ts](/Users/pc/supernova.mn/app/dashboard/admin/actions.ts)
- [lib/admin/data.ts](/Users/pc/supernova.mn/lib/admin/data.ts)
- [lib/admin/auth.ts](/Users/pc/supernova.mn/lib/admin/auth.ts)
- [lib/public/data.ts](/Users/pc/supernova.mn/lib/public/data.ts)
- [app/actions/public.ts](/Users/pc/supernova.mn/app/actions/public.ts)
- [supabase/schema.sql](/Users/pc/supernova.mn/supabase/schema.sql)
- [supabase/schema-v2.sql](/Users/pc/supernova.mn/supabase/schema-v2.sql)
- [supabase/schema-v3.sql](/Users/pc/supernova.mn/supabase/schema-v3.sql)
- [supabase/schema-v4.sql](/Users/pc/supernova.mn/supabase/schema-v4.sql)
- [supabase/seed.sql](/Users/pc/supernova.mn/supabase/seed.sql)
- [supabase/seed-v2.sql](/Users/pc/supernova.mn/supabase/seed-v2.sql)
- [supabase/seed-v3.sql](/Users/pc/supernova.mn/supabase/seed-v3.sql)
- [supabase/seed-v4.sql](/Users/pc/supernova.mn/supabase/seed-v4.sql)
- [scripts/backfill-live-seed-v4.mjs](/Users/pc/supernova.mn/scripts/backfill-live-seed-v4.mjs)

## Data model

### Core relations

- `services.category_id -> service_categories.id`
- `doctor_services.doctor_id -> doctors.id`
- `doctor_services.service_id -> services.id`
- `service_packages <-> services` through `package_services`
- `promotions.service_id -> services.id`
- `promotions.package_id -> service_packages.id`
- `questions.category_id -> symptom_categories.id`
- `answer_options.question_id -> questions.id`
- `assessments.lead_id -> leads.id`
- `assessment_answers.assessment_id -> assessments.id`
- `assessment_answers.question_id -> questions.id`
- `appointments.lead_id -> leads.id`
- `appointments.doctor_id -> doctors.id`
- `appointments.service_id -> services.id`
- `consultation_requests.lead_id -> leads.id`
- `doctor_responses.consultation_id -> consultation_requests.id`
- `crm_notes.lead_id -> leads.id`

### CMS-driven public content

- `landing_page_content`: hero, about, technology, values, privacy, result-copy
- `contact_settings`: phone, email, address, map
- `social_links`
- `working_hours`

## Admin architecture

### Shared admin layer

- `lib/admin/auth.ts`: dashboard viewer lookup, role checks, redirects
- `lib/admin/data.ts`: server-side data loaders for each module
- `app/dashboard/admin/actions.ts`: server actions for full CRUD and CRM status updates

### Reusable admin UI

- `components/admin/AdminPrimitives.tsx`
- `components/admin/useServerAction.ts`
- `components/admin/*Manager.tsx`

### Public data bridge

- `lib/public/data.ts` reads CMS, doctors, services, packages, promotions, diagnosis configuration
- `app/actions/public.ts` writes leads, assessments, assessment_answers, appointments, consultation_requests
- Public pages receive preloaded server data and client flow components submit into Supabase-backed CRM tables

## Supabase setup

Run SQL in this order:

1. [supabase/schema.sql](/Users/pc/supernova.mn/supabase/schema.sql)
2. [supabase/schema-v2.sql](/Users/pc/supernova.mn/supabase/schema-v2.sql)
3. [supabase/schema-v3.sql](/Users/pc/supernova.mn/supabase/schema-v3.sql)
4. [supabase/schema-v4.sql](/Users/pc/supernova.mn/supabase/schema-v4.sql)
5. [supabase/seed.sql](/Users/pc/supernova.mn/supabase/seed.sql)
6. [supabase/seed-v2.sql](/Users/pc/supernova.mn/supabase/seed-v2.sql)
7. [supabase/seed-v3.sql](/Users/pc/supernova.mn/supabase/seed-v3.sql)
8. [supabase/seed-v4.sql](/Users/pc/supernova.mn/supabase/seed-v4.sql)

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

For authenticated staff routes, Supabase Auth users must also have matching rows in `profiles` with one of:

- `office_assistant`
- `doctor`
- `super_admin`

## Local development

```bash
npm install
npm run dev
```

If the schema is already present but relationship/seed data is incomplete, run:

```bash
npm run db:backfill
```

## Verification

Used during this implementation:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Current lint output still includes 2 legacy warnings in unrelated old symptom pages:

- [app/results/page.tsx](/Users/pc/supernova.mn/app/results/page.tsx)
- [app/symptoms/[bodyPart]/page.tsx](/Users/pc/supernova.mn/app/symptoms/[bodyPart]/page.tsx)

## Notes

- `proxy.ts` is used instead of `middleware.ts`, per Next 16 guidance.
- `app/layout.tsx` includes `data-scroll-behavior="smooth"` for smooth anchor scrolling.
- `next.config.ts` sets `turbopack.root` explicitly to avoid wrong workspace-root inference in environments with multiple lockfiles.
