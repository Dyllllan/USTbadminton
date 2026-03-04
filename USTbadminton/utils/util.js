export {
  getFormatTimeByMillis,
  getCurrentFormatTime,
  getFormatTimeByDate,
  getBaseUrl,
  formatUserForDisplay,
  alertFail,
  fail,
  getToken,
  getAuthHeader,
  goToPage,
  checkToken,
  checkSuccess,
  route,
  auth,
  authWithProfile
}

function getBaseUrl() {
  return getApp().globalData.baseUrl
}

/**
 * 将用户对象格式化为页面展示所需字段
 * @param {object} user 用户对象
 * @returns {{ user, avatarUrl, sexShow }}
 */
function formatUserForDisplay(user) {
  if (!user) return { user: {}, avatarUrl: "/images/other.png", sexShow: "其它" }
  let sexShow = "其它"
  if (user.uSex === "female") sexShow = "女"
  else if (user.uSex === "male") sexShow = "男"
  const sex = (user.uSex === "male" || user.uSex === "female") ? user.uSex : "other"
  let avatarUrl = (user.uAvatar && user.uAvatar.trim()) ? user.uAvatar : `/images/${sex}.png`
  if (avatarUrl.startsWith("/") && !avatarUrl.startsWith("/images/")) {
    avatarUrl = getBaseUrl() + avatarUrl
  }
  return { user, avatarUrl, sexShow }
}

function ftime(t) {
  if (t < 10) {
    return `0${t}`
  }
  return t
}
// 获取当前格式化时间
function getCurrentFormatTime() {
  return getFormatTimeByDate(new Date())
}
// 根据Date获取格式化时间
function getFormatTimeByMillis(millis) {
  if (typeof (millis) != "number") {
    millis = parseInt(millis)
  }
  return getFormatTimeByDate(new Date(millis))
}
function getFormatTimeByDate(date) {
  return `${date.getFullYear()}年${ftime(date.getMonth() + 1)}月${ftime(date.getDate())}日`
  // return `${date.getFullYear()}-${ftime(date.getMonth() + 1)}-${ftime(date.getDate())} ${ftime(date.getHours())}:${ftime(date.getMinutes())}:${ftime(date.getSeconds())}`
}

function fail(err) {
  let content = "操作失败，请重试 >_<"
  if (err) {
    const errMsg = (err.errMsg || err.message || String(err)).toLowerCase()
    if (errMsg.includes("connection refused") || errMsg.includes("connect fail") || errMsg.includes("connect econnrefused")) {
      content = "连接被拒绝：请确认后端服务已启动（teamify-master 目录下执行 docker-compose up -d），且 baseUrl 配置正确。真机调试时需将 localhost 改为电脑的局域网 IP（如 192.168.x.x:8080）"
    } else if (errMsg.includes("timeout") || errMsg.includes("超时")) {
      content = "请求超时：请检查网络连接及后端服务是否正常"
    } else if (errMsg === "request:fail" || errMsg.includes("request:fail")) {
      content = "网络请求失败：请确认 1) 后端已启动（docker-compose up -d）2) app.js 中 baseUrl 正确（含端口 :8080）3) 微信开发者工具已勾选「不校验合法域名」"
    } else if (errMsg.includes("fail")) {
      content = `网络请求失败：${err.errMsg || err.message || "请检查网络和后端服务"}`
    }
  }
  alertFail(content)
}
function alertFail(content) {
  wx.showModal({
    title: "操作失败",
    content: content,
    showCancel: false,
    confirmText: "确定",
    confirmColor: "#00BFFF",
  })
}

function getToken() {
  return wx.getStorageSync('auth') || ''
}
function getAuthHeader() {
  let token = getToken()
  let myHeader = token != "" ? { "auth": token, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
  return myHeader
}

function goToPage(pageUrl, redirect) {
  if (redirect == 0) {
    wx.navigateTo({
      url: pageUrl,
    })
  } else if (redirect == 1) {
    wx.redirectTo({
      url: pageUrl,
    })
  }
}

function checkToken() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}/api/user/authwx?check=1`,
      method: 'POST',
      header: getAuthHeader(),
      success: res => {
        if (res.data && res.data.code == 200) resolve()
        else reject(res.data ? res.data.msg : "验证失败")
      },
      fail: err => {
        reject(err ? (err.errMsg || "网络请求失败") : "网络请求失败")
      }
    })
  })
}

function route(pageUrl, needAuth = 1, redirect = 0) {
  if (needAuth == 0) {
    goToPage(pageUrl, redirect)
  } else {
    if (getToken() != '') {
      checkToken().then(
        () => goToPage(pageUrl, redirect),
        () => auth()
      )
    } else {
      wx.removeStorageSync('auth')
      auth(pageUrl, redirect)
    }
  }
}

function checkSuccess(res) {
  if (!res || !res.data) {
    alertFail("服务器返回异常，请检查后端是否正常运行")
    return false
  }
  let code = res.data.code
  let msg = res.data.msg
  if (msg == null || msg === "") {
    msg = "操作失败" + (res.statusCode ? ` (HTTP ${res.statusCode})` : "")
  }
  if (code == 200) {
    return true
  } else if (code == 401) {
    alertFail("登录已过期或未登录，请重新登录")
    auth()
    return false
  } else {
    alertFail(msg)
    return false
  }
}

function auth(pageUrl = "", redirect = 1) {
  return doAuth(null, null, null, pageUrl, redirect)
}

/**
 * 带头像昵称的登录（用于个人页）
 * @param {string} nickName 用户填写的昵称
 * @param {string} avatarPath chooseAvatar 返回的临时文件路径（需上传）
 * @param {string} avatarUrl getUserProfile 返回的头像 URL（直接使用，无需上传）
 */
function authWithProfile(nickName, avatarPath, avatarUrl) {
  return doAuth(nickName, avatarPath, avatarUrl, "", 1)
}

function finishLogin(token, avatarPath, avatarUrl, pageUrl, redirect, resolve) {
  wx.setStorageSync('auth', token)
  const done = () => {
    wx.hideLoading()
    wx.showToast({ title: '登录成功' })
    if (pageUrl) goToPage(pageUrl, redirect)
    resolve()
  }
  if (avatarPath && !avatarUrl) {
    wx.uploadFile({
      url: `${getBaseUrl()}/api/user/avatar/upload`,
      filePath: avatarPath,
      name: 'file',
      header: { "auth": token },
      success: (res) => {
        const data = JSON.parse(res.data || '{}')
        if (data.code !== 200) wx.showToast({ title: '头像上传失败', icon: 'none' })
        done()
      },
      fail: () => { done() }
    })
  } else {
    done()
  }
}

function promptRegisterAndRetry(pageUrl, redirect, resolve, reject) {
  wx.showModal({
    title: "注册账号",
    content: "您还未注册，请授权微信头像和昵称完成注册",
    confirmText: "去授权",
    cancelText: "取消",
    success(modalRes) {
      if (!modalRes.confirm) return reject(new Error("用户取消注册"))
      if (typeof wx.getUserProfile !== "function") {
        alertFail("当前环境不支持授权，请使用最新版微信")
        return reject(new Error("getUserProfile 不可用"))
      }
      wx.getUserProfile({
        desc: "用于完成注册",
        success: (p) => {
          const u = p.userInfo || {}
          doAuth(u.nickName || "", null, u.avatarUrl || null, pageUrl, redirect).then(resolve).catch(reject)
        },
        fail: () => {
          alertFail("注册需要授权微信头像和昵称，请重新尝试")
          reject(new Error("用户拒绝授权"))
        }
      })
    }
  })
}

function doAuth(nickName, avatarPath, avatarUrl, pageUrl, redirect) {
  wx.showLoading({ title: "尝试登录..." })
  return new Promise((resolve, reject) => {
    const reqData = {}
    if (nickName) reqData.nickName = nickName
    if (avatarUrl) reqData.avatarUrl = avatarUrl
    wx.login({
      success(res1) {
        wx.request({
          url: `${getBaseUrl()}/api/user/authwx?code=${res1.code}`,
          method: 'POST',
          header: { "Content-Type": "application/json" },
          data: reqData,
          success(res2) {
            if (!res2 || !res2.data) {
              wx.hideLoading()
              alertFail("服务器返回异常，请检查后端是否正常运行")
              return reject(new Error("响应数据异常"))
            }
            if (res2.data.code === 200) {
              const token = res2.header?.auth || res2.header?.Auth
              if (token) {
                finishLogin(token, avatarPath, avatarUrl, pageUrl, redirect, resolve)
              } else {
                wx.hideLoading()
                alertFail("登录成功但未获取到凭证")
                reject(new Error("未获取到 token"))
              }
            } else if (res2.data.code === 403 && res2.data.msg === "need_register") {
              wx.hideLoading()
              promptRegisterAndRetry(pageUrl, redirect, resolve, reject)
            } else {
              wx.hideLoading()
              alertFail(res2.data.msg || "登录失败")
              reject(new Error(res2.data.msg))
            }
          },
          fail(err) {
            wx.hideLoading()
            alertFail("请检查网络连接及后端服务是否启动")
            reject(err || new Error("网络请求失败"))
          }
        })
      },
      fail(err) {
        wx.hideLoading()
        alertFail("微信登录失败，请重试")
        reject(err || new Error("wx.login 失败"))
      }
    })
  })
}