begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.record_status as enum ('draft', 'ready', 'archived', 'error');
create type public.profile_status as enum ('active', 'suspended');
create type public.curriculum_code as enum ('MATATAG', 'ILAW');
create type public.lesson_plan_type as enum ('DETAILED', 'SEMI_DETAILED', 'DAILY_LOG');
create type public.resource_extraction_status as enum (
  'pending',
  'processing',
  'complete',
  'truncated',
  'failed'
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  school_name text,
  avatar_path text,
  status public.profile_status not null default 'active',
  schema_version text not null default '1.0',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 120),
  constraint profiles_school_name_length check (school_name is null or char_length(school_name) <= 180),
  constraint profiles_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint profiles_preferences_object check (jsonb_typeof(preferences) = 'object')
);

create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  curriculum public.curriculum_code not null,
  lesson_type public.lesson_plan_type not null,
  grade_level text not null,
  subject text not null,
  quarter text not null,
  topic text not null,
  status public.record_status not null default 'draft',
  schema_version text not null default '1.0',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_plans_id_user_key unique (id, user_id),
  constraint lesson_plans_title_length check (char_length(title) between 1 and 200),
  constraint lesson_plans_grade_length check (char_length(grade_level) between 1 and 40),
  constraint lesson_plans_subject_length check (char_length(subject) between 1 and 120),
  constraint lesson_plans_quarter_length check (char_length(quarter) between 1 and 20),
  constraint lesson_plans_topic_length check (char_length(topic) between 1 and 200),
  constraint lesson_plans_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint lesson_plans_content_object check (jsonb_typeof(content) = 'object')
);

create table public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_plan_id uuid not null,
  title text not null,
  theme text not null,
  slide_count integer not null default 0,
  status public.record_status not null default 'draft',
  schema_version text not null default '1.0',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentations_lesson_owner_fk
    foreign key (lesson_plan_id, user_id)
    references public.lesson_plans (id, user_id)
    on delete cascade,
  constraint presentations_title_length check (char_length(title) between 1 and 200),
  constraint presentations_theme_length check (char_length(theme) between 1 and 80),
  constraint presentations_slide_count_nonnegative check (slide_count >= 0),
  constraint presentations_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint presentations_content_object check (jsonb_typeof(content) = 'object')
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_plan_id uuid not null,
  title text not null,
  difficulty text not null,
  item_count integer not null default 0,
  status public.record_status not null default 'draft',
  schema_version text not null default '1.0',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_lesson_owner_fk
    foreign key (lesson_plan_id, user_id)
    references public.lesson_plans (id, user_id)
    on delete cascade,
  constraint assessments_title_length check (char_length(title) between 1 and 200),
  constraint assessments_difficulty_allowed check (difficulty in ('easy', 'average', 'difficult')),
  constraint assessments_item_count_nonnegative check (item_count >= 0),
  constraint assessments_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint assessments_content_object check (jsonb_typeof(content) = 'object')
);

create table public.worksheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_plan_id uuid not null,
  title text not null,
  difficulty text not null,
  item_count integer not null default 0,
  status public.record_status not null default 'draft',
  schema_version text not null default '1.0',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worksheets_lesson_owner_fk
    foreign key (lesson_plan_id, user_id)
    references public.lesson_plans (id, user_id)
    on delete cascade,
  constraint worksheets_title_length check (char_length(title) between 1 and 200),
  constraint worksheets_difficulty_allowed check (difficulty in ('easy', 'average', 'difficult')),
  constraint worksheets_item_count_nonnegative check (item_count >= 0),
  constraint worksheets_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint worksheets_content_object check (jsonb_typeof(content) = 'object')
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_lesson_id uuid,
  name text not null,
  description text not null default '',
  curriculum public.curriculum_code not null,
  grade_level text not null,
  subject text not null,
  status public.record_status not null default 'ready',
  schema_version text not null default '1.0',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_source_lesson_owner_fk
    foreign key (source_lesson_id, user_id)
    references public.lesson_plans (id, user_id)
    on delete set null (source_lesson_id),
  constraint templates_name_length check (char_length(name) between 2 and 80),
  constraint templates_description_length check (char_length(description) <= 240),
  constraint templates_grade_length check (char_length(grade_level) between 1 and 40),
  constraint templates_subject_length check (char_length(subject) between 1 and 120),
  constraint templates_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint templates_content_object check (jsonb_typeof(content) = 'object')
);

create table public.uploaded_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  mime_type text not null,
  byte_size bigint not null,
  extraction_status public.resource_extraction_status not null default 'pending',
  storage_bucket text,
  storage_path text,
  status public.record_status not null default 'draft',
  schema_version text not null default '1.0',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uploaded_resources_name_length check (char_length(name) between 1 and 255),
  constraint uploaded_resources_mime_length check (char_length(mime_type) between 1 and 160),
  constraint uploaded_resources_byte_size_nonnegative check (byte_size >= 0),
  constraint uploaded_resources_storage_pair check (
    (storage_bucket is null and storage_path is null)
    or (storage_bucket is not null and storage_path is not null)
  ),
  constraint uploaded_resources_schema_version_format check (schema_version ~ '^[0-9]+\.[0-9]+$'),
  constraint uploaded_resources_content_object check (jsonb_typeof(content) = 'object')
);

create index lesson_plans_user_updated_idx on public.lesson_plans (user_id, updated_at desc);
create index lesson_plans_search_metadata_idx
  on public.lesson_plans (user_id, curriculum, grade_level, subject, quarter);
create index lesson_plans_user_status_idx on public.lesson_plans (user_id, status);

create index presentations_lesson_idx on public.presentations (lesson_plan_id);
create index presentations_user_updated_idx on public.presentations (user_id, updated_at desc);
create index assessments_lesson_idx on public.assessments (lesson_plan_id);
create index assessments_user_updated_idx on public.assessments (user_id, updated_at desc);
create index worksheets_lesson_idx on public.worksheets (lesson_plan_id);
create index worksheets_user_updated_idx on public.worksheets (user_id, updated_at desc);
create index templates_user_updated_idx on public.templates (user_id, updated_at desc);
create index templates_search_metadata_idx on public.templates (user_id, curriculum, grade_level, subject);
create index templates_source_lesson_idx
  on public.templates (source_lesson_id, user_id)
  where source_lesson_id is not null;
create index uploaded_resources_user_updated_idx on public.uploaded_resources (user_id, updated_at desc);
create index uploaded_resources_user_type_idx on public.uploaded_resources (user_id, mime_type);
create index uploaded_resources_user_extraction_idx
  on public.uploaded_resources (user_id, extraction_status);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger lesson_plans_set_updated_at
before update on public.lesson_plans
for each row execute function private.set_updated_at();
create trigger presentations_set_updated_at
before update on public.presentations
for each row execute function private.set_updated_at();
create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function private.set_updated_at();
create trigger worksheets_set_updated_at
before update on public.worksheets
for each row execute function private.set_updated_at();
create trigger templates_set_updated_at
before update on public.templates
for each row execute function private.set_updated_at();
create trigger uploaded_resources_set_updated_at
before update on public.uploaded_resources
for each row execute function private.set_updated_at();

revoke all on function private.set_updated_at() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.presentations enable row level security;
alter table public.assessments enable row level security;
alter table public.worksheets enable row level security;
alter table public.templates enable row level security;
alter table public.uploaded_resources enable row level security;

alter table public.profiles force row level security;
alter table public.lesson_plans force row level security;
alter table public.presentations force row level security;
alter table public.assessments force row level security;
alter table public.worksheets force row level security;
alter table public.templates force row level security;
alter table public.uploaded_resources force row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "lesson_plans_select_own" on public.lesson_plans
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "lesson_plans_insert_own" on public.lesson_plans
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "lesson_plans_update_own" on public.lesson_plans
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "lesson_plans_delete_own" on public.lesson_plans
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "presentations_select_own" on public.presentations
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "presentations_insert_own" on public.presentations
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "presentations_update_own" on public.presentations
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "presentations_delete_own" on public.presentations
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "assessments_select_own" on public.assessments
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "assessments_insert_own" on public.assessments
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "assessments_update_own" on public.assessments
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "assessments_delete_own" on public.assessments
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "worksheets_select_own" on public.worksheets
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "worksheets_insert_own" on public.worksheets
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "worksheets_update_own" on public.worksheets
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "worksheets_delete_own" on public.worksheets
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "templates_select_own" on public.templates
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "templates_insert_own" on public.templates
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "templates_update_own" on public.templates
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "templates_delete_own" on public.templates
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "uploaded_resources_select_own" on public.uploaded_resources
for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "uploaded_resources_insert_own" on public.uploaded_resources
for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "uploaded_resources_update_own" on public.uploaded_resources
for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "uploaded_resources_delete_own" on public.uploaded_resources
for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke all on table public.profiles from anon;
revoke all on table public.lesson_plans from anon;
revoke all on table public.presentations from anon;
revoke all on table public.assessments from anon;
revoke all on table public.worksheets from anon;
revoke all on table public.templates from anon;
revoke all on table public.uploaded_resources from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.lesson_plans to authenticated;
grant select, insert, update, delete on table public.presentations to authenticated;
grant select, insert, update, delete on table public.assessments to authenticated;
grant select, insert, update, delete on table public.worksheets to authenticated;
grant select, insert, update, delete on table public.templates to authenticated;
grant select, insert, update, delete on table public.uploaded_resources to authenticated;

comment on column public.lesson_plans.content is
  'Versioned canonical LessonPlan JSON. Searchable lesson metadata remains in typed columns.';
comment on column public.presentations.content is
  'Versioned canonical Presentation JSON.';
comment on column public.assessments.content is
  'Versioned canonical Assessment JSON.';
comment on column public.worksheets.content is
  'Versioned canonical Worksheet JSON.';
comment on column public.templates.content is
  'Versioned provider-neutral LessonTemplate JSON.';
comment on column public.uploaded_resources.content is
  'Versioned bounded extraction record; never raw executable document content.';

commit;
