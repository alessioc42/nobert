# nobert

To install dependencies:

```bash
bun install
```

To run:

```bash
bun dev
```

example compose:

```yaml
services:
  nobert:
    image: ghcr.io/alessioc42/nobert:latest
    container_name: nobert
    restart: unless-stopped
    environment:
      DISCORD_TOKEN: your_discord_token
      DISCORD_CLIENT_ID: your_discord_client_id
      DISCORD_GUILD_ID: your_discord_guild_id
      MEMEBASE_IMAGE_COMPRESSION_QUALITY: 60    # optional
      MEMEBASE_MAX_IMAGE_DIMENSION: 768         # optional
      MEMEBASE_PATH: ./database/memebase.db     # optional
    volumes:
      - /etc/nobert/database:/database

```
