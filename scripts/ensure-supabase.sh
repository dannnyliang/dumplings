#!/usr/bin/env bash
#
# 確保本地 Supabase 可用，由需要資料庫的 npm script 在前面呼叫。
#
# Why: 本地 stack 需要 Docker，但沒必要為了偶爾開發而讓 Docker 常駐。
# 這支腳本讓 dev / e2e / types:generate 自己把該起的東西起起來，
# 開發者不必記得先跑 supabase start，也不必讓 Docker 開機自動啟動。
#
# 兩個檢查都在 0.5 秒內完成，已在運行時幾乎沒有額外成本。
# 平台限制：自動啟動 Docker 的部分使用 macOS 的 open -a，其他平台會提示手動啟動。

set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "找不到 docker 指令。請先安裝 Docker Desktop：https://www.docker.com/products/docker-desktop/" >&2
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "找不到 supabase 指令。請先安裝 Supabase CLI：brew install supabase/tap/supabase" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  if [[ "$(uname)" != "Darwin" ]]; then
    echo "Docker 未運行，請先啟動後重試。" >&2
    exit 1
  fi

  echo "Docker 未運行，正在啟動 Docker Desktop..."
  open -a Docker 2>/dev/null || {
    echo "無法自動啟動 Docker Desktop，請手動開啟後重試。" >&2
    exit 1
  }

  printf "等待 Docker 就緒"
  for _ in $(seq 1 90); do
    if docker info >/dev/null 2>&1; then
      printf " 完成\n"
      break
    fi
    printf "."
    sleep 2
  done

  if ! docker info >/dev/null 2>&1; then
    printf "\n"
    echo "Docker 啟動逾時（180 秒）。請手動確認 Docker Desktop 狀態後重試。" >&2
    exit 1
  fi
fi

if supabase status >/dev/null 2>&1; then
  exit 0
fi

echo "本地 Supabase 未運行，正在啟動（首次啟動需要較久）..."
supabase start
