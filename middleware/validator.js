const { User } = require('../models')

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
    // check required fields
    const { account, name, email, password, checkPassword } = req.body
    if (!account || !name || !email || !password || !checkPassword) {
      req.errors.push('所有欄位皆為必填')
    }
    // check if password matches checkPassword
    if (password.trim() !== checkPassword.trim()) {
      req.errors.push('密碼和確認密碼不相符')
    }
    // check if the email's format is valid
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
    const user = await User.findByPk(req.params.id)
    if (!user) {
      req.errors.push('使用者不存在')
    }

    return validateResult(req, res, next)
  }
}
