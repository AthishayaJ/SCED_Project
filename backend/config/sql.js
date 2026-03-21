const sql = require('mssql');

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DB,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("MSSQL Connected ✅");
    } catch (err) {
        console.log("MSSQL Error ❌", err.message);
    }
};

module.exports = { sql, connectDB };
