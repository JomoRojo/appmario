create table public.routine_style (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  priority_comfort integer null,
  priority_looks integer null,
  priority_practical integer null,
  priority_trendy integer null,
  priority_discreet integer null,
  style_very_casual boolean not null default false,
  style_casual boolean not null default false,
  style_smart boolean not null default false,
  style_elegant boolean not null default false,
  style_sporty boolean not null default false,
  style_bohemian boolean not null default false,
  style_classic boolean not null default false,
  style_streetwear boolean not null default false,
  style_rock boolean not null default false,
  style_punk boolean not null default false,
  style_emo boolean not null default false,
  style_gothic boolean not null default false,
  style_vintage boolean not null default false,
  style_preppy boolean not null default false,
  style_artsy boolean not null default false,
  style_minimalist boolean not null default false,
  style_undefined boolean not null default false,
  style_other boolean not null default false,
  style_other_notes text null,
  never_skirts_dresses boolean not null default false,
  never_heels boolean not null default false,
  never_suit boolean not null default false,
  never_tight boolean not null default false,
  never_baggy boolean not null default false,
  never_prints boolean not null default false,
  never_nothing boolean not null default false,
  never_other boolean not null default false,
  never_other_notes text null,
  ai_style_profile text null,
  ai_style_updated_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint routine_style_pkey primary key (id),
  constraint routine_style_closet_id_key unique (closet_id),
  constraint routine_style_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint priority_unique check (
    (
      (
        num_nulls (
          priority_comfort,
          priority_looks,
          priority_practical,
          priority_trendy,
          priority_discreet
        ) = 0
      )
      or (
        num_nulls (
          priority_comfort,
          priority_looks,
          priority_practical,
          priority_trendy,
          priority_discreet
        ) = 5
      )
    )
  ),
  constraint routine_style_priority_comfort_check check (
    (
      (priority_comfort >= 1)
      and (priority_comfort <= 5)
    )
  ),
  constraint routine_style_priority_discreet_check check (
    (
      (priority_discreet >= 1)
      and (priority_discreet <= 5)
    )
  ),
  constraint routine_style_priority_looks_check check (
    (
      (priority_looks >= 1)
      and (priority_looks <= 5)
    )
  ),
  constraint routine_style_priority_practical_check check (
    (
      (priority_practical >= 1)
      and (priority_practical <= 5)
    )
  ),
  constraint never_nothing_exclusive check (
    (
      (never_nothing = false)
      or (
        (never_skirts_dresses = false)
        and (never_heels = false)
        and (never_suit = false)
        and (never_tight = false)
        and (never_baggy = false)
        and (never_prints = false)
        and (never_other = false)
      )
    )
  ),
  constraint routine_style_priority_trendy_check check (
    (
      (priority_trendy >= 1)
      and (priority_trendy <= 5)
    )
  ),
  constraint notes_only_if_never_other check (
    (
      (never_other = true)
      or (never_other_notes is null)
    )
  ),
  constraint notes_only_if_other_style check (
    (
      (style_other = true)
      or (style_other_notes is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists routine_style_closet_id_idx on public.routine_style using btree (closet_id) TABLESPACE pg_default;

create trigger routine_style_updated_at BEFORE
update on routine_style for EACH row
execute FUNCTION handle_updated_at ();