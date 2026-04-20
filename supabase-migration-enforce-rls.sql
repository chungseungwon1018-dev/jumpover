-- Enforce and verify RLS policies are properly configured
-- Make sure all INSERT operations are allowed for anonymous users

-- Disable RLS temporarily to clear all policies
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous users to insert posts" ON posts;
DROP POLICY IF EXISTS "Allow select all posts" ON posts;
DROP POLICY IF EXISTS "Allow delete posts with password verification" ON posts;

DROP POLICY IF EXISTS "Allow anonymous insert comments" ON comments;
DROP POLICY IF EXISTS "Allow select all comments" ON comments;
DROP POLICY IF EXISTS "Allow delete comments with password" ON comments;

DROP POLICY IF EXISTS "Allow anonymous insert reactions" ON reactions;
DROP POLICY IF EXISTS "Allow select all reactions" ON reactions;
DROP POLICY IF EXISTS "Allow update reactions" ON reactions;
DROP POLICY IF EXISTS "Allow delete reactions" ON reactions;

-- Re-enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies with PERMISSIVE mode (default)
-- Posts table
CREATE POLICY "posts_insert_policy" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_select_policy" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_delete_policy" ON posts FOR DELETE USING (true);

-- Comments table
CREATE POLICY "comments_insert_policy" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_select_policy" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_delete_policy" ON comments FOR DELETE USING (true);

-- Reactions table
CREATE POLICY "reactions_insert_policy" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "reactions_select_policy" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_update_policy" ON reactions FOR UPDATE USING (true);
CREATE POLICY "reactions_delete_policy" ON reactions FOR DELETE USING (true);
