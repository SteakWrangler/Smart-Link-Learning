-- Create profiles table for users (parents and students)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('parent', 'student')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create children table (linked to parent profiles)
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table for many-to-many relationship
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create child_subjects junction table
CREATE TABLE public.child_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE(child_id, subject_id)
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create child_challenges junction table
CREATE TABLE public.child_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  UNIQUE(child_id, challenge_id)
);

-- Create student_profiles table for students who log in themselves
CREATE TABLE public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_subjects junction table
CREATE TABLE public.student_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE(student_profile_id, subject_id)
);

-- Create student_challenges junction table
CREATE TABLE public.student_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  UNIQUE(student_profile_id, challenge_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK ((child_id IS NOT NULL AND student_profile_id IS NULL) OR (child_id IS NULL AND student_profile_id IS NOT NULL))
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation_tags table
CREATE TABLE public.conversation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Insert default subjects
INSERT INTO public.subjects (name) VALUES 
('Math'),
('Reading'),
('Writing'),
('Science'),
('Social Studies');

-- Insert default challenges
INSERT INTO public.challenges (name, description) VALUES 
('ADHD/Focus Issues', 'Attention and focus challenges'),
('Dyslexia', 'Reading and language processing difficulties'),
('Processing Delays', 'Information processing delays'),
('Math Anxiety', 'Anxiety related to mathematics'),
('General Learning Support', 'General learning support needs');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for children (only parents can manage)
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

-- Create RLS policies for student profiles (only students can manage their own)
CREATE POLICY "Students can view their own profile" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'student' 
      AND profiles.id = student_profiles.user_id
    )
  );
CREATE POLICY "Students can insert their profile" ON public.student_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'student' 
      AND profiles.id = user_id
    )
  );
CREATE POLICY "Students can update their profile" ON public.student_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'student' 
      AND profiles.id = student_profiles.user_id
    )
  );

-- RLS policies for subjects and challenges (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view challenges" ON public.challenges
  FOR SELECT TO authenticated USING (true);

-- RLS policies for junction tables
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

CREATE POLICY "Students can manage their subjects" ON public.student_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles 
      JOIN public.profiles ON profiles.id = student_profiles.user_id
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'student' 
      AND student_profiles.id = student_subjects.student_profile_id
    )
  );

CREATE POLICY "Students can manage their challenges" ON public.student_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles 
      JOIN public.profiles ON profiles.id = student_profiles.user_id
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'student' 
      AND student_profiles.id = student_challenges.student_profile_id
    )
  );

-- RLS policies for conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )) OR
    (student_profile_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.student_profiles 
      JOIN public.profiles ON profiles.id = student_profiles.user_id
      WHERE profiles.id = auth.uid() 
      AND student_profiles.id = conversations.student_profile_id
    ))
  );

CREATE POLICY "Users can insert their conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = child_id
    )) OR
    (student_profile_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.student_profiles 
      JOIN public.profiles ON profiles.id = student_profiles.user_id
      WHERE profiles.id = auth.uid() 
      AND student_profiles.id = student_profile_id
    ))
  );

CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )) OR
    (student_profile_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.student_profiles 
      JOIN public.profiles ON profiles.id = student_profiles.user_id
      WHERE profiles.id = auth.uid() 
      AND student_profiles.id = conversations.student_profile_id
    ))
  );

CREATE POLICY "Users can delete their conversations" ON public.conversations
  FOR DELETE USING (
    (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children 
      JOIN public.profiles ON profiles.id = children.parent_id
      WHERE profiles.id = auth.uid() 
      AND children.id = conversations.child_id
    )) OR
    (student_profile_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.student_profiles 
      JOIN public.profiles ON profiles.id = student_profiles.user_id
      WHERE profiles.id = auth.uid() 
      AND student_profiles.id = conversations.student_profile_id
    ))
  );

-- RLS policies for messages
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        (conversations.child_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.children 
          JOIN public.profiles ON profiles.id = children.parent_id
          WHERE profiles.id = auth.uid() 
          AND children.id = conversations.child_id
        )) OR
        (conversations.student_profile_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.student_profiles 
          JOIN public.profiles ON profiles.id = student_profiles.user_id
          WHERE profiles.id = auth.uid() 
          AND student_profiles.id = conversations.student_profile_id
        ))
      )
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_id
      AND (
        (conversations.child_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.children 
          JOIN public.profiles ON profiles.id = children.parent_id
          WHERE profiles.id = auth.uid() 
          AND children.id = conversations.child_id
        )) OR
        (conversations.student_profile_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.student_profiles 
          JOIN public.profiles ON profiles.id = student_profiles.user_id
          WHERE profiles.id = auth.uid() 
          AND student_profiles.id = conversations.student_profile_id
        ))
      )
    )
  );

-- RLS policies for conversation tags
CREATE POLICY "Users can manage tags for their conversations" ON public.conversation_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_tags.conversation_id
      AND (
        (conversations.child_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.children 
          JOIN public.profiles ON profiles.id = children.parent_id
          WHERE profiles.id = auth.uid() 
          AND children.id = conversations.child_id
        )) OR
        (conversations.student_profile_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.student_profiles 
          JOIN public.profiles ON profiles.id = student_profiles.user_id
          WHERE profiles.id = auth.uid() 
          AND student_profiles.id = conversations.student_profile_id
        ))
      )
    )
  );

-- Create trigger function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, user_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'user_type', 'parent')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
