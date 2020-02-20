// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'hezuidema-vh7b2'
})
const db = cloud.database()//链接数据库
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try{
    await db.collection('wangpan_list').where({ relationId: event.relationId }).get().then(res =>{
      if(res.data.length == 0){
        console.log('[wangpan_list] [add] =>', event.relationId, event.createTime, event.repositories)
        return db.collection('wangpan_list').add({
          data:{
            relationId: event.relationId,
            createTime: event.createTime,
            filesList: event.repositories,
            sharefolders: []
          }
        })
      }else{
        console.log('[wangpan_list] [update] =>', event.relationId, event.createTime, event.repositories)
        return db.collection('wangpan_list').where({ relationId: event.relationId }).update({
          data: {
            filesList: _.set(event.repositories)
          }
        })
      }
    })
    
  } catch (e) {
    console.error(e)
  }

}