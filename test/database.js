const mysql = require("mysql2/promise");
const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const testUrl = process.env.TEST_MYSQL_URL;

function testConfig() {
    const url = new URL(testUrl);
    return {
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
    };
}

async function createDatabase(t) {
    const config = testConfig();
    const admin = await mysql.createConnection(config);
    t.after(() => admin.end());
    const name = "kosmeti_test_" + randomUUID().replaceAll("-", "");
    await admin.query("CREATE DATABASE ??", [name]);
    const connection = await mysql.createConnection({
        ...config,
        database: name,
        multipleStatements: true,
    });

    t.after(async () => {
        await connection.end();
        // Use a new connection since test hooks can close the admin connection first.
        const cleanup = await mysql.createConnection(config);
        try {
            await cleanup.query("DROP DATABASE ??", [name]);
        } finally {
            await cleanup.end();
        }
    });
    return { connection, config: { ...config, database: name } };
}

function readProjectFile(filename) {
    return readFile(path.join(__dirname, "..", filename), "utf8");
}

async function seedFresh(connection) {
    for (const file of ["schema.sql", "seed.sql"]) {
        await connection.query(
            await readProjectFile("src/database/schemas/" + file),
        );
    }
}

module.exports = { testUrl, createDatabase, readProjectFile, seedFresh };
