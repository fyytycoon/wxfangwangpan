const app = getApp();
const util = require("../../utils/util.js");
const db = wx.cloud.database()
const _ = db.command
Page({
  data: {
    openid:'',
    Loading: 0,
    user_info: '',//用户信息
    color: app.ext.color,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    index:0,//导航栏
    fileListId:'',//列表下标
    inputValue: '',
    dialogShow: false,
    buttons: [{ text: '取消' }, { text: '确定' }],
    error: '',
    relationId: [],//文件关联id
    showData : [],//网盘文件 显示 array
    sharefolders : [],//共享文件 
    he: [],//列表各行高度
    swiperheight: 90,//swiper页面高度
    imgUrls: [],
    current: 'tab1',
        tabs: [
            {
                key: 'tab1',
                title: '网盘文件'
                
            },
            {
                key: 'tab2',
                title: '共享文件'
            },
            {
                key: 'tab3',
                title: '—我—'
            },
        ],
  },
  onLoad: function () {
    var that = this;

    if (app.globalData.userInfo!='') {
      that.setData({
        user_info: app.globalData.userInfo,
      })
      console.log('[index.js] app.globalData.userInfo =>', app.globalData.userInfo)
    } else if (that.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        that.setData({
          user_info: res.userInfo,
        })
      }
      console.log('[index.js] that.data.canIUse =>', that.data.canIUse)
    } else {
      wx.navigateTo({
        url: '/pages/wangpan/login/index'
      })
    }
    console.log("[index.js] [onload] =>"+ that.data.user_info)
    if (wx.getStorageSync('openid') != '') {
      console.log('[index.js] [onload] [openid] =>', wx.getStorageSync('openid'))
      this.setData({
        openid: wx.getStorageSync('openid')
      })
    }
  },
  onShow: function(){
    if(app.globalData.userInfo != ''){
      this.setData({
        user_info: app.globalData.userInfo,
      })
    }
    console.log('[index.js] [onShow] [app.globalData.userInfo] =>', app.globalData.userInfo)
    if(wx.getStorageSync('openid') != ''){
      console.log('[index.js] [onShow] [onGetwangpanlist] =>', wx.getStorageSync('openid'))
      this.onGetwangpanlist().then(res =>{
        console.log(res)
      });
    }
  },
  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: function () {
    
  },

  onGetUserInfo: function (e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        // avatarUrl: e.detail.userInfo.avatarUrl,
        user_info: e.detail.userInfo
      })
    }
  },
  //下拉刷新
  onPullDownRefresh: function () {
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 600)
  },

  //查找wangpam_list
  onGetwangpanlist: function(){
    var that = this;
    return new Promise(function (resolve, reject) {
      db.collection('user_info').where({ _openid: wx.getStorageSync('openid') }).get().then(res1 => {
        console.log('[index.js] [当前relationId] =>', res1.data[0].relationId)
        that.setData({
          relationId: res1.data[0].relationId
        })
        db.collection('wangpan_list').where({ relationId: res1.data[0].relationId }).get().then(res => {
          console.log('[index.js][onGetwangpanlist][list] =>', res)
          if (res.data[0].filesList.length > 0) {
            let flist = res.data[0].filesList;
            that.setData({
              showData: flist,
              sharefolders: res.data[0].sharefolders,
            })
            app.globalData.repositories = flist;
            app.globalData.sharefolders = res.data[0].sharefolders;
            console.log('[index.js][onGetwangpanlist][app.globalData.repositories] =>', app.globalData.repositories)
            console.log('[index.js][onGetwangpanlist][app.globalData.sharefolders] =>', app.globalData.sharefolders)
            that.gethe();
          } else {
            this.setData({
              showData: [{
                fileType: "file-s-0",
                foldersName: "我的资源",
                iconUrl: "/images/default/file-s-0.svg",
                createTime: '',
              }],
              sharefolders: []
            })
          }
        })

      })
    })
  },

  manmanjiazai:function(){
    var flist = this.data.showData;
    var i = 0;
    const urls = new Array(); 
    let showlist = new Array();
    for (const index of flist) {
      if (index.fileType == 'image') {
        urls.push(index.fileID)
      }
      if (index.fileType == 'image' && index.iconUrl.substring(0, 5) != 'https') {
        i = i+1;
        this.getTempFileURL(index.fileID).then(res1 => {
          console.log(res1)
          if (res1.errMsg == 'cloud.getTempFileURL:ok') {
            index.iconUrl = res1.fileList[0].tempFileURL
          }
        })
      }
    }
    this.setData({
      showData: flist,
      imgUrls: urls
    })
    console.log('[慢慢加载] =>', this.data.showData,i)
    app.globalData.repositories = flist;
    const rep = flist;
    setTimeout(() => {
      if (i != 0) {
        wx.cloud.callFunction({
          // 云函数名称
          name: 'wangpan_list-add',
          // 传给云函数的参数
          data: {
            repositories: rep,
            relationId: this.data.relationId
          }
        }).then(res => {
          console.log('[慢慢加载] [更新数据]]', rep)
        })
      }
    }, 1000)
    
  },

  //列表样式
  gethe(){
    const hee = new Array();
   
    if (this.data.showData.length == 10){
      this.setData({
        swiperheight: 98
      })
    }
    if (this.data.showData.length > 10){
      this.setData({
        swiperheight: 98 + (this.data.showData.length -10) * 9
      })
    }
    for (let i = 0; i < this.data.showData.length; ++i) {
      hee.push(2 + i * 9);
      
    }
    console.log('[index.js][gethe][hee] =>', hee)
    this.setData({
      he : hee,
    })
    setTimeout(() => {
      this.manmanjiazai();
    }, 2500)
  },

//下拉选项卡
  showActionSheet1() {
    let that = this
    const filesdata = new Array();
    const addfilesdata = new Array();
    wx.showActionSheet({
      itemList: ['新建文件夹', '本地图片', '本地视频', '聊天文件'],
      itemColor: '#007aff',
      success(res) {
        console.log(res);
        if (res.tapIndex === 0) {
          that.setData({
            dialogShow: true
          })
        } else if (res.tapIndex === 1) {
          wx.chooseImage({
            count: 9, // 设置最多9张
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
              console.log('[选择图片] =>',res)
              wx.showLoading({
                title: '上传中',
              })
              const filePath = res.tempFiles

              for (let i = 0; i < filePath.length; ++i){
                filesdata.push({
                  filename: filePath[i].path.substring(filePath[i].path.length - 13),
                  filetype: 'image',
                  path: filePath[i].path,
                  size: filePath[i].size,
                })
              }
              console.log('[文件上传] [filesdata 数据] =>',filesdata)
              // 并发上传文件
              const uploadTasks = filesdata.map(item => that.uploadFile(item.path,item.filename,item.filetype))
              Promise.all(uploadTasks).then(result => {
                console.log("[上传文件] [result的值] =>", result)
                wx.hideLoading()
                
                for (let i = 0; i < result.length; ++i) {
                  if(result[i].statusCode == 200){
                    addfilesdata.push({
                      foldersName: filesdata[i].filename,
                      fileType: filesdata[i].filetype,
                      iconUrl: filesdata[i].path,
                      fileSize: filesdata[i].size,
                      fileID: result[i].fileID,
                      createTime: util.formatTime(new Date()),
                      extras: '',
                      relationId: '',
                      localStorageTime: new Date().valueOf().toString()
                    })
                  }
                }
                that.addfilesdata(addfilesdata);
                wx.showToast({
                  title: '成功',
                  icon: 'success',
                  duration: 2000
                })
              }).catch(res => {
                wx.hideLoading()
                wx.showToast({ title: '文件上传错误', icon: 'error' })
                console.log('"[上传文件] [文件上传错误] =>',res)
              })
            },
          })
        } else if (res.tapIndex === 2) {
          wx.chooseVideo({
            sourceType: ['album', 'camera'],
            maxDuration: 60,
            camera: 'back',
            success(res) {
              console.log('[选择视频] =>',res)
              wx.showLoading({
                title: '上传中',
              })
            
              filesdata.push({
                filename: res.tempFilePath.substring(res.tempFilePath.length - 13),
                filetype: 'video',
                path: res.tempFilePath,
                size: res.size,
              })
              
              console.log('[文件上传][视频] [filesdata 数据] =>', filesdata)
              // 并发上传文件
              const uploadTasks = filesdata.map(item => that.uploadFile(item.path, item.filename, item.filetype))
              Promise.all(uploadTasks).then(result => {
                console.log("[上传文件] [视频] [result的值] =>", result)
                wx.hideLoading()
                
                for (let i = 0; i < result.length; ++i) {
                  if (result[i].statusCode == 200) {
                    addfilesdata.push({
                      foldersName: filesdata[i].filename,
                      fileType: filesdata[i].filetype,
                      iconUrl: filesdata[i].path,
                      fileSize: filesdata[i].size,
                      fileID: result[i].fileID,
                      createTime: util.formatTime(new Date()),
                      extras: '',
                      relationId: '',
                      localStorageTime: new Date().valueOf().toString()
                    })
                  }
                }
                that.addfilesdata(addfilesdata);
                wx.showToast({
                  title: '成功',
                  icon: 'success',
                  duration: 2000
                })
              }).catch(res => {
                wx.hideLoading()
                wx.showToast({ title: '文件上传错误', icon: 'none' })
                console.log('"[上传文件] [文件上传错误] =>', res)
              })

            }
          })
        } else if(res.tapIndex === 3){
          wx.chooseMessageFile({
            count: 9,
            type: 'all',
            success: res => {
              console.log('选择文件之后的res', res)
              // let tempFilePaths = res.tempFiles
              // for (const tempFilePath of tempFilePaths) {
              //   items.push({
              //     src: tempFilePath.path,
              //     name: tempFilePath.name
              //   })
              // }
              // this.setData({ filesNew: items })
              // console.log('选择文件之后的items', this.data.filesNew)
              wx.showLoading({
                title: '上传中',
              })
              const filePath = res.tempFiles

              for (let i = 0; i < filePath.length; ++i) {
                var filetype;
                var filename;
                var path;
                if (filePath[i].type == 'image'){
                  filetype = 'image';
                  filename = filePath[i].name.substring(filePath[i].name.length - 13);
                  path = filePath[i].path;
                }else if (filePath[i].type == 'video') {
                  filetype = 'video';
                  filename = filePath[i].name.substring(filePath[i].name.length - 13);
                  path = filePath[i].path;
                }else{
                  filename = filePath[i].name;
                  filetype = filePath[i].path.match(/\.(\S*)/)[1];
                  path = "/images/default/" + filePath[i].path.match(/\.(\S*)/)[1] + ".svg";
                }
                filesdata.push({
                  filename: filename,
                  filetype: filetype,
                  path:path,
                  size: filePath[i].size,
                })
              }
              console.log('[文件上传] [filesdata 数据] =>', filesdata)
              // 并发上传文件
              const uploadTasks = filesdata.map(item => that.uploadFile(item.path, item.filename, item.filetype))
              Promise.all(uploadTasks).then(result => {
                console.log("[上传文件] [result的值] =>", result)
                
                wx.hideLoading()
                
                for (let i = 0; i < result.length; ++i) {
                  if (result[i].statusCode == 200) { 
                    addfilesdata.push({
                      foldersName: filesdata[i].filename,
                      fileType: filesdata[i].filetype,
                      iconUrl: filesdata[i].path,
                      fileSize: filesdata[i].size,
                      fileID: result[i].fileID,
                      createTime: util.formatTime(new Date()),
                      extras: '',
                      relationId: '',
                      localStorageTime: new Date().valueOf().toString()
                    })
                  }
                }
                that.addfilesdata(addfilesdata);
                wx.showToast({
                  title: '成功',
                  icon: 'success',
                  duration: 2000
                })
              }).catch(res => {
                wx.hideLoading()
                wx.showToast({ title: '文件上传错误', icon: 'none' })
                console.log('"[上传文件] [文件上传错误] =>', res)
              })
            }
          })
        }
      }
    })
  },

  //上传文件
  uploadFile: function (filePath , filename, filetype){
    const cloudPath = "wangpan/" + wx.getStorageSync('openid') + "/" + filename
    return wx.cloud.uploadFile({
      cloudPath,
      filePath ,
    })
  },
  //换取真实链接
  getTempFileURL: function(fileidlist){
    return wx.cloud.getTempFileURL({
      fileList: [fileidlist]
    })
  },
  
  //查看图片
  previewImage: function (current,urls) {
    console.log('[查看图片] => ', current,urls)
    wx.previewImage({
      current: current, // 当前显示图片的http链接
      urls: urls // 需要预览的图片http链接列表
    })
  },

//add 文件夹
  formSubmit(e) {
    var that = this;
    if (e.detail.index == 1) {
      const ctime = "" + (new Date()).valueOf() + wx.getStorageSync('openid');
      // const rel = app.globalData.relationIdArray[app.globalData.relationIdArray.length - 1]
      const rel = this.data.relationId
      console.log('[index.js] [add 文件夹 relationId] =>',rel)
      let foldersName = this.data.inputValue;
      console.log('[index.js] [add 文件夹 name] =>', foldersName)
      const puu = app.globalData.repositories
      if (!!foldersName) {
        puu.push({
          fileType: "folder",
          foldersName: foldersName,
          iconUrl: "/images/default/folder.svg",
          createTime: util.formatTime(new Date()),
          fileSize: '',
          fileID: '',
          relationId: ctime,
          extras: '',
          localStorageTime: ''
        })
        console.log('[index.js] [云函数] [wangpan_list-add] data=>',puu,rel)
        wx.cloud.callFunction({
          name: 'wangpan_list-add',
          data:{
            repositories: puu,
            relationId: rel
          },
          success: res => {
            console.log(res)
            // setTimeout(function () {
            //   that.onGetwangpanlist().then(res => {
            //     console.log(res)
            //   })
            // }, 2000)
            that.setData({
              showData: puu
            })
            app.globalData.repositories = puu
            that.gethe();
            console.log('[云函数] [wangpan_list-add] [数据更新]=>', that.data.showData)
          },
          fail: res =>{
            console.log(res)
          }
        })
        that.setData({
          dialogShow: false,
        })
        wx.showToast({
          title: '成功',
          icon: 'success',
          duration: 2000
        })
        
      } else {
        this.setData({
          error: '文件夹名不能为空'
        })
      }
    } else {
      this.setData({
        dialogShow: false,
      })
    }

  },
//add filesdata
  addfilesdata: function(filesdata){
    const puu = app.globalData.repositories;
    const puuu = puu.concat(filesdata);
    const rel = this.data.relationId;
    var that = this;
    console.log('[云函数] [wangpan_list-add] [add 数据] =>',puuu)
    wx.cloud.callFunction({
      // 云函数名称
      name: 'wangpan_list-add',
      // 传给云函数的参数
      data: {
        repositories: puuu,
        relationId: rel
      },
      success: res => {
        console.log(res)
        // setTimeout(function () {
        //   that.onGetwangpanlist().then(res => {
        //     console.log(res)
        //   })
        // }, 2000)
        that.setData({
          showData: puuu
        })
        app.globalData.repositories = puuu
        that.gethe();
        console.log('[云函数] [wangpan_list-add] [数据更新]=>',that.data.showData)
      },
      fail: res => {
        console.log(res)
      }
    })
  },
  
  //监听文件列表
  setfileListId: function(e){
    var current;
    var urls;
    console.log(e.currentTarget.id)
    if (app.globalData.repositories[e.currentTarget.id].fileType == 'folder'){
      wx.navigateTo({
        url: '../wangpan/index/index?id=' + app.globalData.repositories[e.currentTarget.id].relationId
      })
    }else if (app.globalData.repositories[e.currentTarget.id].fileType == 'image'){
      current = app.globalData.repositories[e.currentTarget.id].fileID;
      urls = this.data.imgUrls;
      console.log('[查看图片] [current] [urls] =>',current,urls)
      this.previewImage(current, urls);
    } else if (app.globalData.repositories[e.currentTarget.id].fileType == 'video') {
      this.onOpen1();
    }else{
      wx.showToast({
        title: '暂未开放',
        icon: 'none',
        duration: 2000
      })
    }
  },

  //监听滑块
  bindchange(e) {
    console.log(this.data.tabs[e.detail.current].key)
    var key = this.data.tabs[e.detail.current].key;
    if(key == 'tab3'){
      this.setData({
        swiperheight: 90
      })
    }
    if (key == 'tab1') {
      this.gethe();
    }
    this.setData({
      key : this.data.tabs[e.detail.current].key,
      index: e.detail.current,
    })
  },
  // 导航栏点击事件
  onTabsChange(e) {
    console.log('[index.js] [导航栏点击事件] onTabsChange', e)
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)
    this.setData({
        key,
        index,
    })
  },

  keyInput(e) {
    this.setData({ inputValue: e.detail.value })
  },
  onOpen1() {
    this.setData({
      visible1: true,
    })
  },
  
  onClose1() {
    this.setData({
      visible1: false,
    })
  },

})

