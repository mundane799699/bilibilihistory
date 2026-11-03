/**
 * 本地开发用的上游转发器。
 *
 * 背景：这台机器的代理工具会把 bilibilihistory.mundane.ink 解析到 fake-IP（198.18.x.x），
 * 导致 Node/curl 的 TLS 握手被重置。这里在本地起一个 HTTP 端口，转发到真实 IP，
 * 同时用正确的 SNI 和 Host 头，证书校验依然生效。
 *
 * 用法：node scripts/upstream-proxy.mjs
 * 然后把 AUTH_PROXY_TARGET 指向 http://127.0.0.1:3100
 */
import http from "node:http";
import https from "node:https";

const TARGET_IP = process.env.UPSTREAM_IP ?? "118.25.22.240";
const TARGET_HOST = process.env.UPSTREAM_HOST ?? "bilibilihistory.mundane.ink";
const PORT = Number(process.env.UPSTREAM_PROXY_PORT ?? 3100);

const server = http.createServer((req, res) => {
  const upstream = https.request(
    {
      host: TARGET_IP,
      port: 443,
      method: req.method,
      path: req.url,
      servername: TARGET_HOST,
      headers: { ...req.headers, host: TARGET_HOST },
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    }
  );

  upstream.on("error", (error) => {
    console.error("[upstream-proxy]", req.method, req.url, error.message);
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end("upstream error: " + error.message);
  });

  req.pipe(upstream);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[upstream-proxy] http://127.0.0.1:${PORT} → https://${TARGET_HOST} (${TARGET_IP})`);
});