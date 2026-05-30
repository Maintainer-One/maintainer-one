create table if not exists public.players (
    id uuid default gen_random_uuid() primary key,
    team_id uuid references public.teams(id) on delete cascade not null,
    unit_index text not null,
    name text not null,
    status text default 'active' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(team_id, unit_index)
);

-- RLS policies
alter table public.players enable row level security;

create policy "Players are viewable by everyone" on public.players
    for select using (true);
