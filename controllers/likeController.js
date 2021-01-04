const { Like } = require('../models')

const helpers = require('../_helpers')

module.exports = {
  createLike: async (req, res, next) => {
    try {
      await Like.create({ UserId: helpers.getUser(req).id, TweetId: req.params.id })
      return res.json({
        status: 'success',
        message: '推文按讚成功'
      })
    } catch (err) {
      next(err)
    }
  },
  deleteLike: async (req, res, next) => {
    try {
      const like = await Like.findOne({
        where: { UserId: helpers.getUser(req).id, TweetId: req.params.id }
      })

      await like.destroy()
      return res.json({
        status: 'success',
        message: '取消推文按讚成功'
      })
    } catch (err) {
      next(err)
    }
  }
}
