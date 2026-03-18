-- Fix Infinite Recursion in Profiles RLS
-- This happens because the policy to check if a user is an 'admin' selects from the 'profiles' table,
-- which triggers the RLS check again.

-- 1. Create a security definer function to check the user role safely
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to blogs" ON blogs;

-- 3. Re-create policies using the helper function
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins have full access to blogs" ON blogs
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Also apply to other tables if needed
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Ensure anyone can read companies (since it's a public catalog)
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
CREATE POLICY "Anyone can view companies" ON companies
    FOR SELECT USING (true);
