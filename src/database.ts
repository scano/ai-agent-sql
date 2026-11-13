import 'dotenv/config';
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';

interface SchemaColumn extends RowDataPacket {
    TABLE_NAME: string;
    COLUMN_NAME: string;
    DATA_TYPE: string;
}

let pool: Pool | undefined;

function getPool() {
    if (pool) return pool;

    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
        throw new Error('Completa DB_HOST, DB_USER, DB_PASSWORD y DB_NAME en .env.');
    }

    pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        connectionLimit: 10,
        connectTimeout: 5000
    });

    return pool;
}

export async function executeQuery(sqlQuery: string) {
    if (typeof sqlQuery !== 'string' || !/^SELECT\b/i.test(sqlQuery.trim())) {
        throw new Error('El modelo debe devolver una consulta que empiece por SELECT.');
    }

    const connection = await getPool().getConnection();
    try {
        await connection.query('START TRANSACTION READ ONLY');
        const [rows] = await connection.execute<RowDataPacket[]>(sqlQuery);
        return rows;
    } finally {
        try {
            await connection.rollback();
            connection.release();
        } catch (error) {
            connection.destroy();
            throw error;
        }
    }
}

export async function getDatabaseSchema() {
    const [columns] = await getPool().execute<SchemaColumn[]>(`
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    const tables = new Map<string, string[]>();
    for (const { TABLE_NAME, COLUMN_NAME, DATA_TYPE } of columns) {
        const field = `${COLUMN_NAME} (${DATA_TYPE})`;
        const fields = tables.get(TABLE_NAME);
        if (fields) fields.push(field);
        else tables.set(TABLE_NAME, [field]);
    }

    return Array.from(tables, ([table, fields]) =>
        `Table: ${table}\n  Columns: ${fields.join(', ')}`
    ).join('\n\n');
}

export async function closeDatabase() {
    if (pool) await pool.end();
}
