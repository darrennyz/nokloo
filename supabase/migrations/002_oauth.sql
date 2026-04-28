-- OAuth 2.0 support for MCP Claude Desktop integration

-- Registered OAuth clients (via dynamic client registration)
create table if not exists oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  client_name text,
  redirect_uris text[] not null default '{}',
  created_at timestamptz default now()
);

-- Temporary authorization codes (short-lived, single-use)
create table if not exists oauth_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  client_id text not null,
  code text not null unique,
  code_challenge text,
  code_challenge_method text default 'S256',
  redirect_uri text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_oauth_codes_code on oauth_codes(code);
create index if not exists idx_oauth_codes_user on oauth_codes(user_id);
create index if not exists idx_oauth_clients_client_id on oauth_clients(client_id);

-- RLS
alter table oauth_clients enable row level security;
alter table oauth_codes enable row level security;

-- Service role has full access (used by server-side code)
-- No user-facing RLS policies needed since we use service client for all OAuth ops

-- Clean up expired/used codes automatically (optional, can be done via cron)
create or replace function cleanup_oauth_codes() returns void language plpgsql as $$
begin
  delete from oauth_codes where expires_at < now() or used = true;
end;
$$;
