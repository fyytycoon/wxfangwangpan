//index.js
//获取应用实例
const util = require("../../../utils/util.js");
const app = getApp();

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    color: app.ext.color,
    logged: false,
    head_img: "../../../images/1.jpg",
    nick_name: "醉酒的xoxo马",
    brand: '',//设备品牌
    model: '',//设备型号
    version: '',//微信版本号
    system: ''//操作系统及版本
  },
  onLoad: function () {
    var that = this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
            brand : res.brand,//设备品牌
            model : res.model,//设备型号
            version : res.version,//微信版本号
            system : res.system//操作系统及版本
        })
      },
    })
  },
  onBack:function(e){
    wx.navigateBack();
  },
  onGetUserInfo: function (e) {
    console.log('[login.js] [getuserinfo] =>',e)
    if (!this.logged && e.detail.userInfo) {
      const ctime = "" + (new Date()).valueOf() + wx.getStorageSync('openid')
      wx.cloud.callFunction({
        // 云函数名称
        name: 'user-add',
        // 传给云函数的参数
        data: {
          nick_name: e.detail.userInfo.nickName,
          gender: e.detail.userInfo.gender,
          language: e.detail.userInfo.language,
          city: e.detail.userInfo.city,
          province: e.detail.userInfo.province,
          avatar_url: e.detail.userInfo.avatarUrl,
          country: e.detail.userInfo.country,
          createTime: util.formatTime(new Date()),
          openid: wx.getStorageSync('openid'),
          brand: this.data.brand,//设备品牌
          model: this.data.model,//设备型号
          version: this.data.version,//微信版本号
          system: this.data.system,//操作系统及版本
          repositories: app.globalData.repositories,
          relationId: ctime,
          localStorageTime:'',
          dz: -1
        },
        complete: res => {
          app.globalData.userInfo = e.detail.userInfo;
          wx.navigateBack();
          console.log('[login.js][user-add] =>', res)
          console.log('[login.js][app . userInfo] =>', app.globalData.userInfo)
        }
      })
    } else {
      wx.reLaunch({
        url: '/pages/login/index',
        fail: res => {
          console.log(res);
        }
      })
    }
  }
})