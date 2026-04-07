create table public.outfits (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  user_id uuid not null,
  outfit_date date not null,
  occasions_selected text[] not null,
  items_ids uuid[] not null,
  formality_score integer null,
  context_main text null,
  context_secondary text null,
  transition boolean not null default false,
  weather_temp integer null,
  weather_condition text null,
  weather_type text null,
  is_favourite boolean not null default false,
  favourited_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint outfits_pkey primary key (id),
  constraint outfits_unique_per_day unique (closet_id, outfit_date),
  constraint outfits_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint outfits_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint outfits_weather_condition_check check (
    (
      weather_condition = any (
        array[
          'sunny'::text,
          'cloudy'::text,
          'rainy'::text,
          'snowy'::text,
          'windy'::text,
          'foggy'::text
        ]
      )
    )
  ),
  constraint favourited_at_only_if_favourite check (
    (
      (is_favourite = true)
      or (favourited_at is null)
    )
  ),
  constraint outfits_weather_type_check check (
    (
      weather_type = any (
        array['warm'::text, 'cold'::text, 'versatile'::text]
      )
    )
  ),
  constraint items_not_empty check ((array_length(items_ids, 1) >= 1)),
  constraint occasions_not_empty check ((array_length(occasions_selected, 1) >= 1)),
  constraint outfits_formality_score_check check (
    (
      (formality_score >= 1)
      and (formality_score <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists outfits_closet_id_idx on public.outfits using btree (closet_id) TABLESPACE pg_default;

create index IF not exists outfits_user_id_idx on public.outfits using btree (user_id) TABLESPACE pg_default;

create index IF not exists outfits_date_idx on public.outfits using btree (closet_id, outfit_date desc) TABLESPACE pg_default;

create index IF not exists outfits_favourite_idx on public.outfits using btree (closet_id, is_favourite) TABLESPACE pg_default
where
  (is_favourite = true);

create index IF not exists outfits_history_idx on public.outfits using btree (closet_id, outfit_date desc) TABLESPACE pg_default
where
  (is_favourite = false);

create trigger outfits_favourited_at BEFORE
update OF is_favourite on outfits for EACH row
execute FUNCTION handle_outfit_favourited ();

create trigger outfits_items_worn
after INSERT on outfits for EACH row
execute FUNCTION handle_items_worn ();