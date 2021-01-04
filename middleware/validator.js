const { User, Tweet, Reply, Like, Followship } = require('../models')
const helpers = require('../_helpers')

// check if email is valid
function isEmailValid (email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

// if any error occurs, return error response
function validateResult (req, res, next) {
  if (!req.errors.length) {
    return next()
  } else {
    return res.json({ status: 'error', message: req.errors })
  }
}

module.exports = {
  userInfo: async (req, res, next) => {
    req.errors = []
    const { account, name, email, password, checkPassword } = req.body
    if (!account || !name || !email || !password || !checkPassword) {
      req.errors.push('所有欄位皆為必填')
    }
    if (password.trim() !== checkPassword.trim()) {
      req.errors.push('密碼和確認密碼不相符')
    }
    if (!isEmailValid(email.trim())) {
      req.errors.push('Email格式錯誤')
    }

    const [duplicateAccount, duplicateEmail] = await Promise.all([
      User.findOne({ where: { account: account.trim() } }),
      User.findOne({ where: { email: email.trim() } })
    ])
    if (duplicateAccount) {
      req.errors.push('帳號重複')
    }
    if (duplicateEmail) {
      req.errors.push('Email已被註冊')
    }

    return validateResult(req, res, next)
  },
  login: async (req, res, next) => {
    req.errors = []
    const { account, password } = req.body
    if (!account || !password) {
      req.errors.push('帳號和密碼不可為空白')
    }

    const user = await User.findOne({ where: { account } })
    if (!user) {
      req.errors.push('無此帳號')
    }

    return validateResult(req, res, next)
  },
  userExists: async (req, res, next) => {
    req.errors = []
    const id = req.params.id || req.body.id
    const user = await User.findByPk(id)
    if (!user) {
      req.errors.push('使用者不存在')
    }

    return validateResult(req, res, next)
  },
  tweetInfo: (req, res, next) => {
    req.errors = []
    const description = req.body.description.trim()
    if (!description) {
      req.errors.push('不可新增空白推文')
    }
    if (description.length > 140) {
      req.errors.push('推文字數不可超過 140 字')
    }

    return validateResult(req, res, next)
  },
  tweetExists: async (req, res, next) => {
    req.errors = []
    const tweet = await Tweet.findByPk(req.params.id)
    if (!tweet) {
      req.errors.push('推文不存在')
    }

    return validateResult(req, res, next)
  },
  replyInfo: (req, res, next) => {
    req.errors = []
    const comment = req.body.comment
    if (!comment) {
      req.errors.push('不可提交空白留言')
    }

    return validateResult(req, res, next)
  },
  replyExists: async (req, res, next) => {
    req.errors = []
    const reply = await Reply.findByPk(req.params.id)
    if (!reply) {
      req.errors.push('留言不存在')
    }

    return validateResult(req, res, next)
  },
  likeRepeats: async (req, res, next) => {
    req.errors = []
    const like = await Like.findOne({
      where: { UserId: helpers.getUser(req).id, TweetId: req.params.id }
    })
    if (like) {
      req.errors.push('重複按讚')
    }

    return validateResult(req, res, next)
  },
  likeExists: async (req, res, next) => {
    req.errors = []
    const like = await Like.findOne({
      where: { UserId: helpers.getUser(req).id, TweetId: req.params.id }
    })
    if (!like) {
      req.errors.push('按讚不存在')
    }

    return validateResult(req, res, next)
  },
  followRepeats: async (req, res, next) => {
    req.errors = []
    const followship = await Followship.findOne({
      where: { followerId: helpers.getUser(req).id, followingId: req.body.id }
    })
    if (followship) {
      req.errors.push('重複追蹤')
    }

    return validateResult(req, res, next)
  },
  followExists: async (req, res, next) => {
    req.errors = []
    const followship = await Followship.findOne({
      where: { followerId: helpers.getUser(req).id, followingId: req.params.id }
    })
    if (!followship) {
      req.errors.push('追蹤紀錄不存在')
    }

    return validateResult(req, res, next)
  }
}
