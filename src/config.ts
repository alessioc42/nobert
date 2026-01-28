// @ts-nocheck

require("dotenv").config();

/**
 * TO BE CONFIGURED:
 *  - DISCORD_TOKEN: Discord bot token
 *  - DISCORD_CLIENT_ID: Discord bot client ID
 *  - DISCORD_GUILD_ID: Discord server (guild) ID
 *  - MEMEBASE_PATH: Path to the database file (default: ./database/memebase.db)
 *  - MEMEBASE_IMAGE_COMPRESSION_QUALITY: Image compression quality (default: 60)
 *  - MEMEBASE_MAX_IMAGE_DIMENSION: Maximum image dimension (width or height) in pixels (default: 768)
 */

const config: {
    DISCORD_TOKEN: string;
    DISCORD_CLIENT_ID: string;
    DISCORD_GUILD_ID: string;
    MEMEBASE_PATH: string;
    MEMEBASE_IMAGE_COMPRESSION_QUALITY: number;
    MEMEBASE_MAX_IMAGE_DIMENSION: number;
} = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
    MEMEBASE_PATH: process.env.MEMEBASE_PATH || "./database/memebase.db",
    MEMEBASE_IMAGE_COMPRESSION_QUALITY:
        process.env.MEMEBASE_IMAGE_COMPRESSION_QUALITY
            ? parseInt(process.env.MEMEBASE_IMAGE_COMPRESSION_QUALITY)
            : 60,
    MEMEBASE_MAX_IMAGE_DIMENSION: process.env.MEMEBASE_MAX_IMAGE_DIMENSION
        ? parseInt(process.env.MEMEBASE_MAX_IMAGE_DIMENSION)
        : 768,
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
