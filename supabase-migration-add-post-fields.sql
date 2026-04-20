-- Add bg_color and font_style columns to posts table
-- This migration adds support for post styling preferences

ALTER TABLE posts ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#FEF3C7';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'gothic';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_font_style ON posts(font_style);
CREATE INDEX IF NOT EXISTS idx_posts_bg_color ON posts(bg_color);

-- Add comment documentation
COMMENT ON COLUMN posts.bg_color IS 'Background color of the post (#FEF3C7 - cream, #D1FAE5 - mint, etc.)';
COMMENT ON COLUMN posts.font_style IS 'Font style for post content (handwriting or gothic)';
