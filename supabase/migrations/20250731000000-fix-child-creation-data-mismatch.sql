-- Fix child creation issues by updating database to match current frontend expectations
-- This migration adds missing challenges and updates age group format

-- Add the 3 new challenges that the frontend expects but are missing from the database
INSERT INTO public.challenges (name, description) VALUES 
('Autism Spectrum Disorder (ASD)', 'Support for students on the autism spectrum'),
('English Language Learners (ELL)', 'Support for English language learners'), 
('Language Delays', 'Support for language development delays');

-- Update existing children records from old age group format to new grade-based format
-- This ensures existing children display correctly with the new UI
UPDATE public.children SET age_group = 'kindergarten-2nd' WHERE age_group = 'Early Elementary';
UPDATE public.children SET age_group = '3rd-5th' WHERE age_group = 'Elementary';  
UPDATE public.children SET age_group = '6th-8th' WHERE age_group = 'Middle School';
UPDATE public.children SET age_group = '9th-12th' WHERE age_group = 'High School';
UPDATE public.children SET age_group = 'college-plus' WHERE age_group = 'College';