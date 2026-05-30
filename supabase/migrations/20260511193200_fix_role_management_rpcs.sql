-- Fix role management RPCs with better authorization checks and search path security
CREATE OR REPLACE FUNCTION public.grant_role(
    target_username TEXT,
    granted_role app_role,
    target_league_id UUID DEFAULT NULL,
    target_team_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
    caller_id UUID;
    is_authorized BOOLEAN := FALSE;
BEGIN
    -- Get caller ID explicitly
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Find the target user ID
    SELECT id INTO target_user_id FROM public.profiles WHERE username = target_username;
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found', target_username;
    END IF;

    -- 2. Authorization check
    -- Is the caller a project_maintainer? (Global authority)
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = caller_id AND role = 'project_maintainer'
    ) THEN
        is_authorized := TRUE;
    -- Is it a self-assigned contributor role?
    ELSIF EXISTS (SELECT 1 FROM public.profiles WHERE id = caller_id AND username = target_username) 
          AND granted_role = 'contributor' AND target_team_id IS NOT NULL THEN
        is_authorized := TRUE;
    -- Is the caller a league_maintainer for this league?
    ELSIF granted_role IN ('league_maintainer', 'team_maintainer') AND target_league_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = caller_id AND role = 'league_maintainer' AND league_id = target_league_id
    ) THEN
        is_authorized := TRUE;
    -- Is the caller a team_maintainer for this team?
    ELSIF granted_role = 'team_maintainer' AND target_team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = caller_id AND role = 'team_maintainer' AND team_id = target_team_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to revoke a role
CREATE OR REPLACE FUNCTION public.revoke_role(
    role_to_revoke_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    role_record RECORD;
    caller_id UUID;
    is_authorized BOOLEAN := FALSE;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Get the role record
    SELECT * INTO role_record FROM public.user_roles WHERE id = role_to_revoke_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Role not found';
    END IF;

    -- 2. Authorization check
    -- Is the caller a project_maintainer?
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = caller_id AND role = 'project_maintainer'
    ) THEN
        is_authorized := TRUE;
    -- Self-revoke contributor role
    ELSIF role_record.user_id = caller_id AND role_record.role = 'contributor' AND role_record.team_id IS NOT NULL THEN
        is_authorized := TRUE;
    -- Is the caller a league_maintainer for this league?
    ELSIF role_record.role IN ('league_maintainer', 'team_maintainer') AND role_record.league_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = caller_id AND role = 'league_maintainer' AND league_id = role_record.league_id
    ) THEN
        is_authorized := TRUE;
    -- Is the caller a team_maintainer for this team?
    ELSIF role_record.role = 'team_maintainer' AND role_record.team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = caller_id AND role = 'team_maintainer' AND team_id = role_record.team_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
