# PostgreSQL 服务器迁移方案：1.15.53.251 → 118.25.22.240

> 盘点日期：2026-10-11（Asia/Singapore）
>
> 状态：本次数据库迁移已完成（2026-10-11，步骤 1–6）；Vercel 已切换目标正式库，网站恢复访问，30 项自动化功能检查通过。旧库 app 保持 NOLOGIN，新库 app LOGIN，临时维护及测试密钥已移除。用户决定暂缓配置定期备份；旧库继续保留，尚未退役。
>
> 本文是本次迁移的执行依据；`database-migration-plan.md` 是 2026-08 的 Supabase 迁移历史，不适用于本次直接执行。
>
> 文档不保存数据库密码、用户明细、密码哈希或会话 token。

## 0. 实际执行记录（2026-10-11）

### 0.1 步骤 1：实例安装

已在 `118.25.22.240` 完成 PostgreSQL 实例安装及验证，旧服务器和 Vercel 配置未修改。

| 项目 | 实际结果 |
| --- | --- |
| 版本/安装渠道 | 官方 PostgreSQL 17.11 源码包，下载后 SHA-256 校验通过 |
| 构建 | 使用已有系统编译依赖，`nice -n 10 make -j2`；没有安装/升级 OS RPM 包 |
| PostgreSQL 回归测试 | `make check` 的 225 项测试全部通过 |
| 二进制目录 | `/www/server/pgsql/bin` |
| 数据/主配置 | `/www/server/pgsql/data` / 该目录的 `postgresql.conf` |
| 本次配置 | `/www/server/pgsql/data/bilibili-instance.conf`，由主配置 include |
| HBA | `/www/server/pgsql/data/pg_hba.conf` |
| 服务 | `bilibili-postgresql.service`，active/running，已 enable 开机启动 |
| Unix socket | `/run/bilibili-postgresql`；管理员通过 `runuser -u postgres` 使用 peer 认证 |
| 数据属性 | UTF8、libc、en_US.UTF-8、Asia/Shanghai、data_checksums=on |
| 初始资源配置 | max_connections=100，shared_buffers=256MB，work_mem=4MB |
| 持久化设置 | fsync / full_page_writes / synchronous_commit 均 on |
| 网络/协议 | 监听 IPv4/IPv6 的 5432；按用户要求 ssl=off，未来应用连接使用 sslmode=disable |
| 当前远程授权 | 所有 TCP 数据库登录 reject，尚未创建应用角色或业务库 |
| 验证 | 服务重启后测试记录存在，测试表随后删除；本机 peer 正常、TCP 管理员拒绝、root 冒充 postgres 被 peer 拒绝 |
| 公网验证 | 从开发机完成 PostgreSQL 协议探测；5432 可达、SSL 响应 N、远程管理员登录 SQLSTATE 28000 被 HBA 拒绝 |
| 其他服务 | MySQL、Redis、Nginx、uvicorn、Next.js 原 PID 均保持运行；没有重启整机 |
| 当前数据库 | 仅默认 postgres/template0/template1，未创建 bilibili_history 或演练库 |

公网探测验证了从开发机到目标的实际路径，没有读取腾讯云控制台中的安全组内容；实际 Vercel Function 使用应用账号的连接仍属于后续演练验收。

安装日志和初始配置备份保存在目标 root-only 目录 `/root/bilibili-pg17-install-20261011/`，包含源码包及 SHA-256 文件、依赖清单、`configure.log`、`check.log`、`install.log`、`initdb.log`、`instance-setup.log` 和安装前后进程/监听记录。源码构建目录为 `/var/tmp/bilibili-pg17-build-20261011/postgresql-17.11`。

日常操作在目标服务器执行：

```bash
systemctl status bilibili-postgresql.service --no-pager
systemctl reload bilibili-postgresql.service
# 只有修改需要重启的配置或维护时才使用：
systemctl restart bilibili-postgresql.service
runuser -u postgres -- /www/server/pgsql/bin/psql \
  -h /run/bilibili-postgresql -X -d postgres
```

这是独立 systemd 管理的源码安装，未注册为宝塔管理的 PostgreSQL。后续补丁升级需下载对应官方 17.x 源码，沿用编译选项、测试并在维护窗口替换二进制和重启服务，不使用 `dnf upgrade` 或宝塔按钮覆盖本目录。[官方构建安装说明](https://www.postgresql.org/docs/17/install-make.html)

步骤 1 结束时尚未创建本项目角色和数据库；以下步骤 2 已完成创建。源库仍提供生产服务，本机 `.env` / `.env.local` 均未修改。

### 0.2 步骤 2：角色和空演练库

仅在新服务器 `118.25.22.240` 执行，没有访问或修改旧库、Vercel 及本地环境配置。

| 项目 | 实际结果 |
| --- | --- |
| `bilibili_owner` | NOLOGIN，无密码；非超级用户，无建库、建角色、复制及绕过 RLS 权限 |
| `bilibili_app` | 已设置独立新密码；最终 NOLOGIN；非超级用户，无建库、建角色、复制及绕过 RLS 权限；不是 owner 成员 |
| 账号资源限制 | 连接上限 60；idle_session_timeout=60s、idle_in_transaction_session_timeout=30s、statement_timeout=30s、lock_timeout=5s |
| 演练库 | `bilibili_history_rehearsal`，owner 为 `bilibili_owner`，UTF8 / libc / en_US.UTF-8 / Asia/Shanghai |
| 数据库及 schema 权限 | PUBLIC 的数据库权限和 public schema 权限已撤销；app 仅有数据库 CONNECT、public schema USAGE，无 CREATE/TEMP 权限 |
| public schema owner | `bilibili_owner` |
| 新密码 | 32 字节随机值，通过已安装 PostgreSQL 自带 libpq 生成 SCRAM verifier；数据库只接收 verifier，不发送明文密码作为 SQL |
| HBA | 增加仅匹配演练库/应用账号/127.0.0.1 的 SCRAM 规则；管理员保持本机 peer；其余 TCP 仍 reject |
| 配置加载 | HBA 解析无错误，已热加载；没有重启数据库或其他服务 |
| 正向测试 | 临时启用 app LOGIN，本机 SCRAM 认证成功；账号、数据库、时区、30 秒语句超时正确；合成测试表 CRUD 通过并回滚 |
| 权限拒绝测试 | 错误密码、app 建表、app 切换 owner、app 连接 postgres 数据库全部被拒绝 |
| 公网验证 | 从开发机以演练库/app 发起无密码 PostgreSQL 启动请求，明确被 HBA 拒绝 |
| 清理及结束状态 | 测试表及序列已移除；public 下 0 张表、0 个序列；app NOLOGIN 且无残留连接；owner 密码为 NULL，app 存储为 SCRAM |

新凭据仅保存在新服务器的 root-only 目录 `/root/.config/bilibili-history-migration-20261011/`（0700，root:root）：

- `app-password.txt`：新账号密码，0600。
- `rehearsal.env`：指向目标演练库的连接串，0600；当前 NOLOGIN 且没有公网授权，不能直接用于线上切换。
- `rehearsal.pgpass`：本机 SCRAM 连接测试使用的密码文件，0600。

没有将密码写入本文档、Git、命令行参数或工具输出。[PostgreSQL 密码文件说明](https://www.postgresql.org/docs/17/libpq-pgpass.html)

步骤 2 的受限执行记录在 `/root/bilibili-pg17-step2-20261011/`（0700），包含变更前 `pg_hba.conf.before`、`app-crud-check.txt` 和 `checks-summary.json`。执行脚本保存在 `/root/bilibili-pg17-install-20261011/step2-prepare.py`，不含实际密码，带重名检查，禁止重复覆盖已创建的角色、库或凭据文件。

步骤 2 结束时没有导入数据；后续执行情况见步骤 3 记录。

### 0.3 步骤 3：在线备份及迁移演练（已完成）

在源库保持生产服务的情况下，于 2026-10-11 12:52:53（Asia/Shanghai；新加坡同为 UTC+8）创建完整 custom-format archive。只读备份没有修改源正式库、源应用角色或 Vercel 生产变量。

| 项目 | 实际结果 |
| --- | --- |
| 在线备份 | 源 PG 17.6 `pg_dump -Fc --no-owner --no-acl` 成功，54,125,302 字节（约 51.6 MiB） |
| 导出用时 | 4.62 秒 |
| 文件传输 | 源 → 开发机 → 目标，经 SSH/scp 中转，合计 162.36 秒；目标 SHA-256 校验通过 |
| 校验基准 | 同一 archive 恢复到源端新建的 `bilibili_history_snapshot_check`；不与仍在写入的正式库做时点混淆的比较 |
| 源校验库恢复 | 8.16 秒；数据库 PUBLIC CONNECT 已撤销，不授予应用访问 |
| 目标恢复 | PG 17.11，单事务、失败即停止、以 `bilibili_owner` 创建对象，用时 12.09 秒 |
| 完整性核验 | 源/目标输出均 117 行；排除第一行库名/版本/体积后完全一致；各端校验约 6.1 秒 |
| 数据 | history 422,573；user 1,998；account 1,998；session 3,914；memberships 17；verification 0；Drizzle 记录 3；每表全行摘要一致 |
| 结构和关系 | 60 列定义、17 个索引、13 个约束、对象 owner / RLS / 扩展一致；4 项孤儿数均为 0 |
| 序列 | memberships 33 / is_called=true / max ID 33；Drizzle 3 / true / max ID 3，源目标一致 |
| 应用权限 | public 表 CRUD、序列 USAGE/SELECT、schema USAGE；无 schema CREATE、owner 成员资格或 drizzle schema USAGE |
| 本地应用构建 | 隔离工作副本，Next.js 15.2.8 / Node 24.15.0，9.321 秒，退出码 0；沿用项目原有忽略 lint/类型错误的构建设置 |
| 应用测试 | 30 项检查、31 次 HTTP 请求全部通过；通过独立 SSH tunnel `127.0.0.1:25432` 连接目标演练库，应用只监听 `127.0.0.1:3301` |
| 请求用时 | 本机演练最小 15 ms、中位 61 ms、最大 296 ms；含密码计算及 tunnel，不能当作 Vercel 公网性能结果 |
| 测试后处理 | 应用和 tunnel 已停止；目标演练库重新从同一备份恢复并重授权限，再次完整校验通过，测试记录和序列变化全部清除；源端本次新建的隔离校验库已移除，原有其他库不变 |
| 结束状态 | 目标 app NOLOGIN、0 个应用连接、HBA 错误 0；公网规则仍 reject；目标正式 `bilibili_history` 未创建 |

应用验收覆盖：未登录拒绝访问、新用户注册/登录/退出/会话、单条上传及 upsert、批量 upsert、分页、关键词和日期过滤、非法日期、历史删除、免费用户 500 条限制、有效会员超过额度上传、过期/取消会员拒绝上传、会员创建/搜索/读取/修改/删除、合成账号密码重置及新旧密码验证、用户数据隔离和运行账号最小权限。

另以演练库中已有且未过期的 session，在内存中按 Better Auth 协议使用本地原有 `BETTER_AUTH_SECRET` 构造请求，成功识别对应用户并读取其正确的历史总数。后续 Vercel 演练也使用该项目实际 Preview secret，通过同样的已有会话验证；该变量在项目中与 Production 共用。未输出 session token、用户身份、密码哈希或历史明细。没有获取真实用户密码，所以**旧账号原密码的人工登录尚未测试**；复制的 account 内容摘要一致、合成账号密码流程通过。正式域名的真实浏览器登录/会话连续性作为步骤 6 的用户验收项。

演练暴露并修复了文档中的 schema 判断错误：TOC 有 `SCHEMA public` 条目，但实际恢复 SQL 明确不创建默认 public。源校验库首次因缺少 public 失败，单事务回滚；补回空 schema 后恢复成功。目标恢复和第 6 节已改为依据实际 schema-only SQL 判断，正式迁移必须沿用修正后的流程。

受限备份和日志：

- 两端 archive：`/var/tmp/bilibili-migration-20261011/rehearsal.dump`，目录 0700、archive 0600，包含真实认证及业务数据，禁止入 Git 或公开下载；同目录有 `rehearsal.sha256`、TOC、导出/恢复耗时和日志。
- 两端管理员记录：`/root/bilibili-pg17-step3-20261011/`，0700。目标包含源/目标/重置后校验、传输、构建和应用测试摘要；源包含源快照校验结果。没有保存用户明细或实际密码。
- 开发机临时副本位于 `~/.local/share/bilibili-migration-20261011/`，0700；本地中转 archive、演练凭据和隔离应用副本已移除，保留不含凭据的执行脚本及汇总。应用配置未写入仓库 `.env` / `.env.local`。
- 新凭据仍只保存在步骤 2 的目标 root-only 凭据目录；正式迁移尚未使用它。

目标实例全程未重启。测试后短时采样可用内存约 1.7 GiB、磁盘剩余 42 GiB、CPU 空闲约 93%–97% 且未观察到 swap 换入/换出；采样不是全程峰值监测报告。

#### 受保护 Vercel Preview 验收（已完成）

已只读访问控制台，核实项目为 `mundane799699s-projects/bilibilihistory`（Hobby），绑定仓库 `mundane799699/bilibilihistory`。当前正式域名 `bilibilihistory.com`；Production deployment 为 `E5HBTjwPiTSjsQFTjzYL9hkMhiK6`，部署域名 `bilibilihistory-i2qzggg2t-mundane799699s-projects.vercel.app`，Ready，提交 `eea8ac5eee127ee7a80d7c1a5143b00211764740`，与本次本地测试 HEAD 一致。切换前需刷新这些基线。

变量列表显示 DATABASE_URL 和 Better Auth 变量当前均作用于 All Environments；未揭示值、修改变量或重部署。Deployment Protection 的 Require Log In 已开启，类型为 `(Legacy) Standard Protection`；未列出公开保护例外。没有新建 bypass secret 或分享链接。

用户已完成 CLI 登录，`whoami` 核实为 `mundane799699`。已把隔离副本绑定到现有项目 `prj_GAkVZh3WUK5lnWUumYNO9nZsW0ww` / team `team_0dExvzggbTGzdYpo3Z0y7QaX`，没有在仓库创建 `.vercel` 或修改 `.env`。通过受限文件拉取 Preview 配置，再由进程环境注入本 deployment 专用 DATABASE_URL 和测试域名；命令参数只有变量名，没有密码。原有通用 Preview / Production 环境变量保持原值。[Vercel CLI 登录说明](https://vercel.com/docs/cli/login)、[Vercel 部署参数](https://vercel.com/docs/cli/deploy)

| 项目 | 实际结果 |
| --- | --- |
| 测试 deployment | `dpl_55JNoUHkaXmzpX66E3WN7zVWyjQV`，Preview / target=null，创建于 2026-10-11 13:17:26.727（UTC+8），构建达到 READY |
| 测试 URL | `bilibilihistory-1m8xi029y-mundane799699s-projects.vercel.app`；独立临时 alias `bilibilihistory-dbcheck-20261011-9f6672.vercel.app`，均已删除，不可继续访问 |
| 代码范围 | 当前 HEAD 的隔离副本，仅额外添加临时 `/api/migration-check` 路由，要求随机请求头；没有把诊断路由写入仓库或正式部署 |
| 运行环境 | 项目设置 Node.js 22.x、Next.js 15.2.8、pg 8.16.0、Better Auth 1.2.8；Function region 沿用生产 `iad1` |
| 构建耗时 | 构建日志记录 49 秒；从创建到 Deployment completed 约 58.3 秒 |
| 未登录保护 | 独立 alias 的匿名请求返回 302，转向 `vercel.com/sso-api`；实际需要 Vercel Authentication，没有添加公开例外 |
| 数据库身份 | 真正的 Vercel Function 返回 `bilibili_history_rehearsal` / `bilibili_app` / Asia/Shanghai；实例地址与目标相符；history 422,573 / user 1,998 / memberships 17 |
| 功能验收 | 在 Vercel Preview 上再次完成 30 项检查、31 次 HTTP 请求，全部通过，覆盖与本地相同的登录、已有会话、上传、过滤、额度、会员、密码重置及用户隔离 |
| 请求用时 | 最小 467 ms、中位 1,220 ms、最大 6,012 ms，含首次 Function 调用及公网请求时间，不代表纯 SQL 耗时 |
| 连接观测 | 测试结束前目标观测到 2 个空闲应用连接；HBA 错误 0；连接在清理时终止 |
| 生产核验 | 前后 project.env 完全一致，生产 deployment 仍为 `dpl_E5HBTjwPiTSjsQFTjzYL9hkMhiK6`；ssoProtection 保持原值 |
| 清理 | 撤销临时演练库公网 HBA、app NOLOGIN、清空应用连接；删除 Preview 及独立 alias，分别通过 API 404 核实；演练库恢复原备份、重授权限，117 行校验再次匹配源快照 |

CLI `vercel curl` 会自动为项目生成 Protection Bypass for Automation secret。本次生成令牌只用于测试请求，没有设置为部署环境变量。排查时一枚临时令牌意外出现在工具记录中，已立即通过 protection-bypass API 撤销并更换；替换令牌保存在 0600 文件中，全部测试结束后也已撤销。最后核实项目 protectionBypass 与原先状态一致（无令牌），没有留下可用的临时访问密钥。[CLI curl 行为](https://vercel.com/docs/cli/curl)、[自动化访问说明](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)

补充日志和摘要保存在目标 `/root/bilibili-pg17-step3-20261011/`，包括 `preview-build.log`、`preview-tests-summary.json`、`preview-protection-check.json`、`preview-probe-summary.json`、`production-preservation-summary.json` 和 `target-after-vercel-verify.txt`。本地拉取的环境变量、数据库密码文件、临时令牌和隔离部署副本均已清理；没有把它们放入文档或 Git。

步骤 3 自动化验收已通过。原密码的真实浏览器登录留在步骤 6 正式域名人工验收；以下步骤 4 已进入维护窗口。

### 0.4 步骤 4：维护、硬停写及最终备份（已完成）

用户于 2026-10-11 指示继续执行下一步，本次按步骤 4 启动维护。**步骤 4 结束时网站保持维护，旧库不能登录，目标正式库尚未恢复，Vercel 生产连接尚未切换。不得在后续恢复/切换期间重新启用旧账号。**

| 项目 | 实际结果 |
| --- | --- |
| 生产基线 | 仍为 `dpl_E5HBTjwPiTSjsQFTjzYL9hkMhiK6`，Node.js 22.x / iad1；没有正在构建或排队的 deployment |
| 生产别名 | `bilibilihistory.com`、`www.bilibilihistory.com`、`bilibilihistory-mundane799699s-projects.vercel.app`、`bilibilihistory-git-main-mundane799699s-projects.vercel.app`，绑定未改 |
| 配置备份 | 已安全拉取实际 Production 环境变量；数据库与认证 secret 没有改变，没有打印变量值 |
| Git 构建冻结 | 项目的 `commandForIgnoringBuildStep` 从 `null` 临时改为 `exit 0`；Git 构建将被忽略，仓库连接保留。切换完成或回退时恢复 `null` |
| 全站维护 | 发布项目级 WAF 规则 `Database migration maintenance 20261011`：启用，path starts with `/`，Deny，覆盖所有路径及方法；未使用会阻止构建的项目 Pause |
| 维护前状态 | firewallEnabled=false，无规则、无草稿、无自定义 bypass；维护后 firewallEnabled=true，1 条活动规则，无草稿。没有新增保护绕过令牌或公开例外 |
| 入口验证 | 2026-10-11 13:36:56（UTC+8）完成 28 次检查：四个生产别名各自的首页、history、memberships、auth/get-session 共 16 项返回 403；三个 READY 部署直连地址的同样路径共 12 项返回 302 至 Vercel 登录。未验证登录 Vercel 后的历史 URL 请求；其数据库访问由后述 NOLOGIN 硬阻断 |
| 写入者盘点 | 正式库可连接的 LOGIN 角色仅 postgres 和 bilibili_app；非管理员可写角色仅 app；无 publication / subscription / prepared transaction；仍为 7 表、2 序列 |
| 定时作业盘点 | Vercel cron definitions 为空；源端 root cron、`/etc/cron.d` 及 systemd service/timer 文件未发现明确引用本项目的作业。未逐一操作外部同步客户端；其使用旧 app 凭据的新连接均会被拒绝 |
| 硬停写时点 | **2026-10-11 13:37:20.534（UTC+8）**，源端 `ALTER ROLE bilibili_app NOLOGIN` 并终止正式库既存客户端连接；其余数据库及 PostgreSQL 服务未重启 |
| 停写验证 | 源正式库客户端连接 0、预备事务 0；使用安全保存的实际 Production DATABASE_URL 从开发机连接，SQLSTATE 28000，确认应用登录被拒绝 |
| 最终备份 | `/var/tmp/bilibili-migration-20261011/final.dump`，custom format、无 owner/ACL，54,125,303 字节；导出耗时 **4.760 秒** |
| 最终 SHA-256 | `541de986d31e2d81594c086753ee8b0d88b8fc518dc2aa1b169b8f6fd465b964`；旁置 `final.sha256`，后续传输需重新核对 |
| 停写一致性 | `source-before-final.txt` / `source-after-final.txt` 各 117 行；排除第一行身份/体积后全部一致，数据摘要、结构及序列没有变化；完成于 13:37:35.278 |
| 最终数据 | history 422,573；user 1,998；account 1,998；session 3,914；memberships 17；verification 0；Drizzle 3；4 项孤儿数均 0 |
| 目标结束状态 | app NOLOGIN、应用连接 0、HBA 错误 0；仅保留原演练库，正式 `bilibili_history` 尚未创建 |

源端 root-only 执行目录为 `/root/bilibili-pg17-step4-20261011/`（0700），保存执行脚本、校验 SQL、账号原状态、停写开始时间、备份前后验证及 `summary.json`。实际旧 Production 配置保存为同目录 `step4-production-before.env`（0600），包含凭据，仅用于后续核验或回退，禁止打印/提交。最终 archive 为 postgres 所有、0600，旁置导出日志、TOC 和实际 schema-only SQL；没有覆盖 `rehearsal.dump`。

开发机受限目录 `~/.local/share/bilibili-migration-20261011/` 保存 Vercel 变更前配置、域名绑定、维护验证及源端汇总，用于步骤 5–6。与步骤 3 的已清理临时配置不同，本次 Production 配置备份暂时保留为 0600；正式切换验收后清理本地凭据副本。服务器保留回退所需的受限副本。

步骤 4 结束后的恢复工作使用 **final.dump** 新建目标正式库，不能使用演练库代替正式库。以下步骤 5 已完成此工作；源库持续 NOLOGIN，网站维护规则持续启用。

若在目标尚无应用写入时取消迁移，保持维护，先确认生产 deployment/环境变量仍与基线相同，再仅在源正式库的管理员连接执行 `ALTER ROLE bilibili_app LOGIN`，验证旧库可用后删除上述 WAF 规则并发布；随后将 firewallEnabled 恢复原来的 false、Ignored Build Step 恢复 null。当前未实际执行回退，也没有允许源库重新写入。

WAF 的增删都先形成草稿，必须 publish 才生效；本次通过 CLI/API 完成并复查。[Vercel Firewall API](https://vercel.com/docs/vercel-firewall/firewall-api)、[Ignored Build Step](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel)

### 0.5 步骤 5：正式恢复、完整验收及切换前备份（已完成）

用户继续指示执行下一步后，使用步骤 4 的最终 archive，在 `118.25.22.240` **新建**正式 `bilibili_history` 并恢复。没有改名或覆盖演练库，也没有更新 Vercel Production 环境变量或域名绑定。完成时间为 **2026-10-11 13:45:25.639（UTC+8）**。

| 项目 | 实际结果 |
| --- | --- |
| 恢复前复核 | 旧库 app NOLOGIN、客户端 0、预备事务 0；再次执行全部校验，仍匹配步骤 4 最终基线。目标 app NOLOGIN、应用连接 0，正式库及本次临时校验库均不存在 |
| 文件传输 | 源 → 开发机 → 目标，经 SSH/scp；双程中转及本地散列校验合计 **161.137 秒**，54,125,303 字节 |
| 传输完整性 | 本地、目标均计算 SHA-256，匹配源 `final.dump` 的 `541de986d31e2d81594c086753ee8b0d88b8fc518dc2aa1b169b8f6fd465b964` |
| 正式库创建 | owner=bilibili_owner，template0，UTF8 / libc / en_US.UTF-8，TimeZone=Asia/Shanghai；数据库 PUBLIC 权限撤销，app 仅有 CONNECT |
| public schema | 依据本次实际 schema-only SQL 确认没有 CREATE SCHEMA public；保留默认空 schema 并将 owner 改为 bilibili_owner，再恢复对象 |
| 正式恢复 | PG 17.11，本机 peer 管理连接，pg_restore 以 bilibili_owner、单事务、失败即停止、无 owner/ACL 参数恢复，耗时 **11.842 秒**，退出码 0 |
| 完整性核验 | 目标 117 行校验，耗时 **5.760 秒**；排除第一行库名/版本/体积后，与源最终结果完全一致；完成备份恢复测试后，正式库再校验仍一致 |
| 正式数据 | history 422,573；user 1,998；account 1,998；session 3,914；memberships 17；verification 0；Drizzle 3；七表全行摘要一致 |
| 结构及关系 | 60 列定义、17 索引、13 约束、owner / RLS / 扩展与源一致；7 表、2 序列；4 项孤儿数均 0，无未验证约束 |
| 序列 | memberships 33 / is_called=true / max ID 33；Drizzle 3 / true / max ID 3，源目标一致 |
| 应用授权 | public 表 SELECT/INSERT/UPDATE/DELETE；public 序列 USAGE/SELECT；schema USAGE；已设置 owner 的对应默认权限。无数据库 CREATE/TEMP、schema CREATE、TRUNCATE、序列 UPDATE、owner 成员资格或 drizzle schema USAGE |
| 账号与实例 | app 连接上限 60，原有四项超时保持；app SCRAM、owner 无密码；ssl=off、data_checksums=on、Asia/Shanghai；HBA 错误 0 |
| 切换前独立备份 | 从目标正式库重新 pg_dump，`precutover.dump`，54,125,304 字节，耗时 **5.482 秒**；不是复制源 archive |
| 新备份 SHA-256 | `e176bc587665e94c62338681a47a7873a21be0f8c271c7ae90b6a065f5f5ece8`，旁置 `precutover.sha256` |
| 新备份恢复验证 | 新建无应用访问权限的 `bilibili_history_precutover_check`，从 precutover.dump 恢复，耗时 **12.519 秒**；117 行校验匹配源最终基线，随后只删除本次新建的临时库，已确认不存在 |
| 结束状态 | 两端 app 均 NOLOGIN，目标应用连接 0；目标正式库尚无应用写入；目标演练库保留、正式库独立存在 |
| Vercel 保持 | 原生产 deployment、全部环境变量、部署保护及 bypass 状态未改；Ignored Build Step 仍 exit 0；全站维护规则仍生效 |
| 服务和清理 | 目标 PostgreSQL 服务 active，启动时间仍为 12:42:34.395，未重启；本地中转 final.dump 已删除，两端服务器 archive 保留 |

目标受限目录 `/root/bilibili-pg17-step5-20261011/`（0700，文件 0600）保存恢复脚本、原校验 SQL、源最终/本次复核结果、`final.restore.log`、目标恢复后及备份后校验、权限摘要、传输/生产保持摘要、备份导出/恢复日志和 `summary.json`。本地受限目录保留这些汇总及校验输出，不保留本轮中转 archive。

目标 archive 位于 `/var/tmp/bilibili-migration-20261011/`（0700）：`final.dump` 和 `precutover.dump` 均为 postgres 所有、0600，旁置 SHA-256、TOC 和 schema-only SQL。不同时间/版本重新导出的 archive 哈希无需相同；本次确认的是传输文件字节一致，以及恢复后的数据/结构/序列一致。源端最终 archive 也仍保留，因此原始迁移快照在两台服务器都有副本；**日常新库备份的异机复制与保留策略仍待步骤 7 配置**。

新正式连接已安全准备在目标 `/root/.config/bilibili-history-migration-20261011/production.env` 及 `production.pgpass`（0600），沿用步骤 2 生成且已在演练验证的独立新密码，库名为 `bilibili_history`。没有打印密码、放入命令行或写入 Git。步骤 5 结束时本地配置尚未修改，目标 app 仍 NOLOGIN，正式库公网连接尚未开放；以下步骤 6 已完成启用及配置切换。

步骤 5 结束时目标尚无应用写入，旧库及最终备份完整保留，处于可直接回退阶段。以下步骤 6 开放写入后，回退必须按第 10 节保留并同步新库最新数据，不能直接重新开放旧库。

### 0.6 步骤 6：Vercel 正式切换及恢复服务（已完成）

本次按用户指示完成切换，网站已恢复公开访问：[bilibilihistory.com](https://bilibilihistory.com)。旧服务器上的正式库和其他站点数据库均保留；旧 `bilibili_app` 持续 NOLOGIN，避免历史 deployment 继续写旧库。

| 项目 | 实际结果 |
| --- | --- |
| Production 配置 | 原 All Environments 的 DATABASE_URL 调整为仅 Production，值指向 `118.25.22.240:5432/bilibili_history`，使用独立新密码及 sslmode=disable；其余全部环境变量、认证及会员管理密钥保持原值 |
| 非生产配置 | 单独创建 Preview / Development 的 DATABASE_URL，指向目标演练库；演练库仍只有 loopback HBA，公网连接保持拒绝。通用 Preview 暂不能直接访问数据库，后续测试需单独授权，不共用生产连接 |
| 部署来源 | 当前 HEAD `eea8ac5eee127ee7a80d7c1a5143b00211764740` 的私有隔离副本；无业务代码修改、无诊断路由、无 .env 上传 |
| 新生产部署 | `dpl_ETHEGxjyFroxUj1xxvAJjhiW5vDK`，Production / READY，`bilibilihistory-7ncrtspar-mundane799699s-projects.vercel.app`；沿用 Node.js 22.x、iad1，构建日志记录 54 秒，从创建到 Ready 约 67.86 秒 |
| 分阶段部署 | 使用 `--prod --skip-domain`，先构建和验证，再 promote；初始未自动绑定正式域名，Git 构建冻结保持至恢复服务后 |
| 只读开放 | 13:50:51.075（UTC+8）开放仅正式库/app 的 IPv4/IPv6 公网 SCRAM；撤销表 INSERT/UPDATE/DELETE、序列 USAGE，角色 default_transaction_read_only=on，再启用目标 LOGIN |
| 维护测试入口 | 原全站 Deny 规则增加随机请求头的排除条件，只让受控测试通过；生成临时 Vercel Authentication bypass。密钥仅通过私有文件及请求头传递，没有作为 CLI 参数或部署环境变量 |
| 只读身份及会话 | 新部署识别迁移来的近期有效 session，并返回对应历史总数；直接驱动确认正式库 / app / PG17.11 / read_only=on、无 INSERT/nextval 权限；目标观测到 1 个 `bilibili-history-web` 连接，ssl=false |
| 开写前完整性 | 新部署只读测试后，目标 117 行校验仍与源最终基线完全一致，未发生应用数据或序列变化 |
| 域名切换 | promote 后绑定主域名、www 及默认项目别名；额外将原 Git main 别名显式重新绑定。四个原生产别名均通过 API 核实指向新 deployment |
| 写入开放 | **13:55:58.910（UTC+8）** 恢复目标 CRUD/序列权限、RESET 角色只读配置、终止既存只读连接。自此按“新库已接受写入”的回退流程处理 |
| 功能冒烟 | 在正式主域名的维护入口完成 **30 项检查、31 次 HTTP 请求**，全部通过；已有会话、注册/登录/退出、历史单条/批量/upsert/过滤/删除、额度、会员、合成账号密码重置及隔离、最小权限均覆盖 |
| 测试脚本修正 | 首轮通过 25 项后，测试脚本自身长期持有的空闲 Client 被 60 秒 idle_session_timeout 关闭（57P05）。先清理该测试账号，再改用 10 秒释放空闲连接的 Pool 完整复测；没有修改生产超时或应用代码 |
| 原有数据保持 | 两轮合成账号、account、session 及每轮 501 条历史已按随机测试 UID/email 精确清理；会员记录已在测试中删除。清理后七表全行摘要及全部结构仍与源一致，4 项孤儿数为 0 |
| 唯一校验差异 | 两次测试会员消耗编号 34、35，memberships 序列从 33 增至 35，真实最大 ID 仍为 33；未回调序列。Drizzle 序列仍为 3，正常编号空缺不影响业务 |
| 切换备份 | 清理后、解除维护前创建 `cutover.dump`，54,125,304 字节；SHA-256=`f1ff9c3669ca664b2d4394c5f2ef3af205841c9270318b161b03e3b4170f3cb4`，与前两份 archive 同目录、0600；该新文件的独立恢复及异机复制留在步骤 7 |
| 请求耗时 | 复测最小 700 ms、中位 1,807 ms、最大 40,164 ms；31 请求耗时总和 94,637 ms。最大值是第 16 次请求，即 498 条历史批量上传，返回 200；这是客户端端到端耗时，尚未定位原因，后续重点观察批量上传延迟，不据此认定纯 SQL 耗时或服务整体性能 |
| 恢复访问确认 | **14:03:50.099（UTC+8）**，不带临时密钥验证四个生产别名：首页 200、匿名 history 401；www 原有 307 重定向至主域名后同样通过 |
| 公网已有会话验收 | 14:04:27.211（UTC+8），正式主域名仅带迁移来的会话 cookie，没有维护/bypass 请求头，已有用户识别及历史读取 200；目标新连接 read_only=off，旧 Production 凭据连接源库被拒绝（28000） |
| 保护恢复 | 临时 bypass 已撤销，并以旧令牌实际验证无法通过；新部署直连地址匿名请求仍 302 至 Vercel Authentication。维护规则已删除并发布，firewallEnabled=false、0 规则、0 草稿；Ignored Build Step 恢复原值 null |
| 本地配置 | `.env` 和 `.env.local` 的 DATABASE_URL 均更新为目标正式库直连，其余变量保持；文件 0600。消除旧 127.0.0.1:15432 的配置覆盖，没有接管或重启用户已有 tunnel |
| 结束状态 | 目标 app LOGIN、连接上限 60、无角色只读配置、HBA 错误 0；原实例启动时间 12:42:34.395 未变。源 app NOLOGIN、正式库客户端 0；旧库和所有迁移 archive 均保留 |

本次自动验收使用迁移来的真实有效 session，确认认证密钥及账号数据兼容；**没有获取真实用户密码，原密码的人工浏览器登录仍由用户验收**。合成账号的新旧密码验证已通过，真实 account 全行摘要未变。无需为迁移修改真实用户密码。

目标执行记录在 `/root/bilibili-pg17-step6-20261011/`（0700，文件 0600），包括正式开放前 HBA、只读/写入开放时间、开写前及测试清理后完整校验、功能和清理摘要、生产配置保持、域名和公开访问验证、构建日志。新数据库凭据继续仅保存在目标 root-only 配置目录及必要的 Vercel/本地受限环境文件。本地临时拉取的生产配置、旧配置副本、测试密钥、API 私密输入/响应和隔离部署副本在验收后清理；源端步骤 4 的旧 Production 配置备份继续受限保留，供同步数据后的回退使用。

**本次数据库迁移及生产切换已完成。** 用户于 2026-10-11 决定暂缓配置定期备份；日常备份、异机副本及恢复验证列为后续运维事项，不影响本次迁移完成状态。目前未配置新的定期备份作业、WAL/PITR 或持续复制。旧库至少按计划观察 7 天，未获后续退役指示前不删除。

### 0.7 迁移后 Function 区域优化（2026-10-11）

用户发现翻页缓慢，完成浏览器网络、SQL 执行计划及连接链路排查后，按用户指示调整 Function 区域。迁移时沿用的美国 `iad1` 已改为新加坡 **`sin1`**。

- 香港 `hkg1` 构建成功，但实际连接目标库多次触发 5 秒连接超时，曾导致登录页服务端异常；随即恢复前一个可用部署，随后通过测试别名完成复验。香港部署未作为最终生产部署。
- 新加坡隔离部署验证已有会话及分页通过后，再提升到生产。最终部署为 `dpl_3oPCNAnowjrBZJqnmJh1gzzNwWBr`，四个原生产别名均核对指向该部署；生产浏览器响应头确认 `sin1::sin1`。
- 同一浏览器第 5、6、7 页历史接口等待响应头从约 4.9–6.1 秒降至约 0.48–1.06 秒；数据及现有会话读取正常。
- 项目默认区域及工作区 `vercel.json` 均设置 `sin1`；环境变量、认证密钥、数据库连接、部署保护及业务代码保持。未更改服务器防火墙或 PostgreSQL 配置，定期备份仍按用户指示暂缓。
- 前一个美国应用部署仍连接目标新数据库，保留供应用区域回退；不涉及把数据库切回旧服务器。

详细测量、香港失败及新加坡验收见 [pagination-performance-investigation-2026-10-11.md](./pagination-performance-investigation-2026-10-11.md)。

## 1. 推荐方案

采用 **同主版本 PostgreSQL 17 + 一次演练 + 短维护窗口内最终全量迁移 + Vercel 重新部署切换**。

迁移的是旧服务器上的独立数据库 `bilibili_history`，网站继续部署在 Vercel。目标安装 PostgreSQL 17.x，至少不低于源端 17.6，优先采用安装渠道提供的受维护补丁版本。使用逻辑备份 `pg_dump -Fc` / `pg_restore`，不复制 PostgreSQL 数据目录，不迁移旧服务器上其他站点的数据库。

目前数据库约 319 MB，适合全量导出恢复。推荐预留 30–60 分钟维护窗口；这是计划预算，实际停机时间由演练测出的导出、传输、恢复、校验及 Vercel 构建耗时决定。未演练前不承诺具体停机分钟数。若业务不能接受这个窗口，再另行设计逻辑复制方案。

正式切换必须满足：旧库真正停写 → 最终备份 → 新库恢复与数据校验 → 新 Production deployment 验证 → 域名切换 → 开放新库写入。最终备份之后旧库持续禁止应用连接，避免旧 deployment 产生分叉数据。

## 2. 已核实的现状

### 项目

| 项目 | 当前实现 | 迁移影响 |
| --- | --- | --- |
| 应用 | Next.js 15.2.8、Drizzle ORM、Better Auth、`pg` | 数据库迁移不要求改写业务查询 |
| 连接 | `lib/db/pool.ts` 读取 `DATABASE_URL` | 生产切换必须更新 Vercel 环境变量并创建新 deployment |
| 连接池 | Drizzle / Better Auth 共用 `pg.Pool`；默认每进程 3 个连接；等待 5 秒、空闲回收 10 秒 | 沿用现有配置，检查并发实例的总连接数 |
| Vercel | 已使用 `attachDatabasePool` | 仍需限制数据库侧连接数 |
| 本地 `.env` | 指向旧服务器正式库 | 切换后需要更新 |
| 本地 `.env.local` | 指向 `127.0.0.1:15432/bilibili_history` | 会覆盖 `.env`，必须重新建立指向新服务器的 tunnel |
| 数据定义 | `schema.ts` 未包含 `session`、`verification`；`tablesFilter` 仅包含历史表 | 不能仅凭 schema 文件生成迁移范围 |
| 迁移记录 | 仓库 journal 2 条；实际旧库 `drizzle.__drizzle_migrations` 3 条 | 以实际数据库为准，完整保留迁移记录；切换时不运行 `db:push` / `db:migrate` |

写入入口包括历史上传/更新/删除、注册/登录/会话续期、会员创建/修改/删除和密码重置。部分会员路由中的会话授权检查目前被注释，因此维护期间必须封住完整应用访问；只禁止历史上传不能实现停写。此问题单独安排修复，迁移流程不能依赖这些接口的现有授权检查。

步骤 3 已核实 Vercel 项目绑定、当前 Production deployment、正式域名、变量作用范围、部署保护、Node.js 22.x 和 Function region `iad1`，并使用受限 Preview 配置完成真实 Function 演练，详见第 0.3 节。切换前需要刷新控制台基线。

### 两台服务器

| 项目 | 源端 `1.15.53.251` | 目标 `118.25.22.240` |
| --- | --- | --- |
| SSH | `root` 登录成功 | `root` 登录成功 |
| 系统 | OpenCloudOS 9.4 | OpenCloudOS 9.2 |
| PostgreSQL | 17.6，宝塔/自定义目录安装 | 步骤 1 已安装官方源码版 17.11，独立 systemd 管理 |
| 二进制 | `/www/server/pgsql/bin`，不在默认 PATH | `/www/server/pgsql/bin` |
| 数据目录 | `/www/server/pgsql/data` | `/www/server/pgsql/data` |
| 容量 | 根盘约 40 GB，剩余 29 GB | 根盘约 70 GB，剩余 43 GB |
| 内存 | 约 3.6 GiB | 约 3.6 GiB，已有其他服务，CPU 2 核 |
| 服务 | 已有其他站点和 `heartsticker` 数据库 | 已有 MySQL、Redis、多个 Web 服务及宝塔面板 |
| 网络 | PostgreSQL 监听公网 5432，`ssl=off` | 5432 公网可达，ssl=off；HBA 仅为演练库/app 准备了 loopback SCRAM，app NOLOGIN，公网仍 reject；未修改防火墙 |

初次盘点及安装前复查均未发现已有 PostgreSQL；步骤 1 已安装独立实例，没有重启整机或改动其他服务。后续只使用已记录的这一实例，避免创建第二套未知数据库服务。

### 源库基线

以下是 2026-10-11 的在线盘点值，数据库仍可写，正式验收必须使用停写后的最终基线。

| 对象 | 行数 |
| --- | ---: |
| `public.bilibili_history` | 422,573 |
| `public.user` | 1,998 |
| `public.account` | 1,998 |
| `public.session` | 3,914 |
| `public.memberships` | 17 |
| `public.verification` | 0 |
| `drizzle.__drizzle_migrations` | 3 |

- 编码 `UTF8`；locale provider 为 libc，`LC_COLLATE / LC_CTYPE = en_US.UTF-8`；数据库时区 `Asia/Shanghai`。
- 数据库 owner 为 `bilibili_owner`（NOLOGIN）；`bilibili_migrator` 当前 NOLOGIN；`bilibili_app` LOGIN，无超级用户/建库/建角色权限，也不是 owner 成员。
- 运行账号连接上限 60；空闲连接 60 秒、空闲事务 30 秒、语句 30 秒、锁等待 5 秒。
- 7 张普通表，17 个索引，2 个序列；唯一扩展为 `plpgsql`。
- 未发现应用自定义函数、触发器、RLS、大对象、publication 或 subscription。
- account、session、memberships、history 到 user 的孤儿检查均为 0。
- `memberships_id_seq.last_value = 33`，会员最大 ID 为 33；Drizzle 序列当前为 3。

迁移范围是 **整个 `bilibili_history` 数据库的对象和数据**，包含用户、密码哈希、现有会话、会员、历史记录、索引、约束、序列和 Drizzle 记录。角色、数据库创建属性及权限按目标环境重建。旧库 `heartsticker`、演练库和整个 PostgreSQL 实例不在迁移范围内。

## 3. 分步执行与检查点

| 步骤 | 工作 | 对生产影响 | 通过条件 |
| --- | --- | --- | --- |
| 0 | 项目及服务器只读盘点 | 无配置变更 | 已完成；执行前刷新数据基线 |
| 1 | 安装目标 PostgreSQL、沿用旧库连接方式并配置访问规则 | 不影响旧库 | 已完成；PG17、持久化、重启恢复及基础公网连通性通过 |
| 2 | 建角色及独立演练库 | 不影响旧库 | 已完成；角色权限、编码/locale/时区及 SCRAM 测试通过 |
| 3 | 在线导出、演练恢复及应用测试 | 旧库保持服务，有备份读取负载 | 已完成；完整性、本地和受保护 Vercel 功能及耗时通过，临时访问和测试数据已清理 |
| 4 | 维护、停止旧库写入、最终导出 | 开始维护窗口 | 新应用连接被拒绝，旧连接清空，前后签名一致 |
| 5 | 恢复正式新库、校验 | 持续维护 | 所有数据、结构、序列及权限验收通过 |
| 6 | Vercel 新部署、域名切换及开放写入 | 结束维护窗口 | 正式域名实际使用新库，功能测试通过 |
| 7 | 观察、备份恢复验证及旧库退役 | 新库提供服务 | 观察期通过，独立备份可恢复 |

每一步记录开始/结束时间、命令退出码、日志路径、验收结果；失败时停在当前检查点，先执行对应回滚，不继续后续步骤。

## 4. 步骤 1：准备目标数据库服务

1. 刷新内存、磁盘、5432 端口占用与现有服务列表；预留至少 5 GB 可用空间用于数据、索引构建、WAL 和备份，不把全部空闲内存分配给 PostgreSQL。
2. 优先检查现有宝塔软件源能否提供 PostgreSQL 17.x，沿用源端管理方式，便于维护。若不能提供合适版本，先验证 OpenCloudOS 软件源或 PostgreSQL 官方 RPM 渠道与本机兼容性，再选择安装渠道。
3. **不要直接执行无版本限制的 `dnf install postgresql-server`**；它可能安装低于 17 的版本。OpenCloudOS 不在 PostgreSQL 官方 Yum 页明确列出的支持系统中，不能把 RHEL 安装命令当作本机已验证命令。
4. 安装并初始化独立实例，确认 OS 中存在 `en_US.UTF-8` locale，初始化采用 UTF8 / libc。记录实际 `PG_BIN`、数据目录、Unix socket 目录、启动/重载命令和开机启动方式。不要假设宝塔实例存在 `postgresql.service`。
5. 服务初期仅监听本机；设置 `max_connections=100`，以 `shared_buffers=256MB`、`work_mem=4MB` 作为初始预算，演练后根据已有服务内存调整。保持 `fsync`、`full_page_writes`、`synchronous_commit` 开启。
6. 验证服务可重启、数据目录持久化、日志可读；本次在目标安装的维护动作不得重启 MySQL、Redis 或其他站点。

目标采用官方 PostgreSQL 17.11 源码安装，二进制 `/www/server/pgsql/bin`，数据目录 `/www/server/pgsql/data`，独立 systemd 服务 `bilibili-postgresql.service`；不是宝塔托管安装。目标 Unix socket 目录是 `/run/bilibili-postgresql`，所有目标管理员 `psql` / `pg_restore` / `pg_dump` 连接必须指定 `-h /run/bilibili-postgresql`；源端沿用原来的默认 socket。每段命令标明执行位置，不作为一键脚本整篇粘贴。

### Vercel 到目标库的连接

2026-10-11 执行步骤 1 时，用户明确要求“原来的服务器怎样，现在就怎样”。因此本次沿用旧库的 **IP + 5432 + 无 TLS + SCRAM-SHA-256** 连接方式，不新增数据库域名或证书。正式连接示例：

```dotenv
DATABASE_URL="postgresql://bilibili_app:<新生成并安全保存的密码>@118.25.22.240:5432/bilibili_history?sslmode=disable"
```

密码由步骤 2 独立生成；不复用旧密码。步骤 1 只建立数据库实例，TCP 的全部登录暂时拒绝；步骤 2/3 创建角色和指定数据库后，才增加仅针对本项目的允许规则，沿用源库当前访问范围：

```text
host bilibili_history bilibili_app 0.0.0.0/0 scram-sha-256
host bilibili_history bilibili_app ::/0 scram-sha-256
host all all 0.0.0.0/0 reject
host all all ::/0 reject
```

规则按首次匹配生效，允许规则应放在 reject 之前；本机 Unix socket 的管理员连接使用 peer。不要沿用旧实例 loopback 对所有用户的 trust 规则，也不要添加公网超级用户授权。[PostgreSQL HBA](https://www.postgresql.org/docs/17/auth-pg-hba-conf.html)

同步检查腾讯云安全组及本机现有 nftables/iptables 规则；`firewalld` 未运行不等于公网已允许或已保护。SSH tunnel 仅用于迁移和本地测试，Vercel Functions 不能使用开发机的 tunnel。当前方案沿用旧库明文公网传输方式；TLS 改造可另行安排，不作为本次迁移的前置要求。

## 5. 步骤 2：创建角色和隔离演练库

本步已完成，实际状态见第 0.2 节。以下保留操作模板；角色和库已存在，不要重复执行 CREATE 或重新生成密码。

目标通过 SSH，在本机以 PostgreSQL 管理员创建：

```sql
CREATE ROLE bilibili_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE bilibili_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  CONNECTION LIMIT 60;

ALTER ROLE bilibili_app SET idle_session_timeout = '60s';
ALTER ROLE bilibili_app SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE bilibili_app SET statement_timeout = '30s';
ALTER ROLE bilibili_app SET lock_timeout = '5s';

CREATE DATABASE bilibili_history_rehearsal
  OWNER bilibili_owner TEMPLATE template0 ENCODING 'UTF8'
  LOCALE_PROVIDER libc LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';
ALTER DATABASE bilibili_history_rehearsal SET TimeZone = 'Asia/Shanghai';
REVOKE ALL ON DATABASE bilibili_history_rehearsal FROM PUBLIC;
GRANT CONNECT ON DATABASE bilibili_history_rehearsal TO bilibili_app;
```

命令针对尚不存在的新角色/新库。若发现重名，先盘点，禁止覆盖未知对象。恢复操作经 SSH 使用本机 `postgres`，再 `SET ROLE bilibili_owner` 创建对象；不需要为公网开通迁移管理员。

给目标运行账号生成独立新密码，不复用本次提供的旧密码。采用交互式 `psql` 的 `\password bilibili_app` 或安全 secret 工具设置密码，不把完整连接串写入文档、Git、命令行参数或日志。何时将目标账号改为 LOGIN，按演练或正式开放阶段执行。

实际已使用 libpq 设置 SCRAM 密码、调整 public schema owner 并授予 USAGE；空库没有业务表，表/序列的正式 runtime grants 留到恢复后执行。仅添加 loopback 的演练库 SCRAM 规则，用于本步短暂 LOGIN 测试；最终恢复 NOLOGIN。后续若确需 Vercel 演练，再增加仅针对该演练库/账号的公网规则，演练结束撤销。

## 6. 步骤 3：在线演练

### 6.1 导出源库

在源服务器执行，使用本机 socket，不需要把旧连接串放到命令行：

```bash
# 源服务器：root shell；本批目录不存在时创建，已存在时先检查内容。
set -euo pipefail
install -d -o postgres -g postgres -m 700 /var/tmp/bilibili-migration-20261011
runuser -u postgres -- /www/server/pgsql/bin/pg_dump \
  --format=custom --no-owner --no-acl \
  --dbname=bilibili_history \
  --file=/var/tmp/bilibili-migration-20261011/rehearsal.dump
chmod 600 /var/tmp/bilibili-migration-20261011/rehearsal.dump
cd /var/tmp/bilibili-migration-20261011
sha256sum rehearsal.dump > rehearsal.sha256
/www/server/pgsql/bin/pg_restore --list rehearsal.dump > rehearsal.toc
```

不使用 `--table=bilibili_history`，必须导出整个数据库。`pg_dump` 不导出角色，目标角色已独立创建；`--no-owner` 在 custom archive 恢复时仍应再次指定。确认 dump 命令成功且无未处理警告。[pg_dump 文档](https://www.postgresql.org/docs/17/app-pgdump.html)

在线 dump 是一致性快照，但导出完成后的源库会继续变化。因此演练不要求“事后源库实时行数等于快照行数”；可将同一演练 archive 分别恢复到源服务器独立的 `bilibili_history_snapshot_check` 临时库和目标演练库，使用附录 SQL 比较二者，从而对齐同一快照。临时库不开放应用访问，测试结束后经核实名称再移除。最终迁移会停写，再严格比较源正式库与目标正式库。

### 6.2 传输与恢复

优先由开发机中转 SSH，不要求源服务器具备目标 root 的密钥。以下在开发机执行，目标批次目录先经 SSH 以 postgres 所有者、0700 权限创建：

```bash
# 开发机：避免在 Git 仓库中保存 dump；目录里包含用户及认证敏感数据。
set -euo pipefail
install -d -m 700 "$HOME/.local/share/bilibili-migration-20261011"
scp root@1.15.53.251:/var/tmp/bilibili-migration-20261011/rehearsal.dump \
  "$HOME/.local/share/bilibili-migration-20261011/"
scp root@1.15.53.251:/var/tmp/bilibili-migration-20261011/rehearsal.sha256 \
  "$HOME/.local/share/bilibili-migration-20261011/"
chmod 600 "$HOME/.local/share/bilibili-migration-20261011/"*
scp "$HOME/.local/share/bilibili-migration-20261011/rehearsal.dump" \
  "$HOME/.local/share/bilibili-migration-20261011/rehearsal.sha256" \
  root@118.25.22.240:/var/tmp/bilibili-migration-20261011/
```

目标执行：

```bash
set -euo pipefail
PG_BIN=/www/server/pgsql/bin # 先核实实际安装路径
cd /var/tmp/bilibili-migration-20261011
sha256sum -c rehearsal.sha256
chown postgres:postgres rehearsal.dump
chmod 600 rehearsal.dump
"$PG_BIN/pg_restore" --list rehearsal.dump > rehearsal.toc

# 仅针对刚创建、尚未恢复的空演练库；先确认 public 没有任何对象。
# TOC 的 SCHEMA public 条目不代表实际执行 CREATE SCHEMA，必须检查恢复 SQL。
"$PG_BIN/pg_restore" --schema-only --no-owner --no-acl --file=rehearsal.schema.sql rehearsal.dump
if grep -Eq '^CREATE SCHEMA public;' rehearsal.schema.sql; then
  runuser -u postgres -- "$PG_BIN/psql" -X -v ON_ERROR_STOP=1 \
    -h /run/bilibili-postgresql -d bilibili_history_rehearsal -c 'DROP SCHEMA public;'
else
  runuser -u postgres -- "$PG_BIN/psql" -X -v ON_ERROR_STOP=1 \
    -h /run/bilibili-postgresql -d bilibili_history_rehearsal -c 'ALTER SCHEMA public OWNER TO bilibili_owner;'
fi

runuser -u postgres -- "$PG_BIN/pg_restore" \
  --exit-on-error --single-transaction --no-owner --no-acl \
  --host=/run/bilibili-postgresql \
  --role=bilibili_owner --dbname=bilibili_history_rehearsal \
  rehearsal.dump > rehearsal.restore.log 2>&1
```

按 archive 实际生成的 schema-only SQL 决定是否保留空库默认 `public` schema，不能仅看 TOC：本次 archive 的 TOC 有 public 条目，但 SQL 只有 initdb 已创建它的注释，没有 CREATE SCHEMA。此操作仅适用于有明确库名的空库初始化，不能在旧正式库执行。单事务恢复失败时不保留半套数据，不使用 `--clean` 清理已有业务库，不与 `--jobs` 混用。[pg_restore 文档](https://www.postgresql.org/docs/17/app-pgrestore.html)

恢复后，在**目标演练库**授予应用权限并更新统计信息：

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO bilibili_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bilibili_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bilibili_app;
ALTER DEFAULT PRIVILEGES FOR ROLE bilibili_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bilibili_app;
ALTER DEFAULT PRIVILEGES FOR ROLE bilibili_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO bilibili_app;
ANALYZE;
```

运行账号不授予 owner 成员资格，不授予 schema CREATE、DDL 或 Drizzle migration 写入权限。未来迁移应使用管理员/独立迁移账号。

### 6.3 验证与演练应用测试

1. 使用同一 archive 对齐的两套库运行 `database-migration-verify.sql`：7 张表行数、全行摘要、列定义、索引、约束、序列必须一致；4 项孤儿数为 0。
2. 确认业务表 owner 为 `bilibili_owner`、编码/locale/时区正确；演练库中以应用账号运行 SELECT 及事务内可回滚 CRUD，确认没有 DDL 权限。序列 `nextval` 不会随事务回滚，任何写测试完成后不再把演练库当作正式基线。
3. 开启目标账号 LOGIN，仅按演练用途开放演练库的连接规则，正式开放前移除该库公网规则。
4. 本地 tunnel 使用独立端口，避免覆盖旧 tunnel：

   ```bash
   ssh -o ExitOnForwardFailure=yes -N \
     -L 127.0.0.1:25432:127.0.0.1:5432 root@118.25.22.240
   ```

   本地开发专用配置指向 `127.0.0.1:25432/bilibili_history_rehearsal`。若启用严格 hostssl-only 策略，需在本地 socket/loopback HBA 中明确允许 tunnel 所需连接；tunnel 内使用无 TLS 只能限本机链路，不用作 Vercel 生产连接配置。

5. 测试旧账号登录、会话、分页/关键词/日期查询、单条与批量上传/upsert、删除、会员有效期/免费额度、密码重置，以及隔离测试用户注册。先完成完整性对比，再做会改变数据的测试。
6. 通过隔离的 Vercel Preview/测试项目验证公网连接、实际 `pg` 驱动、构建、生产所用版本是否仍可部署及连接性能。测试站必须受保护，因为它包含真实认证数据；演练库不得暴露为公开测试站，也不得覆盖通用 Preview 的生产配置。
7. 测试后撤销演练公开访问，并记录导出、双程传输、恢复、校验、构建耗时。目标已有多项服务，应观察 CPU、swap、数据库连接数及慢查询，确认没有影响其他站点。

## 7. 步骤 4：维护窗口与旧库硬停写

演练通过后确定执行窗口及回滚负责人，冻结 Git 自动生产部署和所有数据库结构变更。保存旧 Production deployment ID、域名绑定、旧 `DATABASE_URL` 的安全副本、其他环境变量及源角色 LOGIN 原值。

1. 在 Vercel 控制台核实当前项目、正式域名、所有旧 deployment URL 和 Preview 是否使用源库。暂停外部同步脚本、定时任务、本地开发进程及管理操作。
2. 对整个应用入口启用维护/访问阻断，包含 API、默认 `.vercel.app`、历史 deployment URL；测试管理员可保留受保护的入口。不要仅在首页放提示。
3. 若采用 Vercel Pause，先验证它对构建的影响。2026-08 的实际执行记录显示当时 Pause 会阻止构建，不能把“暂停时 Redeploy 成功”作为前提。本方案依赖数据库硬停写，允许在必要时恢复项目构建能力，同时维持应用维护保护。
4. **仅在源端**通过本机 PostgreSQL 管理连接执行：

   ```sql
   ALTER ROLE bilibili_app NOLOGIN;
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'bilibili_history'
     AND pid <> pg_backend_pid()
     AND backend_type = 'client backend';
   ```

   NOLOGIN 会阻止该源角色对该实例所有数据库的新登录，应先确认它没有其他独立业务用途；当前已知它也用于本项目演练库。终止范围仅是源正式库的客户端连接，不影响 `heartsticker`。角色切换不影响既存连接，必须同时清理连接；若发现其他写入角色，也要封住其应用登录并记录恢复方式。管理员/root 仍有写能力，维护期间除备份和只读验证外禁止人工写库。

5. 从公网应用连接验证新登录被拒绝；检查正式库无未授权客户端连接、无未完成预备事务，所有已确认写入入口已停。仅设置 `default_transaction_read_only` 不能替代这一步。
6. 运行附录校验 SQL 保存 `source-before-final.txt`。按演练相同参数导出 **新文件 `final.dump`**，生成 SHA-256、TOC 和日志。导出结束后再次运行附录保存 `source-after-final.txt`；除运行时间等非数据元信息外，行数/数据摘要/结构/序列必须一致。
7. 源库保持 NOLOGIN。若签名改变，查明遗漏写入者并重新停写、重新导出，禁止使用不确定的备份切换。

## 8. 步骤 5：正式恢复与验收

1. 目标新建正式空库 `bilibili_history`，参数与演练库相同，owner 为 `bilibili_owner`。不得把演练测试后的库改名当作正式库。
2. 将目标 `bilibili_app` 暂时 NOLOGIN，并清理其演练连接；恢复时通过本机 `postgres` 管理连接完成。
3. 通过 SSH 中转 `final.dump` 及 SHA-256，验证散列一致。沿用第 6 节根据实际 schema-only SQL 处理默认 public、单事务 restore 命令，将文件和库名分别改为 `final.dump` / `bilibili_history`，使用本次 `final.schema.sql` 判断 schema 创建语句。禁止使用源端地址作恢复目的地。
4. 正式库恢复后按第 6 节重授 public 表/序列权限、默认权限，REVOKE PUBLIC 的数据库 CONNECT 并仅 GRANT CONNECT 给应用账号，设置数据库 `TimeZone='Asia/Shanghai'`，执行 `ANALYZE`。
5. 应用账号仍 NOLOGIN。以管理员运行 `database-migration-verify.sql`，与源端最终结果比较：7 表行数及内容摘要、全部列/索引/约束、两条序列状态完全相同；4 项孤儿检查均为 0；约束已验证；角色所有权和授权符合方案。
6. 额外校验数据库创建属性、`plpgsql`、连接限制和超时；检查恢复日志、无意外 schema/object。迁移现场重新盘点若出现新表或扩展，更新校验及目标依赖后再继续。
7. 制作目标切换前备份并保存校验结果；本次还在独立临时库实际恢复该备份，核对完整数据和结构后删除仅本次创建的临时库。数据验收通过之后再启用新库应用登录，任何失败都不切换 Vercel。

**此时是可直接回滚的最后阶段：目标尚未接受任何应用写入，源端最终数据仍完整保留。**

## 9. 步骤 6：Vercel 切换与恢复服务

1. 在正确 Vercel 项目的 **Production** 环境变量中更新 `DATABASE_URL` 为目标正式库连接；继续使用既有 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`NEXT_PUBLIC_BETTER_AUTH_URL` 和会员管理 secret。更改认证 secret 或站点域名会影响会话，与数据库搬迁分开处理。
2. 创建使用 Production 配置的新 deployment，先不自动绑定正式域名。已核实项目绑定的 CLI 可使用：

   ```bash
   vercel deploy --prod --skip-domain
   ```

   运行前确认当前项目/团队、代码 revision 及 CLI 能力；不得用带 `--env DATABASE_URL=...` 的命令暴露凭据。可在控制台关闭自动分配生产域名来实现等效流程。[Vercel deploy](https://vercel.com/docs/cli/deploy)

3. 环境变量更新只作用于新 deployment；旧 deployment 保留旧值。因此不能只改环境变量，也不能假定提升早先演练 Preview 会自动换成正式库。[Vercel 环境变量](https://vercel.com/docs/environment-variables)
4. 初始阶段目标应用账号仍 NOLOGIN，可完成不访问数据库的构建检查；如果构建需要数据库，先按下述只读权限放行后构建，不让它获得业务写权限。
5. 在目标正式库，保留 SELECT 权限，暂时撤销应用对 public 表的 INSERT/UPDATE/DELETE 和序列 USAGE，设置目标角色 `default_transaction_read_only=on`，再启用 LOGIN；以新受保护 deployment 做只读验证。读取页面、已有 session 查询等只读路径可测试，登录/续期等可能写会话的请求此时失败是预期，不能把它们当作只读验证项。验收不通过时保持维护。
6. 验证目标 `pg_stat_activity` 的 `application_name='bilibili-history-web'`、连接目的数据库，结合受控请求和 Vercel 日志确认新 deployment 实际使用目标正式库。按当前沿用旧配置的方案，`pg_stat_ssl.ssl=false` 是预期。仅看到首页 200 不足以证明接对数据库。
7. 核实旧库持续拒绝应用登录，随后将正式域名绑定到已经验证的新 Production deployment，维持维护保护。
8. 恢复目标正式库应用 CRUD/序列权限，`ALTER ROLE bilibili_app RESET default_transaction_read_only`，清理目标该角色已有只读连接让新连接重新加载设置；确认其他默认只读设置不存在。从此开始记录目标首次写入时间，回滚进入“需要同步新数据”的阶段。
9. 在正式域名、受保护的维护入口进行测试用户旧账号登录、历史查询/上传/删除、会员查询及管理等完整冒烟测试。测试写入单独记录并清理，不要求业务测试后的库仍等于导出时摘要。
10. 冒烟通过后移除维护保护，恢复同步客户端。正式域名、`.vercel.app` 别名和可访问的新 deployment 必须一致连接新库，旧 deployment 即使被直接访问也不能写旧库。
11. 更新本地 `.env`、`.env.local` 和明确需要访问正式库的运维脚本；本地 tunnel 改到新服务器。其他 Preview 默认保持隔离数据库，不让旧 Preview 继续尝试旧生产库。

没有计划将网站本身迁出 Vercel，因此业务域名通常无需更换 DNS 服务器地址；这里切换的是 Vercel deployment 的域名绑定和数据库 IP 连接。

## 10. 回滚

### 新库尚未接受任何应用写入

停止目标应用登录并断开目标应用连接，将 Vercel Production `DATABASE_URL` 恢复安全保存的旧值；使用旧 deployment 或重新部署接旧库的已知代码。确认流量接旧 deployment，源端恢复原来的 `bilibili_app LOGIN` 状态，再完成验证并解除维护。即便直接提升旧 deployment，也应恢复项目环境变量，避免下一次部署又连接新库。

只操作本项目的库和角色。目标库和备份保留供排查，不删除旧库、不覆盖其他数据库。

### 新库已发生业务写入或冒烟写入

**不能直接把连接串改回旧库**，否则会丢失新库新增/更新/删除的数据，特别是会话、密码重置及会员修改。

1. 重新维护，封住新库应用登录并断开连接，确保两端都不再接受业务写入。
2. 备份新库及其当前验证结果，明确哪端是最新权威数据源。
3. 本方案未建立持续复制，优先将新库最新全量 dump 反向恢复到旧服务器的**新建独立恢复库**（如 `bilibili_history_rollback_20261011`），不覆盖源保留库；使用源端 PG17 客户端验证兼容性。
4. 在恢复库校验完整数据、权限、locale/时区后，为应用授权，将 Vercel 新 deployment 接到这个恢复库；验证通过再开放写入。
5. 若目标新库无法读取，依据最近可恢复备份的时间点明确实际数据损失范围，再决定恢复，不能宣称无损回滚。

RPO 目标是正常迁移不丢失已提交数据；依赖严格停写和最终校验实现。故障后的 RPO 取决于新库备份策略；迁移保留的旧库不能代替新库持续备份。

## 11. 步骤 7：观察与退役

本节为迁移完成后的运维计划。按用户 2026-10-11 的指示，定期备份配置暂缓，本轮不执行；旧库退役另行安排。

- 首小时重点观察注册/登录、历史上传、会话、会员和权限错误；随后建议观察至少 7 天。源库继续禁止本项目应用登录，保留数据，不停整个旧 PostgreSQL 实例，因为还有其他库。
- 监控 Vercel 数据库超时/5xx、连接数、CPU/内存/swap、磁盘/WAL 增长、死锁和慢查询；迁移后遇到容量问题先查连接与负载，不盲目上调连接上限。
- 配置目标定期 custom-format 备份、SHA-256 校验和异机副本，首个新库备份在独立临时库实际恢复一次。建议每日备份、保留 7–14 天；若需要更小故障 RPO，再设计 WAL 归档/PITR。
- 最终 dump 包含密码哈希、token 及个人信息，服务器备份目录权限 0700，文件 0600，异机存储限制访问并加密。只保留正式备份及必要日志，及时删除本地重复 staging 副本。
- 观察结束且目标备份恢复验证通过后，再安排删除本项目旧库、旧密码和临时演练库；退役前查清所有调用者。保留脱敏执行记录、验收摘要和版本/配置说明。
- 后续单独治理：补齐 Better Auth schema、对齐真实 Drizzle 迁移基线、收紧会员接口授权、完善部署及备份监控；不在停机窗口顺便改业务结构。

## 12. 验收与执行记录

只读校验文件：[database-migration-verify.sql](./database-migration-verify.sql)。通过本机管理员连接运行，不把完整连接串传给命令行：

```bash
# 源服务器；目标还需增加 -h /run/bilibili-postgresql，演练需替换数据库名。
runuser -u postgres -- /www/server/pgsql/bin/psql \
  -X -v ON_ERROR_STOP=1 -P pager=off -d bilibili_history \
  < database-migration-verify.sql > source-final.txt
```

该 SQL 使用同一只读快照，输出行数、全行 MD5 聚合摘要及结构定义，不输出用户原始数据。摘要用于迁移一致性核对；archive 传输完整性另用 SHA-256。结果存储在受限迁移目录，不把 dump 或生产明细提交 Git。

2026-10-11 已在源库实际运行该 SQL，退出码 0，7 表行数与盘点一致，4 项孤儿数均为 0，两条序列与各自最大 ID 一致。另以只读 schema-only 导出确认当前默认 `public` 没有 CREATE SCHEMA 语句，而 `drizzle` 有；正式恢复仍以本次 archive 实际生成的 schema-only SQL 为准。这些在线盘点值不代表最终停写基线。

| 验收项 | 要求 | 执行记录 |
| --- | --- | --- |
| 版本/属性 | PG17、UTF8、libc locale、Asia/Shanghai | 步骤 1 已通过；业务库创建后再次验收 |
| 演练数据 | 同一快照 7 表行数/摘要、结构及序列一致 | 步骤 3 已通过，本地及受保护 Vercel Preview 验收均通过 |
| 正式停写 | 应用 LOGIN 被拒绝、旧连接清空、备份前后签名一致 | 步骤 4 已通过；2026-10-11 13:37:20 UTC+8 停写，final.dump 已生成 |
| 正式数据 | 最终源端与目标 7 表行数/摘要一致 | 步骤 5 已通过，目标正式库及切换前备份恢复结果均匹配源最终基线 |
| 关系/序列 | 4 项孤儿数 0；序列状态及约束一致 | 步骤 5 恢复时 2 序列、13 约束一致；步骤 6 仅测试会员序列正常递增至 35，无未验证约束 |
| 角色/权限 | 独立 owner；应用无 DDL、非超级用户 | 步骤 6 权限验收通过；目标 app LOGIN，源 app NOLOGIN |
| 网络 | 实际 Vercel `pg` 通过新 IP/SCRAM 连接，沿用 sslmode=disable | 步骤 6 正式库真实 Function / 公网驱动 / 会话及历史读取通过，观测 ssl=false |
| 部署 | Production 新 deployment、正式域名接新库 | 步骤 6 已完成，四个生产别名指向新部署，公开访问及数据库连接验收通过 |
| 功能 | 旧用户、会话、历史、会员及写入测试通过 | 步骤 6 自动验收 30 项通过；真实原密码的人工浏览器登录待用户验收 |
| 回滚 | 保留旧配置与源快照，记录按是否开写区分的回退流程 | 旧配置及备份保留；未实际演练线上回切，开写后必须同步新库最新数据 |
| 备份 | 目标独立备份已恢复验证、异机保存 | 步骤 5 切换前独立备份恢复验证通过；源最终快照两端保留；日常备份及异机策略按用户指示暂缓 |

本次迁移已完成生产连接、数据迁移、切换、自动功能验收及恢复服务。用户决定暂缓定期备份配置，步骤 7 保留为后续运维计划；原账号浏览器登录可由用户进一步确认。旧库建议至少保留 7 天，未获退役指示前不删除。目标安装渠道及公网连接方式按步骤 1 的实际执行记录为准；用户已选择沿用旧库连接方式，无需新增 TLS 域名和证书。
