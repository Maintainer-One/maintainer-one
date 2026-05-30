-- Indexes to optimize the 1-minute cron job queries

-- Optimizes: WHERE status = 'scheduled' AND code_lock_time <= NOW()
CREATE INDEX IF NOT EXISTS idx_matches_cron_lock ON matches(status, code_lock_time);

-- Optimizes: WHERE status = 'simmed' AND scheduled_time <= NOW()
CREATE INDEX IF NOT EXISTS idx_matches_cron_play ON matches(status, scheduled_time);
