const app = getApp()
const baseUrl = app.globalData.baseUrl
import * as util from "../../../utils/util"

const VENUE_OPTIONS = [
  { name: "LG1-court 1" },
  { name: "LG1-court 2" },
  { name: "LG1-court 3" },
  { name: "LG1-court 4" },
  { name: "LG1-court 5" },
  { name: "LG1-court 6" },
  { name: "Seafront-Court 1" },
  { name: "Seafront-Court 2" }
]

const LEVEL_OPTIONS = [
  { name: "初级" },
  { name: "中级" },
  { name: "高级" },
  { name: "不限" }
]

const TIME_SLOT_OPTIONS = [
  { name: "08:00-10:00" },
  { name: "10:00-12:00" },
  { name: "12:00-14:00" },
  { name: "14:00-16:00" },
  { name: "16:00-18:00" },
  { name: "18:00-20:00" },
  { name: "20:00-22:00" }
]

Page({
  data: {
    aVenue: "",
    aLevel: "",
    aDate: "",
    aDateShow: "",
    aTimeSlot: "",
    aCount: 4,
    aIsPublic: "1",
    aNeedApprove: false,
    aDesc: "",

    venueOptions: VENUE_OPTIONS,
    levelOptions: LEVEL_OPTIONS,
    timeSlotOptions: TIME_SLOT_OPTIONS,

    activePicker: "",
    showPicker: false,
    showDate: false,
    submitting: false,

    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    dateFormatter(type, value) {
      if (type === "year") return `${value}年`
      if (type === "month") return `${value}月`
      if (type === "day") return `${value}日`
      return value
    }
  },

  openPicker(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ activePicker: type, showPicker: true })
  },

  onPickerClose() {
    this.setData({ showPicker: false })
  },

  onPickerSelect(e) {
    const name = e.detail.name
    const field = this.data.activePicker
    const map = { venue: "aVenue", level: "aLevel", timeSlot: "aTimeSlot" }
    this.setData({ [map[field]]: name, showPicker: false })
  },

  getPickerActions() {
    const map = {
      venue: this.data.venueOptions,
      level: this.data.levelOptions,
      timeSlot: this.data.timeSlotOptions
    }
    return map[this.data.activePicker] || []
  },

  openDatePicker() {
    this.setData({ showDate: true })
  },

  onDateClose() {
    this.setData({ showDate: false })
  },

  onDateConfirm(e) {
    const ts = e.detail
    this.setData({
      showDate: false,
      aDate: String(ts),
      aDateShow: util.getFormatTimeByMillis(ts)
    })
  },

  onCountChange(e) {
    this.setData({ aCount: e.detail })
  },

  onIsPublicClick(e) {
    this.setData({ aIsPublic: e.currentTarget.dataset.name })
  },

  onNeedApproveChange(e) {
    this.setData({ aNeedApprove: e.detail })
  },

  buildActivityName() {
    const parts = [this.data.aVenue, this.data.aDateShow, this.data.aLevel].filter(Boolean)
    return parts.length ? parts.join(" ") : "羽毛球活动"
  },

  validate() {
    const { aVenue, aDate, aTimeSlot } = this.data
    const missing = []
    if (!aVenue) missing.push("场地")
    if (!aDate) missing.push("日期")
    if (!aTimeSlot) missing.push("时间段")
    if (missing.length) {
      wx.showToast({ title: `请选择${missing[0]}`, icon: "none" })
      return false
    }
    return true
  },

  createActivity() {
    if (!util.getToken()) {
      util.alertFail("请先登录后再创建活动")
      util.auth()
      return
    }
    if (!this.validate()) return
    if (this.data.submitting) return

    wx.showModal({
      title: "创建活动",
      content: "确认创建？",
      success: (res) => {
        if (!res.confirm) return
        this.setData({ submitting: true })
        wx.showLoading({ title: "创建中..." })

        wx.request({
          url: `${baseUrl}/api/activity/add`,
          header: util.getAuthHeader(),
          method: "POST",
          data: {
            aName: this.buildActivityName(),
            aDesc: this.data.aDesc || "",
            aEndDate: this.data.aDate || String(this.data.currentDate),
            aIsPublic: parseInt(this.data.aIsPublic) || 0,
            aVenue: this.data.aVenue,
            aLevel: this.data.aLevel || "",
            aDate: this.data.aDate,
            aTimeSlot: this.data.aTimeSlot,
            aCount: this.data.aCount,
            aNeedApprove: this.data.aNeedApprove ? 1 : 0
          },
          success: (res) => {
            wx.hideLoading()
            if (util.checkSuccess(res)) {
              wx.showToast({ title: "创建成功" })
              util.route("/pages/page_home/page_home", 1, 1)
            }
          },
          fail: (err) => {
            wx.hideLoading()
            util.fail(err)
          },
          complete: () => {
            this.setData({ submitting: false })
          }
        })
      }
    })
  }
})
