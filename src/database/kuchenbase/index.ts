import { Database } from "bun:sqlite";
import fs from "fs";
import path from "path";
import config from "../../config";

export type KuchenLeaderboardEntry = {
    name: string;
    displayname: string;
    value: number;
};

class KuchenBase {
    private db: Database;

    private insertKuchenStmt: ReturnType<Database["prepare"]>;
    private deleteKuchenStmt: ReturnType<Database["prepare"]>;

    constructor(filename: string) {
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        this.db = new Database(filename);
        this.db.run("PRAGMA journal_mode = WAL;");

        /*
         *
         * author:
         *   Stabile Discord-Benutzer-ID
         *
         * author_displayname:
         *   Anzeigename zum Zeitpunkt des Eintrags
         *
         * created_at:
         *   Zeitpunkt, zu dem der Kuchen eingetragen wurde
         */
        this.db.run(`
            CREATE TABLE IF NOT EXISTS kuchen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT NOT NULL,
                author_displayname TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_kuchen_author
            ON kuchen(author);
        `);

        this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_kuchen_created_at
            ON kuchen(created_at);
        `);

        this.insertKuchenStmt = this.db.prepare(`
            INSERT INTO kuchen (
                author,
                author_displayname,
                created_at
            )
            VALUES (?, ?, ?);
        `);

        this.deleteKuchenStmt = this.db.prepare(`
            DELETE FROM kuchen
            WHERE id = ?;
        `);
    }

    addKuchen(
        author: string,
        authorDisplayname: string,
        timestamp: Date = new Date(),
    ): number {
        const result = this.insertKuchenStmt.run(
            author,
            authorDisplayname,
            timestamp.toISOString(),
        );

        return Number(result.lastInsertRowid);
    }

    deleteKuchen(id: number): boolean {
        const result = this.deleteKuchenStmt.run(id);

        return result.changes > 0;
    }

    countKuchen(): number {
        const stmt = this.db.prepare<
            { value: number },
            []
        >(`
            SELECT COUNT(*) AS value
            FROM kuchen;
        `);

        return stmt.get()?.value ?? 0;
    }

    countKuchenByAuthor(author: string): number {
        const stmt = this.db.prepare<
            { value: number },
            [string]
        >(`
            SELECT COUNT(*) AS value
            FROM kuchen
            WHERE author = ?;
        `);

        return stmt.get(author)?.value ?? 0;
    }

    leaderboardByAuthor(
        startDate?: Date,
        endDate?: Date,
        limit: number = 10,
    ): KuchenLeaderboardEntry[] {
        let sql = `
            SELECT
                author AS name,
                MAX(author_displayname) AS displayname,
                COUNT(*) AS value
            FROM kuchen
        `;

        const conditions: string[] = [];
        const params: Array<string | number> = [];

        if (startDate) {
            conditions.push("created_at >= ?");
            params.push(startDate.toISOString());
        }

        if (endDate) {
            conditions.push("created_at <= ?");
            params.push(endDate.toISOString());
        }

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(" AND ")}`;
        }

        sql += `
            GROUP BY author
            ORDER BY value DESC, displayname COLLATE NOCASE ASC
            LIMIT ?
        `;

        params.push(limit);

        const stmt = this.db.prepare<
            KuchenLeaderboardEntry,
            Array<string | number>
        >(sql);

        return stmt.all(...params);
    }

    close(): void {
        this.db.close();
    }
}

export const defaultKuchenBase = new KuchenBase(
    config.KUCHENBASE_PATH,
);

export default KuchenBase;