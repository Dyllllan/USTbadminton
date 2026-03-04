# UST 羽毛球组队 - 集成说明

teamify 组队功能已整合到 USTbadminton 小程序中。

## 微信开发者工具使用步骤

### 1. 构建 npm
- 打开微信开发者工具，导入项目（选择 `USTbadminton` 文件夹）
- 菜单栏：**工具** → **构建 npm**
- 等待构建完成，会生成 `miniprogram_npm` 目录

### 2. 本地开发配置
- **不校验合法域名**：右上角「详情」→「本地设置」→ 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
- 确保后端服务已启动（`docker-compose up -d` 在 teamify-master 目录）

### 3. 后端配置（微信登录）
编辑 `teamify-master/src/main/resources/application.yaml`：
- `wx.appId` 已配置为 USTbadminton 的 AppID
- `wx.appSecret`：在[微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发设置 中获取

### 4. 修改 API 地址（可选）
如需修改后端地址，编辑 `USTbadminton/app.js` 中的 `globalData.baseUrl`

## 功能说明
- **创建活动**：发起羽毛球活动
- **加入活动**：扫码或浏览公开活动
- **公开活动**：查看所有公开活动
- **登录**：微信授权登录
- **管理/个人**：底部导航栏
