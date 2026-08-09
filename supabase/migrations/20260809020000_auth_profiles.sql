begin;

alter table public.profiles
  add column role_title text not null default 'Teacher',
  add column preferred_grade_level text,
  add column preferred_subjects text[] not null default '{}'::text[],
  add column school_logo_path text;

alter table public.profiles
  add constraint profiles_role_title_length check (char_length(role_title) between 2 and 80),
  add constraint profiles_preferred_grade_length check (
    preferred_grade_level is null or char_length(preferred_grade_level) between 1 and 40
  ),
  add constraint profiles_preferred_subject_count check (cardinality(preferred_subjects) <= 12),
  add constraint profiles_preferred_subjects_total_length check (
    char_length(array_to_string(preferred_subjects, '')) <= 960
  ),
  add constraint profiles_school_logo_owner_path check (
    school_logo_path is null or school_logo_path like id::text || '/%'
  );

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), '')
  )
from auth.users as users
on conflict (id) do nothing;

comment on column public.profiles.role_title is
  'Teacher-facing job title only. This value is never used for authorization.';
comment on column public.profiles.school_logo_path is
  'Private school-logos object path prefixed by the authenticated user UUID.';

commit;
