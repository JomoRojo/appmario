create table public.profiles (
  id uuid not null,
  email text not null,
  phone text null,
  trial_started_at timestamp with time zone not null default now(),
  trial_ends_at timestamp with time zone not null default (now() + '15 days'::interval),
  bonus_days integer not null default 0,
  status text not null default 'trial_active'::text,
  subscription_tier text null,
  subscription_id text null,
  subscription_provider text null,
  current_period_start timestamp with time zone null,
  current_period_end timestamp with time zone null,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamp with time zone null,
  clothes_total integer not null default 0,
  data_deletion_date timestamp with time zone null,
  data_deletion_final_date timestamp with time zone null,
  data_extension_count integer not null default 0,
  last_extension_paid_at timestamp with time zone null,
  locale text not null default 'es'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  validated boolean null default false,
  email_validated boolean not null default false,
  onboarding_completed boolean not null default false,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_status_check check (
    (
      status = any (
        array[
          'trial_active'::text,
          'trial_expired'::text,
          'subscribed'::text,
          'subscription_expired'::text,
          'lifetime'::text
        ]
      )
    )
  ),
  constraint profiles_subscription_provider_check check (
    (
      subscription_provider = any (
        array[
          'stripe'::text,
          'apple_iap'::text,
          'google_play'::text
        ]
      )
    )
  ),
  constraint profiles_bonus_days_check check (
    (
      (bonus_days >= 0)
      and (bonus_days <= 16)
    )
  ),
  constraint profiles_subscription_tier_check check (
    (
      subscription_tier = any (
        array[
          'basic'::text,
          'standard'::text,
          'gold'::text,
          'premium'::text
        ]
      )
    )
  ),
  constraint profiles_clothes_total_check check ((clothes_total >= 0)),
  constraint profiles_data_extension_count_check check ((data_extension_count >= 0))
) TABLESPACE pg_default;

create trigger profiles_bonus_days BEFORE
update OF bonus_days on profiles for EACH row
execute FUNCTION handle_bonus_days ();

create trigger profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION handle_updated_at ();