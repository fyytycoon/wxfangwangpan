// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'hezuidema-vh7b2'
})
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const pro = await db.collection('user_info').where({_openid: event.openid}).get();
    if(pro.data.length>0){ //说明数据已存在
      console.log(event.openid+"openid[user_info]数据已存在")
    }else{
      console.log("event.system =>" + event.system)
      await db.collection('user_info').add({
        // data 字段表示需新增的 JSON 数据
        data: {
          _openid: event.openid,
          nick_name: event.nick_name,
          gender: event.gender,
          language: event.language,
          city: event.city,
          province: event.province,
          avatar_url: event.avatar_url,
          country: event.country,
          dz: event.dz,
          createTime: event.createTime,
          brand: event.brand,//设备品牌
          model: event.model,//设备型号
          version: event.version,//微信版本号
          system: event.system,//操作系统及版本
          relationId: event.relationId,//关联文件id
        }
      })
    }
    if(event.dz==-1){
      const cons = await db.collection('wangpan_list').where({ relationId: event.relationId }).get();
      if (cons.data.length > 0) {//说明数据已存在
        console.log(event.relationId + "relationId[wangpan_list]数据已存在")
        return 1;
      }else{
        const ctime = "" + (new Date()).valueOf() + event.openid
        await db.collection('wangpan_list').add({
          // data 字段表示需新增的 JSON 数据
          data: {
            relationId: event.relationId,
            createtime: event.createtime,
            filesList: [{
              fileType: event.repositories[0].fileType,
              foldersName: event.repositories[0].foldersName,
              iconUrl: event.repositories[0].iconUrl,
              createTime: event.repositories[0].createTime,
              fileSize:'',
              fileID:'',
              relationId: ctime,
              extras: '',
              localStorageTime: '',
            }],
            sharefolders: []
          }
        })
      }
      
    }
    return 0;
  } catch (e) {
    console.error(e)
  }
}