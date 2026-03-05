const app = getApp()
const baseUrl = app.globalData.baseUrl
import * as util from "../../utils/util"

const LEVEL_OPTIONS = ["初级", "中级", "高级", "不限"]
const VENUE_OPTIONS = ["LG1-court 1", "LG1-court 2", "LG1-court 3", "LG1-court 4", "LG1-court 5", "LG1-court 6", "Seafront-Court 1", "Seafront-Court 2"]
const TIME_SLOT_OPTIONS = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"]

Page({
  data: {
    activities: [],
    filteredActivities: [],
    dateOptions: [],
    searchKeyword: "",
    filterExpanded: false,
    filterLevel: "",
    filterVenue: "",
    filterTimeSlot: "",
    filterDate: "",
    levelOptions: LEVEL_OPTIONS,
    venueOptions: VENUE_OPTIONS,
    timeSlotOptions: TIME_SLOT_OPTIONS,
    myCreated: [],
    myParticipated: [],
    myActivities: [],
    userName: "",
    isLogin: false
  },
  onShow() {
    this.loadPublicActivities()
    this.loadMyActivities()
  },
  loadPublicActivities() {
    let that = this
    wx.request({
      url: `${baseUrl}/api/activity/get/pub`,
      success(res) {
        if (util.checkSuccess(res)) {
          let activities = res.data.obj || []
          const now = Date.now()
          activities = activities.map(a => {
            a.aEndDateShow = util.getFormatTimeByMillis(a.aEndDate)
            if (a.aDate) a.aDateShow = util.getFormatTimeByMillis(a.aDate)
            if (parseInt(a.aEndDate) < now) {
              a.aName = a.aName + " (已结束)"
            }
            return a
          })
          const dateOptions = [...new Set(activities.map(a => a.aDateShow || a.aEndDateShow).filter(Boolean))].sort()
          that.setData({ activities, dateOptions }, () => that.applyFilters())
        }
      }
    })
  },
  onSearchChange(e) {
    this.setData({ searchKeyword: e.detail || "" }, () => this.applyFilters())
  },
  toggleFilter() {
    this.setData({ filterExpanded: !this.data.filterExpanded })
  },
  onFilterTap(e) {
    const { type, value } = e.currentTarget.dataset
    const key = `filter${type.charAt(0).toUpperCase() + type.slice(1)}`
    const current = this.data[key]
    const next = current === value ? "" : value
    this.setData({ [key]: next }, () => this.applyFilters())
  },
  applyFilters() {
    const { activities, searchKeyword, filterLevel, filterVenue, filterTimeSlot, filterDate } = this.data
    let list = activities.filter(a => {
      if (searchKeyword && !(a.aName || "").toLowerCase().includes((searchKeyword || "").toLowerCase())) return false
      if (filterLevel && a.aLevel !== filterLevel) return false
      if (filterVenue && a.aVenue !== filterVenue) return false
      if (filterTimeSlot && a.aTimeSlot !== filterTimeSlot) return false
      const dateShow = a.aDateShow || a.aEndDateShow
      if (filterDate && dateShow !== filterDate) return false
      return true
    })
    list = list.sort((a, b) => {
      const da = a.aDate || a.aEndDate || "0"
      const db = b.aDate || b.aEndDate || "0"
      if (da !== db) return parseInt(da) - parseInt(db)
      const ta = (a.aTimeSlot || "").localeCompare(b.aTimeSlot || "")
      if (ta !== 0) return ta
      return (a.aVenue || "").localeCompare(b.aVenue || "")
    })
    this.setData({ filteredActivities: list })
  },
  loadMyActivities() {
    if (util.getToken() === '') {
      this.setData({ isLogin: false })
      return
    }
    let that = this
    util.checkToken().then(
      () => {
        wx.request({
          url: `${baseUrl}/api/user/get/info`,
          header: util.getAuthHeader(),
          success(res) {
            if (!util.checkSuccess(res)) {
              that.setData({ isLogin: false })
              return
            }
            const user = res.data.obj
            that.setData({ isLogin: true })
            wx.request({
              url: `${baseUrl}/api/activity/get/my`,
              header: util.getAuthHeader(),
              success(res2) {
                if (util.checkSuccess(res2)) {
                  let list = res2.data.obj || []
                  if (!Array.isArray(list)) list = []
                  const now = Date.now()
                  const myCreated = []
                  const myParticipated = []
                  list.forEach(a => {
                    a.aEndDateShow = util.getFormatTimeByMillis(a.aEndDate)
                    if (a.aDate) a.aDateShow = util.getFormatTimeByMillis(a.aDate)
                    if (parseInt(a.aEndDate) < now) {
                      a.aName = a.aName + " (已结束)"
                    }
                    if (a.aHolderId === (user.uId || user.uid)) {
                      a.role = '发布'
                      myCreated.push(a)
                    } else {
                      a.role = '参与'
                      myParticipated.push(a)
                    }
                  })
                  const myActivities = [...myCreated, ...myParticipated]
                  that.setData({
                    myCreated,
                    myParticipated,
                    myActivities,
                    userName: user.uName || '用户'
                  })
                }
              }
            })
          }
        })
      },
      () => {
        this.setData({ isLogin: false })
      }
    )
  },
  toCreateActivity() {
    util.route("/pages/page_activity/create/create")
  },
  viewActivity(e) {
    const aId = e.currentTarget.dataset.aid
    util.route(`/pages/page_activity/detail/detail?aId=${aId}&aType=1`)
  },
  goToMe() {
    util.route("/pages/page_me/page_me")
  },
  joinActivity(e) {
    const aId = e.currentTarget.dataset.aid
    util.route(`/pages/page_activity/detail/detail?aId=${aId}&aType=0`)
  }
})