const imgur = require('imgur-node-api')
imgur.setClientID(process.env.IMGUR_CLIENT_ID)

module.exports = (filePath) => {
  return new Promise((resolve, reject) => {
    imgur.upload(filePath, (err, img) => {
      if (err) {
        reject(err)
      }
      if (img) {
        resolve(img.data.link)
      }
    })
  })
}
