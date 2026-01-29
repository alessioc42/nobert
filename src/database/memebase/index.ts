import { Database } from "bun:sqlite";
import config from "../../config";

class MemeBase {
    private db: Database;
    private insertMemeStmt: ReturnType<Database["prepare"]>;
    private insertFTSStmt: ReturnType<Database["prepare"]>;
    private deleteMemeStmt: ReturnType<Database["prepare"]>;
    private deleteFTSStmt: ReturnType<Database["prepare"]>;
    private randomMemeStmt: ReturnType<Database["prepare"]>;

    constructor(filename?: string) {
        this.db = new Database(filename);

        // Enable WAL mode for improved performance
        this.db.run("PRAGMA journal_mode = WAL;");

        /**
         * Table Content stores the memes information:
         * - id: unique identifier for each meme
         * - author: discord user ID of the meme creator
         * - author_displayname: display name of the meme creator
         * - content: Compressed BLOB of the meme image
         * - strings: Image recognition strings associated with the meme for later FTS
         * - created_at: timestamp when the meme was created
         */
        this.db.run(`
            CREATE TABLE IF NOT EXISTS memes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT NOT NULL,
                author_displayname TEXT,
                content BLOB NOT NULL,
                strings TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Full-Text Search virtual table for efficient searching of memes based on associated strings and author display name
        this.db.run(`
            CREATE VIRTUAL TABLE IF NOT EXISTS meme_fts USING fts5(
                strings,
                author_displayname,
                content='memes',
                content_rowid='id'
            );
        `);

        this.insertMemeStmt = this.db.prepare(`
            INSERT INTO memes (author, author_displayname, content, strings) VALUES (?, ?, ?, ?);
        `);
        this.insertFTSStmt = this.db.prepare(`
            INSERT INTO meme_fts (rowid, strings, author_displayname) VALUES (?, ?, ?);
        `);
        this.deleteMemeStmt = this.db.prepare(`
            DELETE FROM memes WHERE id = ?;
        `);
        this.deleteFTSStmt = this.db.prepare(`
            DELETE FROM meme_fts WHERE rowid = ?;
        `);
        this.randomMemeStmt = this.db.prepare(`
            SELECT id, author, author_displayname, content, strings, created_at 
            FROM memes ORDER BY RANDOM() 
            LIMIT 1`);
    }

    addMeme(
        author: string,
        authorDisplayname: string,
        content: Uint8Array,
        strings: string,
    ) {
        strings = this.normalizeTextForFTS(strings);
        const result = this.insertMemeStmt.run(
            author,
            authorDisplayname,
            content,
            strings,
        );
        this.insertFTSStmt.run(
            result.lastInsertRowid,
            strings,
            authorDisplayname,
        );
    }

    deleteMeme(id: number): boolean {
        this.deleteFTSStmt.run(id);
        const result = this.deleteMemeStmt.run(id);
        return result.changes > 0;
    }

    searchMemes(
        query: string,
        options?: { startDate?: Date; endDate?: Date; limit?: number },
    ): Array<
        {
            id: number;
            author: string;
            author_displayname: string;
            content: Uint8Array;
            strings: string;
            created_at: string;
        }
    > {
        query = this.normalizeTextForFTS(query);

        let sql = `
            SELECT m.id, m.author, m.author_displayname, m.content, m.strings, m.created_at
            FROM memes m
            JOIN meme_fts fts ON m.id = fts.rowid
            WHERE meme_fts MATCH ?
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

        if (options?.limit) {
            sql += ` LIMIT ?`;
            params.push(options.limit);
        }

        const stmt = this.db.prepare<
            {
                id: number;
                author: string;
                author_displayname: string;
                content: Uint8Array;
                strings: string;
                created_at: string;
            },
            (string | number)[]
        >(sql);
        return stmt.all(...params);
    }

    randomMeme(): {
        id: number;
        author: string;
        author_displayname: string;
        content: Uint8Array;
        strings: string;
        created_at: string;
    } | null {
        return this.randomMemeStmt.get() as {
            id: number;
            author: string;
            author_displayname: string;
            content: Uint8Array;
            strings: string;
            created_at: string;
        } | null;
    }

    normalizeTextForFTS(text: string): string {
        return text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\b(\w{3,})s\b/g, '$1');
    }

    close() {
        this.db.close();
    }
}

const defaultMemeBase = new MemeBase(config.MEMEBASE_PATH);

export { defaultMemeBase, MemeBase };
