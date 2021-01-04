# Simple Twitter API
Backend API for simple twitter application, which is built with Express and MySQL.

### Brief Introduction
This API supports basic CRUD features, such as creating an account, posting a tweet, following people, etc.

### Document
Check more information in [Twitter Restful API](https://www.notion.so/Twitter-Restful-API-ce031de8db4a496fa03622af7d9a1455)

### Usage
- Install dependencies
  ```
  npm install
  ```
- Follow `.env.example` to setup your .env
  ```
  touch .env
  ```
- Checkout `config.json` to setup database
  ```
  {
    "development": {
      "username": "YOUR_USERNAME",
      "password": "YOUR_PASSWORD",
      "database": "YOUR_DB_NAME",
      "host": "127.0.0.1",
      "dialect": "mysql",
      "operatorsAliases": false
    },
    "test": {
      "username": "YOUR_USERNAME",
      "password": "YOUR_PASSWORD",
      "database": "YOUR_DB_NAME",
      "host": "127.0.0.1",
      "dialect": "mysql",
      "logging": false
    },
    "production": {
      "use_env_variable": "YOUR_DATABASE_URL"
    },
    "travis": {
      "username": "travis",
      "database": "YOUR_TRAVIS_DB_NAME",
      "host": "127.0.0.1",
      "dialect": "mysql",
      "logging": false
    }
  }
  ```
- Database seeder
  ```
  # database migration
  npx sequelize db:migrate

  # generate seed data
  npx sequelize db:seed:all
  ```
- Run app
  ```
  # dev mode
  npm run dev

  # prod mode
  npm run start
  ```

### Package Version
- express : 4.16.4
- mysql2 : 1.6.4
- sequelize : 4.42.0
- sequelize-cli : 5.5.0

### App Info
#### Author 
order alphabetically
- [elliottwuTW](https://github.com/elliottwuTW)
- [Fan-55](https://github.com/Fan-55)

