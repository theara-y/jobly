"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const { createToken } = require("../helpers/tokens");
const Job = require("../models/job.js");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  await User.register({
    username: "adminuser",
    firstName: "admin",
    lastName: "user",
    email: "admin@user.com",
    password: "password",
    isAdmin: true,
  });

  await Job.create({
    title: "Developer 1",
    salary: 1111,
    equity: 0.1,
    companyHandle: "c1"
  })
  await Job.create({
    title: "Developer 1",
    salary: 1111,
    equity: 0.1,
    companyHandle: "c1"
  })
  await Job.create({
    title: "Developer 2",
    salary: 2222,
    equity: 0.2,
    companyHandle: "c2"
  })
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

async function getJobId() {
  const jobResult = await db.query(
    "SELECT id FROM jobs WHERE title = 'Developer 2' LIMIT 1");
  
  return jobResult.rows[0].id;
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "adminuser", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getJobId,
  u1Token,
  adminToken
};
