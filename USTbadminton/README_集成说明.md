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

**若出现「连接被拒绝 / connection refused」：**
- 确认后端已启动：`cd teamify-master && docker-compose up -d`
- 真机调试时：将 `baseUrl` 改为电脑的局域网 IP（如 `http://192.168.1.100:8080`），手机无法访问 `localhost`

## 功能说明
- **创建活动**：发起羽毛球活动
- **加入活动**：扫码或浏览公开活动
- **公开活动**：查看所有公开活动
- **登录**：微信授权登录。使用「头像昵称填写能力」：点击头像选择、输入昵称后登录，会同步到个人信息
- **管理/个人**：底部导航栏

### 隐私协议（发布时）
使用 chooseAvatar 获取头像需在[微信公众平台](https://mp.weixin.qq.com) → 设置 → 服务内容声明 中声明 `scope.chooseAvatar` 和昵称收集用途，否则真机可能报错。

### 数据库迁移（已有数据时）
若之前已运行过项目，需执行以下命令添加用户头像字段：
```bash
docker exec -i mysql-server mysql -uroot -proot123 form_team_talent < teamify-master/docker/mysql/init/migration_add_user_avatar.sql
```
