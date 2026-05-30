-- Enable RLS on team_code_versions
ALTER TABLE public.team_code_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read versions
CREATE POLICY "Anyone can view team code versions" 
ON public.team_code_versions 
FOR SELECT USING (true);

-- Only team maintainers or project maintainers can insert new versions
CREATE POLICY "Team maintainers can insert" 
ON public.team_code_versions 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND (
            (role = 'team_maintainer' AND team_id = team_code_versions.team_id) OR
            role = 'project_maintainer'
        )
    )
);

-- Note: We do not allow updates or deletes to maintain determinism.
