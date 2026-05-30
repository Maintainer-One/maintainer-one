-- Create community_content table
CREATE TABLE public.community_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'link',
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow anyone to read
ALTER TABLE public.community_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community content viewable by everyone" ON public.community_content FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON public.community_content FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
