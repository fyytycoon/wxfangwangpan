let app = getApp()

Page({
  data: {
    currentTab: 0,
    items: [
      {
        "iconPath": "/pages/img/index2.png",
        "selectedIconPath": "/pages/img/index1.png",
        "text": "首页"
      },
      {
        "iconPath": "/pages/img/car2.png",
        "selectedIconPath": "/pages/img/car1.png",
        "text": "购物车"
      },
      {
        "iconPath": "/pages/img/my2.png",
        "selectedIconPath": "/pages/img/my1.png",
        "text": "我的"
      }
    ]
  },
  swichNav: function (e) {
    console.log(e)
    let that = this;
    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab: e.target.dataset.current
      })
    }
  },
  onLoad: function (option) {

  }
})
