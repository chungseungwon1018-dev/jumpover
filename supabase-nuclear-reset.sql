-- NUCLEAR OPTION: Complete RLS reset and rebuild
-- This removes EVERYTHING and starts fresh

-- Step 1: Disable RLS completely
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (even ones we might have missed)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('posts', 'comments', 'reactions')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create single all-permissive policies
CREATE POLICY "nuclear_posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nuclear_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nuclear_reactions" ON reactions FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Verify
SELECT 'POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'RLS STATUS:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('posts', 'comments', 'reactions')
ORDER BY tablename;