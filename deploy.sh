#!/usr/bin/env bash
# 部署到自建服务器（布局见 docs/server-deployment-2026-10-19.md）。
#
# 用法:
#   ./deploy.sh             部署当前 HEAD 提交（未提交的改动不会被部署）
#   ./deploy.sh rollback    切回上一个发布版本
#   ./deploy.sh list        列出服务器上的发布版本
#
# 服务器连接信息从 .env.local 读取: SERVER_IP / SERVER_USER / SERVER_PASSWORD
# 可选环境变量:
#   KEEP_RELEASES=3                               保留的发布版本数（含当前版本）
#   NPM_REGISTRY=https://registry.npmmirror.com   服务器安装依赖使用的源
#   SKIP_TESTS=1                                  跳过本地测试
set -euo pipefail

cd "$(dirname "$0")"

KEEP_RELEASES="${KEEP_RELEASES:-3}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# 只读取需要的键，不 source 整个文件（其他值可能含特殊字符）
env_get() {
  local v
  v="$(grep -E "^$1=" .env.local | tail -1 | cut -d= -f2-)" || true
  v="${v%$'\r'}"
  v="${v#\"}"; v="${v%\"}"; v="${v#\'}"; v="${v%\'}"
  printf '%s' "$v"
}

[[ -f .env.local ]] || die ".env.local 不存在"
SERVER_IP="$(env_get SERVER_IP)"
SERVER_USER="$(env_get SERVER_USER)"
SERVER_PASSWORD="$(env_get SERVER_PASSWORD)"
[[ -n "$SERVER_IP" && -n "$SERVER_USER" && -n "$SERVER_PASSWORD" ]] \
  || die ".env.local 缺少 SERVER_IP / SERVER_USER / SERVER_PASSWORD"
command -v sshpass >/dev/null || die "需要 sshpass: brew install hudochenkov/sshpass/sshpass"

# 密码通过环境变量传给 sshpass，不出现在命令行参数里
export SSHPASS="$SERVER_PASSWORD"
HOST="$SERVER_USER@$SERVER_IP"
CTL_DIR="$(mktemp -d /tmp/bhw-deploy.XXXXXX)"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15
  -o ControlMaster=auto -o ControlPath="$CTL_DIR/%C" -o ControlPersist=120)
cleanup() {
  ssh "${SSH_OPTS[@]}" -O exit "$HOST" >/dev/null 2>&1 || true
  rm -rf "$CTL_DIR"
}
trap cleanup EXIT

remote() { sshpass -e ssh "${SSH_OPTS[@]}" "$HOST" "$@"; }

# 服务器端的公共函数，拼接在每段远程脚本前面
REMOTE_LIB=$(cat <<'EOF'
set -euo pipefail
BASE=/opt/bilibili-history-web
SERVICE=bilibili-history-web.service
log() { printf '\033[1;32m[server]\033[0m %s\n' "$*"; }

health_check() {
  local code
  for _ in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/login || true)"
    [[ "$code" == 200 ]] && return 0
    sleep 1
  done
  return 1
}

# 发布版本名，新的在前
list_releases() {
  find "$BASE/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r
}

# 原子切换 current 链接
switch_to() {
  ln -sfn "$1" "$BASE/current.new"
  mv -T "$BASE/current.new" "$BASE/current"
}
EOF
)

run_remote() {
  local script="$1"; shift
  # 包进 { } 让 bash 先读完整段脚本，避免子进程（pnpm 等）读 stdin 吞掉后续命令
  printf '{\n%s\n%s\n}\n' "$REMOTE_LIB" "$script" | remote bash -s -- "$@"
}

cmd_list() {
  run_remote "$(cat <<'EOS'
echo "当前: $(basename "$(readlink -f "$BASE/current")")"
list_releases
EOS
)"
}

cmd_rollback() {
  run_remote "$(cat <<'EOS'
cur="$(basename "$(readlink -f "$BASE/current")")"
# 版本名以时间开头，按名字排序即按时间排序；取当前版本之前的那个
prev="$(list_releases | awk -v cur="$cur" '$0 == cur { found = 1; next } found { print; exit }')"
[[ -n "$prev" ]] || { echo "没有比 $cur 更早的版本可回退"; exit 1; }
log "回退: $cur -> $prev"
switch_to "$BASE/releases/$prev"
systemctl restart "$SERVICE"
health_check || { journalctl -u "$SERVICE" -n 50 --no-pager; exit 1; }
log "回退完成"
EOS
)"
}

cmd_deploy() {
  command -v git >/dev/null || die "需要 git"
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    printf '\033[1;33mwarning:\033[0m 存在未提交的改动，它们不会被部署（只部署 HEAD）\n'
  fi

  local sha tag archive
  sha="$(git rev-parse --short HEAD)"
  tag="$(date +%Y%m%d-%H%M%S)-$sha"
  archive="$CTL_DIR/source.tar.gz"

  if [[ "${SKIP_TESTS:-}" != 1 ]]; then
    log "运行本地测试"
    pnpm test:history
  fi

  log "打包 ${sha}（git archive HEAD）"
  git archive --format=tar.gz -o "$archive" HEAD

  log "上传到 $SERVER_IP"
  remote "mkdir -p /root/bilibili-deploy && chmod 700 /root/bilibili-deploy"
  sshpass -e scp "${SSH_OPTS[@]}" -q "$archive" "$HOST:/root/bilibili-deploy/$tag.tar.gz"

  log "服务器构建并发布 $tag"
  run_remote "$(cat <<'EOS'
TAG="$1"; KEEP="$2"; REGISTRY="$3"
ARCHIVE="/root/bilibili-deploy/$TAG.tar.gz"
BUILD="$BASE/builds/$TAG"
SRC="$BUILD/source"
RELEASE="$BASE/releases/$TAG"
[[ ! -e "$RELEASE" ]] || { echo "$RELEASE 已存在"; exit 1; }

# 安装和构建都以 bilibili-web 身份运行
AS_BUILDER=(runuser -u bilibili-web -- env
  PATH="$BASE/runtime/bin:/usr/bin:/bin"
  HOME="$BASE/build-cache"
  XDG_CACHE_HOME="$BASE/build-cache"
  NEXT_TELEMETRY_DISABLED=1)
# 加载 production.env（值为 JSON 字符串）后执行命令
with_prod_env() {
  python3 -c '
import json, os, sys
for line in open("/etc/bilibili-history-web/production.env").read().splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        os.environ[k] = json.loads(v)
os.execvp(sys.argv[1], sys.argv[1:])
' "$@"
}

log "解压源码"
install -d -m 700 -o bilibili-web -g bilibili-web "$BUILD" "$SRC"
tar -xzf "$ARCHIVE" -C "$SRC"
chown -R bilibili-web:bilibili-web "$SRC"
rm -f "$ARCHIVE"

log "安装依赖"
cd "$SRC"
"${AS_BUILDER[@]}" "$BASE/runtime/bin/node" "$BASE/tooling/node_modules/pnpm/bin/pnpm.cjs" install \
  --frozen-lockfile --store-dir "$BASE/build-cache/pnpm-store" --registry "$REGISTRY"

log "构建（next build, standalone）"
with_prod_env "${AS_BUILDER[@]}" \
  NODE_OPTIONS=--max-old-space-size=768 \
  SELF_HOSTED_BUILD=1 \
  NODE_ENV=production \
  "$BASE/runtime/bin/node" "$SRC/node_modules/next/dist/bin/next" build
[[ -f "$SRC/.next/standalone/server.js" ]] || { echo "构建产物缺少 server.js"; exit 1; }

log "组装发布目录 $RELEASE"
cp -a "$SRC/.next/standalone" "$RELEASE"
cp -a "$SRC/.next/static" "$RELEASE/.next/static"
cp -a "$SRC/public" "$RELEASE/public"
mkdir -p "$RELEASE/.next/cache"
chown -R root:bilibili-web "$RELEASE"
chmod -R u=rwX,g=rX,o= "$RELEASE"
chown -R bilibili-web:bilibili-web "$RELEASE/.next/cache"

# systemd 单元有改动时同步
if ! cmp -s "$SRC/deploy/bilibili-history-web.service" "/etc/systemd/system/$SERVICE"; then
  log "更新 systemd 单元"
  install -m 644 "$SRC/deploy/bilibili-history-web.service" "/etc/systemd/system/$SERVICE"
  systemctl daemon-reload
fi

PREV="$(readlink -f "$BASE/current")"
log "切换 current -> $TAG 并重启服务"
switch_to "$RELEASE"
systemctl restart "$SERVICE"

if ! health_check; then
  echo "健康检查失败，回退到 $(basename "$PREV")" >&2
  journalctl -u "$SERVICE" -n 50 --no-pager >&2 || true
  switch_to "$PREV"
  systemctl restart "$SERVICE"
  exit 1
fi
log "健康检查通过"

# 构建目录（含 node_modules）发布后不再需要
find "$BASE/builds" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +

# 只保留最近 KEEP 个发布版本，当前版本永远保留
CUR="$(readlink -f "$BASE/current")"
list_releases | tail -n +"$((KEEP + 1))" | while read -r name; do
  [[ "$BASE/releases/$name" == "$CUR" ]] && continue
  log "清理旧版本 $name"
  rm -rf "${BASE:?}/releases/$name"
done
EOS
)" "$tag" "$KEEP_RELEASES" "$NPM_REGISTRY"

  log "部署完成: $tag  →  https://bilibilihistory.mundane.ink"
}

case "${1:-deploy}" in
  deploy) cmd_deploy ;;
  rollback) cmd_rollback ;;
  list) cmd_list ;;
  *) die "未知命令: $1（可用: deploy | rollback | list）" ;;
esac
