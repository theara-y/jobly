const { BadRequestError } = require("../expressError");

/* Builds a parameterized string for the query
dataToUpdate is an object
  where the object contains the request data
  where keys are in model property format
  example: { firstName: "test" }

jsToSql is an object
  where the object contains a mapping of model properties to sql table columns
  example: { firstName: "first_name" }

Returns the an object with the parameterized string 
and an array of corresponding data values
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
