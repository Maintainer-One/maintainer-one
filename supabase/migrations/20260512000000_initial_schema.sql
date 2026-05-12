-- Initial schema for Maintainer One

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  protocol_version TEXT NOT NULL,
  protocol_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  logo_url TEXT,
  logo_icon_url TEXT,
  active_version_id UUID, -- Foreign key added after team_code_versions is created
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_code_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  source_code TEXT NOT NULL,
  compiled_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint to teams
ALTER TABLE teams ADD CONSTRAINT teams_active_version_id_fkey FOREIGN KEY (active_version_id) REFERENCES team_code_versions(id) ON DELETE SET NULL;

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'completed', 'scheduled'
  protocol_version TEXT NOT NULL,
  protocol_config JSONB DEFAULT '{}'::jsonb,
  code_lock_offset_minutes INTEGER DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  code_lock_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL, -- 'scheduled', 'simmed', 'played'
  home_score INTEGER,
  away_score INTEGER,
  home_code_version_id UUID REFERENCES team_code_versions(id),
  away_code_version_id UUID REFERENCES team_code_versions(id),
  winner_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE match_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  secret_seed BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE seasons;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
