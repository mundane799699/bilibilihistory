# Supabase PostgreSQL 迁移到自建 PostgreSQL：执行方案

> 历史文档：本文记录 2026-08 的 Supabase → `1.15.53.251` 迁移。2026-10 的 `1.15.53.251` → `118.25.22.240` 迁移请使用 [服务器迁移方案](./database-migration-2026-10-server-to-server.md)。

> 文档状态：正式迁移及生产切换完成，进入观察期
> 盘点日期：2026-08-22
> 项目：`bilibili-history-web`

## 0. 当前执行进度（2026-08-22）

> 本节记录实际执行状态；下文仍保留完整 Runbook。

- 已通过 SSH 对目标服务器完成只读预检。
- 目标 PostgreSQL 为 17.6，本机 `pg_dump/pg_restore` 也是 17.x；目标时区已经是 `Asia/Shanghai`。
- 服务器磁盘约 40 GB，当前剩余约 30 GB；`max_connections = 100`。
- 已创建独立正式空库 `bilibili_history`，owner 为不可登录角色 `bilibili_owner`。
- 已创建 `bilibili_migrator` 和 `bilibili_app`，目前均为 `NOLOGIN`，尚未设置新密码或增加公网 HBA 规则。
- `heartsticker` 数据库、账号和数据未被修改。
- 已创建隔离演练库 `bilibili_history_rehearsal`，并完成一次全量 dump/restore。
- 演练 dump 为 custom format，约 40 MB，包含 44 个目录对象。
- 源端与演练库的 7 个对象行数完全一致，6 张应用表的全表摘要完全一致。
- 演练库关系完整性检查全部为 0，`memberships_id_seq = max(memberships.id) = 32`。
- 正式库 `bilibili_history` 仍为空，尚未进行最终迁移或生产连接切换。
- 已为演练库授予 `bilibili_app` 最小 CRUD/sequence 权限，并仅为本机 SSH tunnel 测试启用 LOGIN；该角色没有密码，现有 HBA 不允许它从公网连接。
- 已建立 `127.0.0.1:15432` 到目标服务器 `127.0.0.1:5432` 的 SSH tunnel。
- 本地 `.env.local` 已指向 `bilibili_history_rehearsal`；`.env` 仍保留 Supabase 源连接。
- 已分别通过项目使用的 `postgres.js` 和 `pg.Pool` 成功读取演练库。
- 用户已完成本地注册/登录、历史查询与 CRUD 冒烟测试，结果正常。
- 用户明确选择临时无 TLS 的公网生产连接方案，并接受密码及业务数据明文传输风险。
- 已为正式 `bilibili_app` 生成 SCRAM-SHA-256 强密码，仍保持非超级用户、不可建库、不可建角色。
- 已在 HBA 中仅开放 `bilibili_app` 通过公网连接 `bilibili_history`；演练库和其他数据库没有新增公网授权。
- HBA 修改前备份位于服务器 `/root/.config/bilibili-history/`，规则解析无错误并已热加载。
- 已从公网验证正式库连接成功，确认当前连接未使用 TLS。
- 完整生产连接串保存在服务器 root-only 文件中，并已复制到用户本机剪贴板，没有写入仓库或本文档。
- 用户已暂停 Vercel Production，生产流量返回 `503 DEPLOYMENT_PAUSED`。
- 最终导出前后的源端签名完全一致，证明正式 dump 期间没有数据变化。
- 最终 dump SHA-256 为 `af3cd76338572ca42260533baf6cb8830384cf5d8b79d6e33a5345f1fd2714fe`，源端和目标服务器副本一致。
- 正式库 `bilibili_history` 已通过单事务恢复，runtime grants 和 `ANALYZE` 已完成。
- 正式基线为：`bilibili_history=327886`、`user=1798`、`account=1798`、`session=3382`、`memberships=16`、`verification=0`、Drizzle migration 记录 2 条。
- 源端与正式目标的 6 张应用表全表摘要完全一致，4 项孤儿检查均为 0，会员 sequence 与最大 ID 均为 32。
- 已从公网使用 `bilibili_app` 验证正式库读取和 CRUD 权限。
- Vercel 实际行为确认：项目暂停时会阻止新 deployment 构建，因此不能在 Pause 状态下完成 Redeploy。
- 为避免 Resume 后旧 deployment 再次写入 Supabase，已将源数据库 `default_transaction_read_only` 设置为 `on`。
- 已通过源端 transaction pooler 6543 的新会话确认 `transaction_read_only=on`；该设置可通过 `ALTER DATABASE postgres RESET default_transaction_read_only` 回滚。
- Vercel 暂停状态阻止构建后，已先锁定源库只读，再 Resume 并成功完成新 Production Deployment。
- 最新 main deployment 的首页、Better Auth session API、history 未授权响应和 memberships API 均符合预期。
- 对最新 main deployment 发起只读 API 请求时，正式目标库事务计数从 270 增加到 322，确认 Vercel 新 deployment 实际连接 `bilibili_history`，不是 Supabase。
- 目标行数保持最终基线不变；Supabase 仍为只读且行数未变化。
- 用户确认正确生产域名为 `bilibilihistory.com`；此前检查的 `bilibilihistory.02000721.xyz` 是无关旧域名。
- `bilibilihistory.com` 的首页、Better Auth、history 和 memberships 路由均正常；只读 API 请求使正式目标库事务计数增加，确认该域名连接的是自建 `bilibili_history`。
- 用户已通过 `bilibilihistory.com` 完成旧账号登录、历史读取和写入冒烟测试，结果正常。
- 切换后目标库健康检查：174 MB、327,886 条历史、1,798 个用户/账户、3,382 个会话、16 条会员；4 项孤儿检查为 0，会员 sequence 为 32，deadlock 为 0。
- 并发 API 验证一度留下 27 个 Vercel 连接；已为 `bilibili_app` 设置连接上限 60、空闲连接 60 秒、空闲事务 30 秒、语句 30 秒、锁等待 5 秒，并清理 26 个空闲连接。
- 已将 Drizzle 和 Better Auth 统一为同一个 `pg.Pool`；单进程默认最多 3 个连接，空闲 10 秒回收，连接等待 5 秒超时，Vercel 上使用 `attachDatabasePool` 管理 Fluid Compute 挂起前的空闲连接。
- 本地生产构建成功；统一连接池后的首页、Better Auth 匿名 session API 和 memberships 查询冒烟测试均返回 200。
- 已在服务器 `/www/backup/pgsql_bak/bilibili_history` 保存权限为 0600 的切换前和切换后 custom-format 备份及 SHA-256 文件；两份 archive 均能正常读取 44 个目录对象。
- 本机和服务器 staging 中的重复敏感 dump 已删除；正式备份保留，staging 仅保留 restore log。
- 本地 `.env.local` 已从演练库切换到正式 `bilibili_history`，仍通过 SSH tunnel 访问；`postgres.js` 与 `pg.Pool` 均验证成功。
- Supabase 源库继续保持只读，数据基线未变化，观察期内不删除。

执行时发现目标 PostgreSQL 是宝塔/自定义目录安装，二进制位于 `/www/server/pgsql/bin`，不是 systemd PostgreSQL service。演练恢复需要把 dump 放在 `postgres` 系统用户可穿越和读取的目录；后续统一使用 `/var/tmp/bilibili-history-migration`，不再使用 `/root` 或当前不可穿越的 `/www/backup` 父目录。

## 1. 结论与推荐方案

推荐在 `1.15.53.251` 的 PostgreSQL 实例上创建独立数据库 `bilibili_history`，不要把本项目的数据混入现有的 `heartsticker` 数据库。使用独立数据库、独立 owner/migrator/runtime 角色，可以避免两个站点之间发生表名、迁移记录、权限、备份和恢复方面的耦合。

本次采用“演练一次 + 短维护窗口内最终全量迁移”的方式：

1. 先解决目标端网络和凭据安全问题。
2. 创建隔离的目标数据库与最小权限角色。
3. 从 Supabase 的 session pooler（5432）或 direct endpoint 导出应用 schema。
4. 恢复到演练库，核对结构、行数、摘要、外键、序列并完成应用冒烟测试。
5. 正式切换时暂停所有应用请求，重新做一次最终 dump/restore。
6. 先在只读状态验证，再更新生产 `DATABASE_URL` 并开放写入。
7. 保留 Supabase 和最终 dump 一段观察期，确认目标备份可恢复后再退役源库。

当前数据量约 206 MB，应用数据结构简单，无触发器、RLS、应用自定义函数和大对象，不需要引入逻辑复制。逻辑复制会增加身份认证表、删除同步和序列同步的复杂度，对这个体量收益不大。

## 2. 项目与源库现状

### 2.1 应用技术栈

- Next.js 15。
- Drizzle ORM 与 Better Auth 都使用 `pg`。
- 业务查询和登录、账户、会话共用同一个进程级 `pg.Pool`。
- 连接池读取 `DATABASE_URL`；可选用 `DATABASE_POOL_MAX` 覆盖单进程默认上限 3。
- 项目没有使用 Supabase JavaScript SDK；Supabase 目前只是 PostgreSQL 托管方。
- 认证数据位于 `public` schema，而不是 Supabase 的 `auth` schema。

因此迁移后业务代码原则上不需要改写，核心变更是数据库对象、数据和运行环境连接串。

### 2.2 2026-08-22 只读盘点基线

源端为 PostgreSQL 15.8，数据库约 206 MB。以下行数只是规划时的快照，正式验收必须比较停写后的源端最终值与目标端值，不能把此表当作固定验收值。

| 对象 | 行数 | 作用 |
| --- | ---: | --- |
| `public.bilibili_history` | 327,886 | B 站观看历史，约 191 MB |
| `public.user` | 1,797 | Better Auth 用户 |
| `public.account` | 1,797 | Better Auth 登录凭证，包含密码哈希 |
| `public.session` | 3,381 | Better Auth 会话，其中 176 条尚未过期 |
| `public.memberships` | 16 | 会员记录 |
| `public.verification` | 0 | Better Auth 验证记录 |
| `drizzle.__drizzle_migrations` | 2 | 数据库迁移历史 |

其他检查结果：

- `auth.users`、`auth.sessions`、`storage.buckets`、`storage.objects` 均为 0 行。
- `public` 下没有 RLS policy、触发器、视图或自定义函数。
- 没有 PostgreSQL large object。
- `account`、`session`、`memberships` 到 `user` 的孤儿记录均为 0。
- `bilibili_history.user_id` 虽没有外键，但当前找不到对应用户的记录为 0。
- `memberships_id_seq.last_value = 32`，与当前 `memberships.id` 最大值一致。

### 2.3 迁移范围

需要迁移：

- 整个 `public` schema：6 张应用表、索引、约束和 `memberships_id_seq`。
- `drizzle` schema：`__drizzle_migrations` 表及序列。

不迁移：

- Supabase 管理的 `auth`、`storage`、`realtime`、`vault` schema。
- `pg_stat_statements`、`supabase_vault` 等 Supabase 平台扩展。
- 数据库级 Supabase 角色、权限和平台内部 migration。

## 3. 已发现的阻断项与风险

### 3.1 目标端公网连接没有 TLS——迁移前必须处理

在 2026-08-22 的探测中，`1.15.53.251:5432` 公网可达，但 PostgreSQL 返回“不支持 SSL”。这意味着当前连接串会通过公网明文传输数据库密码、用户数据、密码哈希和会话 token。

正式连接目标库前，必须至少完成一种方案：

- 推荐：防火墙关闭公网 5432，只允许应用服务器私网访问；迁移人员通过 SSH tunnel 连接 `127.0.0.1:5432`。
- 或：为 PostgreSQL 配置 TLS，客户端使用 `sslmode=verify-full`，并限制来源 IP。
- 如果应用仍运行在 Vercel，目标库通常不能只开放给一个固定出口 IP。应在目标侧增加受 TLS 保护的 PgBouncer/连接代理，或把应用部署到与数据库有私网连接的环境。

在此项解决前，不应使用用户提供的目标连接串传输真实数据。

### 3.2 已暴露的目标密码必须轮换

目标连接密码已经出现在对话中，应视为已泄露。不要把该密码写入本文档、Git、shell history 或命令行参数。创建新数据库时应建立新的运行时角色和随机强密码，并通过部署平台的 secrets 管理功能注入。

### 3.3 不能依赖现有本地 migration 从零建库

仓库的数据库迁移记录存在漂移：

- 当前 `lib/db/migrations/0000_yummy_lester.sql` 只创建 `memberships`。
- Better Auth 的 `user/account/session/verification` 在另一份 SQL 中。
- `lib/db/schema.ts` 没有声明 `session` 和 `verification`。
- Drizzle snapshot 没有完整覆盖当前 6 张应用表。
- Git 历史显示早期 `0000` migration 被替换，而不是追加新 migration。
- 源库 `drizzle.__drizzle_migrations` 有 2 条记录，本地 journal 只保留一个当前入口。

因此本次必须把源端生产数据库结构作为权威来源，使用 `pg_dump` 搬迁；不能对空目标库直接执行 `pnpm db:migrate` 或 `pnpm db:push`。迁移稳定后再单独整理新的 schema baseline，不要把 baseline 整理和数据搬迁混在同一个变更窗口。

### 3.4 认证会话与应用密钥

迁移会复制 Better Auth 的用户、密码哈希和 session。切换时必须保持现有 `BETTER_AUTH_SECRET`、生产域名、Cookie 配置和 `BETTER_AUTH_URL` 不变，才有机会保留现有登录状态。即使如此，也要用一个迁移前已登录的账号验证 session；若验证失败，回退方案是让用户重新登录，而不是改写密码数据。

### 3.5 时间与连接池

数据库字段大量使用 `timestamp without time zone`。目标数据库应设置 `timezone = 'Asia/Shanghai'`，应用容器的时区也应确认一致。不要在迁移窗口中顺便修改字段类型。

项目当前同时创建 `postgres.js` 和 `pg.Pool` 连接池。自建 PostgreSQL 的 `max_connections`、应用实例数和每实例连接数必须提前核算；否则切换后可能出现连接耗尽。可在后续代码变更中显式限制两套客户端的 pool size，生产环境优先通过 PgBouncer 连接。

## 4. 分阶段执行 Runbook

### 阶段 0：确认负责人、窗口和成功标准

- 确认当前生产部署位置；README 显示曾使用 Vercel，但执行前需要确认现状。
- 确认谁能 SSH 登录数据库服务器并使用 PostgreSQL 管理员账号。
- 约定维护窗口；当前体量建议预留 30–60 分钟，实际停机时间以演练计时为准。
- 明确迁移期间的维护页/停服方式。因为读取 session 也可能刷新会话，最终 dump 前应暂停整个应用流量，而不只是禁用 history POST。
- 指定回滚决策人，并预留至少 30 分钟的只读验收期。
- 确认源 Supabase 在切换后至少保留 7 天，不立即删除项目。

成功标准：

- 6 张应用表和 `drizzle` migration 表均存在，结构和约束一致。
- 停写后的源、目标逐表行数和摘要一致。
- 3 类外键无孤儿，`bilibili_history` 无失联用户。
- `memberships_id_seq` 不小于 `memberships.id` 最大值。
- 旧用户可登录；迁移前会话按预期保留或有明确的重新登录处理。
- 历史列表、分页、上传、更新、删除、会员读取均通过冒烟测试。
- 应用日志无认证错误、连接错误、超时或唯一约束异常。
- 目标端备份任务已启用并至少完成一次恢复演练。

### 阶段 1：加固并准备目标 PostgreSQL

1. 通过安全路径进入服务器：优先 SSH 后在数据库本机执行管理命令。
2. 轮换现有 `heartsticker` 密码，因为它已暴露；现有站点也要同步更新 secret。
3. 确认 PostgreSQL 版本、字符集、磁盘、连接数、时区、备份和 WAL 策略：

   ```sql
   select version();
   show server_encoding;
   show timezone;
   show max_connections;
   select pg_size_pretty(pg_database_size('heartsticker'));
   ```

4. 目标 PostgreSQL 应不低于源端 15；优先使用相同或更新 major 版本。dump/restore 客户端版本应与目标 major 匹配，并通过演练确认兼容性。
5. 至少预留数 GB 可用空间，并考虑数据增长、索引重建、临时文件、WAL 和备份空间。
6. 创建专用数据库和角色。密码使用 `\password` 交互设置，不写进 SQL 文件：

   ```sql
   -- 在服务器本机：sudo -u postgres psql
   create role bilibili_owner nologin;
   create role bilibili_migrator login;
   \password bilibili_migrator
   grant bilibili_owner to bilibili_migrator;

   create role bilibili_app login;
   \password bilibili_app

   create database bilibili_history
     owner bilibili_owner
     template template0
     encoding 'UTF8';

   revoke all on database bilibili_history from public;
   grant connect on database bilibili_history to bilibili_app;
   alter database bilibili_history set timezone = 'Asia/Shanghai';
   ```

7. 不把 `heartsticker` 账号作为本项目的生产运行账号。`bilibili_migrator` 仅用于 migration/restore，`bilibili_app` 仅用于应用 CRUD。
8. 配置每日全量备份和 WAL/PITR（如暂时没有 PITR，至少进行每日加密 `pg_dump`、异机保存和保留策略）。备份只有成功恢复过才算可用。

### 阶段 2：准备迁移工具与安全连接

源端当前应用 URL 使用 Supabase transaction pooler 的 6543 端口。它适合 serverless 事务流量，不适合 `pg_dump`。盘点已确认同一 Supabase session pooler 的 5432 端口可访问，正式导出应从 Supabase Connect 页面获取 session mode 5432 URL，或使用 direct connection。

建议在临时迁移机上设置只对当前用户可读的工作目录：

```bash
umask 077
MIGRATION_DIR="$(mktemp -d -t bilibili-db-migration.XXXXXX)"
```

连接信息只放入受限的 `.pgpass`/`PGPASSFILE` 或临时 secret 环境，不回显、不提交。本文统一使用以下占位变量：

- `SOURCE_DATABASE_URL`：Supabase direct 或 session pooler 5432 URL，必须启用 SSL。
- `TARGET_MIGRATOR_URL`：通过 SSH tunnel/private network/TLS 访问 `bilibili_history`，用户为 `bilibili_migrator`。
- `TARGET_APP_URL`：生产应用使用的 `bilibili_app` 最小权限 URL。

如果使用 SSH tunnel，可让目标 URL 指向本机临时端口，而不是从公网直连 5432：

```bash
ssh -N -L 15432:127.0.0.1:5432 <ssh-user>@1.15.53.251
```

迁移前验证源、目标版本，并保存到操作日志：

```bash
psql "$SOURCE_DATABASE_URL" -XAtc "select version(), current_database(), current_user"
psql "$TARGET_MIGRATOR_URL" -XAtc "select version(), current_database(), current_user"
pg_dump --version
pg_restore --version
```

### 阶段 3：完整演练

演练使用独立数据库，例如 `bilibili_history_rehearsal`，不能覆盖正式目标。演练时源应用可以继续运行，所以数据快照只用于测试流程和计时，不作为最终数据。

1. 使用 custom format 导出且只包含应用 schema：

   ```bash
   pg_dump \
     --dbname="$SOURCE_DATABASE_URL" \
     --format=custom \
     --file="$MIGRATION_DIR/rehearsal.dump" \
     --schema=public \
     --schema=drizzle \
     --no-owner \
     --no-privileges \
     --verbose

   shasum -a 256 "$MIGRATION_DIR/rehearsal.dump" \
     > "$MIGRATION_DIR/rehearsal.dump.sha256"
   pg_restore --list "$MIGRATION_DIR/rehearsal.dump" \
     > "$MIGRATION_DIR/rehearsal.contents.txt"
   ```

2. 检查目录清单，确认只有 `public`、`drizzle` 和所需对象，没有 `auth/storage/realtime/vault`。
3. 恢复到全新演练库。约 206 MB 时优先使用单事务、遇错即停，原子性比并行速度更重要：

   ```bash
   pg_restore \
     --dbname="$REHEARSAL_MIGRATOR_URL" \
     --role=bilibili_owner \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges \
     --single-transaction \
     --exit-on-error \
     --verbose \
     "$MIGRATION_DIR/rehearsal.dump" \
     2>&1 | tee "$MIGRATION_DIR/rehearsal-restore.log"
   ```

4. 在目标库重新授予 runtime 最小权限：

   ```sql
   revoke create on schema public from public;
   grant usage on schema public to bilibili_app;
   grant select, insert, update, delete
     on all tables in schema public to bilibili_app;
   grant usage, select, update
     on all sequences in schema public to bilibili_app;

   alter default privileges for role bilibili_owner in schema public
     grant select, insert, update, delete on tables to bilibili_app;
   alter default privileges for role bilibili_owner in schema public
     grant usage, select, update on sequences to bilibili_app;

   analyze;
   ```

5. 按第 6 节执行全部数据与结构校验。
6. 建立预览部署，把预览环境 `DATABASE_URL` 指向演练库；其他 Better Auth 配置保持与预览域名兼容。
7. 运行第 7 节冒烟测试并记录导出、恢复、校验各阶段耗时。
8. 演练通过后删除演练数据库；dump 按敏感备份处理，不可进入 Git 或普通网盘。

### 阶段 4：正式切换

正式切换建议按以下顺序执行，每一步都记录开始时间、结束时间和操作者：

1. 确认演练在近期成功，最终 dump 的磁盘空间充足，目标正式库为空或允许整体清理。
2. 打开维护页或停止生产应用全部流量，并等待现有请求和连接排空。
3. 确认源端没有应用写事务；记录源端最终行数、摘要和 sequence 状态。
4. 按演练命令生成 `final.dump`、SHA-256 和 contents 清单。
5. 按演练命令恢复到 `bilibili_history`，使用 `--single-transaction --exit-on-error`。
6. 应用最小权限 grants，执行 `ANALYZE`。
7. 在应用仍处于维护/只读状态时执行全部结构、数据、认证和性能校验。
8. 在生产 secrets 中把 `DATABASE_URL` 更新为 `TARGET_APP_URL`。保持 `BETTER_AUTH_SECRET`、生产 URL 和 Cookie 相关配置不变。
9. 重启/重新部署所有应用实例，确保旧连接池被清空。
10. 保持写入关闭，执行只读冒烟测试：旧 session、重新登录、历史列表和会员读取。
11. 若只读测试通过，再开放写入并测试新增/更新/删除。
12. 观察应用和数据库 30–60 分钟；无异常后宣布切换完成。

不要在最终 dump 后让旧 Supabase 与新库同时接受写入。当前应用没有双写、CDC 或冲突合并机制，两边同时写会导致无法安全回滚。

### 阶段 5：观察与源库退役

- 迁移后 24–48 小时重点观察认证失败率、API 5xx、查询延迟、连接数、CPU、内存、磁盘、WAL 增长和慢查询。
- 至少保留 Supabase 7 天；业务允许时建议保留 14 天。
- 最终 dump 加密后异机保存，明确保留期限；其中含密码哈希和 session token。
- 在目标端完成一次备份恢复演练，确认新备份链可用。
- 观察期结束后先撤销源库应用账号/网络访问，再安排 Supabase 项目删除。
- 删除迁移机上的明文 dump、临时 `.pgpass` 和日志中的连接信息，并记录删除时间。

## 5. 正式迁移命令模板

以下模板只能在阶段 1–3 的安全要求完成后使用。变量值不应写入脚本仓库。

```bash
umask 077
MIGRATION_DIR="$(mktemp -d -t bilibili-db-final.XXXXXX)"

pg_dump \
  --dbname="$SOURCE_DATABASE_URL" \
  --format=custom \
  --file="$MIGRATION_DIR/final.dump" \
  --schema=public \
  --schema=drizzle \
  --no-owner \
  --no-privileges \
  --verbose \
  2>&1 | tee "$MIGRATION_DIR/final-dump.log"

shasum -a 256 "$MIGRATION_DIR/final.dump" \
  > "$MIGRATION_DIR/final.dump.sha256"
shasum -a 256 -c "$MIGRATION_DIR/final.dump.sha256"

pg_restore --list "$MIGRATION_DIR/final.dump" \
  > "$MIGRATION_DIR/final.contents.txt"

pg_restore \
  --dbname="$TARGET_MIGRATOR_URL" \
  --role=bilibili_owner \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --single-transaction \
  --exit-on-error \
  --verbose \
  "$MIGRATION_DIR/final.dump" \
  2>&1 | tee "$MIGRATION_DIR/final-restore.log"
```

说明：

- `--clean` 只允许用于本项目的独立、可整体重建数据库，不能指向现有 `heartsticker` 数据库。
- custom archive 支持查看内容并选择性恢复；本项目体量下使用单事务串行恢复即可。
- 如果演练证明串行恢复超出窗口，可改为 `pg_restore --jobs=2`，但它不能和 `--single-transaction` 同时使用，原子性和错误清理方式需要重新评估。
- dump 成功不等于恢复成功；必须检查命令退出码和 restore log，不能只看文件存在。

## 6. 验证清单

### 6.1 逐表行数

在停写后的源端与恢复后的目标端分别运行并保存结果：

```sql
select 'account' as table_name, count(*)::bigint from public.account
union all select 'bilibili_history', count(*)::bigint from public.bilibili_history
union all select 'memberships', count(*)::bigint from public.memberships
union all select 'session', count(*)::bigint from public.session
union all select 'user', count(*)::bigint from public."user"
union all select 'verification', count(*)::bigint from public.verification
union all select 'drizzle.__drizzle_migrations', count(*)::bigint
  from drizzle.__drizzle_migrations
order by 1;
```

### 6.2 内容摘要

在源、目标分别计算。摘要结果必须相同；只记录摘要，不导出明文账户、密码哈希或 token。

```sql
select 'account' as table_name,
       md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by id), '')) as digest
from public.account t
union all
select 'bilibili_history',
       md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by id, user_id), ''))
from public.bilibili_history t
union all
select 'memberships',
       md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by id), ''))
from public.memberships t
union all
select 'session',
       md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by id), ''))
from public.session t
union all
select 'user',
       md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by id), ''))
from public."user" t
union all
select 'verification',
       md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by id), ''))
from public.verification t;
```

`row_to_json` 的列顺序依赖相同表结构，因此摘要差异时先比较 schema，再定位数据差异。

### 6.3 关系完整性与序列

```sql
select
  (select count(*) from public.account a
     left join public."user" u on u.id = a."userId"
     where u.id is null) as orphan_accounts,
  (select count(*) from public.session s
     left join public."user" u on u.id = s."userId"
     where u.id is null) as orphan_sessions,
  (select count(*) from public.memberships m
     left join public."user" u on u.id = m.user_id
     where u.id is null) as orphan_memberships,
  (select count(*) from public.bilibili_history h
     left join public."user" u on u.id = h.user_id
     where u.id is null) as history_without_user;

select max(id) as max_membership_id from public.memberships;
select last_value, is_called from public.memberships_id_seq;
```

四个 orphan 值应均为 0，sequence 的下一值必须大于现有最大 ID。如有异常，修复方式为：

```sql
select setval(
  'public.memberships_id_seq',
  coalesce((select max(id) from public.memberships), 1),
  (select count(*) > 0 from public.memberships)
);
```

### 6.4 结构与权限

- 目标端必须有 6 张 `public` 表和 1 张 `drizzle` 表。
- 比较列类型、nullable、default、主键、唯一约束、外键和全部索引。
- `bilibili_app` 能 CRUD 应用表和使用 `memberships_id_seq`，但不能建表、删表或访问其他数据库。
- 确认 `public` schema 没有多余 Supabase 平台对象。
- 确认 `show timezone`、`server_encoding` 和数据库版本符合预期。
- 运行 `ANALYZE` 后检查主要查询计划，尤其是历史分页查询。

## 7. 应用冒烟测试

按顺序执行，并使用专门测试账号：

1. 使用迁移前未过期 session 打开 dashboard。
2. 退出后使用原邮箱和密码重新登录。
3. 加载历史第一页和后续分页，核对总数、排序和中文内容。
4. 上传一条测试历史，再以相同 `(id, user_id)` upsert 更新。
5. 删除测试历史，确认不会影响其他用户。
6. 验证免费用户 500 条限制与会员状态判断。
7. 读取会员列表并验证一个会员关联用户。
8. 创建/更新/删除一条测试会员，确认 `memberships_id_seq` 正常递增。
9. 检查应用日志和 PostgreSQL 日志，无认证、连接、约束、编码和超时错误。

测试数据应在验证后删除，并再次确认表计数符合预期变化。

## 8. 回滚方案

### 8.1 开放目标写入前

这是最安全的回滚窗口：

1. 保持维护模式。
2. 将生产 `DATABASE_URL` 恢复为原 Supabase runtime URL。
3. 重启全部应用实例，清空目标连接。
4. 验证 Supabase 登录和历史读取。
5. 关闭维护模式。
6. 保留失败的目标库和日志用于排查，不在现场反复覆盖。

因为源端在最终 dump 前已停写，且目标端尚未开放写入，此时不会丢数据。

### 8.2 已开放目标写入后

不能直接把连接串切回 Supabase，否则目标端新增/修改/删除的数据会丢失。必须：

1. 立即重新进入维护模式，冻结目标端写入。
2. 记录开放写入时间和受影响表。
3. 比较目标与源端增量，包括删除记录；`session` 也可能发生变化。
4. 生成并审核目标到源端的回填脚本或执行一次受控反向全量恢复。
5. 数据对齐后才能切回源端。

因此正式切换要把“只读验证通过”设置为开放写入的硬门槛，并尽量在开放写入后的最初一小时完成高强度观察。

## 9. 迁移后需要单独安排的工程治理

这些事项重要，但不应塞进数据切换窗口：

1. 修复 Drizzle migration 基线，让空库可以从仓库完整重建 6 张应用表。
2. 在 `lib/db/schema.ts` 中补齐 `session`、`verification`，并核对 Better Auth 当前版本需要的全部索引。
3. 调整 `drizzle.config.ts` 的 `tablesFilter`，避免只跟踪 `bilibili_history`。
4. 建立 CI：从空 PostgreSQL 执行 migration，再运行 schema diff 和基础集成测试。
5. 已完成：统一 Drizzle 与 Better Auth 的 `pg.Pool`，显式配置连接上限、连接超时和空闲回收；SSL 仍待独立安全改造。
6. 根据实际查询计划评估为历史分页添加复合索引 `(user_id, view_at desc)`；不要在迁移当天顺便优化索引。
7. 为目标库增加容量、连接数、备份失败、复制/WAL 和慢查询告警。

## 10. 执行前最终确认表

- [ ] 目标公网 5432 已关闭或已配置可验证 TLS，并限制访问来源。
- [ ] 对话中暴露的旧密码已经轮换。
- [ ] 已创建独立 `bilibili_history` 数据库和三类角色。
- [ ] 目标 PostgreSQL/client 版本已确认并通过演练。
- [ ] 目标备份与恢复流程已经跑通。
- [ ] Supabase session mode 5432/direct dump URL 已准备。
- [ ] 演练 dump/restore、校验、应用测试全部通过并已记录耗时。
- [ ] 维护窗口、维护页、回滚决策人已确认。
- [ ] 生产 secrets 的改动和重新部署步骤已确认。
- [ ] `BETTER_AUTH_SECRET` 和生产 URL 在切换中保持不变。
- [ ] 最终 dump、校验记录和日志的加密保存/销毁策略已确认。
- [ ] 源 Supabase 的保留期限已确认。

## 11. 参考资料

- [Supabase：选择 direct、session pooler 与 transaction pooler](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PostgreSQL：pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL：pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Drizzle ORM：使用现有 node-postgres Pool](https://orm.drizzle.team/docs/get-started/postgresql)
- [Vercel：使用 attachDatabasePool 管理连接池](https://vercel.com/kb/guide/efficiently-manage-database-connection-pools-with-fluid-compute)
