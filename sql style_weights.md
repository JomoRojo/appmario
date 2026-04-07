create table public.style_weights (
  id uuid not null default gen_random_uuid (),
  category text not null,
  response_key text not null,
  formality_score integer not null,
  functionality_tag text not null,
  context_tag text not null,
  transition_weight numeric(3, 2) not null default 1.00,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint style_weights_pkey primary key (id),
  constraint style_weights_unique unique (category, response_key),
  constraint style_weights_formality_score_check check (
    (
      (formality_score >= 1)
      and (formality_score <= 5)
    )
  ),
  constraint style_weights_category_check check (
    (
      category = any (
        array[
          'routine_work'::text,
          'routine_study'::text,
          'routine_activities'::text,
          'routine_style'::text
        ]
      )
    )
  ),
  constraint style_weights_transition_weight_check check (
    (
      (transition_weight >= (0)::numeric)
      and (transition_weight <= (5)::numeric)
    )
  ),
  constraint style_weights_functionality_tag_check check (
    (
      functionality_tag = any (
        array[
          'mobility_high'::text,
          'mobility_medium'::text,
          'mobility_low'::text,
          'sport_active'::text,
          'aesthetic_priority'::text
        ]
      )
    )
  ),
  constraint style_weights_context_tag_check check (
    (
      context_tag = any (
        array[
          'casual_work'::text,
          'smart_work'::text,
          'formal_work'::text,
          'casual_study'::text,
          'smart_study'::text,
          'athletic'::text,
          'outdoor_casual'::text,
          'social_casual'::text,
          'social_formal'::text,
          'formal_event'::text,
          'family_active'::text,
          'travel'::text,
          'cultural'::text,
          'home_errands'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists style_weights_category_idx on public.style_weights using btree (category) TABLESPACE pg_default;

create index IF not exists style_weights_response_key_idx on public.style_weights using btree (category, response_key) TABLESPACE pg_default;

create trigger style_weights_updated_at BEFORE
update on style_weights for EACH row
execute FUNCTION handle_updated_at ();