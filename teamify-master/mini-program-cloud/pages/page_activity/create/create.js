const app = getApp()
let util = require("../../../utils/util")

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
    venueOptions: [
      { name: "LG1-court 1" },
      { name: "LG1-court 2" },
      { name: "LG1-court 3" },
      { name: "LG1-court 4" },
      { name: "LG1-court 5" },
      { name: "LG1-court 6" },
      { name: "Seafront- Court 1" },
      { name: "Seafront- court 2" }
    ],
    levelOptions: [
      { name: "初级" },
      { name: "中级" },
      { name: "高级" },
      { name: "不限" }
    ],
    showVenue: false,
    showLevel: false,
    showDate: false,
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    dateFormatter(type, value) {
      if (type === "year") return `${value}年`
      if (type === "month") return `${value}月`
      if (type === "day") return `${value}日`
      return value
    }
  },
  showVenuePicker() {
    this.setData({ showVenue: true })
  },
  onVenueClose() {
    this.setData({ showVenue: false })
  },
  onVenueSelect(e) {
    const item = e.detail
    this.setData({ aVenue: item.name, showVenue: false })
  },
  showLevelPicker() {
    this.setData({ showLevel: true })
  },
  onLevelClose() {
    this.setData({ showLevel: false })
  },
  onLevelSelect(e) {
    const item = e.detail
    this.setData({ aLevel: item.name, showLevel: false })
  },
  showDatePicker() {
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
    const name = e.currentTarget.dataset.name
    this.setData({ aIsPublic: name })
  },
  onNeedApproveChange(e) {
    this.setData({ aNeedApprove: e.detail })
  },
  getDefaultName() {
    const parts = [this.data.aVenue, this.data.aDateShow, this.data.aLevel].filter(Boolean)
    return parts.length ? parts.join(" ") : "羽毛球活动"
  },
  async sendCreateActivity() {
    const endDate = this.data.aDate || this.data.currentDate
    const res = await app.call({
      url: "/api/activity/add",
      method: "POST",
      data: {
        aName: this.getDefaultName(),
        aDesc: this.data.aDesc || "",
        aEndDate: String(endDate),
        aIsPublic: parseInt(this.data.aIsPublic) || 0,
        aVenue: this.data.aVenue || "",
        aLevel: this.data.aLevel || "",
        aDate: this.data.aDate ? String(this.data.aDate) : "",
        aTimeSlot: this.data.aTimeSlot || "",
        aCount: this.data.aCount || 4,
        aNeedApprove: this.data.aNeedApprove ? 1 : 0
      }
    })
    if (util.checkSuccess(res)) {
      wx.showToast({ title: "创建成功" })
      util.route("/pages/page_home/page_home", 1, 1)
    }
  },
  async createActivity() {
    wx.showModal({
      title: "创建活动",
      content: "确认创建？",
      success: async (res) => {
        if (res.confirm) {
          await this.sendCreateActivity()
        }
      }
    })
  }
})
