const app = getApp();
const util = require("../../../utils/util.js");
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
    he : [],
    imgUrls:[],
    swiperheight: 90,//swiper页面高度
  },
  onLoad: function (options) {
    var that = this;
    that.data.relationId = options.id
    console.log(options)
  },
  onShow: function(){
    if(this.data.relationId != ''){
      console.log('[wangpan.js] [onShow] [openid] =>', wx.getStorageSync('openid'))
      console.log('[wangpan.js] [onShow] [relationId] =>', this.data.relationId)
      this.onGetwangpanlist().then(res =>{
        console.log(res)
      });
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
    return new Promise(function (resolve, reject){
      console.log('[wangpan.js] [onGetwangpanlist] [当前relationId] =>', that.data.relationId),
        db.collection('wangpan_list').where({ relationId: that.data.relationId }).get().then(res => {
          console.log('[wangpan.js][onGetwangpanlist][list] =>', res)
          if (res.data.length > 0) {
            that.setData({
              showData: res.data[0].filesList,
              sharefolders: res.data[0].sharefolders
            })
            app.globalData.repositories = res.data[0].filesList;
            app.globalData.sharefolders = res.data[0].sharefolders;
            console.log('[wangpan.js][onGetwangpanlist][app.globalData.repositories] =>', app.globalData.repositories)
            console.log('[wangpan.js][onGetwangpanlist][app.globalData.sharefolders] =>', app.globalData.sharefolders)
            that.gethe();
          } else {
            console.log('[wangpan.js] [当前页为 空]]')
            app.globalData.repositories = '';
            app.globalData.sharefolders = '';
          }
        })
    })
    
  },

  //列表样式
  gethe() {
    const hee = new Array();
    const urls = new Array();
    if (this.data.showData.length == 10) {
      this.setData({
        swiperheight: 98
      })
    }
    if (this.data.showData.length > 10) {
      this.setData({
        swiperheight: 98 + (this.data.showData.length - 10) * 9
      })
    }
    for (let i = 0; i < this.data.showData.length; ++i) {
      hee.push(2 + i * 9);
      if (this.data.showData[i].fileType == 'image') {
        urls.push(this.data.showData[i].iconUrl)
      }
    }
    console.log('[wangpan.js][gethe][hee] =>', hee)
    this.setData({
      he: hee,
      imgUrls: urls
    })
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
              console.log('[选择图片] =>', res)
              wx.showLoading({
                title: '上传中',
              })
              const filePath = res.tempFiles

              for (let i = 0; i < filePath.length; ++i) {
                filesdata.push({
                  filename: filePath[i].path.substring(filePath[i].path.length - 13),
                  filetype: 'image',
                  path: filePath[i].path,
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
                      relationId: ''
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
                console.log('"[上传文件] [文件上传错误] =>', res)
              })
            },
          })
        } else if (res.tapIndex === 2) {
          wx.chooseVideo({
            sourceType: ['album', 'camera'],
            maxDuration: 60,
            camera: 'back',
            success(res) {
              console.log('[选择视频] =>', res)
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
                      relationId: ''
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
                console.log('"[上传文件] [文件上传错误] =>', res)
              })

            }
          })
        } else if (res.tapIndex === 3) {
          wx.chooseMessageFile({
            count: 9,
            type: 'all',
            success: res => {
              console.log('选择文件之后的res', res)
            
              wx.showLoading({
                title: '上传中',
              })
              const filePath = res.tempFiles

              for (let i = 0; i < filePath.length; ++i) {
                var filetype;
                var filename;
                var path;
                if (filePath[i].type == 'image') {
                  filetype = 'image';
                  filename = filePath[i].name.substring(filePath[i].name.length - 13);
                  path = filePath[i].path;
                } else if (filePath[i].type == 'video') {
                  filetype = 'video';
                  filename = filePath[i].name.substring(filePath[i].name.length - 13);
                  path = filePath[i].path;
                } else {
                  filename = filePath[i].name;
                  filetype = filePath[i].path.match(/\.(\S*)/)[1];
                  path = "/images/default/" + filePath[i].path.match(/\.(\S*)/)[1] + ".svg";
                }
                filesdata.push({
                  filename: filename,
                  filetype: filetype,
                  path: path,
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
                      relationId: ''
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
//add 文件夹
  formSubmit(e) {
    var that = this;
    if (e.detail.index == 1) {
      const ctime = "" + (new Date()).valueOf() + wx.getStorageSync('openid');
      // const rel = app.globalData.relationIdArray[app.globalData.relationIdArray.length - 1]
      const rel = that.data.relationId
      console.log('[index.js] [add 文件夹 relationId] =>',rel)
      let foldersName = that.data.inputValue;
      console.log('[index.js] [add 文件夹 name] =>', foldersName)
      var puu;
      if (app.globalData.repositories != '') {
        puu = app.globalData.repositories;
      } else {
        puu = [];
      }
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
        })
        console.log('[wangpan.js] [云函数] [wangpan_list-add] data=>',puu,rel)
        wx.cloud.callFunction({
          name: 'wangpan_list-add',
          data:{
            repositories: puu,
            createTime: util.formatTime(new Date()),
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
          },
        })
        that.setData({
          dialogShow: false,
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
    var that = this;
    var puu;
    var puuu;
    if (app.globalData.repositories != ''){
      puu = app.globalData.repositories;
    }else{
      puu = [];
    }
    puuu = puu.concat(filesdata);
    const rel = this.data.relationId;
    console.log('[wangpan.js] [云函数] [wangpan_list-add] [add 图片数据] =>',puuu,rel)
    wx.cloud.callFunction({
      // 云函数名称
      name: 'wangpan_list-add',
      // 传给云函数的参数
      data: {
        repositories: puuu,
        createTime: util.formatTime(new Date()),
        relationId: rel
      },
      success: res => {
        console.log('[addfilesdata] success=>',res)
        that.setData({
          showData: puuu
        })
        app.globalData.repositories = puuu;
        that.gethe();
        console.log('[云函数] [wangpan_list-add] [数据更新]=>', that.data.showData)
      },
      fail: res => {
        console.log(res)
      }
    })
  },

  //查看图片
  previewImage: function (current, urls) {
    console.log('[查看图片] => ', current, urls)
    wx.previewImage({
      current: current, // 当前显示图片的http链接
      urls: urls // 需要预览的图片http链接列表
    })
  },

  //监听文件列表
  setfileListId: function (e) {
    var current;
    var urls;
    console.log(e.currentTarget.id)
    if (app.globalData.repositories[e.currentTarget.id].fileType == 'folder') {
      wx.navigateTo({
        url: '/pages/wangpan/index/index?id=' + app.globalData.repositories[e.currentTarget.id].relationId
      })
    } else if (app.globalData.repositories[e.currentTarget.id].fileType == 'image') {
      current = app.globalData.repositories[e.currentTarget.id].iconUrl;
      urls = this.data.imgUrls;
      console.log('[查看图片] [current] [urls] =>', current, urls)
      this.previewImage(current, urls);
    } else {
      wx.showToast({
        title: '暂未开放',
        icon: 'none',
        duration: 2000
      })
    }
  },

  
 
  keyInput(e) {
    this.setData({ inputValue: e.detail.value })
  },
 

})

