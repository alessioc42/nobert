import { Database } from "bun:sqlite";

class MemeBase {
    private db: Database;
    private insertMemeStmt: ReturnType<Database["prepare"]>;
    private insertFTSStmt: ReturnType<Database["prepare"]>;
    private deleteMemeStmt: ReturnType<Database["prepare"]>;
    private deleteFTSStmt: ReturnType<Database["prepare"]>;

    constructor(filename?: string) {
        this.db = new Database(filename);

        // Enable WAL mode for improved performance
        this.db.run("PRAGMA journal_mode = WAL;");

        /**
         * Table Content stores the memes information:
         * - id: unique identifier for each meme
         * - author: discord user ID of the meme creator
         * - content: Compressed BLOB of the meme image
         * - strings: Image recognition strings associated with the meme for later FTS
         * - created_at: timestamp when the meme was created
         */
        this.db.run(`
            CREATE TABLE IF NOT EXISTS memes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author INT NOT NULL,
                content BLOB NOT NULL,
                strings TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Full-Text Search virtual table for efficient searching of memes based on associated strings
        this.db.run(`
            CREATE VIRTUAL TABLE IF NOT EXISTS meme_fts USING fts5(
                strings,
                content='memes',
                content_rowid='id'
            );
        `);

        this.insertMemeStmt = this.db.prepare(`
            INSERT INTO memes (author, content, strings) VALUES (?, ?, ?);
        `);
        this.insertFTSStmt = this.db.prepare(`
            INSERT INTO meme_fts (rowid, strings) VALUES (?, ?);
        `);
        this.deleteMemeStmt = this.db.prepare(`
            DELETE FROM memes WHERE id = ?;
        `);
        this.deleteFTSStmt = this.db.prepare(`
            DELETE FROM meme_fts WHERE rowid = ?;
        `);
    }

    addMeme(author: number, content: Uint8Array, strings: string) {
        const result = this.insertMemeStmt.run(author, content, strings);
        this.insertFTSStmt.run(result.lastInsertRowid, strings);
    }

    deleteMeme(id: number): boolean {
        this.deleteFTSStmt.run(id);
        const result = this.deleteMemeStmt.run(id);
        return result.changes > 0;
    }

    searchMemes(
        query: string,
        options?: { startDate?: Date; endDate?: Date }
    ): Array<{ id: number; author: number; content: Uint8Array; strings: string; created_at: string }> {
        let sql = `
            SELECT m.id, m.author, m.content, m.strings, m.created_at
            FROM memes m
            JOIN meme_fts fts ON m.id = fts.rowid
            WHERE fts.strings MATCH ?
        `;
        const params: (string | number)[] = [query];

        if (options?.startDate) {
            sql += ` AND m.created_at >= ?`;
            params.push(options.startDate.toISOString());
        }

        if (options?.endDate) {
            sql += ` AND m.created_at <= ?`;
            params.push(options.endDate.toISOString());
        }

        const stmt = this.db.prepare<
            { id: number; author: number; content: Uint8Array; strings: string; created_at: string },
            (string | number)[]
        >(sql);
        return stmt.all(...params);
    }

    close() {
        this.db.close();
    }
}

export { MemeBase };
