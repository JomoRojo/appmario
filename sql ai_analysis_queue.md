create table public.ai_analysis_queue (
  id uuid not null default gen_random_uuid (),
  closet_id uuid not null,
  user_id uuid not null,
  items_count_at integer not null,
  trigger_type text not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  processed_at timestamp with time zone null,
  constraint ai_analysis_queue_pkey primary key (id),
  constraint ai_analysis_queue_closet_id_fkey foreign KEY (closet_id) references closets (id) on delete CASCADE,
  constraint ai_analysis_queue_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint ai_analysis_queue_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint ai_analysis_queue_trigger_type_check check (
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
  )
) TABLESPACE pg_default;