-- Check current RLS policies status
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('posts', 'comments', 'reactions')
ORDER BY tablename;

-- Try to insert a test post directly (this should work if policies are permissive)
-- INSERT INTO posts (id, univ_id, type, content, password_hash, expires_at)
-- VALUES (gen_random_uuid(), 'test-univ-id', 'text', 'Test post', 'test', NOW() + INTERVAL '1 hour');