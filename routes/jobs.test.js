"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  getJobId,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "Lead Developer",
    salary: 100000,
    equity: 0.75,
    companyHandle: "c1",
  };

  test("works for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Lead Developer",
        salary: 100000,
        equity: "0.75", // Returned as a string
        company: {
          handle: "c1",
          name: "C1",
          numEmployees: 1,
          description: "Desc1",
          logoUrl: "http://c1.img"
        }
      }
    });
  });

  test("unauth for regular users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new"
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "not-an-int",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with salary check", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: -1000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with equity check", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: 2.0,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        status: 400,
        message: "Bad Request: equity must be between 0 and 1."
      }
    })
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Developer 1",
            salary: 1111,
            equity: "0.1",
            company: {
              handle: "c1",
              name: "C1",
              numEmployees: 1,
              description: "Desc1",
              logoUrl: "http://c1.img"
            }
          },
          {
            id: expect.any(Number),
            title: "Developer 1",
            salary: 1111,
            equity: "0.1",
            company: {
              handle: "c1",
              name: "C1",
              numEmployees: 1,
              description: "Desc1",
              logoUrl: "http://c1.img"
            }
          },
          {
            id: expect.any(Number),
            title: "Developer 2",
            salary: 2222,
            equity: "0.2",
            company: {
              handle: "c2",
              name: "C2",
              numEmployees: 2,
              description: "Desc2",
              logoUrl: "http://c2.img"
            }
          }
        ],
    });
  });

  test("filter by title", async function () {
    const resp = await request(app).get("/jobs")
      .send({
        title: "2"
      });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Developer 2",
            salary: 2222,
            equity: "0.2",
            company: {
              handle: "c2",
              name: "C2",
              numEmployees: 2,
              description: "Desc2",
              logoUrl: "http://c2.img"
            }
          }
        ],
    });
  });

  test("filter by minSalary", async function () {
    const resp = await request(app).get("/jobs")
      .send({
        minSalary: 2222
      });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Developer 2",
            salary: 2222,
            equity: "0.2",
            company: {
              handle: "c2",
              name: "C2",
              numEmployees: 2,
              description: "Desc2",
              logoUrl: "http://c2.img"
            }
          }
        ],
    });
  });

  test("filter by hasEquity true", async function () {
    const resp = await request(app).get("/jobs")
      .send({
        hasEquity: true
      });
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Developer 1",
            salary: 1111,
            equity: "0.1",
            company: {
              handle: "c1",
              name: "C1",
              numEmployees: 1,
              description: "Desc1",
              logoUrl: "http://c1.img"
            }
          },
          {
            id: expect.any(Number),
            title: "Developer 1",
            salary: 1111,
            equity: "0.1",
            company: {
              handle: "c1",
              name: "C1",
              numEmployees: 1,
              description: "Desc1",
              logoUrl: "http://c1.img"
            }
          },
          {
            id: expect.any(Number),
            title: "Developer 2",
            salary: 2222,
            equity: "0.2",
            company: {
              handle: "c2",
              name: "C2",
              numEmployees: 2,
              description: "Desc2",
              logoUrl: "http://c2.img"
            }
          }
        ],
    });
  });

  test("filter by hasEquity false", async function () {
    const resp = await request(app).get("/jobs")
      .send({
        hasEquity: false
      });
    expect(resp.body).toEqual({
      jobs: []
    });
  });

  test("filter by invalid minSalary", async function () {
    const resp = await request(app).get("/jobs")
      .send({
        minSalary: -1000
      });
    expect(resp.status).toBe(400);
    expect(resp.body).toEqual({
      error: {
        status: 400,
        message: "Bad Request: minSalary must be non-negative",
      }
    });
  });

  test("filter by unknown", async function () {
    const resp = await request(app).get("/jobs")
      .send({
        companyHandle: 'c1'
      });
    expect(resp.status).toBe(400);
    expect(resp.body).toEqual({
      error: {
        status: 400,
        message: expect.any(Array)
      }
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
      .get("/companies")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobId = await getJobId();

    const resp = await request(app).get(`/jobs/${jobId}`);

    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: "Developer 2",
        salary: 2222,
        equity: "0.2",
        company: {
          handle: "c2",
          name: "C2",
          numEmployees: 2,
          description: "Desc2",
          logoUrl: "http://c2.img"
        }
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const jobId = await getJobId();

    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "Developer 3",
        salary: 3333,
        equity: 0.3,
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      job: {
        id: jobId,
        title: "Developer 3",
        salary: 3333,
        equity: "0.3",
        companyHandle: "c2",
      },
    });
  });

  test("unauth for regular users", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "Developer 3",
        salary: 3333,
        equity: 0.3,
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "Developer 3",
        salary: 3333,
        equity: 0.3,
      });

    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/-1`)
      .send({
        title: "Developer 3",
        salary: 3333,
        equity: 0.3,
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        id: 2
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "Developer 3",
        salary: "not-an-int",
        equity: 0.3,
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const jobId = await getJobId();

    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({ deleted: `${jobId}` });
  });

  test("unauth for regular users", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`);

    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/-1`)
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(404);
  });
});
