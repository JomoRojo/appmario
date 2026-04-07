create table public.closet_ai_analysis (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  user_id uuid not null,
  items_count_at integer not null,
  trigger_type text not null,
  style_profile text null,
  dominant_styles text[] null,
  dominant_colors text[] null,
  dominant_items text[] null,
  formality_tendency integer null,
  avoid_patterns text[] null,
  rejection_patterns text[] null,
  ai_raw_response jsonb null,
  is_current boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint closet_ai_analysis_pkey primary key (id),
  constraint closet_ai_analysis_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint closet_ai_analysis_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint closet_ai_analysis_formality_tendency_check check (
    (
      (formality_tendency >= 1)
      and (formality_tendency <= 5)
    )
  ),
  constraint closet_ai_analysis_trigger_type_check check (
    (
      trigger_type = any (
        array[
          'threshold_15'::text,
          'threshold_30'::text,
          'threshold_50'::text,
          'threshold_every_25'::text,
          'manual'::text
        ]
      )
    )
  ),
  constraint valid_items_count check ((items_count_at >= 0))
) TABLESPACE pg_default;

create index IF not exists closet_ai_analysis_closet_id_idx on public.closet_ai_analysis using btree (closet_id) TABLESPACE pg_default;

create index IF not exists closet_ai_analysis_user_id_idx on public.closet_ai_analysis using btree (user_id) TABLESPACE pg_default;

create index IF not exists closet_ai_analysis_current_idx on public.closet_ai_analysis using btree (closet_id, is_current) TABLESPACE pg_default
where
  (is_current = true);

create index IF not exists closet_ai_analysis_created_idx on public.closet_ai_analysis using btree (closet_id, created_at desc) TABLESPACE pg_default;

create trigger closet_ai_analysis_on_insert BEFORE INSERT on closet_ai_analysis for EACH row
execute FUNCTION handle_new_ai_analysis ();