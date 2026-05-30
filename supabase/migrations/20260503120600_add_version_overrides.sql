-- Add name to team_code_versions
ALTER TABLE team_code_versions ADD COLUMN name TEXT;

-- Add override columns to matches
ALTER TABLE matches ADD COLUMN home_override_version_id UUID REFERENCES team_code_versions(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN away_override_version_id UUID REFERENCES team_code_versions(id) ON DELETE SET NULL;
