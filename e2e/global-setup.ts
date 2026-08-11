import { BASE_URL } from '../playwright.config'

/**
 * 開跑前驗明正身。
 *
 * playwright.config.ts 的 reuseExistingServer 會直接沿用已佔用該 port 的服務，
 * 但它只確認 port 有回應，不確認回應的是哪個 app。曾因此整批測試打到另一個
 * 專案的 dev server，而且部分測試還是綠的（例如「不連向正式 Supabase」——
 * 別人的網站當然不連），假綠燈比紅燈更難察覺。
 *
 * manifest.json 是靜態檔、不需登入，是最省事的身分依據。
 */
export default async function globalSetup(): Promise<void> {
  const manifestUrl = `${BASE_URL}/manifest.json`

  let response: Response
  try {
    response = await fetch(manifestUrl)
  } catch (error: unknown) {
    throw new Error(`無法連線至 ${manifestUrl}：${error instanceof Error ? error.message : String(error)}`)
  }

  if (!response.ok) {
    throw new Error(`${manifestUrl} 回應 ${response.status}，${BASE_URL} 上的服務可能不是 Dumplings`)
  }

  // 佔用該 port 的若是別的 SPA，多半會對任何路徑回傳 HTML fallback，
  // 此時 response.ok 仍為 true，必須自己攔下解析失敗，否則只會看到
  // 一句 "Unexpected token '<'"，完全看不出是 port 撞到。
  let manifest: { name?: string }
  try {
    manifest = (await response.json()) as { name?: string }
  } catch {
    throw new Error(
      `${manifestUrl} 沒有回傳 JSON，${BASE_URL} 上的服務不是 Dumplings。\n` +
        `該 port 已被其他服務佔用，請先關閉它，或改用其他 port 執行 E2E。`
    )
  }

  if (manifest.name !== 'Dumplings') {
    throw new Error(
      `${BASE_URL} 上跑的不是 Dumplings（manifest.name = ${JSON.stringify(manifest.name)}）。\n` +
        `該 port 已被其他服務佔用，請先關閉它，或改用其他 port 執行 E2E。`
    )
  }
}
