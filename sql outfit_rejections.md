create table public.outfit_rejections (
  id uuid not null default gen_random_uuid (),
  outfit_id uuid not null,
  closet_id uuid not null,
  user_id uuid not null,
  rejection_type text not null,
  item_id uuid null,
  rejection_reason text not null,
  rejection_notes text null,
  fed_to_ai boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint outfit_rejections_pkey primary key (id),
  constraint outfit_rejections_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint outfit_rejections_item_id_fkey foreign KEY (item_id) references items (id) on delete set null,
  constraint outfit_rejections_outfit_id_fkey foreign KEY (outfit_id) references outfits (id) on delete CASCADE,
  constraint outfit_rejections_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint item_id_required_if_single_item check (
    (
      (rejection_type = 'full_outfit'::text)
      or (item_id is not null)
    )
  ),
  constraint outfit_rejections_rejection_reason_check check (
    (
      rejection_reason = any (
        array[
          'dont_like'::text,
          'item_in_laundry'::text,
          'item_not_found'::text,
          'wrong_occasion'::text,
          'not_in_mood'::text,
          'weather_changed'::text,
          'other'::text
        ]
      )
    )
  ),
  constraint outfit_rejections_rejection_type_check check (
    (
      rejection_type = any (array['full_outfit'::text, 'single_item'::text])
    )
  ),
  constraint item_id_only_if_single_item check (
    (
      (rejection_type = 'single_item'::text)
      or (item_id is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists outfit_rejections_outfit_id_idx on public.outfit_rejections using btree (outfit_id) TABLESPACE pg_default;

create index IF not exists outfit_rejections_user_id_idx on public.outfit_rejections using btree (user_id) TABLESPACE pg_default;

create index IF not exists outfit_rejections_item_id_idx on public.outfit_rejections using btree (item_id) TABLESPACE pg_default
where
  (item_id is not null);

create index IF not exists outfit_rejections_fed_to_ai_idx on public.outfit_rejections using btree (user_id, fed_to_ai) TABLESPACE pg_default
where
  (fed_to_ai = false);

create trigger outfit_rejections_laundry
after INSERT on outfit_rejections for EACH row
execute FUNCTION handle_rejection_laundry ();