"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");
const Job = require("./job.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "Lead Developer",
        salary: 100000,
        equity: 0.75,
        companyHandle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(
            {
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
        );
    });

    test("bad request with company not found", async function () {
        try {
            newJob.companyHandle = "c9";
            await Job.create(newJob);
            fail(); // If no error is thrown, this test fails.
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
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
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const jobResult = await db.query(
            "SELECT id FROM jobs WHERE title = 'Developer 1' LIMIT 1");

        const jobId = jobResult.rows[0].id;

        let job = await Job.get(jobId);

        expect(job).toEqual({
            id: jobId,
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
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const jobUpdate = {
        title: "New",
        salary: 100,
        equity: .99,
    };

    test("works", async function () {
        const jobResult = await db.query(
            "SELECT id FROM jobs WHERE title = 'Developer 1' LIMIT 1");
            
        const jobId = jobResult.rows[0].id;

        let job = await Job.update(jobId, jobUpdate);
        
        expect(job).toEqual({
            id: jobId,
            title: "New",
            salary: 100,
            equity: "0.99",
            companyHandle: "c1"
        });
    });

    test("works: partial update", async function () {
        const jobPartialUpdate = {
            title: "New",
            equity: null, // update equity to null
        };

        const jobResult = await db.query(
            "SELECT id FROM jobs WHERE title = 'Developer 1' LIMIT 1");
            
        const jobId = jobResult.rows[0].id;

        let job = await Job.update(jobId, jobPartialUpdate);
        
        expect(job).toEqual({
            id: jobId,
            title: "New",
            salary: 1111,
            equity: null,
            companyHandle: "c1"
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(-1, jobUpdate);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            const jobResult = await db.query(
                "SELECT id FROM jobs WHERE title = 'Developer 1' LIMIT 1");
            
            const jobId = jobResult.rows[0].id;

            await Job.update(jobId, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        const jobResult = await db.query(
            "SELECT id FROM jobs WHERE title = 'Developer 1' LIMIT 1");
                
        const jobId = jobResult.rows[0].id;

        await Job.delete(jobId);

        const res = await db.query(
            `SELECT id FROM jobs WHERE id = ${jobId}`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.delete(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
