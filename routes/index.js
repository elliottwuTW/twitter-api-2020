const express = require('express')
const router = express.Router()

//packages
const multer = require('multer')
const upload = multer({ dest: 'temp/' })

// controllers
const userController = require('../controllers/userController')
const tweetController = require('../controllers/tweetController')
const likeController = require('../controllers/likeController')
const replyController = require('../controllers/replyController')
const followshipController = require('../controllers/followshipController')

// authorizers
const { authToken, authUserRole, authAdminRole } = require('../middleware/auth')

// validator
const validator = require('../middleware/validator')

// routes
// tweet
router.post('/api/tweets', authToken, authUserRole, validator.tweetInfo, tweetController.createTweet)
router.get('/api/tweets', authToken, authUserRole, tweetController.getTweets)
router.get('/api/tweets/:id', authToken, authUserRole, validator.tweetExists, tweetController.getTweet)
router.put('/api/tweets/:id', authToken, authUserRole, validator.tweetExists, validator.tweetInfo, tweetController.updateTweet)
router.delete('/api/tweets/:id', authToken, authUserRole, validator.tweetExists, tweetController.deleteTweet)

// like
router.post('/api/tweets/:id/like', authToken, authUserRole, validator.tweetExists, validator.likeRepeats, likeController.createLike)
router.post('/api/tweets/:id/unlike', authToken, authUserRole, validator.tweetExists, validator.likeExists, likeController.deleteLike)

// followship
router.post('/api/followships', authToken, authUserRole, validator.userExists, validator.followRepeats, followshipController.createFollowship)
router.delete('/api/followships/:id', authToken, authUserRole, validator.userExists, validator.followExists, followshipController.deleteFollowship)

// reply
router.post('/api/tweets/:id/replies', authToken, authUserRole, validator.tweetExists, validator.replyInfo, replyController.createReply)
router.get('/api/tweets/:id/replies', authToken, authUserRole, validator.tweetExists, replyController.getReplies)
router.get('/api/replies/:id', authToken, authUserRole, validator.replyExists, replyController.getReply)
router.put('/api/replies/:id', authToken, authUserRole, validator.replyExists, validator.replyInfo, replyController.updateReply)
router.delete('/api/replies/:id', authToken, authUserRole, validator.replyExists, replyController.deleteReply)

// users
router.post('/api/login', validator.login, userController.login)
router.post('/api/users', validator.userInfo, userController.createUser)
router.get('/api/users/top', authToken, authUserRole, userController.getTopUsers)
router.get('/api/users/:id', authToken, authUserRole, validator.userExists, userController.getUser)
router.get('/api/users/:id/tweets', authToken, authUserRole, validator.userExists, userController.getTweets)
router.put('/api/users/:id', authToken, authUserRole, validator.userExists, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), userController.updateUser) //編輯個人資料
router.put('/api/users/:id/setting', authToken, authUserRole, validator.userExists, userController.updateUserSetting) //設定
router.get('/api/users/:id/replied_tweets', authToken, authUserRole, validator.userExists, userController.getRepliedTweets)
router.get('/api/users/:id/followings', authToken, authUserRole, validator.userExists, userController.getFollowings)
router.get('/api/users/:id/followers', authToken, authUserRole, validator.userExists, userController.getFollowers)
router.get('/api/users/:id/likes', authToken, authUserRole, validator.userExists, userController.getLikedTweets)
router.get('/api/get_current_user', authToken, authUserRole, userController.getCurrentUser)

// admin
router.get('/api/admin/users', authToken, authAdminRole, userController.getUsers)
router.get('/api/admin/tweets', authToken, authAdminRole, tweetController.getTweets)
router.delete('/api/admin/tweets/:id', authToken, authAdminRole, validator.tweetExists, tweetController.deleteTweet)

module.exports = router
