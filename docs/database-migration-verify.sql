-- PostgreSQL 17；只能用于本项目源/目标/演练库的只读迁移校验。
-- 输出聚合摘要和结构，不输出用户明细、密码哈希或 session token。
-- psql -X -v ON_ERROR_STOP=1 -P pager=off -d <已确认的本项目库名> < 本文件
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '5s';
SET LOCAL TimeZone = 'Asia/Shanghai';
SET LOCAL DateStyle = 'ISO, YMD';

-- 身份和创建属性：演练库名/数据库大小可以不同，其他属性应符合方案。
SELECT current_database() AS database_name,
       current_setting('server_version') AS server_version,
       pg_size_pretty(pg_database_size(current_database())) AS database_size;
SELECT pg_encoding_to_char(encoding) AS encoding,
       datcollate, datctype, datlocprovider,
       current_setting('TimeZone') AS validation_timezone
FROM pg_database WHERE datname = current_database();

-- 七表全行内容摘要；文本主键固定 C 排序，避免跨环境排序差异。
-- MD5 用于一致性校验，不用于抵御恶意篡改；文件传输另用 SHA-256。
SELECT 'public.bilibili_history' AS object_name, count(*) AS rows,
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), ''
         ORDER BY id, user_id COLLATE "C"), '')) AS content_digest
FROM public.bilibili_history t
UNION ALL
SELECT 'public.user', count(*),
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id COLLATE "C"), ''))
FROM public."user" t
UNION ALL
SELECT 'public.account', count(*),
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id COLLATE "C"), ''))
FROM public.account t
UNION ALL
SELECT 'public.session', count(*),
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id COLLATE "C"), ''))
FROM public.session t
UNION ALL
SELECT 'public.memberships', count(*),
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id), ''))
FROM public.memberships t
UNION ALL
SELECT 'public.verification', count(*),
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id COLLATE "C"), ''))
FROM public.verification t
UNION ALL
SELECT 'drizzle.__drizzle_migrations', count(*),
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY id), ''))
FROM drizzle.__drizzle_migrations t
ORDER BY object_name;

SELECT 'account_user' AS check_name, count(*) AS orphan_rows
FROM public.account a LEFT JOIN public."user" u ON a."userId" = u.id WHERE u.id IS NULL
UNION ALL
SELECT 'session_user', count(*)
FROM public.session s LEFT JOIN public."user" u ON s."userId" = u.id WHERE u.id IS NULL
UNION ALL
SELECT 'memberships_user', count(*)
FROM public.memberships m LEFT JOIN public."user" u ON m.user_id = u.id WHERE u.id IS NULL
UNION ALL
SELECT 'history_user', count(*)
FROM public.bilibili_history h LEFT JOIN public."user" u ON h.user_id = u.id WHERE u.id IS NULL;

-- 不调用 nextval/setval；注意序列状态不受事务快照保护，最终验收必须停写。
SELECT 'public.memberships_id_seq' AS sequence_name, last_value, is_called,
       (SELECT max(id) FROM public.memberships) AS max_table_id
FROM public.memberships_id_seq
UNION ALL
SELECT 'drizzle.__drizzle_migrations_id_seq', last_value, is_called,
       (SELECT max(id) FROM drizzle.__drizzle_migrations)
FROM drizzle.__drizzle_migrations_id_seq;

SELECT schemaname, sequencename, data_type, start_value, min_value, max_value,
       increment_by, cycle, cache_size
FROM pg_sequences WHERE schemaname IN ('public', 'drizzle')
ORDER BY schemaname, sequencename;

SELECT table_schema, table_name, ordinal_position, column_name, data_type,
       udt_name, is_nullable, column_default, character_maximum_length,
       numeric_precision, numeric_scale, datetime_precision, is_identity,
       identity_generation, is_generated, generation_expression
FROM information_schema.columns WHERE table_schema IN ('public', 'drizzle')
ORDER BY table_schema, table_name, ordinal_position;

SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname,
       pg_get_constraintdef(con.oid) AS definition, con.convalidated
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'drizzle')
ORDER BY n.nspname, c.relname, con.conname;

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname IN ('public', 'drizzle')
ORDER BY schemaname, tablename, indexname;

SELECT n.nspname AS schema_name, c.relname, c.relkind,
       pg_get_userbyid(c.relowner) AS owner, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'drizzle') AND c.relkind IN ('r', 'p', 'S', 'v', 'm')
ORDER BY n.nspname, c.relname;

SELECT extname, extversion FROM pg_extension ORDER BY extname;
COMMIT;
