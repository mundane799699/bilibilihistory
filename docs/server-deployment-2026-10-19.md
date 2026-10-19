# 服务器部署记录（2026-10-19）

网站已部署到 `118.25.22.240`，入口为 **https://bilibilihistory.mundane.ink**。Nginx 接收 HTTPS 请求，转发到本机 Next.js 服务；应用通过 `127.0.0.1:5432` 连接已有 PostgreSQL，使用原来的正式库和应用账号。此次没有搬动或恢复数据库数据。

## 实际部署

| 项目 | 配置 |
| --- | --- |
| 代码基线 | `41fc79e970ddf68dffd2856d8480e42fcfc19bdc`，包含 NUL 字符上传修复；增加 standalone 构建开关和部署配置 |
| 运行账号 | `bilibili-web`，系统账号，无交互登录权限 |
| Node.js | 独立 Node.js `v22.23.3`，官方 Linux x64 包，SHA-256 核对通过 |
| Node 路径 | `/opt/bilibili-history-web/runtime/bin/node` |
| 现有 Node | `/root/.nvm/versions/node/v20.10.0` 及 nvm 默认值保留，其他应用继续使用原版本 |
| 包管理器 | 本项目独立安装 pnpm `11.4.0`，不更改系统全局版本 |
| 构建目录 | `/opt/bilibili-history-web/builds/20261019-41fc79e/source` |
| 发布目录 | `/opt/bilibili-history-web/releases/20261019-41fc79e` |
| 当前版本链接 | `/opt/bilibili-history-web/current` |
| 服务 | `bilibili-history-web.service`，active/running，开机启动，异常退出后自动重启 |
| 应用监听 | **仅** `127.0.0.1:3010`；公网入口由 Nginx 提供 |
| 环境配置 | `/etc/bilibili-history-web/production.env`，root:root，0600，目录 0700 |
| 前后端认证地址 | `https://bilibilihistory.mundane.ink`；前端编译产物已核对使用新域名 |
| 认证密钥/管理后台凭据 | 沿用原配置，通过 SSH 安全传输，没有写入 Git、本文或命令行参数 |
| 数据库连接 | `127.0.0.1:5432/bilibili_history`，pool max=5，保留原 SCRAM 密码和连接方式 |
| 服务内存 | 初次验收约 100 MiB；Node 堆上限配置为 512 MiB |
| Nginx 实例 | 现有 `/www/server/nginx/sbin/nginx`，沿用原实例，只做语法检查及平滑 reload |
| 新 Nginx 配置 | `/www/server/nginx/conf/vhost/bilibilihistory.mundane.ink.conf` |
| TLS | 沿用 `/home/ssl/cert.pem` 和 `/home/ssl/key.pem` 的通配符证书，覆盖 `*.mundane.ink`，当前到期 2026-12-31 UTC |

独立运行包包含 Next.js standalone 输出、`.next/static` 和 `public`。构建时使用 `SELF_HOSTED_BUILD=1`，只启用一个构建 worker，避免小内存服务器创建大量并行进程。系统服务以普通账号运行，发布文件只读，仅 `.next/cache` 可写。

依赖安装使用锁文件固定版本，官方仓库网络慢时使用 `registry.npmmirror.com`，锁文件及包完整性校验保留。测试及 TypeScript 检查在本地通过，Linux 生产构建在服务器完成。

## DNS 和 HTTPS

首次查询中，公共 DNS 和 `dns3.hichina.com` / `dns4.hichina.com` 两个权威 DNS 均返回 NXDOMAIN。通过服务器现有证书续期账号只读查询发现：`bilibilihistory` 的 A 记录已经存在、值正确，但状态为 **DISABLE**。该条记录随后启用，最终 API 状态 ENABLE，阿里和 Google 公共 DNS 均解析为 `118.25.22.240`，TTL 600 秒。

HTTP 自动 301 跳转到新域名 HTTPS。公网直连及普通域名访问均验证了证书链和域名匹配，没有跳过证书校验。现有 ACME 配置的证书安装路径就是上述 `/home/ssl` 路径，续期 reload 命令包含 Nginx；此次没有创建或替换其他站点的证书。

## 验收

以下 13 项通过 Nginx HTTPS 入口，用一次性合成账号完成：

1. 登录页返回 200。
2. 密码注册成功。
3. 会话 Cookie 包含 Secure / HttpOnly。
4. 退出登录成功。
5. 同一账号用密码重新登录成功。
6. 已登录会话查询正常。
7. 100 条数据批量上传成功，包括标题、作者名中的 NUL 字符清理。
8. 同一批 100 条重复上传更新成功。
9. 第二页分页正确，云端总数仍为 100。
10. 已登录 dashboard 正常渲染。
11. 管理页面仍要求 Basic Auth，未认证返回 401。
12. 错误密码正常返回 401。
13. 连接池空闲 12 秒后，会话查询重新建连正常。

合成账号及其 account、session 和 100 条测试历史随后删除，真实用户数据未修改。服务重启后登录页恢复 200，systemd enabled 已验证。初次服务器内的密码登录约 337 ms，会话约 15–22 ms，分页约 25 ms；这些是同机 HTTPS 测试耗时，不代表所有用户的网络耗时。

公网单独验收包括：HTTPS 登录页、会话接口、HTTP→HTTPS 跳转、静态资源及不存在账号的正常密码认证拒绝。浏览器打开新域名登录页正常。新 Nginx 配置上线前后的其他 vhost 文件摘要一致，其他网站配置没有改动。

## 日常管理

在服务器执行：

```bash
systemctl status bilibili-history-web.service --no-pager
journalctl -u bilibili-history-web.service -n 100 --no-pager
systemctl restart bilibili-history-web.service

/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
```

Nginx 日志：`/www/wwwlogs/bilibilihistory.mundane.ink.access.log` 和对应的 `.error.log`。应用日志交给 journald，不通过 Node 进程自行滚动日志文件。

后续更新时，在新的构建目录以相同环境和 `SELF_HOSTED_BUILD=1` 构建，复制 standalone、static、public 到新的发布目录，保留发布文件只读及 cache 可写权限；完成测试后切换 `current` 链接并重启本应用服务。回退同理，切回已有发布目录后重启。不要覆盖正在使用的发布目录，也不要重启 PostgreSQL 或整台机器来发布网站。

`NEXT_PUBLIC_BETTER_AUTH_URL` 是构建时变量，改变域名时必须重新构建，单独重启进程不够。服务环境文件由 root 读取，修改实际密码和密钥时不要打印文件内容。

## 迁移范围与后续事项

新域名需要重新登录，原账号和原密码继续有效。现有插件若仍把 API 和登录页面指向旧域名，需要更新云端地址；本次只部署网站，没有修改插件项目。旧 Vercel 项目和 `bilibilihistory.com` 没有删除、暂停或改解析，避免插件尚未更新时直接失去入口。

数据库公网监听和现有 HBA 没有收紧，因为旧客户端/旧站点仍可能使用；新服务自身的数据库连接已经改为 loopback。此前用户暂缓定期数据库备份的决定继续保留，本次没有新增备份定时任务。

部署配置模板保存在项目 `deploy/`；完整执行日志、摘要和合成测试结果位于服务器 `/root/bilibili-selfhost-20261019/` 及本机 `~/.local/share/bilibili-selfhost-20261019/`，均按受限目录管理。真实环境变量只保存在服务器独立环境文件及原有受限配置中。
