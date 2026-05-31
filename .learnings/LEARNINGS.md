# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## 2026-06-01 前端合代码规范

### 1. 生产环境不允许出现开发配置
- **问题**: `api.ts` 里 `VITE_API_BASE_URL` fallback 写了 `http://192.168.86.9:8081`
- **修复**: fallback 改为空字符串，开发配置只在 `.env.development` 里
- **规则**: `api.ts` 的 fallback 必须为空 `''`，开发地址只通过 `.env.development` 配置
- **涉及文件**: `services/api.ts`、`.env.production`

### 2. .env.production 必须提交到 git
- **问题**: `.env.production` 被 gitignore 忽略，生产构建用了旧配置
- **修复**: `git add -f .env.production` 强制追踪
- **规则**: `.env.production` 必须在版本控制中，`VITE_API_BASE_URL` 留空

### 3. 合代码前必须重新 generate
- **问题**: 本地改了代码但没重新 `pnpm generate`，推上去的 dist 是旧的
- **规则**: 每次合代码到 master 前，先 `pnpm generate`，再 `git add -f .output/public/`
