# 历史记录翻页性能排查（2026-10-11）

## 结论

主要瓶颈位于请求与数据库连接链路，初次排查证据指向 Vercel 美国 `iad1` Function 到目标数据库的高延迟及重传。数据库执行普通分页 SQL 本身很快，现有分页索引和统计信息已就绪。随后按用户指示完成区域切换，当前生产 Function 为新加坡 `sin1`，结果见下文执行记录。数据库参数、索引及业务代码未修改。

此次迁移沿用了原来的 Function 区域 `iad1`，没有根据新数据库重新选择区域。由于没有同条件下旧服务器的网络测量，不能断言迁移让接口慢了多少。

## 浏览器复现

在用户已经登录的 Chrome 页面，保持每页 20 条、无关键词和日期筛选，通过页面按钮依次访问第 5、6、7 页。使用浏览器 CDP 网络事件记录请求时间，未导出 Cookie、认证请求头或历史记录内容。

| 页码 | 路由请求等待响应头 | 历史接口等待响应头 | 历史接口从请求到接收完成 | 历史接口接收字节数 |
| --- | ---: | ---: | ---: | ---: |
| 5 | 530 ms | 4,871 ms | 4,899 ms | 3,367 |
| 6 | 801 ms | 6,074 ms | 6,446 ms | 3,509 |
| 7 | 549 ms | 5,514 ms | 5,910 ms | 3,747 |

六个请求全部 HTTP 200。响应 `x-vercel-id` 均包含 `sin1::iad1`；项目 API 同时确认 `serverlessFunctionRegion=iad1`、`resourceConfig.functionDefaultRegions=[iad1]`、Fluid Compute 已开启。`sin1` 是入口区域，不能据此认为执行 SQL 的 Function 在新加坡。

翻页存在顺序依赖：先发 `/dashboard?page=...&_rsc=...`，其响应完成后才发 `/api/history?page=...&pageSize=20`，额外增加约 0.5–0.8 秒等待。该顺序由 `app/dashboard/page.tsx` 中 `router.push` 更新 URL、`useSearchParams` 更新后触发请求的流程产生。路由等待结束前原页面仍显示，历史接口请求开始后才设置加载状态，因此点击后还有一段没有明显反馈的时间。

## 数据库本机执行计划

通过管理员 Unix socket 执行只读 `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`，使用与当前页面匹配的用户以及同样的筛选、排序和每页条数，不输出用户 ID 或记录内容。

| 查询 | PostgreSQL 执行时间 | 主要执行方式 |
| --- | ---: | --- |
| 第 1 页 | 0.166 ms | 分页联合索引扫描 |
| 第 5 页 | 0.294 ms | 分页联合索引扫描，读取 100 行取最后 20 行 |
| 第 100 页 | 3.471 ms | 分页联合索引扫描 |
| 第 544 页 | 33.434 ms | 位图扫描及外部排序 |
| 总条数 | 9.915 ms | 联合索引的 Index Only Scan |
| 用户主键读取 | 0.065 ms | 主键索引扫描 |

以上是单次采样的执行时间，不含连接建立、网络传输和应用处理，另有约 0.5–0.8 ms 的规划时间。此次测试为已恢复并投入使用的数据库，不能代表冷缓存或并发高峰。

联合索引实际定义为 `(user_id, view_at DESC NULLS LAST, id DESC NULLS LAST)`，与分页 SQL 的过滤及排序一致。历史表统计信息在迁移恢复后已于 13:44:48 更新。无需将问题归因于漏建索引或未执行 ANALYZE。

服务器当时 load average 为 `0.00, 0.00, 0.00`，可用内存约 1.6 GB。翻页期间约 12 秒的数据库连接采样只捕获到应用连接 `idle / ClientRead`，未捕获持续执行或锁等待；短查询可能落在采样间隔内，因此不能据此声称完全没有执行 SQL。

## 网络及应用往返

在第 7 页查询附近，通过目标服务器 `ss -tin` 采样已建立的 PostgreSQL TCP 连接：

- TCP RTT 约 208–276 ms。
- 两个连接分别出现累计一次重传，重传字节数为 582 和 498；不是整个响应数据量。
- 本机直连相同数据库的三个独立连接建立耗时约 79–98 ms；除第一次 SELECT 1 为约 100 ms，其余 SELECT 1 为约 15–18 ms。该对比是另一条网络路径，只用于说明数据库没有在所有路径上表现出秒级等待。

代码检查确认历史 GET 的处理顺序为：

1. `auth.api.getSession` 验证会话。
2. 当前安装的 Better Auth 1.2.8 `findSession` 先等待 session 查询，再等待 user 查询；`lib/auth.ts` 未配置会话 Cookie 缓存。
3. 完成认证后，通过 `Promise.all` 执行历史分页与总条数查询。

因此，每次翻页包含多个数据库往返。`lib/db/pool.ts` 已使用共享 Pool 和 `attachDatabasePool`，并非没有连接池；但最大连接数为 3、空闲超时为 10 秒，连接复用不跨 Function 实例保证。连接关闭或请求落到其他实例时，仍需重新完成 TCP/SCRAM 建连。分页和统计同时查询也可能要求第二条连接。当前证据不足以支持盲目增加连接数或放大超时。

这些往返及重传会放大跨区域延迟。不过，目前没有每个生产请求的连接、认证、SQL 和冷启动分段计时，**不能精确地把 5–6 秒中的每一段全部归因于网络**；Vercel 调度、冷启动、连接建立以及应用处理各自的占比仍需进一步测量。

## 建议顺序

1. **先实测靠近数据库的 Function 区域。** 优先对香港 `hkg1` 做隔离测试，与当前 `iad1` 比较连接建立、认证和分页的耗时及稳定性；地理接近不保证实际线路更好，需要测量后再切生产。当前项目为 Hobby，单一区域配置即可，无需为了此项采用多区域方案。可采用独立部署的 CLI `--regions hkg1`，或将验证后的区域写入 `vercel.json`。Preview 当前使用演练库且公网连接受限，不能直接假设现有 Preview 可用于测速。
2. **增加分段耗时。** 如区域调整后仍慢，记录连接/池等待、认证、分页、总数的耗时；响应可添加仅含时长的 Server-Timing，日志不记录 Cookie、SQL 参数、用户明细或密码，以确定剩余瓶颈。
3. **减少翻页等待链。** 纯客户端分页状态可使用 Next.js 支持的原生 History API 同步 URL，避免每次页码变化先请求 RSC；需验证前进后退、刷新、筛选及页码修正仍正确。增加相邻页缓存或预取时，需保证删除、上传及切换账号后的数据失效正确。
4. **再优化重复数据库往返。** 评估合并分页与总数、合并认证查询或采用适当的会话缓存。缓存认证会影响会话撤销的及时性，不能只为测速直接开启。深分页的 OFFSET 有额外代价，但当前最大约 33 ms，优先级低于秒级链路延迟。

## 区域切换执行记录（2026-10-11）

最终生产区域为 **新加坡 `sin1`**。香港 `hkg1` 在当前线路上无法稳定建连，不能作为本次生产区域。

| 项目 | 执行结果 |
| --- | --- |
| 香港部署 | `dpl_F3Gn91iinYcFtNPD2W1i9krxsf1K`，构建 READY，实际运行 `hkg1`；刷新登录页面时出现服务端异常，立即恢复前一个可用部署 |
| 香港复验 | 通过已有 git-main 别名复验，主站保持原可用部署；认证及历史 GET 多次 500，约 5.2–5.7 秒；运行日志明确为 `Connection terminated due to connection timeout`，不是密码认证失败。未修改数据库防火墙或放大连接超时来掩盖失败 |
| 新加坡预验 | `dpl_3oPCNAnowjrBZJqnmJh1gzzNwWBr`，隔离构建 READY；在同一测试别名验证已有会话及三页历史，4 项通过，查询总数及每页记录数正确 |
| 新加坡预验耗时 | 认证约 1,434 ms；第 5、6、7 页完整 HTTP 请求分别约 1,041、320、332 ms；该组为本机 Node 客户端测量，不与浏览器响应头时间混用 |
| 生产切换 | 预验后提升新加坡部署；主域名、www、项目默认别名及 git-main 别名四项均核对为新加坡部署 |
| 持久配置 | Vercel 项目 `resourceConfig.functionDefaultRegions=[sin1]`、`serverlessFunctionRegion=sin1`；新增 `vercel.json`，仅设置 `regions: [sin1]`，后续代码部署继续采用该区域 |
| 配置保持 | 完整比较项目环境变量、部署保护、bypass、Git 绑定、Ignored Build Step、Node 版本及框架，均保持一致；继续使用目标正式数据库 |
| 用户浏览器 | 生产主域名刷新后原登录正常，历史总数正确；通过页面按钮再次验证第 5、6、7 页，全部 200，响应头确认 `sin1::sin1` |

同一浏览器、账号和分页条件的前后对比：

| 页码 | 原美国接口等待响应头 | 新加坡接口等待响应头 | 新加坡接口完整接收时间 | 新加坡路由等待响应头 |
| --- | ---: | ---: | ---: | ---: |
| 5 | 4,871 ms | 483 ms | 742 ms | 264 ms |
| 6 | 6,074 ms | 502 ms | 761 ms | 552 ms |
| 7 | 5,514 ms | 1,064 ms | 1,314 ms | 425 ms |

接口响应头等待时间中位数从约 5.51 秒降至 0.50 秒，三次样本中约减少 91%。页面翻页仍包含路由等待、响应体接收和渲染时间，不能将接口等待时间当作整个翻页完成时间；小样本也不代表所有时段的长期表现。

14:38（UTC+8）核对生产部署及四个别名。旧美国部署 `dpl_ETHEGxjyFroxUj1xxvAJjhiW5vDK` 保留，仍连接同一个目标正式库，必要时可以回到该应用部署；这与迁移文档中需要同步新数据的“回旧数据库”不同。香港失败部署不再承载生产别名。

## 参考

- [Vercel Function 区域配置](https://vercel.com/docs/functions/configuring-functions/region)：Function 应靠近数据库；默认区域为 `iad1`，Hobby 支持一个区域。
- [Vercel 区域列表](https://vercel.com/docs/regions)：`hkg1` 为香港区域。
- [Next.js 原生 History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api)：原生 History API 可同步 `useSearchParams`；实施时还应核对项目安装的 Next.js 15.2.8 行为。
- 相关代码：`app/dashboard/page.tsx`、`app/api/history/route.ts`、`lib/db/queries.ts`、`lib/db/pool.ts`、`lib/auth.ts`，以及当前安装的 Better Auth `findSession` 实现。
