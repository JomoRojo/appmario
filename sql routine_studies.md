create table public.routine_studies (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  has_uniform boolean not null,
  style_comfortable boolean not null default false,
  style_smart boolean not null default false,
  style_elegant boolean not null default false,
  style_random boolean not null default false,
  style_varies boolean not null default false,
  style_other boolean not null default false,
  style_other_notes text null,
  formality_score integer null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint routine_studies_pkey primary key (id),
  constraint routine_studies_closet_id_key unique (closet_id),
  constraint routine_studies_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint no_style_if_uniform check (
    (
      (has_uniform = false)
      or (
        (style_comfortable = false)
        and (style_smart = false)
        and (style_elegant = false)
        and (style_random = false)
        and (style_varies = false)
        and (style_other = false)
      )
    )
  ),
  constraint notes_only_if_other_work check (
    (
      (style_other = true)
      or (style_other_notes is null)
    )
  ),
  constraint routine_work_formality_score_check check (
    (
      (formality_score >= 1)
      and (formality_score <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists routine_studies_closet_id_idx on public.routine_studies using btree (closet_id) TABLESPACE pg_default;