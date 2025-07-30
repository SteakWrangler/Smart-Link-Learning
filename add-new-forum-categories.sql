-- Add new forum categories for ASD, ELL, and Language Delays
INSERT INTO public.forum_categories (name, description, color, sort_order) VALUES 
('Autism Spectrum (ASD)', 'Support for autism spectrum disorders, sensory needs, and social communication.', 'indigo', 6),
('English Language Learners', 'Resources and support for multilingual families and ELL students.', 'teal', 7),
('Language & Speech', 'Language delays, speech therapy, and communication support.', 'violet', 8);

-- Update sort_order for existing categories to make room
UPDATE public.forum_categories 
SET sort_order = sort_order + 3 
WHERE sort_order >= 6;