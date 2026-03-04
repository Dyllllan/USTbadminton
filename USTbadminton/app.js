// app.js - UST 羽毛球组队
App({
  globalData: {
    // 后端 API 地址
    // - 模拟器调试：使用 http://localhost:8080
    // - 真机调试：必须改为电脑的局域网 IP，如 http://192.168.1.100:8080（手机无法访问 localhost）
    // 微信开发者工具需勾选「不校验合法域名」才能访问
    // 后端启动：在 teamify-master 目录执行 docker-compose up -d
    baseUrl: 'http://10.89.188.111:8080'
  }
})
