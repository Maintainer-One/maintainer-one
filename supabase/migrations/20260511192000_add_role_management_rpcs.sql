-- Function to grant a role
CREATE OR REPLACE FUNCTION public.grant_role(
    target_username TEXT,
    granted_role app_role,
    target_league_id UUID DEFAULT NULL,
    target_team_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
    caller_username TEXT;
    is_authorized BOOLEAN := FALSE;
BEGIN
    -- 1. Find the target user ID
    SELECT id INTO target_user_id FROM public.profiles WHERE username = target_username;
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Get caller's username
    SELECT username INTO caller_username FROM public.profiles WHERE id = auth.uid();

    -- 2. Authorization check
    -- Is it a self-assigned contributor role?
    IF caller_username = target_username AND granted_role = 'contributor' AND target_team_id IS NOT NULL THEN
        is_authorized := TRUE;
    -- Is the caller a project_maintainer?
    ELSIF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'project_maintainer'
    ) THEN
        is_authorized := TRUE;
    -- Is the caller a league_maintainer for this league?
    ELSIF granted_role IN ('league_maintainer', 'team_maintainer') AND target_league_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'league_maintainer' AND league_id = target_league_id
    ) THEN
        is_authorized := TRUE;
    -- Is the caller a team_maintainer for this team?
    ELSIF granted_role = 'team_maintainer' AND target_team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'team_maintainer' AND team_id = target_team_id
    ) THEN
        is_authorized := TRUE;
    END IF;

    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Unauthorized to grant this role';
    END IF;

    -- 3. Grant the role (upsert)
    INSERT INTO public.user_roles (user_id, role, league_id, team_id)
    VALUES (target_user_id, granted_role, target_league_id, target_team_id)
    ON CONFLICT (user_id, role, league_id, team_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a role
CREATE OR REPLACE FUNCTION public.revoke_role(
    role_to_revoke_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    role_record RECORD;
    is_authorized BOOLEAN := FALSE;
BEGIN
    -- 1. Get the role record
    SELECT * INTO role_record FROM public.user_roles WHERE id = role_to_revoke_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Role not found';
    END IF;

    -- 2. Authorization check
    -- Self-revoke contributor role
    IF role_record.user_id = auth.uid() AND role_record.role = 'contributor' AND role_record.team_id IS NOT NULL THEN
        is_authorized := TRUE;
    -- Is the caller a project_maintainer?
    ELSIF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'project_maintainer'
    ) THEN
        is_authorized := TRUE;
    -- Is the caller a league_maintainer for this league?
    ELSIF role_record.role IN ('league_maintainer', 'team_maintainer') AND role_record.league_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'league_maintainer' AND league_id = role_record.league_id
    ) THEN
        is_authorized := TRUE;
    -- Is the caller a team_maintainer for this team?
    ELSIF role_record.role = 'team_maintainer' AND role_record.team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'team_maintainer' AND team_id = role_record.team_id
    ) THEN
        is_authorized := TRUE;
    END IF;

    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Unauthorized to revoke this role';
    END IF;

    -- 3. Revoke the role
    DELETE FROM public.user_roles WHERE id = role_to_revoke_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
