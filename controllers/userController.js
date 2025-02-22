const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User, Tweet, Reply, sequelize, Sequelize } = require('../models/index')
const QueryTypes = Sequelize.QueryTypes
const helpers = require('../_helpers')

module.exports = {
  createUser: async (req, res, next) => {
    try {
      const { account, name, email, password } = req.body
      const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10))
      await User.create({ account, name, email, password: hash })
      return res.json({ status: 'success', message: '註冊成功' })
    } catch (err) {
      next(err)
    }
  },
  login: async (req, res, next) => {
    try {
      const { account, password } = req.body
      const user = await User.findOne({ where: { account } })
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ status: 'error', message: ['帳號或密碼錯誤'] })
      }

      const payload = { id: user.id }
      const token = jwt.sign(payload, process.env.JWT_SECRET)
      return res.json({
        status: 'success',
        message: '成功登入',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } catch (err) {
      next(err)
    }
  },
  getUsers: async (req, res, next) => {
    try {
      const users = await sequelize.query(`
        SELECT U.id, U.name, U.account, U.cover, U.avatar, IFNULL(F1.followingCount, 0) AS followingCount, IFNULL(F2.followerCount, 0) AS followerCount, IFNULL(T.tweetCount, 0) AS tweetCount, CAST(IFNULL(L.likedCount, 0) AS UNSIGNED) AS LikedCount
        FROM Users AS U

        LEFT JOIN (SELECT followerId, COUNT(followerId) AS followingCount FROM Followships GROUP BY followerId) AS F1
        ON F1.followerId = U.id

        LEFT JOIN (SELECT followingId, COUNT(followingId) AS followerCount FROM Followships GROUP BY followingId) AS F2
        ON F2.followingId = U.id

        LEFT JOIN (SELECT UserId, COUNT(UserId) AS tweetCount FROM Tweets GROUP BY UserId) AS T
        ON T.UserId = U.id

        LEFT JOIN (
        SELECT T.UserId, SUM(L.likeCount) AS likedCount
        FROM Tweets AS T
        LEFT JOIN (SELECT TweetId, COUNT(TweetId) AS likeCount FROM Likes GROUP BY TweetId) AS L
        ON T.id = L.TweetId
        GROUP BY T.UserId) AS L
        ON L.UserId = U.id;`, { type: QueryTypes.SELECT })
      res.json(users)
    } catch (err) {
      next(err)
    }
  },
  getTopUsers: async (req, res, next) => {
    try {
      const topUsers = await sequelize.query(`
        SELECT F.followingId, name,account,avatar, IF(isFollowed.followingId, true, false) AS isFollowed
        FROM Users AS U
        INNER JOIN (SELECT followingId, COUNT(followingId) AS followerCount FROM Followships WHERE followingId <> ${req.user.id} GROUP BY followingId LIMIT 10) AS F
        ON U.id = F.followingId
        LEFT JOIN (SELECT followingId FROM Followships WHERE followerId = ${req.user.id} ) AS isFollowed
        ON U.id = isFollowed.followingId
        ORDER BY F.followingId;`, { type: QueryTypes.SELECT })
      res.json(topUsers)
    } catch (err) {
      next(err)
    }
  },
  getUser: async (req, res, next) => {
    try {
      const user = await sequelize.query(`
        SELECT U.id,account,name,email,avatar,cover,introduction,role, IFNULL(a.followerCount,0) AS followerCount, IFNULL(b.followingCount,0) AS followingCount, IF(c.isFollowed, true, false) AS isFollowed, (SELECT COUNT(id) FROM Tweets WHERE Tweets.UserId = ${req.params.id}) AS tweetCount
        FROM Users AS U

        LEFT JOIN (
        SELECT followingId, COUNT(followingId) AS followerCount
        FROM Followships
        WHERE followingId = ${req.params.id}
        GROUP BY followingId) AS a
        ON a.followingId = U.id

        LEFT JOIN (
        SELECT followerId, COUNT(followerId) AS followingCount
        FROM Followships
        WHERE followerId = ${req.params.id}
        GROUP BY followerId) AS b
        ON b.followerId = U.id

        LEFT JOIN(
        SELECT followingId AS isFollowed
        FROM Followships
        WHERE followerId = ${helpers.getUser(req).id}
        ) AS c
        ON c.isFollowed = U.id

        WHERE U.id = ${req.params.id};`, { plain: true, type: QueryTypes.SELECT })

      if (user.role === 'admin') {
        return res.status(401).json({ status: 'error', message: ['Unauthorized'] })
      }
      delete user.role //not required on frontend
      return res.json(user)
    } catch (err) {
      next(err)
    }
  },
  getTweets: async (req, res, next) => {
    try {
      const user = await sequelize.query(`
          SELECT id,name,account,avatar FROM Users WHERE id=${req.params.id};`,
        { plain: true, type: QueryTypes.SELECT }
      )
      let tweets = await sequelize.query(`
          SELECT T.*, IFNULL(L.likedCount, 0) AS likedCount, IFNULL(R.repliedCount, 0) AS repliedCount, IF(IL.isLiked, true, false) AS isLiked
          FROM Tweets AS T
          LEFT JOIN (SELECT TweetId, COUNT(TweetId) AS likedCount FROM Likes GROUP BY TweetId) AS L
          ON L.TweetId = T.id
          LEFT JOIN (SELECT TweetId, COUNT(TweetId) AS repliedCount FROM Replies GROUP BY TweetId) AS R
          ON R.TweetId = T.id
          LEFT JOIN (SELECT TweetId AS isLiked FROM Likes WHERE UserId = ${helpers.getUser(req).id})AS IL
          ON IL.isLiked = T.id
          WHERE T.UserId = ${req.params.id}
          ORDER BY T.updatedAt DESC`,
        { type: QueryTypes.SELECT })

      tweets = tweets.map(t => ({
        user,
        ...t
      }))
      res.json(tweets)
    } catch (err) {
      next(err)
    }
  },
  updateUser: async (req, res, next) => { //編輯個人資料 name, avatar, introduction, cover
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      return res.json({ status: 'error', message: ['無權編輯'] })
    }
    const { name, introduction } = req.body
    if (!name.trim()) {
      return res.json({ status: 'error', message: ['名稱不能空白'] })
    }
    try {
      const user = await User.findByPk(req.params.id)
      /* if req.files object contains cover or avatar, upload the image file to imgur and get the link
       * The condition "req.files !== undefined" is for testing. Otherwise, it is not necessary. 
       */
      if (req.files !== undefined) {
        if (Object.keys(req.files).length) {
          const uploadToImgur = require('../utils/uploadToImgur')
          let [cover, avatar] = [user.cover, user.avatar]
          if (req.files.cover) {
            cover = await uploadToImgur(req.files.cover[0].path)
          }
          if (req.files.avatar) {
            avatar = await uploadToImgur(req.files.avatar[0].path)
          }
          await user.update({ name, introduction, cover, avatar })
          return res.json({ status: 'success', message: '修改成功' })
        }
      }
      //if req.files object is empty, update only name and introduction
      await user.update({ name, introduction })
      return res.json({ status: 'success', message: '修改成功' })
    } catch (err) {
      next(err)
    }
  },
  updateUserSetting: async (req, res, next) => { // 設定
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      return res.json({ status: 'error', message: ['無權編輯'] })
    }
    try {
      const { account, name, email, password } = req.body
      const user = await User.findByPk(req.params.id)
      const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10))
      await user.update({ account, name, email, password: hash })
      return res.json({ status: 'success', message: '修改成功' })
    } catch (err) {
      next(err)
    }
  },
  getFollowings: async (req, res, next) => {
    try {
      const followings = await sequelize.query(`
        SELECT F.followingId, U.name,U.account,U.avatar,U.introduction, IF(IFW.isFollowed, true, false) AS isFollowed
        FROM Followships AS F
        LEFT JOIN (SELECT id,name,account,avatar, introduction From Users) AS U
        ON U.id = F.followingId
        LEFT JOIN (SELECT followingId AS isFollowed FROM Followships WHERE followerId = ${helpers.getUser(req).id}) AS IFW
        ON IFW.isFollowed = F.followingId
        WHERE F.followerId = ${req.params.id}
        ORDER BY F.followingId;`, { type: QueryTypes.SELECT })
      return res.json(followings)
    } catch (err) {
      next(err)
    }
  },
  getFollowers: async (req, res, next) => {
    try {
      const followers = await sequelize.query(`
        SELECT F.followerId, U.name,U.account,U.avatar,U.introduction, IF(IFW.isFollowed, true, false) AS isFollowed
        FROM Followships AS F
        LEFT JOIN (SELECT id,name,account,avatar, introduction From Users) AS U
        ON U.id = F.followerId
        LEFT JOIN (SELECT followingId AS isFollowed FROM Followships WHERE followerId = ${helpers.getUser(req).id}) AS IFW 
        ON IFW.isFollowed = F.followerId
        WHERE F.followingId = ${req.params.id}
        ORDER BY F.followerId;`, { type: QueryTypes.SELECT })
      return res.json(followers)
    } catch (err) {
      next(err)
    }
  },
  getLikedTweets: async (req, res, next) => {
    try {
      let likedTweets = await sequelize.query(`
          SELECT T.*, IFNULL(LC.likedCount,0) AS likedCount, IFNULL(RC.repliedCount,0) AS repliedCount, IF(IL.isLiked, true, false) AS isLiked
          FROM Likes AS L
          LEFT JOIN (SELECT T.*, U.name,account,avatar  FROM Tweets AS T INNER JOIN (SELECT * FROM Users) AS U ON U.id = T.UserId)AS T
          ON T.id = L.TweetId
          LEFT JOIN (SELECT TweetId, COUNT(TweetId) AS likedCount FROM Likes GROUP BY TweetId) AS LC
          ON LC.TweetId = L.TweetId
          LEFT JOIN (SELECT TweetId, COUNT(TweetId) AS repliedCount FROM Replies GROUP BY TweetId) AS RC
          ON RC.TweetId = L.TweetId
          LEFT JOIN (SELECT TweetId AS isLiked FROM Likes WHERE UserId = ${helpers.getUser(req).id}) AS IL
          ON IL.isLiked = L.TweetId
          WHERE L.UserId = ${req.params.id}
          ORDER BY L.updatedAt DESC;`, { type: QueryTypes.SELECT })

      likedTweets = likedTweets.map(t => {
        t.TweetId = t.id
        t.user = {
          id: t.UserId,
          name: t.name,
          account: t.account,
          avatar: t.avatar
        }
        delete t.id
        delete t.name
        delete t.account
        delete t.avatar
        return { ...t }
      })
      res.json(likedTweets)
    } catch (err) {
      next(err)
    }
  },
  getRepliedTweets: async (req, res, next) => {
    try {
      let replies = await Reply.findAll({
        where: { UserId: req.params.id },
        include: [{
          model: Tweet,
          attributes: {
            include: [
              [sequelize.literal(`EXISTS(SELECT L.TweetId FROM Likes AS L WHERE L.UserId = ${helpers.getUser(req).id} AND L.TweetId = Tweet.id)`), 'isLiked']
            ]
          },
          include: [{
            model: User,
            attributes: ['id', 'name', 'account', 'avatar']
          }]
        }],
        order: [['updatedAt', 'DESC']]
      })
      replies = replies.map(r => ({ ...r.toJSON() }))
      return res.json(replies)
    } catch (err) {
      next(err)
    }
  },
  getCurrentUser: (req, res, next) => {
    try {
      const { id, name, email, role } = req.user
      const data = {
        id, name, email, role
      }
      return res.json(data)
    } catch (err) {
      next(err)
    }
  }
}