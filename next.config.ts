import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 不要設定 experimental.staleTimes.dynamic > 0。
  // 本專案所有頁面都是動態的（page.tsx 皆會 supabase.auth.getUser() 讀 cookie），
  // 把 dynamic 片段快取在 client Router Cache 會讓新增/修改後 router.refresh() 仍回吐舊明細。
  // Next.js 15 已將 dynamic 預設從 30s 改回 0s，正是為了避免這個 read-your-own-writes 問題。
};

export default nextConfig;
