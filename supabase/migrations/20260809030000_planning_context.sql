begin;

create type public.schedule_entry_kind as enum (
  'lesson',
  'assessment',
  'teaching_pack',
  'other'
);

create type public.schedule_entry_status as enum (
  'planned',
  'completed',
  'cancelled'
);

alter table public.assessments
  add constraint assessments_id_user_key unique (id, user_id);

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind public.schedule_entry_kind not null,
  status public.schedule_entry_status not null default 'planned',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  subject text,
  notes text not null default '',
  lesson_plan_id uuid,
  assessment_id uuid,
  teaching_pack_lesson_id uuid,
  revision bigint not null default 1,
  schema_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_entries_title_length check (char_length(title) between 2 and 160),
  constraint schedule_entries_subject_length check (subject is null or char_length(subject) <= 120),
  constraint schedule_entries_notes_length check (char_length(notes) <= 500),
  constraint schedule_entries_time_order check (ends_at > starts_at),
  constraint schedule_entries_max_duration check (ends_at <= starts_at + interval '24 hours'),
  constraint schedule_entries_revision_positive check (revision > 0),
  constraint schedule_entries_schema_version check (schema_version = '1.0'),
  constraint schedule_entries_link_matches_kind check (
    (kind = 'lesson' and assessment_id is null and teaching_pack_lesson_id is null)
    or (kind = 'assessment' and lesson_plan_id is null and teaching_pack_lesson_id is null)
    or (kind = 'teaching_pack' and lesson_plan_id is null and assessment_id is null)
    or (kind = 'other' and lesson_plan_id is null and assessment_id is null and teaching_pack_lesson_id is null)
  ),
  constraint schedule_entries_lesson_owner_fk
    foreign key (lesson_plan_id, user_id)
    references public.lesson_plans (id, user_id)
    on delete set null (lesson_plan_id),
  constraint schedule_entries_assessment_owner_fk
    foreign key (assessment_id, user_id)
    references public.assessments (id, user_id)
    on delete set null (assessment_id),
  constraint schedule_entries_pack_lesson_owner_fk
    foreign key (teaching_pack_lesson_id, user_id)
    references public.lesson_plans (id, user_id)
    on delete set null (teaching_pack_lesson_id)
);

create index schedule_entries_user_start_idx
  on public.schedule_entries (user_id, starts_at);
create index schedule_entries_user_kind_start_idx
  on public.schedule_entries (user_id, kind, starts_at);
create index schedule_entries_user_status_start_idx
  on public.schedule_entries (user_id, status, starts_at);

create trigger schedule_entries_set_updated_at
before update on public.schedule_entries
for each row execute function private.bump_revision_and_updated_at();

alter table public.schedule_entries enable row level security;
alter table public.schedule_entries force row level security;

create policy "schedule_entries_select_own"
on public.schedule_entries for select to authenticated
using ((select auth.uid()) = user_id);

create policy "schedule_entries_insert_own"
on public.schedule_entries for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "schedule_entries_update_own"
on public.schedule_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "schedule_entries_delete_own"
on public.schedule_entries for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.schedule_entries from anon;
grant select, insert, update, delete on public.schedule_entries to authenticated;

create table public.classroom_contexts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  class_size text not null default 'standard',
  language text not null default 'english',
  available_resources text[] not null default array['chalkboard']::text[],
  learner_needs text[] not null default '{}'::text[],
  preferred_duration text not null default '60 mins',
  teacher_notes text not null default '',
  revision bigint not null default 1,
  schema_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classroom_contexts_class_size check (
    class_size in ('small', 'standard', 'large', 'overcrowded')
  ),
  constraint classroom_contexts_language check (
    language in ('english', 'filipino', 'bilingual', 'regional')
  ),
  constraint classroom_contexts_duration check (
    preferred_duration in ('45 mins', '50 mins', '60 mins', '90 mins', '2 hours')
  ),
  constraint classroom_contexts_resources_count check (
    cardinality(available_resources) between 1 and 4
  ),
  constraint classroom_contexts_resources_values check (
    available_resources <@ array['printables', 'chalkboard', 'projector', 'tech_lab']::text[]
  ),
  constraint classroom_contexts_needs_count check (cardinality(learner_needs) <= 6),
  constraint classroom_contexts_needs_values check (
    learner_needs <@ array[
      'reading_scaffolds',
      'language_scaffolds',
      'visual_supports',
      'step_by_step_instructions',
      'extension_activities',
      'movement_breaks'
    ]::text[]
  ),
  constraint classroom_contexts_notes_length check (char_length(teacher_notes) <= 400),
  constraint classroom_contexts_notes_not_sensitive check (
    teacher_notes !~* '([[:alnum:]._%+-]+@[[:alnum:].-]+[.][A-Za-z]{2,})|((\+?63|0)9[0-9]{9})|(diagnos(is|ed)|medical condition|student named|learner named|autis(m|tic)|adhd|home address|contact number)'
  ),
  constraint classroom_contexts_revision_positive check (revision > 0),
  constraint classroom_contexts_schema_version check (schema_version = '1.0')
);

create trigger classroom_contexts_set_updated_at
before update on public.classroom_contexts
for each row execute function private.bump_revision_and_updated_at();

alter table public.classroom_contexts enable row level security;
alter table public.classroom_contexts force row level security;

create policy "classroom_contexts_select_own"
on public.classroom_contexts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "classroom_contexts_insert_own"
on public.classroom_contexts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "classroom_contexts_update_own"
on public.classroom_contexts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "classroom_contexts_delete_own"
on public.classroom_contexts for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.classroom_contexts from anon;
grant select, insert, update, delete on public.classroom_contexts to authenticated;

comment on table public.schedule_entries is
  'Ownership-scoped teaching plan entries. Deliberately excludes recurrence, reminders, and external calendar state.';
comment on table public.classroom_contexts is
  'Reusable, general classroom defaults. Do not store learner names, contact details, diagnoses, or medical information.';
comment on column public.classroom_contexts.teacher_notes is
  'General instructional guidance only; application validation rejects common identifying or sensitive-data patterns.';

commit;
