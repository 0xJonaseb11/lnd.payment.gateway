create schema if not exists network;

create table network.payments (
  id text primary key,
  rail text not null check (rail in ('momo_rwf', 'ledger')),
  status text not null check (status in (
    'INVOICE_ISSUED',
    'LN_ACCEPTED',
    'DISBURSING',
    'COMPLETE',
    'REFUNDED',
    'MANUAL_REVIEW',
    'EXPIRED'
  )),
  amount_rwf bigint,
  amount_usdt_micros bigint not null,
  amount_msat bigint not null,
  fee_bps bigint not null,
  fee_usdt_micros bigint not null,
  destination_type text check (
    destination_type is null
    or destination_type in ('mtn_momo', 'airtel_momo')
  ),
  msisdn text,
  account_id text,
  payment_hash text not null unique,
  preimage text not null,
  bolt11 text not null,
  momo_reference_id text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

create index payments_reconcilable_idx
  on network.payments (created_at)
  where status in ('DISBURSING', 'MANUAL_REVIEW');

create table network.ledger_accounts (
  id text primary key,
  usdt_micros bigint not null check (usdt_micros >= 0)
);

alter table network.payments enable row level security;
alter table network.ledger_accounts enable row level security;

revoke all on schema network from public;
grant usage on schema network to postgres;
grant all on all tables in schema network to postgres;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema network from anon';
    execute 'revoke all on all tables in schema network from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema network from authenticated';
    execute 'revoke all on all tables in schema network from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant usage on schema network to service_role';
    execute 'grant all on all tables in schema network to service_role';
  end if;
end $$;
