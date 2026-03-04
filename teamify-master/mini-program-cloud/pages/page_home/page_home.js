const app = getApp()
let util = require("../../utils/util")

Page({
  data: {
    activities: [],
    myCreated: [],
    myParticipated: [],
    myActivities: [],
    userName: '',
    isLogin: false
  },
  async onShow() {
    await this.loadPublicActivities()
    await this.loadMyActivities()
  },
  async loadPublicActivities() {
    const res = await app.call({
      url: "/api/activity/get/pub"
    })
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
      this.setData({ activities })
    }
  },
  async loadMyActivities() {
    if (util.getToken() === '') {
      this.setData({ isLogin: false })
      return
    }
    try {
      await util.checkToken()
      const userRes = await app.call({ url: "/api/user/get/info" })
      if (!util.checkSuccess(userRes)) {
        this.setData({ isLogin: false })
        return
      }
      const user = userRes.data.obj
      this.setData({ isLogin: true })
      const actRes = await app.call({ url: "/api/activity/get/my" })
      if (util.checkSuccess(actRes)) {
        let list = actRes.data.obj || []
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
        this.setData({
          myCreated,
          myParticipated,
          myActivities,
          userName: user.uName || '用户'
        })
      }
    } catch (e) {
      this.setData({ isLogin: false })
    }
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