
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Parents can view their children" ON public.children;
DROP POLICY IF EXISTS "Parents can insert children" ON public.children;
DROP POLICY IF EXISTS "Parents can update their children" ON public.children;
DROP POLICY IF EXISTS "Parents can delete their children" ON public.children;
DROP POLICY IF EXISTS "Parents can manage child subjects" ON public.child_subjects;
DROP POLICY IF EXISTS "Parents can manage child challenges" ON public.child_challenges;
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Authenticated users can view challenges" ON public.challenges;

-- Create RLS policies for children table
CREATE POLICY "Parents can view their children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'parent' 
      AND profiles.id = children.parent_id
    )
  );

CREATE POLICY "Parents can insert children" ON public.children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'parent' 
      AND profiles.id = parent_id
    )
  );

CREATE POLICY "Parents can update their children" ON public.children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'parent' 
      AND profiles.id = children.parent_id
    )
  );

CREATE POLICY "Parents can delete their children" ON public.children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'parent' 
      AND profiles.id = children.parent_id
    )
  );

-- Create RLS policies for junction tables
CREATE POLICY "Parents can manage child subjects" ON public.child_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'parent' 
      AND children.id = child_subjects.child_id
    )
  );

CREATE POLICY "Parents can manage child challenges" ON public.child_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'parent' 
      AND children.id = child_challenges.child_id
    )
  );

-- Allow authenticated users to read subjects and challenges
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view challenges" ON public.challenges
  FOR SELECT TO authenticated USING (true);
