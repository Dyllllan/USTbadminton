const app = getApp()
const baseUrl = app.globalData.baseUrl
import * as util from "../../utils/util"

Page({
  data: {
    activities: [],
    myCreated: [],
    myParticipated: [],
    myActivities: [],
    userName: '',
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
          that.setData({ activities })
        }
      }
    })
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