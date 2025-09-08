-- Quick fix for your existing linksmarttechllc@gmail.com account
-- Run this in Supabase SQL Editor to set up your account for testing

-- Update your existing user account with the password you want
UPDATE auth.users 
SET 
    encrypted_password = crypt('J57vy4dfu6$', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'linksmarttechllc@gmail.com';

-- Update or create your profile with proper subscription settings
INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    has_used_trial,
    stripe_customer_id,
    email_notifications,
    forum_notifications,
    is_anonymous_in_forum,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'linksmarttechllc@gmail.com'),
    'linksmarttechllc@gmail.com',
    'Justin',
    'Link',
    true,
    'cus_admin_permanent',
    true,
    true,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    first_name = 'Justin',
    last_name = 'Link',
    has_used_trial = true,
    stripe_customer_id = 'cus_admin_permanent',
    email_notifications = true,
    forum_notifications = true,
    is_anonymous_in_forum = false,
    updated_at = NOW();

-- Create permanent subscription so you have full access
INSERT INTO public.subscriptions (
    id,
    user_id,
    customer_id,
    price_id,
    product_id,
    status,
    cancel_at_period_end,
    current_period_end,
    created_at,
    updated_at
) VALUES (
    'sub_admin_permanent',
    (SELECT id FROM auth.users WHERE email = 'linksmarttechllc@gmail.com'),
    'cus_admin_permanent',
    'price_1S4yAXRdA5Qg3GBAzrsuNSbs',
    'prod_admin_permanent',
    'active',
    false,
    '2099-12-31 23:59:59'::timestamp,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    current_period_end = '2099-12-31 23:59:59'::timestamp,
    updated_at = NOW();

-- Verify everything was created correctly
SELECT 'User Account:' as type, email, email_confirmed_at FROM auth.users WHERE email = 'linksmarttechllc@gmail.com'
UNION ALL
SELECT 'Profile:' as type, email, CONCAT(first_name, ' ', last_name) FROM public.profiles WHERE email = 'linksmarttechllc@gmail.com'  
UNION ALL
SELECT 'Subscription:' as type, customer_id, status FROM public.subscriptions WHERE customer_id = 'cus_admin_permanent';