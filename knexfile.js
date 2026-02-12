const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.MYSQLHOST || "localhost",
      port: process.env.MYSQLPORT || 3308,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "dev-root",
      database: process.env.MYSQLDATABASE || "dev_smart_invite_db"
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
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    },
    migrations: {
      directory: path.resolve(__dirname, "backend/migrations")
    }
  }
};
