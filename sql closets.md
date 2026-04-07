create table public.closets (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  first_name text null,
  last_name text null,
  country text null,
  region text null,
  city text null,
  gender text null,
  birth_date date null,
  name text not null,
  is_default boolean not null default false,
  position integer not null default 1,
  has_routine_work boolean not null default false,
  has_routine_study boolean not null default false,
  has_routine_free boolean not null default false,
  is_active boolean not null default true,
  size_top text[] null,
  size_bottom text[] null,
  size_shoes text[] null,
  items_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  laundry_day text[] null,
  constraint closets_pkey primary key (id),
  constraint closets_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint closets_gender_check check (
    (
      gender = any (
        array[
          'male'::text,
          'female'::text,
          'non_binary'::text,
          'unspecified'::text
        ]
      )
    )
  ),
  constraint closets_items_count_check check ((items_count >= 0)),
  constraint closets_laundry_day_check check (
    (
      (laundry_day is null)
      or (
        (array_length(laundry_day, 1) >= 1)
        and (
          laundry_day <@ array[
            'monday'::text,
            'tuesday'::text,
            'wednesday'::text,
            'thursday'::text,
            'friday'::text,
            'saturday'::text,
            'sunday'::text,
            'variable'::text
          ]
        )
      )
    )
  ),
  constraint closets_position_check check (
    (
      ("position" >= 1)
      and ("position" <= 4)
    )
  )
) TABLESPACE pg_default;

create index IF not exists closets_user_id_idx on public.closets using btree (user_id) TABLESPACE pg_default;

create index IF not exists closets_is_default_idx on public.closets using btree (user_id, is_default) TABLESPACE pg_default;

create index IF not exists closets_is_active_idx on public.closets using btree (user_id, is_active) TABLESPACE pg_default;

create trigger closets_clothes_total
after
update OF items_count on closets for EACH row
execute FUNCTION handle_clothes_total ();

create trigger closets_default_check BEFORE INSERT
or
update OF is_default on closets for EACH row
execute FUNCTION handle_default_closet ();

create trigger closets_limit_check BEFORE INSERT on closets for EACH row
execute FUNCTION handle_closet_limit ();

create trigger closets_updated_at BEFORE
update on closets for EACH row
execute FUNCTION handle_updated_at ();

create trigger items_ai_threshold
after
update OF items_count on closets for EACH row
execute FUNCTION handle_ai_analysis_threshold ();