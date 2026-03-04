const app = getApp()
const baseUrl = app.globalData.baseUrl
import * as util from "../../../utils/util"

Component({
  data: {
  },
  properties: {
    active: {
      type: String
    }
  },
  methods: {
    navToPage(e) {
      let pageName = e.detail
      this.setData({
        active: e.detail
      })
      if (pageName == "home") {
        util.route("/pages/page_home/page_home", 0, 1)
      }
      else if (pageName == "create") {
        util.route("/pages/page_activity/create/create", 0, 1)
      }
      else if (pageName == "me") {
        util.route("/pages/page_me/page_me", 0, 1)
      }
    }
  },
  lifetimes: {
    attached() {
      this.setData({
        active: this.properties.active
      })
    }
  }
})
