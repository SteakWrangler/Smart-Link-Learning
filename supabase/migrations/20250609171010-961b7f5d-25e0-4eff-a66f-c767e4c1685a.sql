-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Create student_subjects junction table
CREATE TABLE public.student_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE(student_id, subject_id)
);

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_challenges junction table
CREATE TABLE public.student_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  UNIQUE(student_id, challenge_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('user', 'ai')),
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
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for students
CREATE POLICY "Users can view their own students" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" ON public.students
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for subjects
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT USING (true);

-- Create RLS policies for student_subjects
CREATE POLICY "Users can view their own student subjects" ON public.student_subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_subjects.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own student subjects" ON public.student_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_subjects.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Create RLS policies for challenges
CREATE POLICY "Anyone can view challenges" ON public.challenges
  FOR SELECT USING (true);

-- Create RLS policies for student_challenges
CREATE POLICY "Users can view their own student challenges" ON public.student_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_challenges.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own student challenges" ON public.student_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_challenges.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = conversations.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own conversations" ON public.conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = conversations.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.students ON students.id = conversations.student_id
      WHERE conversations.id = messages.conversation_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.students ON students.id = conversations.student_id
      WHERE conversations.id = messages.conversation_id
      AND students.user_id = auth.uid()
    )
  );

-- Create RLS policies for conversation_tags
CREATE POLICY "Users can view their own conversation tags" ON public.conversation_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.students ON students.id = conversations.student_id
      WHERE conversations.id = conversation_tags.conversation_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own conversation tags" ON public.conversation_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.students ON students.id = conversations.student_id
      WHERE conversations.id = conversation_tags.conversation_id
      AND students.user_id = auth.uid()
    )
  );

-- Create trigger function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
