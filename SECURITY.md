# Security Policy

本仓库是一个静态网站（VitePress + GitHub Pages）。代码不包含服务端逻辑，也不处理用户数据。安全关注点主要集中在依赖供应链与构建/部署流程。

## 支持范围
- 活跃分支：`main`（持续接收安全更新）
- 构建与部署：GitHub Actions（最小权限、固定 Node/Pnpm 版本、锁定安装）

## 报告安全问题
- 请通过 GitHub Issues 私密方式（`Security advisory`）或发送邮件至仓库所有者公开邮箱。
- 请提供：问题描述、复现步骤、受影响文件路径与版本信息。
- 我们会在 7 个工作日内确认与回复处理进度。

## 依赖与构建安全
- 使用 `pnpm-lock.yaml` 锁定版本；CI 使用 `pnpm install --frozen-lockfile`。
- 若发现依赖漏洞，请附带 `npm audit`/`pnpm audit` 报告或相关链接。

## 内容安全
- 不在仓库中提交任何密钥或敏感信息。
- 外链请使用 HTTPS；对第三方脚本与评论组件进行来源校验与最小化使用。
