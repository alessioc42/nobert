// @ts-nocheck
import dotenv from 'dotenv';

dotenv.config( {
    path: ".env.test"
});

/**
 * TO BE CONFIGURED:
 *  - DISCORD_TOKEN: Discord bot token
 *  - DISCORD_CLIENT_ID: Discord bot client ID
 *  - DISCORD_GUILD_ID: Discord server (guild) ID
 * 
 *  - MEMEBASE_INDEXING_CHANNELS: Comma-separated list of channel names/ids to index memes from (default: "meme,halloffame")
 *  - MEMEBASE_PATH: Path to the database file (default: ./database/memebase.db)
 *  - MEMEBASE_IMAGE_COMPRESSION_QUALITY: Image compression quality (default: 60)
 *  - MEMEBASE_MAX_IMAGE_DIMENSION: Maximum image dimension (width or height) in pixels (default: 768)
 * 
 *  - OLLAMA_MODEL: Ollama model to use (default: gemma3:4b)
 *  - OLLAMA_API_URL: URL of the Ollama API (default: http://localhost:11434)
 */

const config: {
    DISCORD_TOKEN: string;
    DISCORD_CLIENT_ID: string;
    DISCORD_GUILD_ID: string;
    MEMEBASE_INDEXING_CHANNELS: string;
    MEMEBASE_PATH: string;
    MEMEBASE_IMAGE_COMPRESSION_QUALITY: number;
    MEMEBASE_MAX_IMAGE_DIMENSION: number;
    OLLAMA_MODEL: string;
    OLLAMA_API_URL: string;
} = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
    MEMEBASE_INDEXING_CHANNELS: process.env.MEMEBASE_INDEXING_CHANNELS || "meme,halloffame",
    MEMEBASE_PATH: process.env.MEMEBASE_PATH || "./database/memebase.db",
    MEMEBASE_IMAGE_COMPRESSION_QUALITY:
        process.env.MEMEBASE_IMAGE_COMPRESSION_QUALITY
            ? parseInt(process.env.MEMEBASE_IMAGE_COMPRESSION_QUALITY)
            : 60,
    MEMEBASE_MAX_IMAGE_DIMENSION: process.env.MEMEBASE_MAX_IMAGE_DIMENSION
        ? parseInt(process.env.MEMEBASE_MAX_IMAGE_DIMENSION)
        : 768,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || "gemma3:4b",
    OLLAMA_API_URL: process.env.OLLAMA_API_URL || "http://localhost:11434",
};

for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
        console.error(
            `Warning: Configuration variable ${key} is not set. Exiting.`,
        );
        process.exit(1);
    }
}

export default config;
