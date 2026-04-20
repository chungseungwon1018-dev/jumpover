-- Add missing columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#FEF3C7';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'gothic';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spot TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_blur BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_spot ON posts(spot);
CREATE INDEX IF NOT EXISTS idx_posts_is_blur ON posts(is_blur);

-- Add UPDATE policy for posts (for delete operations)
DROP POLICY IF EXISTS "Allow update and delete posts" ON posts;
CREATE POLICY "Allow delete posts"
  ON posts
  FOR DELETE
  USING (true);
