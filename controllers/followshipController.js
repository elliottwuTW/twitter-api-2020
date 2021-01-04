const { Followship } = require('../models')

const helpers = require('../_helpers')

module.exports = {
  createFollowship: async (req, res, next) => {
    try {
      // userId is in the req.body
      const id = req.body.id

      if (String(id) === String(helpers.getUser(req).id)) {
        return res.json({ status: 'error', message: ['不能追蹤自己'] })
      }

      await Followship.create({ followerId: helpers.getUser(req).id, followingId: id })
      return res.json({
        status: 'success',
        message: '追蹤成功'
      })
    } catch (err) {
      next(err)
    }
  },
  deleteFollowship: async (req, res, next) => {
    try {
      const followship = await Followship.findOne({
        where: { followerId: helpers.getUser(req).id, followingId: req.params.id }
      })
      await followship.destroy()
      return res.json({
        status: 'success',
        message: '取消追蹤成功'
      })
    } catch (err) {
      next(err)
    }
  }
}
