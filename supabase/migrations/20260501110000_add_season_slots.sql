ALTER TABLE seasons ADD COLUMN game_slots JSONB DEFAULT '["12:00", "15:00"]'::jsonb;
