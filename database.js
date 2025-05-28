const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'app_database.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    createTables().catch(error => {
        console.error("Error al crear/verificar tablas:", error);
        // Manejar el error de creación de tablas
    });
  }
});

const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const allQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const runTransaction = (callback) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            callback(db)
                .then(() => {
                    db.run("COMMIT;");
                    resolve();
                })
                .catch((err) => {
                    db.run("ROLLBACK;");
                    reject(err);
                });
        });
    });
};


async function createTables() {
    try {
        await runQuery(`CREATE TABLE IF NOT EXISTS agencias (
            codigo_agencia TEXT UNIQUE NOT NULL COLLATE NOCASE, -- COLLATE NOCASE para búsqueda sin distinción de mayúsculas
            nombre TEXT NOT NULL,
            direccion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await runQuery(`CREATE TABLE IF NOT EXISTS usuarios (
            usuario TEXT UNIQUE NOT NULL COLLATE NOCASE, -- COLLATE NOCASE
            clave TEXT NOT NULL, -- Almacenar clave hasheada
            agencia_id INTEGER NOT NULL,
            rol TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
        )`);

        await runQuery(`CREATE TABLE IF NOT EXISTS taquillas (
            numero_taquilla TEXT NOT NULL COLLATE NOCASE, -- COLLATE NOCASE
            agencia_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE,
            UNIQUE (numero_taquilla, agencia_id)
        )`);

        await runQuery(`CREATE INDEX IF NOT EXISTS idx_agencias_codigo ON agencias(codigo_agencia)`);
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario)`);
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_usuarios_agencia ON usuarios(agencia_id)`);
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_taquillas_agencia ON taquillas(agencia_id)`);

        console.log("Tablas y índices verificados/creados.");
    } catch (error) {
        console.error("Error al crear tablas o índices:", error);
        throw error; // Propagar el error para ser manejado en main.js
    }
}

const closeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = {
    db, // Exportar la instancia si es necesario para operaciones avanzadas, pero preferir las funciones prometidas
    run: runQuery,
    get: getQuery,
    all: allQuery,
    transaction: runTransaction, // Corrected export name
    close: closeDatabase
};