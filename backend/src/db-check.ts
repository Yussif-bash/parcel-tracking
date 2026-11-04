import { pool } from "./db.ts";

const result = await pool.query(
    "SELECT current_user AS user, current_database() AS database, version() AS version"
)

console.log(result.rows[0]);


await pool.end()