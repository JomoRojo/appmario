create table public.outfit_favourites (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  user_id uuid not null,
  name text not null,
  occasion text null,
  notes text null,
  weather_warm boolean not null default false,
  weather_cold boolean not null default false,
  weather_versatile boolean not null default false,
  items_ids uuid[] not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint outfit_favourites_pkey primary key (id),
  constraint outfit_favourites_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint outfit_favourites_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint outfit_favourites_versatile_exclusive check (
    (
      (weather_versatile = false)
      or (
        (weather_warm = false)
        and (weather_cold = false)
      )
    )
  ),
  constraint outfit_favourites_occasion_check check (
    (
      occasion = any (
        array[
          'errands'::text,
          'kids'::text,
          'pet'::text,
          'gym'::text,
          'outdoor_sport'::text,
          'casual_plans'::text,
          'nights_out'::text,
          'special_events'::text,
          'travel'::text,
          'shopping'::text,
          'cultural'::text,
          'volunteering'::text,
          'work'::text,
          'study'::text,
          'home'::text
        ]
      )
    )
  ),
  constraint outfit_favourites_items_not_empty check ((array_length(items_ids, 1) >= 1)),
  constraint outfit_favourites_at_least_one_weather check (
    (
      (weather_warm = true)
      or (weather_cold = true)
      or (weather_versatile = true)
    )
  )
) TABLESPACE pg_default;

create index IF not exists outfit_favourites_closet_id_idx on public.outfit_favourites using btree (closet_id) TABLESPACE pg_default;

create index IF not exists outfit_favourites_user_id_idx on public.outfit_favourites using btree (user_id) TABLESPACE pg_default;

create index IF not exists outfit_favourites_occasion_idx on public.outfit_favourites using btree (closet_id, occasion) TABLESPACE pg_default;

create trigger outfit_favourites_updated_at BEFORE
update on outfit_favourites for EACH row
execute FUNCTION handle_updated_at ();