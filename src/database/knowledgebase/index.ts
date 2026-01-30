import sqlite3 from "sqlite3";
import Database from "flexsearch/db/sqlite";
import { Index } from "flexsearch";
import fs from "fs";
import path from "path";
import config from "../../config";

class Knowledgebase {
    MAX_PREVIEW_LENGTH = 60;

    private db: sqlite3.Database;
    private index: Index<string>;

    constructor(filename: string) {
        fs.mkdirSync(path.dirname(filename), { recursive: true });
        this.db = new sqlite3.Database(filename);
        this.db.exec("PRAGMA journal_mode = WAL;");

        const db = new Database("knowledgebase", {
            db: this.db,
            type: "integer",
        });

        this.index = new Index({
            preset: "score",
            tokenize: "tolerant",
        });

        this.index.mount(db);

        this.db.exec(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            author_displayname TEXT,
            preview TEXT,
            has_image INTEGER DEFAULT 0,
            discord_path TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`);
    }

    async updatePost({
        author,
        authorDisplayName,
        hasImage,
        messagePath,
        text,
        timestamp,
    }: {
        author: string;
        authorDisplayName: string;
        hasImage: boolean;
        messagePath: {
            guildId: bigint;
            channelId: bigint;
            messageId: bigint;
        };
        timestamp: Date;
        text: string;
    }): Promise<void> {
        const preview = text.length > this.MAX_PREVIEW_LENGTH
            ? text.slice(0, this.MAX_PREVIEW_LENGTH) + "..."
            : text;
        const shrinkedDiscordPath = this.discordPathShrinker.encodeKey(
            messagePath.guildId,
            messagePath.channelId,
            messagePath.messageId,
        );
        const formattedTimestamp = timestamp.toISOString();

        // Check if a post with this discord_path already exists
        const existingId: number | null = await new Promise(
            (resolve, reject) => {
                this.db.get(
                    `SELECT id FROM posts WHERE discord_path = ?`,
                    [shrinkedDiscordPath],
                    (err, row: { id: number } | undefined) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row?.id ?? null);
                        }
                    },
                );
            },
        );

        if (existingId !== null) {
            // Update existing record
            await new Promise<void>((resolve, reject) => {
                this.db.run(
                    `UPDATE posts SET author = ?, author_displayname = ?, preview = ?, has_image = ?, created_at = ? WHERE id = ?`,
                    [
                        author,
                        authorDisplayName || null,
                        preview || null,
                        hasImage ? 1 : 0,
                        formattedTimestamp,
                        existingId,
                    ],
                    (err) => {
                        if (err) {
                            console.error("Error updating post:", err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    },
                );
            });

            // Update the index entry
            this.index.update(existingId, text);
        } else {
            // Insert new record
            const dbID: number = await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO posts (author, author_displayname, preview, has_image, discord_path, created_at) VALUES (?, ?, ?, ?, ?, ?);`,
                    [
                        author,
                        authorDisplayName || null,
                        preview || null,
                        hasImage ? 1 : 0,
                        shrinkedDiscordPath || null,
                        formattedTimestamp,
                    ],
                    function (err) {
                        if (err) {
                            console.error("Error inserting post:", err);
                            reject(err);
                        } else {
                            resolve(this.lastID);
                        }
                    },
                );
            });

            this.index.add(dbID, text);
        }
    }

    async searchPosts(
        query: string,
        limit: number = 10,
        offset: number = 0,
    ): Promise<{
        dbID: number;
        messageURL: string;
        preview: string;
        author: string;
        authorDisplayName: string;
        hasImage: boolean;
        createdAt: string;
    }[]> {
        const results = await this.index.search({ query, limit, offset });

        const ids = results.map((id) => ({ num: id }));

        return new Promise((resolve, reject) => {
            if (ids.length === 0) {
                resolve([]);
                return;
            }

            const placeholders = ids.map(() => "?").join(",");

            this.db.all(
                `SELECT id, author, author_displayname, preview, has_image, discord_path, created_at FROM posts WHERE id IN (${placeholders})`,
                ids.map((idObj) => idObj.num),
                (err, rows: any[]) => {
                    if (err) {
                        console.error(
                            `[Knowledgebase] Database query error:`,
                            err,
                        );
                        reject(err);
                        return;
                    }

                    const mappedResults = rows.map((row) => ({
                        dbID: row.id,
                        messageURL: `https://discord.com/channels/${
                            this.discordPathShrinker.decodeKey(row.discord_path)
                        }`,
                        preview: row.preview || "",
                        author: row.author,
                        authorDisplayName: row.author_displayname || "",
                        hasImage: row.has_image === 1,
                        createdAt: row.created_at,
                    }));

                    // sort by the order of `ids` against `dbID`
                    const sortedResults = [];
                    for (const idObj of ids) {
                        const match = mappedResults.find((r) =>
                            r.dbID === idObj.num
                        );
                        if (match) {
                            sortedResults.push(match);
                        }
                    }

                    resolve(sortedResults);
                },
            );
        });
    }

    private discordPathShrinker = {
        encodeKey: (
            guildId: bigint,
            channelId: bigint,
            messageId: bigint,
        ): string => {
            return `${bigintAsBase36(guildId)}.${bigintAsBase36(channelId)}.${
                bigintAsBase36(messageId)
            }`;
        },
        decodeKey: (key: string): string => {
            const parts = key.split(".");
            if (parts.length !== 3) {
                throw new Error("Invalid key format");
            }
            const strParts = {
                guildId: base36AsBigint(parts[0]!),
                channelId: base36AsBigint(parts[1]!),
                messageId: base36AsBigint(parts[2]!),
            };
            return `${strParts.guildId}/${strParts.channelId}/${strParts.messageId}`;
        },
    };

    close(): void {
        this.db.close();
    }
}

export const defaultKnowledgebase = new Knowledgebase(
    config.KNOWLEDGEBASE_DATABASE_PATH,
);

export default Knowledgebase;

function bigintAsBase36(num: bigint): string {
    return num.toString(36);
}

function base36AsBigint(str: string): bigint {
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = 0n;
    for (const char of str.toLowerCase()) {
        result = result * 36n + BigInt(digits.indexOf(char));
    }
    return result;
}
