-- RLS Policy Fix: Allow anonymous users to create posts without strict validation
-- This removes overly strict security policies that prevent simple passwords

-- Drop existing restrictive policies on posts table
DROP POLICY IF EXISTS "Allow authenticated users to insert posts" ON posts;
DROP POLICY IF EXISTS "Allow anonymous insert posts" ON posts;
DROP POLICY IF EXISTS "Allow users to insert their own posts" ON posts;

-- Create new permissive policy for INSERT
CREATE POLICY "Allow anonymous users to insert posts"
  ON posts
  FOR INSERT
  WITH CHECK (true);

-- Allow SELECT for all users
DROP POLICY IF EXISTS "Allow select all posts" ON posts;
CREATE POLICY "Allow select all posts"
  ON posts
  FOR SELECT
  USING (true);

-- Allow UPDATE and DELETE with password verification (handled in app)
DROP POLICY IF EXISTS "Allow update and delete posts" ON posts;
CREATE POLICY "Allow delete posts with password verification"
  ON posts
  FOR DELETE
  USING (true);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Similar policies for comments
DROP POLICY IF EXISTS "Allow anonymous insert comments" ON comments;
CREATE POLICY "Allow anonymous insert comments"
  ON comments
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select all comments" ON comments;
CREATE POLICY "Allow select all comments"
  ON comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow delete comments" ON comments;
CREATE POLICY "Allow delete comments with password"
  ON comments
  FOR DELETE
  USING (true);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Similar policies for reactions
DROP POLICY IF EXISTS "Allow anonymous insert reactions" ON reactions;
CREATE POLICY "Allow anonymous insert reactions"
  ON reactions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select all reactions" ON reactions;
CREATE POLICY "Allow select all reactions"
  ON reactions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow update reactions" ON reactions;
CREATE POLICY "Allow update reactions"
  ON reactions
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow delete reactions" ON reactions;
CREATE POLICY "Allow delete reactions"
  ON reactions
  FOR DELETE
  USING (true);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
