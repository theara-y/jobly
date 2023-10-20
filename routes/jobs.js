"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json")

const router = new express.Router();


/** POST / { newJob } => { job }
 *
 *  newJob: { title, salary, equity, companyHandle }
 *
 *  Returns { id, title, salary, equity, { company } }
 *
 *  Authorization required: login, isAdmin
 */
router.post("/", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { salary, equity } = req.body;
    if (salary < 0) {
        throw new BadRequestError(
            "Bad Request: salary must be non-negative."
            , 400
        );
    }
    if (equity < 0 || equity > 1) {
        throw new BadRequestError(
            "Bad Request: equity must be between 0 and 1."
            , 400
        );
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity { company } }, ...] }
 *
 *  Can filter on provided search filters:
 *   - title - fetch jobs with titles like title
 *   - minSalary - fetch jobs with salary >= minSalary
 *   - hasEquity - fetch jobs with equity > 0 if true
 *
 *  Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const { minSalary } = req.body;
    const validator = jsonschema.validate(req.body, jobFilterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs)
    }
    if (minSalary && minSalary < 0) {
        throw new BadRequestError("Bad Request: minSalary must be non-negative")
    }

    const jobs = await Job.findAll(req.body);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Return { id, title, salary, equity, company }
 *
 *  Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, isAdmin
 */

router.patch("/:id", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { salary, equity } = req.body;
    if (salary && salary < 0) {
        throw new BadRequestError(
            "Bad Request: salary must be non-negative."
            , 400
        );
    }
    if (equity && (equity < 0 || equity > 1)) {
        throw new BadRequestError(
            "Bad Request: equity must be between 0 and 1."
            , 400
        );
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 *  Authorization: login, isAdmin
 */

router.delete("/:id", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    await Job.delete(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
