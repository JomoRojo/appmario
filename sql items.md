create table public.items (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  user_id uuid not null,
  image_url_front text not null,
  image_path_front text not null,
  image_url_back text null,
  image_path_back text null,
  image_url_clean text null,
  tipo_categoria text null,
  tipo_descripcion text null,
  body_part text null,
  fit_type text null,
  estilo text null,
  color_primary text null,
  color_secondary text null,
  has_pattern boolean not null default false,
  pattern_type text null,
  pattern_colors text[] null,
  material text null,
  descripcion text null,
  ai_raw_response jsonb null,
  weather_warm boolean not null default false,
  weather_cold boolean not null default false,
  weather_versatile boolean not null default false,
  occasion_errands boolean not null default false,
  occasion_kids boolean not null default false,
  occasion_pet boolean not null default false,
  occasion_gym boolean not null default false,
  occasion_outdoor_sport boolean not null default false,
  occasion_casual_plans boolean not null default false,
  occasion_nights_out boolean not null default false,
  occasion_special_events boolean not null default false,
  occasion_travel boolean not null default false,
  occasion_shopping boolean not null default false,
  occasion_cultural boolean not null default false,
  occasion_volunteering boolean not null default false,
  occasion_work boolean not null default false,
  occasion_study boolean not null default false,
  occasion_home boolean not null default false,
  times_worn integer not null default 0,
  last_worn_at date null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  status text not null default 'available'::text,
  available_from date null,
  constraint items_pkey primary key (id),
  constraint items_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint items_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint items_estilo_check check (
    (
      estilo = any (
        array[
          'casual'::text,
          'smart'::text,
          'formal'::text,
          'sporty'::text,
          'bohemian'::text,
          'classic'::text,
          'streetwear'::text,
          'rock'::text,
          'punk'::text,
          'emo'::text,
          'gothic'::text,
          'vintage'::text,
          'preppy'::text,
          'artsy'::text,
          'minimalist'::text
        ]
      )
    )
  ),
  constraint items_fit_type_check check (
    (
      fit_type = any (
        array[
          'fitted'::text,
          'slim'::text,
          'regular'::text,
          'oversize'::text,
          'crop'::text,
          'wide_leg'::text,
          'skinny'::text,
          'flare'::text,
          'straight'::text,
          'relaxed'::text,
          'tailored'::text
        ]
      )
    )
  ),
  constraint items_material_check check (
    (
      material = any (
        array[
          'cotton'::text,
          'linen'::text,
          'wool'::text,
          'synthetic'::text,
          'denim'::text,
          'leather'::text,
          'silk'::text,
          'knit'::text,
          'fleece'::text,
          'mixed'::text
        ]
      )
    )
  ),
  constraint items_pattern_type_check check (
    (
      pattern_type = any (
        array[
          'stripes'::text,
          'floral'::text,
          'geometric'::text,
          'animal_print'::text,
          'graphic'::text,
          'logo'::text,
          'abstract'::text,
          'plaid'::text,
          'tie_dye'::text
        ]
      )
    )
  ),
  constraint items_status_check check (
    (
      status = any (
        array[
          'available'::text,
          'in_laundry'::text,
          'being_washed'::text,
          'unavailable'::text,
          'inactive'::text
        ]
      )
    )
  ),
  constraint items_times_worn_check check ((times_worn >= 0)),
  constraint items_tipo_categoria_check check (
    (
      tipo_categoria = any (
        array[
          'camiseta'::text,
          'camisa'::text,
          'pantalon'::text,
          'falda'::text,
          'vestido'::text,
          'chaqueta'::text,
          'abrigo'::text,
          'zapatos'::text,
          'botas'::text,
          'zapatillas'::text,
          'accesorio'::text,
          'jersey'::text,
          'sudadera'::text,
          'mono'::text,
          'shorts'::text,
          'otro'::text
        ]
      )
    )
  ),
  constraint pattern_only_if_has_pattern check (
    (
      (has_pattern = true)
      or (
        (pattern_type is null)
        and (pattern_colors is null)
      )
    )
  ),
  constraint at_least_one_weather check (
    (
      (weather_warm = true)
      or (weather_cold = true)
      or (weather_versatile = true)
    )
  ),
  constraint versatile_exclusive check (
    (
      (weather_versatile = false)
      or (
        (weather_warm = false)
        and (weather_cold = false)
      )
    )
  ),
  constraint back_path_with_back_url check (
    (
      (image_url_back is not null)
      or (image_path_back is null)
    )
  ),
  constraint items_body_part_check check (
    (
      body_part = any (
        array[
          'upper_body'::text,
          'lower_body'::text,
          'full_body'::text,
          'feet'::text,
          'accessory'::text,
          'layering'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists items_closet_id_idx on public.items using btree (closet_id) TABLESPACE pg_default;

create index IF not exists items_user_id_idx on public.items using btree (user_id) TABLESPACE pg_default;

create index IF not exists items_is_active_idx on public.items using btree (closet_id, is_active) TABLESPACE pg_default;

create index IF not exists items_body_part_idx on public.items using btree (closet_id, body_part) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists items_weather_warm_idx on public.items using btree (closet_id, weather_warm) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists items_weather_cold_idx on public.items using btree (closet_id, weather_cold) TABLESPACE pg_default
where
  (is_active = true);

create index IF not exists items_estilo_idx on public.items using btree (closet_id, estilo) TABLESPACE pg_default
where
  (is_active = true);

create trigger items_bonus_check
after INSERT on items for EACH row
execute FUNCTION handle_bonus_check ();

create trigger items_count_sync
after INSERT
or
update OF is_active on items for EACH row
execute FUNCTION handle_items_count ();