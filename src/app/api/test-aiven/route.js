import mariadb from "mariadb";

export async function GET() {
  let connection;

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return Response.json(
        {
          success: false,
          message: "DATABASE_URL is missing",
        },
        { status: 500 }
      );
    }

    const parsedUrl = new URL(databaseUrl);

    const pool = mariadb.createPool({
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 3306),
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.replace(/^\//, ""),
      connectionLimit: 1,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    connection = await pool.getConnection();

    const result = await connection.query("SELECT 1 AS test");

    await connection.release();
    await pool.end();

    return Response.json({
      success: true,
      message: "Direct MariaDB connection successful",
      result,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.release();
      } catch {}
    }

    return Response.json(
      {
        success: false,
        message: "Direct MariaDB connection failed",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}