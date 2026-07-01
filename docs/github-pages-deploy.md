# 部署到 GitHub Pages

本專案透過 `.github/workflows/deploy-pages.yml` 把前端發佈到 GitHub Pages。
網址：**https://woobebox.github.io/treasure-box-inventory/**

> 這個 org 禁止使用外部 GitHub Actions，所以 workflow 全部用 shell `run` 步驟（手寫 git、npm），並以「推送到 `gh-pages` 分支」的傳統方式發佈，不使用官方 Pages actions。

## 運作方式

- **觸發**：push 到 `main`（且動到 `apps/web/**` 等）時自動執行；也可在 Actions 頁面手動 `Run workflow`。
- **流程**：checkout → `npm ci` → `npm run build`（production，base = `/treasure-box-inventory/`）→ 複製 `index.html` 成 `404.html`（SPA 深層連結 fallback）+ 建 `.nojekyll` → 把 `apps/web/dist` 以 orphan 分支 force-push 到 `gh-pages`。

## 首次設定（需你手動一次，我無法代做）

### 1. 加入 Supabase 環境變數為 repo Secrets
Settings → Secrets and variables → Actions → New repository secret，新增兩個：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://nrjbazjyqqqjpgrnrmmz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 你的 anon public key |

> anon key 本來就會被編進前端公開包、屬公開設計，放 Secrets 只是避免寫進原始碼。若沒設這兩個，部署版仍可用，但會退化為純離線（不同步）。

### 2. 啟用 Pages（第一次部署跑完後）
Settings → Pages → Build and deployment → Source 選 **Deploy from a branch** → 分支選 **`gh-pages`**、資料夾 **`/ (root)`** → Save。
等一兩分鐘後開網址即可。

## 驗證

- 開 https://woobebox.github.io/treasure-box-inventory/ → 應正常載入（不是白畫面）。
- 登入 → 建立/選家庭 → 新增物品 → 設定頁「立即同步」。
- 深層連結：直接開 `.../treasure-box-inventory/add` 或在物品頁重新整理 → 不應 404（靠 `404.html` fallback）。

## 疑難排解

- **白畫面 / 資產 404**：base 路徑不符。確認 repo 名為 `treasure-box-inventory`（對應 `vite.config.ts` 的 base）。
- **能開但無法同步**：Secrets 沒設或名稱錯；重設後重跑 workflow。
- **push gh-pages 失敗（403）**：workflow 需 `permissions: contents: write`（已設定）。
- **本機預覽子路徑**：`npm run build && npm run preview`，preview 會以 `/treasure-box-inventory/` 提供。
