#!/usr/bin/env bash
#
# 讓 Supabase 為這個分支的 PR 建立 preview branch。
#
# Supabase GitHub integration 只在 PR 動到 `supabase/` 時才建 preview branch，
# 而關掉這個限制（"Supabase changes only"）需要付費方案。沒有 preview branch，
# Supabase 就不會把 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
# 注入 Vercel preview，proxy.ts 建 Supabase client 時會丟錯，整站 500。
#
# 純前端的分支因此要靠 supabase/.preview-trigger 製造一筆 `supabase/` 變動。
# 已經動過 supabase/ 的分支不需要，這支腳本會自己判斷並跳過。
#
# 時機很重要：branch 是在 PR「被開啟」的當下建立的，diff 也是那一刻判定的。
# PR 開了之後才補 trigger commit 沒有用，必須把 PR 關掉再重開。
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

BASE="${1:-main}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
TRIGGER_FILE="supabase/.preview-trigger"

if [ "$BRANCH" = "$BASE" ] || [ "$BRANCH" = "HEAD" ]; then
  echo "目前在 $BRANCH，請先切到要開 PR 的分支。" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "工作區有未提交的變動，請先 commit 或 stash 再跑。" >&2
  exit 1
fi

git fetch --quiet origin "$BASE"

if [ -n "$(git diff --name-only "origin/$BASE...HEAD" -- supabase/)" ]; then
  echo "這個分支已經動過 supabase/，Supabase 會自動建 preview branch，不需要 trigger。"
  exit 0
fi

cat > "$TRIGGER_FILE" <<TRIGGER
# 這個檔案唯一的用途，是讓 PR 的 diff 裡有一筆 \`supabase/\` 變動，
# 好讓 Supabase GitHub integration 為這個 PR 建立 preview branch。
# 內容沒有任何意義，由 \`npm run pr:trigger\` 維護，不要手動改。
$BRANCH $(git rev-parse --short HEAD)
TRIGGER

git add "$TRIGGER_FILE"
git commit --quiet -m "chore: 觸發 Supabase preview branch

這個分支沒有動到 supabase/，Supabase 會跳過建立 preview branch，
Vercel preview 就拿不到 Supabase 的 URL 與 anon key 而整站 500。
補一筆 supabase/ 變動讓 integration 願意建 branch。"

echo "已建立 trigger commit："
git --no-pager log -1 --oneline

if gh pr view --json state --jq .state >/dev/null 2>&1; then
  echo
  echo "注意：這個分支已經有 PR 了。preview branch 只在 PR 開啟的當下建立，"
  echo "光是 push 這筆 commit 不會讓 Supabase 補建 branch——push 之後要把 PR"
  echo "關掉再重開（gh pr close <n> && gh pr reopen <n>）。"
fi
