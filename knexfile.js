const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3308,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "dev-root",
      database: process.env.MYSQL_DATABASE || "dev_smart_invite_db"
    },
    migrations: {
      directory: path.resolve(__dirname, "backend/migrations")
    }
  },
  // test: {
  //   client: "mysql2",
  //   connection: {
  //     host: "localhost",
  //     port: 3308,
  //     user: "root",
  //     password: "dev-root",
  //     database: "test_smart_invite_db"
  //   },
  //   migrations: {
  //     directory: path.resolve(__dirname, "backend/migrations")
  //   }
  // },
  production: {
    client: "mysql2",
    connection: {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    },
    migrations: {
      directory: path.resolve(__dirname, "backend/migrations")
    }
  }
};
