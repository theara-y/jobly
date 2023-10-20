"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const format = require('pg-format');

/* Related functions for jobs */

class Job {
    /**
     * Create a new data.
     * 
     * data: object
     *  title: string
     *  salary: int
     *  equity: float
     *  companyHandle: string (fk)
     * 
     * Return: object
     *      id: int
     *      title: string
     *      salary: int
     *      equity: float
     *      company: object
     *          handle: string
     *          name: string
     *          numEmployees: int
     *          description: string
     *          logoUrl: string    
     * 
     * Throws: BadRequestError if company is not found.
     */
    static async create({ title, salary, equity, companyHandle }) {
        const getCompanyResult = await db.query(
            `SELECT handle,
                name,
                num_employees AS "numEmployees",
                description,
                logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`, [companyHandle]);

        const company = getCompanyResult.rows[0];
        if (!company)
            throw new BadRequestError(`Company handle not found: ${companyHandle}`);

        const addJobResult = await db.query(`
            INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity`
            , [title, salary, equity, companyHandle]);

        const job = addJobResult.rows[0];

        job.company = company;

        return job;
    }

    /**
     * Get all jobs.
     * 
     * Return: array[object]
     *      id: int
     *      title: string
     *      salary: int
     *      equity: float
     *      company: object
     *          handle: string
     *          name: string
     *          numEmployees: int
     *          description: string
     *          logoUrl: string
     */
    static async findAll(filters) {
        const conditions = [];

        if (filters) {
            const { title, minSalary, hasEquity } = filters;
            if (title)
                conditions.push(format("title ILIKE %L", `%${title}%`));
            if (minSalary)
                conditions.push(format("salary >= %L", minSalary));
            if (hasEquity !== undefined && hasEquity)
                conditions.push(format("equity >= 0"));
            else if (hasEquity !== undefined && !hasEquity)
                conditions.push(format("(equity = 0 OR equity = NULL)"))
        }

        let whereClause = ''
        if (conditions.length) {
            whereClause = 'WHERE ' + conditions.join(' AND ')
        }

        let sqlQuery =
            `SELECT j.id,
                j.title,
                j.salary,
                j.equity,
                c.handle,
                c.name,
                c.num_employees AS "numEmployees",
                c.description,
                c.logo_url AS "logoUrl"
            FROM jobs j
            INNER JOIN companies c
            ON c.handle = j.company_handle ${whereClause}`;

        const getJobsResult = await db.query(sqlQuery);

        return getJobsResult.rows.map(r => ({
            id: r.id,
            title: r.title,
            salary: r.salary,
            equity: r.equity,
            company: {
                handle: r.handle,
                name: r.name,
                numEmployees: r.numEmployees,
                description: r.description,
                logoUrl: r.logoUrl
            }
        }));
    }

    /**
     * Get a job by id.
     * 
     * Return: object
     *      id: int
     *      title: string
     *      salary: int
     *      equity: float
     *      company: object
     *          handle: string
     *          name: string
     *          numEmployees: int
     *          description: string
     *          logoUrl: string
     * 
     * Throws: NotFoundError if not found.
     */
    static async get(id) {
        const result = await db.query(
            `SELECT j.id,
                j.title,
                j.salary,
                j.equity,
                c.handle,
                c.name,
                c.num_employees AS "numEmployees",
                c.description,
                c.logo_url AS "logoUrl"
            FROM jobs j
            INNER JOIN companies c
            ON c.handle = j.company_handle
            WHERE j.id = $1`, [id]);

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return result.rows.map(r => ({
            id: r.id,
            title: r.title,
            salary: r.salary,
            equity: r.equity,
            company: {
                handle: r.handle,
                name: r.name,
                numEmployees: r.numEmployees,
                description: r.description,
                logoUrl: r.logoUrl
            }
        }))[0];
    }

    /**
     * Update a job by id.
     * 
     * Can perform a partial update.
     * 
     * data: object
     *      title: string [optional]
     *      salary: int [optional]
     *      equity: float [optional]
     * 
     * data cannot be an empty object
     * 
     * Return: 
     *      id: int
     *      title: string 
     *      salary: int
     *      equity: float
     *      companyHandle: string
     * 
     * Throws: NotFoundError if not found.
     */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});

        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE jobs
            SET ${setCols}
            WHERE id = ${idVarIdx}
            RETURNING id, 
                title, 
                salary, 
                equity, 
                company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /**
     * Delete a job by id.
     * 
     * Return: undefined
     * 
     * Throws: NotFoundError if not found.
     */
    static async delete(id) {
        const result = await db.query(
            `DELETE FROM jobs WHERE id = $1
            RETURNING id`, [id]);

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
