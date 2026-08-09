begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'owner-a@example.test', '', now(), '{}'::jsonb, '{"display_name":"Owner A"}'::jsonb, now(), now()
  ),
  (
    '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'owner-b@example.test', '', now(), '{}'::jsonb, '{"display_name":"Owner B"}'::jsonb, now(), now()
  );

insert into public.lesson_plans (
  id, user_id, title, curriculum, lesson_type, grade_level, subject, quarter, topic, content
) values (
  '30000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'Owner A lesson', 'MATATAG', 'DETAILED', 'Grade 7', 'Science', 'Q1', 'Cells', '{}'::jsonb
);

insert into public.schedule_entries (
  id, user_id, title, kind, starts_at, ends_at, lesson_plan_id
) values (
  '40000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000001',
  'Owner A science class', 'lesson', now() + interval '1 day', now() + interval '1 day 1 hour',
  '30000000-0000-4000-8000-000000000003'
);

insert into public.classroom_contexts (user_id, class_size, language)
values ('10000000-0000-4000-8000-000000000001', 'standard', 'english');

select is(
  (select count(*) from pg_policies where schemaname = 'public' and tablename in (
    'profiles', 'lesson_plans', 'presentations', 'assessments', 'worksheets', 'templates', 'uploaded_resources',
    'schedule_entries', 'classroom_contexts'
  )),
  36::bigint,
  'all application tables expose exactly four ownership policies'
);
select is(
  (select count(*) from pg_policies where schemaname = 'public' and roles = array['authenticated']::name[]),
  36::bigint,
  'all public application policies target authenticated users only'
);
select is(
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'private_teacher_assets_%'),
  4::bigint,
  'private teacher assets have four ownership policies'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.lesson_plans), 1::bigint, 'owner can select their lesson');
select is((select count(*) from public.profiles), 1::bigint, 'owner can select only their profile');
select is((select count(*) from public.schedule_entries), 1::bigint, 'owner can select their schedule');
select is((select count(*) from public.classroom_contexts), 1::bigint, 'owner can select their classroom context');
select lives_ok(
  $$update public.profiles set school_name = 'Owner A School' where id = '10000000-0000-4000-8000-000000000001'$$,
  'owner can update their profile'
);
select is(
  (select school_name from public.profiles where id = '10000000-0000-4000-8000-000000000001'),
  'Owner A School',
  'owner sees their profile update'
);
select lives_ok(
  $$update public.schedule_entries set title = 'Updated science class' where id = '40000000-0000-4000-8000-000000000004'$$,
  'owner can update their schedule'
);
select lives_ok(
  $$update public.classroom_contexts set preferred_duration = '50 mins' where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'owner can update their classroom context'
);

select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.lesson_plans), 0::bigint, 'another teacher cannot select the owner lesson');
select is((select count(*) from public.schedule_entries), 0::bigint, 'another teacher cannot select the owner schedule');
select is((select count(*) from public.classroom_contexts), 0::bigint, 'another teacher cannot select the owner classroom context');
select is(
  (with changed as (
    update public.profiles set school_name = 'Cross-account edit'
    where id = '10000000-0000-4000-8000-000000000001'
    returning id
  ) select count(*) from changed),
  0::bigint,
  'another teacher cannot update the owner profile'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*) from public.lesson_plans), 0::bigint, 'anonymous users cannot select lessons');
select is((select count(*) from public.profiles), 0::bigint, 'anonymous users cannot select profiles');
select is((select count(*) from public.schedule_entries), 0::bigint, 'anonymous users cannot select schedules');
select is((select count(*) from public.classroom_contexts), 0::bigint, 'anonymous users cannot select classroom contexts');

select * from finish();
rollback;
