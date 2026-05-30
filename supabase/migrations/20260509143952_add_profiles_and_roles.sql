-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles but allow anyone to read
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create app_role ENUM
CREATE TYPE app_role AS ENUM ('project_maintainer', 'league_maintainer', 'team_maintainer', 'contributor');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE NULLS NOT DISTINCT (user_id, role, league_id, team_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles are viewable by everyone." ON public.user_roles FOR SELECT USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    gh_username TEXT;
BEGIN
    gh_username := COALESCE(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username');
    
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        new.id,
        gh_username,
        new.raw_user_meta_data->>'avatar_url'
    );
    
    -- Auto-grant project_maintainer to specific username
    IF gh_username = 'merosenlund' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'project_maintainer');
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'contributor');
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
