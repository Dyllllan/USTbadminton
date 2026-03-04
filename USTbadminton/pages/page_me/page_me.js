import * as util from "../../utils/util"

Page({
  data: {
    user: {},
    avatarUrl: "",
    sexShow: "",
    isLogin: false,
    showLoginForm: false,
    defaultAvatar: "/images/other.png",
    defaultNickname: "羽毛球爱好者",
    loginAvatarPath: "",
    loginAvatarUrl: "",
    loginNickname: ""
  },
  onLoad() {
    let that = this
    if (util.getToken() != '') {
      util.checkToken().then(
        () => { // 进行登录
          wx.request({
            url: `${util.getBaseUrl()}/api/user/get/info`,
            header: util.getAuthHeader(),
            success(res) {
              if (util.checkSuccess(res)) {
                const { user, avatarUrl, sexShow } = util.formatUserForDisplay(res.data.obj)
                that.setData({ user, avatarUrl, sexShow, isLogin: true })
              }
            },
            fail() {
              util.fail()
            }
          })
        },
        () => {
          that.setData({
            isLogin: false
          })
        }
      )
    } else {
      that.setData({
        isLogin: false
      })
    }
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      loginAvatarPath: avatarUrl,
      loginAvatarUrl: avatarUrl
    })
  },
  onNicknameBlur(e) {
    this.setData({ loginNickname: e.detail.value || "" })
  },
  onLoginTap() {
    const that = this
    // 优先拉取微信头像和昵称，用于登录/注册时同步到账号
    if (typeof wx.getUserProfile === "function") {
      wx.getUserProfile({
        desc: "用于完善个人资料",
        success(profileRes) {
          const u = profileRes.userInfo || {}
          util.authWithProfile(u.nickName || "", null, u.avatarUrl || null).then(
            () => that.loadUserAndShow(),
            () => {}
          )
        },
        fail() {
          // 用户拒绝授权时，仍尝试仅用 code 登录（老用户可成功，新用户会提示 need_register）
          util.auth("", 1).then(() => that.loadUserAndShow(), () => {})
        }
      })
    } else {
      util.auth("", 1).then(() => that.loadUserAndShow(), () => {})
    }
  },
  showLoginFormWithDefaults(useDefaults) {
    this.setData({
      showLoginForm: true,
      defaultAvatar: "/images/other.png",
      defaultNickname: useDefaults ? "羽毛球爱好者" : "",
      loginAvatarPath: "",
      loginAvatarUrl: useDefaults ? "" : "",
      loginNickname: useDefaults ? "羽毛球爱好者" : ""
    })
  },
  loadUserAndShow() {
    const that = this
    wx.request({
      url: `${util.getBaseUrl()}/api/user/get/info`,
      header: util.getAuthHeader(),
      success(res) {
        if (util.checkSuccess(res)) {
          const { user, avatarUrl, sexShow } = util.formatUserForDisplay(res.data.obj)
          that.setData({ user, avatarUrl, sexShow, isLogin: true, showLoginForm: false })
        }
      }
    })
  },
  doLogin() {
    const that = this
    const nickName = (this.data.loginNickname || "").trim()
    const avatarPath = this.data.loginAvatarPath
    util.authWithProfile(nickName, avatarPath, null).then(
      () => {
        that.loadUserAndShow()
      },
      () => {
        this.setData({ isLogin: false, showLoginForm: false })
      }
    )
  },
  toUpdatePage() {
    let info = JSON.stringify(this.data)
    util.route(`/pages/page_me/update/update?info=${info}`)
  },
  toManagePage() {
    util.route("/pages/page_manage/page_manage")
  },
  logout() {
    wx.showModal({
      title: "退出登录",
      content: "确认退出？",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('auth')
          this.setData({
            user: {},
            avatarUrl: "",
            sexShow: "",
            isLogin: false,
            showLoginForm: false
          })
          wx.showToast({ title: "已退出登录" })
        }
      }
    })
  },
  deleteAccount() {
    const that = this
    const clearLoginState = () => that.setData({
      user: {}, avatarUrl: "", sexShow: "", isLogin: false, showLoginForm: false
    })
    wx.showModal({
      title: "注销账号",
      content: "注销后，您的账号及所有相关数据（活动、小组、加入记录等）将被永久删除，且无法恢复。确定要注销吗？",
      confirmText: "确定注销",
      confirmColor: "#ee0a24",
      success(res) {
        if (!res.confirm) return
        wx.showModal({
          title: "再次确认",
          content: "此操作不可撤销，请再次确认是否注销账号？",
          confirmText: "确认注销",
          confirmColor: "#ee0a24",
          success(res2) {
            if (!res2.confirm) return
            wx.showLoading({ title: "注销中..." })
            wx.request({
              url: `${util.getBaseUrl()}/api/user/delete/account`,
              method: "POST",
              header: util.getAuthHeader(),
              success(reqRes) {
                wx.hideLoading()
                if (util.checkSuccess(reqRes)) {
                  wx.removeStorageSync('auth')
                  clearLoginState()
                  wx.showToast({ title: "账号已注销", icon: "success" })
                }
              },
              fail(err) {
                wx.hideLoading()
                util.fail(err)
              }
            })
          }
        })
      }
    })
  }
})
