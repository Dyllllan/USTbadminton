import * as util from "../../../utils/util"

const UST_EMAIL_SUFFIX = "@connect.ust.hk"

Page({
  data: {
    uName: "",
    uSex: "",
    uSchool: "",
    uStuNum: "",
    uMajor: "",
    uEmail: "",
    uEmailVerified: 0,
    email: "",
    emailCode: "",
    codeCountdown: 0,
    sexColumns: ["男", "女", "其它"]
  },
  onSexChange(event) {
    this.setData({ uSex: event.detail })
  },
  onLoad(params) {
    let info = JSON.parse(params.info)
    let user = info.user || {}
    this.setData({
      uName: user.uName || "",
      uSex: user.uSex || "",
      uSchool: user.uSchool || "",
      uStuNum: user.uStuNum || "",
      uMajor: user.uMajor || "",
      uEmail: user.uEmail || "",
      uEmailVerified: user.uEmailVerified || 0,
      email: user.uEmail || ""
    })
  },
  sendEmailCode() {
    const email = (this.data.email || "").trim()
    if (!email) {
      wx.showToast({ title: "请输入邮箱", icon: "none" })
      return
    }
    if (!email.toLowerCase().endsWith(UST_EMAIL_SUFFIX)) {
      wx.showToast({ title: "仅支持 @connect.ust.hk 格式", icon: "none" })
      return
    }
    wx.request({
      url: `${util.getBaseUrl()}/api/user/email/sendCode`,
      method: "POST",
      header: util.getAuthHeader(),
      data: { email },
      success(res) {
        if (util.checkSuccess(res)) {
          wx.showToast({ title: "验证码已发送", icon: "success" })
          const page = getCurrentPages().pop()
          if (page && page.startCodeCountdown) page.startCodeCountdown()
        }
      },
      fail() { util.fail() }
    })
  },
  startCodeCountdown() {
    let count = 60
    this.setData({ codeCountdown: count })
    const timer = setInterval(() => {
      count--
      this.setData({ codeCountdown: count })
      if (count <= 0) clearInterval(timer)
    }, 1000)
  },
  verifyEmail() {
    const email = (this.data.email || "").trim()
    const code = (this.data.emailCode || "").trim()
    if (!email || !code) {
      wx.showToast({ title: "请输入邮箱和验证码", icon: "none" })
      return
    }
    if (!email.toLowerCase().endsWith(UST_EMAIL_SUFFIX)) {
      wx.showToast({ title: "仅支持 @connect.ust.hk 格式", icon: "none" })
      return
    }
    wx.request({
      url: `${util.getBaseUrl()}/api/user/email/verify`,
      method: "POST",
      header: util.getAuthHeader(),
      data: { email, code },
      success(res) {
        if (util.checkSuccess(res)) {
          wx.showToast({ title: "邮箱认证成功", icon: "success" })
          const page = getCurrentPages().pop()
          if (page) page.setData({ uEmail: email, uEmailVerified: 1, emailCode: "" })
        }
      },
      fail() { util.fail() }
    })
  },
  updateInfo() {
    let that = this
    wx.request({
      url: `${util.getBaseUrl()}/api/user/update`,
      header: util.getAuthHeader(),
      method: "POST",
      data: {
        uName: that.data.uName,
        uSex: that.data.uSex,
        uSchool: that.data.uSchool,
        uStuNum: that.data.uStuNum,
        uMajor: that.data.uMajor
      },
      success(res) {
        if (util.checkSuccess(res)) {
          util.route('/pages/page_me/page_me', 1, 1)
          wx.showToast({ title: '更新成功' })
        }
      },
      fail() { util.fail() }
    })
  }
})