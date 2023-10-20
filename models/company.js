"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const format = require('pg-format');

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * 
   * filters parameter is optional
   * filters is of type object
   * and can contain the following properties to
   * build parts of the where clause:
   * nameLike
   * minEmployees
   * maxEmployees
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters) {
    const conditions = [];

    // if filters are provided
    // build where clause and convert to SQL safe strings using pg-format
    if (filters) {
      const {nameLike, minEmployees, maxEmployees} = filters;
      if (nameLike)
        conditions.push(format("name ILIKE %L", `%${nameLike}%`));
      if (minEmployees)
        conditions.push(format("num_employees >= %L", minEmployees));
      if (maxEmployees)
        conditions.push(format("num_employees <= %L", maxEmployees));
    }

    let whereClause = ''
    if (conditions.length) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }
    
    let query = 
    `SELECT handle,
        name,
        description,
        num_employees AS "numEmployees",
        logo_url AS "logoUrl"
    FROM companies ${whereClause}
    ORDER BY name`

    const companiesRes = await db.query(query);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const getCompanyResult = await db.query(
          `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.id,
                  j.title,
                  j.salary,
                  j.equity
           FROM companies c
           LEFT JOIN jobs j
           ON j.company_handle = c.handle
           WHERE c.handle = $1`,
        [handle]);

    const rows = getCompanyResult.rows;

    if (!rows.length) throw new NotFoundError(`No company: ${handle}`);

    const {name, description, numEmployees, logoUrl} = rows[0];

    const company = {
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
      jobs: []
    }

    if (rows.length > 1 || rows[0].id !== null) {
      company.jobs = rows.map(r => ({
        id: r.id,
        title: r.title,
        salary: r.salary,
        equity: r.equity
      }));
    }

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
