-- First, drop the old age_group check constraint
ALTER TABLE public.children DROP CONSTRAINT IF EXISTS children_age_group_check;

-- Convert all legacy grade formats to specific grades BEFORE adding new constraint
-- Default to the lowest grade in each range as requested

-- Handle range-based system (kindergarten-2nd, 3rd-5th, etc.)
UPDATE public.children SET age_group = 'kindergarten' WHERE age_group = 'kindergarten-2nd';
UPDATE public.children SET age_group = '3rd-grade' WHERE age_group = '3rd-5th';  
UPDATE public.children SET age_group = '6th-grade' WHERE age_group = '6th-8th';
UPDATE public.children SET age_group = '9th-grade' WHERE age_group = '9th-12th';
UPDATE public.children SET age_group = 'college' WHERE age_group = 'college-plus';

-- Handle original descriptive system (early-elementary, elementary, etc.)
UPDATE public.children SET age_group = 'kindergarten' WHERE age_group = 'early-elementary';
UPDATE public.children SET age_group = '3rd-grade' WHERE age_group = 'elementary';
UPDATE public.children SET age_group = '6th-grade' WHERE age_group = 'middle-school';
UPDATE public.children SET age_group = '9th-grade' WHERE age_group = 'high-school';

-- Handle any other variations that might exist
UPDATE public.children SET age_group = 'kindergarten' WHERE age_group IN ('k-2', 'K-2');
UPDATE public.children SET age_group = '3rd-grade' WHERE age_group IN ('3-5');
UPDATE public.children SET age_group = '6th-grade' WHERE age_group IN ('6-8');
UPDATE public.children SET age_group = '9th-grade' WHERE age_group IN ('9-12');
UPDATE public.children SET age_group = 'college' WHERE age_group IN ('college+');

-- Now add new check constraint that allows specific grades (after data conversion)
ALTER TABLE public.children ADD CONSTRAINT children_age_group_check 
CHECK (age_group IN (
  'kindergarten',
  '1st-grade',
  '2nd-grade', 
  '3rd-grade',
  '4th-grade',
  '5th-grade',
  '6th-grade',
  '7th-grade',
  '8th-grade',
  '9th-grade',
  '10th-grade',
  '11th-grade',
  '12th-grade',
  'college'
));