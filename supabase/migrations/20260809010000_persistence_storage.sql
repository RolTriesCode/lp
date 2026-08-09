begin;

alter table public.lesson_plans
  add column revision bigint not null default 1,
  add column prototype_source_id text;
alter table public.presentations add column revision bigint not null default 1;
alter table public.assessments add column revision bigint not null default 1;
alter table public.worksheets add column revision bigint not null default 1;
alter table public.templates add column revision bigint not null default 1;
alter table public.uploaded_resources add column revision bigint not null default 1;

alter table public.lesson_plans
  add constraint lesson_plans_revision_positive check (revision > 0),
  add constraint lesson_plans_prototype_source_length
    check (prototype_source_id is null or char_length(prototype_source_id) between 1 and 100);
alter table public.presentations
  add constraint presentations_revision_positive check (revision > 0);
alter table public.assessments
  add constraint assessments_revision_positive check (revision > 0);
alter table public.worksheets
  add constraint worksheets_revision_positive check (revision > 0);
alter table public.templates
  add constraint templates_revision_positive check (revision > 0);
alter table public.uploaded_resources
  add constraint uploaded_resources_revision_positive check (revision > 0),
  add constraint uploaded_resources_reference_bucket check (
    storage_bucket is null or storage_bucket = 'teacher-references'
  ),
  add constraint uploaded_resources_owner_path check (
    storage_path is null or storage_path like user_id::text || '/%'
  ),
  add constraint uploaded_resources_supported_mime check (
    mime_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  add constraint uploaded_resources_size_limit check (byte_size <= 10485760);

create unique index lesson_plans_user_prototype_source_uidx
  on public.lesson_plans (user_id, prototype_source_id)
  where prototype_source_id is not null;

create or replace function private.bump_revision_and_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.revision = old.revision + 1;
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.bump_revision_and_updated_at() from public, anon, authenticated;

drop trigger lesson_plans_set_updated_at on public.lesson_plans;
drop trigger presentations_set_updated_at on public.presentations;
drop trigger assessments_set_updated_at on public.assessments;
drop trigger worksheets_set_updated_at on public.worksheets;
drop trigger templates_set_updated_at on public.templates;
drop trigger uploaded_resources_set_updated_at on public.uploaded_resources;

create trigger lesson_plans_set_updated_at
before update on public.lesson_plans
for each row execute function private.bump_revision_and_updated_at();
create trigger presentations_set_updated_at
before update on public.presentations
for each row execute function private.bump_revision_and_updated_at();
create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function private.bump_revision_and_updated_at();
create trigger worksheets_set_updated_at
before update on public.worksheets
for each row execute function private.bump_revision_and_updated_at();
create trigger templates_set_updated_at
before update on public.templates
for each row execute function private.bump_revision_and_updated_at();
create trigger uploaded_resources_set_updated_at
before update on public.uploaded_resources
for each row execute function private.bump_revision_and_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'teacher-references',
    'teacher-references',
    false,
    10485760,
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'school-logos',
    'school-logos',
    false,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'lesson-attachments',
    'lesson-attachments',
    false,
    10485760,
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
  ),
  (
    'generated-images',
    'generated-images',
    false,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "private_teacher_assets_select_own"
on storage.objects for select to authenticated
using (
  bucket_id in ('teacher-references', 'school-logos', 'lesson-attachments', 'generated-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "private_teacher_assets_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('teacher-references', 'school-logos', 'lesson-attachments', 'generated-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "private_teacher_assets_update_own"
on storage.objects for update to authenticated
using (
  bucket_id in ('teacher-references', 'school-logos', 'lesson-attachments', 'generated-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id in ('teacher-references', 'school-logos', 'lesson-attachments', 'generated-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy "private_teacher_assets_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id in ('teacher-references', 'school-logos', 'lesson-attachments', 'generated-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

comment on column public.lesson_plans.revision is
  'Server-incremented optimistic concurrency token. Writes must match the last observed value.';
comment on column public.lesson_plans.prototype_source_id is
  'Original local prototype identifier used only for explicit, idempotent one-time imports.';

commit;
