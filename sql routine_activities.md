create table public.routine_activities (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  activity_errands boolean not null default false,
  activity_kids boolean not null default false,
  activity_pet boolean not null default false,
  activity_gym boolean not null default false,
  activity_outdoor boolean not null default false,
  activity_casual_plans boolean not null default false,
  activity_nights_out boolean not null default false,
  activity_special_events boolean not null default false,
  activity_travel boolean not null default false,
  activity_shopping boolean not null default false,
  activity_cultural boolean not null default false,
  activity_volunteering boolean not null default false,
  activity_other boolean not null default false,
  activity_other_notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint routine_activities_pkey primary key (id),
  constraint routine_activities_closet_id_key unique (closet_id),
  constraint routine_activities_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint notes_only_if_other_activities check (
    (
      (activity_other = true)
      or (activity_other_notes is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists routine_activities_closet_id_idx on public.routine_activities using btree (closet_id) TABLESPACE pg_default;

create trigger routine_activities_sync_closet
after INSERT
or DELETE on routine_activities for EACH row
execute FUNCTION handle_closet_routine_free ();

create trigger routine_activities_updated_at BEFORE
update on routine_activities for EACH row
execute FUNCTION handle_updated_at ();