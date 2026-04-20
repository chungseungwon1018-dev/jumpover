-- Create universities table
CREATE TABLE universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#3B82F6',
  location TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  univ_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  spot TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT,
  image_url TEXT,
  is_blur BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reactions table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, emoji)
);

-- Create indexes for better performance
CREATE INDEX idx_posts_univ_id ON posts(univ_id);
CREATE INDEX idx_posts_expires_at ON posts(expires_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);

-- Insert initial university data
INSERT INTO universities (name, theme_color, location) VALUES
('충북대학교', '#1E40AF', ARRAY['솔못', '중문', '학생식당', '도서관', '체육관']),
('충남대학교', '#DC2626', ARRAY['정문', '중문', '학생회관', '도서관', '체육관']),
('청주교육대학교', '#059669', ARRAY['정문', '중문', '기숙사', '도서관', '체육관']);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for universities (read-only for all)
CREATE POLICY "Universities are viewable by everyone" ON universities
  FOR SELECT USING (true);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Post authors can update their posts" ON posts
  FOR UPDATE USING (true); -- We'll validate password in application logic

CREATE POLICY "Post authors can delete their posts" ON posts
  FOR DELETE USING (true); -- We'll validate password in application logic

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Comment authors can delete their comments" ON comments
  FOR DELETE USING (true); -- We'll validate password in application logic

-- RLS Policies for reactions
CREATE POLICY "Reactions are viewable by everyone" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create/update reactions" ON reactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update reaction counts" ON reactions
  FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired posts (can be called by Edge Function)
CREATE OR REPLACE FUNCTION cleanup_expired_posts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM posts WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;