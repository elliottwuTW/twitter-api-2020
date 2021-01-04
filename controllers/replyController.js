const { Reply, User } = require('../models')

const helpers = require('../_helpers')

module.exports = {
  createReply: async (req, res, next) => {
    try {
      const comment = req.body.comment.trim()
      await Reply.create({
        comment,
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id
      })
      return res.json({
        status: 'success',
        message: '新增推文留言成功'
      })
    } catch (err) {
      next(err)
    }
  },
  getReply: async (req, res, next) => {
    try {
      const reply = await Reply.findByPk(req.params.id, { include: [User] })
      return res.json(reply)
    } catch (err) {
      next(err)
    }
  },
  getReplies: async (req, res, next) => {
    try {
      const replies = await Reply.findAll({
        where: { TweetId: req.params.id },
        include: [User],
        order: [['updatedAt', 'DESC']]
      })

      return res.json(replies)
    } catch (err) {
      next(err)
    }
  },
  updateReply: async (req, res, next) => {
    try {
      const reply = await Reply.findByPk(req.params.id)

      if (reply.UserId !== helpers.getUser(req).id) {
        return res.json({ status: 'error', message: ['使用者非留言作者，無權限更新'] })
      }

      const comment = req.body.comment
      await reply.update({ comment })
      return res.json({
        status: 'success',
        message: '更新留言成功'
      })
    } catch (err) {
      next(err)
    }
  },
  deleteReply: async (req, res, next) => {
    try {
      const reply = await Reply.findByPk(req.params.id)

      if (reply.UserId !== helpers.getUser(req).id) {
        return res.json({ status: 'error', message: ['使用者非留言作者，無法刪除'] })
      }

      await reply.destroy()
      return res.json({
        status: 'success',
        message: '刪除留言成功'
      })
    } catch (err) {
      next(err)
    }
  }
}
