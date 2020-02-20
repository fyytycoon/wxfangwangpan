//app.js
const util = require("/utils/util.js");
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'hezuidema-vh7b2',
        traceUser: true,
      })
    }

    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[app.js] [云函数] [login] user openid: ', res)
        this.globalData.openid = res.result.openid
        wx.setStorageSync("openid", res.result.openid);
        // 获取用户信息
        wx.getSetting({
          success: res1 => {
            console.log('[app.js] [getSetting] =>',res1)
            wx.cloud.database().collection('user_info').where({ _openid: res.result.openid }).get().then(res =>{
              console.log('[app.js] [pro.data] =>', res)
              if (res1.authSetting['scope.userInfo'] && res.data.length > 0) {
                // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                wx.getUserInfo({
                  success: res => {
                    this.globalData.userInfo = res.userInfo
                    // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                    // 所以此处加入 callback 以防止这种情况
                    if (this.userInfoReadyCallback) {
                      this.userInfoReadyCallback(res)
                    }
                    console.log('[app.js] [getuserinfo] =>', res)
                  }
                })
              } else {
                // TODO  跳转登录
                wx.navigateTo({
                  url: '/pages/wangpan/login/index'
                })
                console.log('[app.js]navigateto => login/index')
              }
            })
            
            
          }
        })
      },
      fail: err => {
        console.error('[app.js] [云函数] [login] 调用失败', err)
      }
    })
    

  },
  ext: {
    color: "#3D94FF"
  },
  globalData: {
    openid:'',
    userInfo:'',//用户信息
    relationIdArray:[],
    repositories:[{
      fileType: "folder",
      foldersName: "我的资源",
      iconUrl: "/images/default/file-s-0.svg",
      createTime: '',
      fileSize: '',
      fileID: '',
      extras: '',
      relationId:'',
      localStorageTime: ''
    }],//网盘文件
    sharefolders: []//共享文件
  },
  onGetOpenid() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[app.js] [云函数] [login] user openid: ', res)
        this.globalData.openid = res.result.openid
        wx.setStorageSync("openid", res.result.openid);
      },
      fail: err => {
        console.error('[app.js] [云函数] [login] 调用失败', err)
      }
    })
  },
})
