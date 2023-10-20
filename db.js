"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: "postgresql://tya:password@localhost:5432/jobly" || getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: "postgresql://tya:password@localhost:5432/jobly_test" || getDatabaseUri()
  });
}

db.connect();

module.exports = db;