-- Force enable RLS and create ultra-permissive policies
-- This should allow ALL operations for testing purposes

-- First, completely disable RLS
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON posts;
DROP POLICY IF EXISTS "Allow anonymous users to insert posts" ON posts;
DROP POLICY IF EXISTS "Allow select all posts" ON posts;
DROP POLICY IF EXISTS "Allow delete posts with password verification" ON posts;

DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;
DROP POLICY IF EXISTS "Allow anonymous insert comments" ON comments;
DROP POLICY IF EXISTS "Allow select all comments" ON comments;
DROP POLICY IF EXISTS "Allow delete comments with password" ON comments;

DROP POLICY IF EXISTS "reactions_insert_policy" ON reactions;
DROP POLICY IF EXISTS "reactions_select_policy" ON reactions;
DROP POLICY IF EXISTS "reactions_update_policy" ON reactions;
DROP POLICY IF EXISTS "reactions_delete_policy" ON reactions;
DROP POLICY IF EXISTS "Allow anonymous insert reactions" ON reactions;
DROP POLICY IF EXISTS "Allow select all reactions" ON reactions;
DROP POLICY IF EXISTS "Allow update reactions" ON reactions;
DROP POLICY IF EXISTS "Allow delete reactions" ON reactions;

-- Re-enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create maximally permissive policies
-- Allow everything for all operations
CREATE POLICY "allow_all_posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reactions" ON reactions FOR ALL USING (true) WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;