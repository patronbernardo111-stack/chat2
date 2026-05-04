$headers = @{
    "Authorization" = "Bearer sbp_a4641afade9647541a8503a98484bc328a690dae"
    "Content-Type" = "application/json"
}
$baseUrl = "https://api.supabase.com/v1/projects/dptpdifjqgzccjauhodq/database/query"

function RunSQL($sql) {
    $body = [System.Text.Encoding]::UTF8.GetBytes(($sql | ConvertTo-Json -Compress))
    try {
        $r = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method POST -Body ([System.Text.Encoding]::UTF8.GetString($body)) -ErrorAction Stop
        Write-Host "OK" -ForegroundColor Green
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err -match "already exists") {
            Write-Host "SKIP (already exists)" -ForegroundColor Yellow
        } else {
            Write-Host "ERROR: $err" -ForegroundColor Red
        }
    }
}

$queries = @(
    'create extension if not exists "pgcrypto"',
    'create table if not exists users (id uuid primary key default gen_random_uuid(), phone varchar(20) unique not null, full_name varchar(100) not null, password_hash varchar(255) not null, avatar_url text, status varchar(20) default ''offline'', last_seen timestamptz, created_at timestamptz default now(), last_login timestamptz, is_active boolean default true)',
    'create table if not exists wallets (id uuid primary key default gen_random_uuid(), user_id uuid unique references users(id) on delete cascade, balance numeric(15,2) default 5000, currency varchar(3) default ''XAF'', created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists transactions (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, type varchar(30) not null, amount numeric(15,2) not null, method varchar(100), reference text, status varchar(20) default ''completed'', created_at timestamptz default now())',
    'create table if not exists recharge_codes (id uuid primary key default gen_random_uuid(), code varchar(40) unique not null, amount numeric(15,2) not null, used boolean default false, used_by uuid references users(id) on delete set null, created_by uuid references users(id) on delete set null, used_at timestamptz, expires_at timestamptz, created_at timestamptz default now())',
    'create table if not exists contacts (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, contact_user_id uuid references users(id) on delete cascade, nickname varchar(100), name varchar(100), phone varchar(20), is_blocked boolean default false, is_favorite boolean default false, created_at timestamptz default now(), unique(user_id, contact_user_id))',
    'create table if not exists chats (id uuid primary key default gen_random_uuid(), type text default ''private'', name text, avatar_url text, created_by uuid references users(id) on delete set null, participants jsonb default ''[]''::jsonb, created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists chat_participants (id uuid primary key default gen_random_uuid(), chat_id uuid references chats(id) on delete cascade, user_id uuid references users(id) on delete cascade, joined_at timestamptz default now(), unread_count integer default 0, unique(chat_id, user_id))',
    'create table if not exists messages (id uuid primary key default gen_random_uuid(), chat_id uuid references chats(id) on delete cascade, sender_id uuid references users(id) on delete set null, text text, type text default ''text'', status text default ''sent'', reply_to uuid, file_url text, created_at timestamptz default now())',
    'create table if not exists message_reads (id uuid primary key default gen_random_uuid(), chat_id uuid references chats(id) on delete cascade, user_id uuid references users(id) on delete cascade, last_read_message_id uuid references messages(id) on delete set null, read_at timestamptz default now(), unique(chat_id, user_id))',
    'create table if not exists lia_conversations (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, message text not null, reply text not null, created_at timestamptz default now())',
    'create table if not exists ledger_accounts (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, code varchar(40) unique not null, name varchar(120) not null, account_type varchar(30) not null, currency varchar(3) default ''XAF'', is_system boolean default false, is_active boolean default true, created_at timestamptz default now())',
    'create table if not exists ledger_journals (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, reference varchar(80), concept text not null, total_amount numeric(15,2) not null default 0, status varchar(20) not null default ''draft'', requires_approval boolean default false, created_by uuid references users(id) on delete set null, approved_by uuid references users(id) on delete set null, approved_at timestamptz, created_at timestamptz default now())',
    'create table if not exists ledger_entries (id uuid primary key default gen_random_uuid(), journal_id uuid references ledger_journals(id) on delete cascade, account_id uuid references ledger_accounts(id) on delete restrict, entry_type varchar(6) not null check (entry_type in (''debit'',''credit'')), amount numeric(15,2) not null check (amount > 0), currency varchar(3) default ''XAF'', memo text, counterparty_user_id uuid references users(id) on delete set null, created_at timestamptz default now())',
    'create table if not exists ledger_approvals (id uuid primary key default gen_random_uuid(), journal_id uuid references ledger_journals(id) on delete cascade, requested_by uuid references users(id) on delete set null, approved_by uuid references users(id) on delete set null, status varchar(20) not null default ''pending'', reason text, created_at timestamptz default now(), updated_at timestamptz default now(), unique(journal_id))',
    'create table if not exists taxi_rides (id uuid primary key default gen_random_uuid(), ride_ref varchar(60) unique not null, user_id uuid references users(id) on delete cascade, origin jsonb not null, destination jsonb not null, ride_type varchar(30) not null, fare numeric(15,2) not null, status varchar(30) not null default ''searching'', driver jsonb, rating integer, rating_comment text, created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists service_orders (id uuid primary key default gen_random_uuid(), order_ref varchar(60) unique not null, user_id uuid references users(id) on delete cascade, provider varchar(30) not null, service_type varchar(40) not null, contract_ref varchar(80), amount numeric(15,2) default 0, status varchar(30) not null default ''pending'', payload jsonb default ''{}''::jsonb, response jsonb default ''{}''::jsonb, created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists cemac_transfers (id uuid primary key default gen_random_uuid(), transfer_ref varchar(80) unique not null, user_id uuid references users(id) on delete cascade, from_country varchar(4) not null, to_country varchar(4) not null, beneficiary_name varchar(120) not null, beneficiary_account varchar(60) not null, amount numeric(15,2) not null, fee numeric(15,2) not null default 0, status varchar(30) not null default ''pending'', metadata jsonb default ''{}''::jsonb, created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists audit_logs (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete set null, action varchar(80) not null, module varchar(40) not null, entity_id varchar(80), details jsonb default ''{}''::jsonb, created_at timestamptz default now())',
    'create table if not exists message_deletions (id uuid primary key default gen_random_uuid(), message_id uuid not null references messages(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, deleted_at timestamptz default now(), unique(message_id, user_id))',
    'create table if not exists stories (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade not null, media jsonb not null, type text default ''text'', views integer default 0, reactions jsonb default ''[]'', expires_at timestamptz not null, created_at timestamptz default now())',
    'create table if not exists call_sessions (call_id varchar(100) primary key, offer text, answer text, caller_candidates text default ''[]'', callee_candidates text default ''[]'', type varchar(10) default ''audio'', caller_id text not null, target_user_id text not null, ended boolean default false, created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, subscription jsonb not null, active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now())',
    'create table if not exists expo_push_tokens (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade not null, token varchar(200) unique not null, platform varchar(10) default ''android'', updated_at timestamptz default now())',
    'create table if not exists notifications (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, title text, body text, type varchar(40), read boolean default false, created_at timestamptz default now())',
    'create table if not exists insurance_policies (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, policy_number varchar(60) unique not null, type varchar(40) not null, status varchar(20) default ''active'', premium numeric(15,2), created_at timestamptz default now())',
    'create table if not exists insurance_claims (id uuid primary key default gen_random_uuid(), policy_id uuid references insurance_policies(id) on delete cascade, user_id uuid references users(id) on delete cascade, description text, status varchar(20) default ''pending'', amount numeric(15,2), created_at timestamptz default now())',
    'create table if not exists user_news_favorites (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade, news_id uuid, created_at timestamptz default now())'
)

$i = 1
foreach ($q in $queries) {
    Write-Host "[$i/$($queries.Count)] Ejecutando..." -NoNewline
    RunSQL $q
    $i++
}

Write-Host "`nTodas las tablas procesadas." -ForegroundColor Cyan
