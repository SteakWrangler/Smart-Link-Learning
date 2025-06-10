-- First, let's see what categories currently exist
SELECT name, id FROM forum_categories ORDER BY sort_order;

-- Delete any duplicate or incorrect categories first
DELETE FROM forum_categories WHERE name = 'Community Chat';

-- Insert or update the categories we need
INSERT INTO forum_categories (name, description, color, sort_order) VALUES
('General Chat', 'General discussion, introductions, and community connection.', 'gray', 10),
('Managing Frustration', 'Support for handling learning challenges and keeping sessions positive.', 'orange', 5),
('General Learning Support', 'General learning tips, strategies, and questions.', 'indigo', 6),
('ADHD & Focus', 'Discussion and support for ADHD and focus-related challenges.', 'blue', 1),
('Dyslexia & Reading', 'Support and strategies for dyslexia and reading difficulties.', 'green', 2),
('Processing & Learning Differences', 'Discussion about processing delays and learning differences.', 'purple', 3),
('Math & Numbers', 'Help with math anxiety and number-related learning challenges.', 'red', 4)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Verify the final state
SELECT name, description, color, sort_order FROM forum_categories ORDER BY sort_order; 