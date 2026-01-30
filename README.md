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

Full list of environment variables can be found in [config.ts](src/config.ts)
```yaml
services:
  nobert:
    image: ghcr.io/alessioc42/nobert:latest
    container_name: nobert
    restart: unless-stopped
    environment:
      DISCORD_TOKEN: your_discord_token         # required
      DISCORD_CLIENT_ID: your_discord_client_id # required
      DISCORD_GUILD_ID: your_discord_guild_id   # required
      MEMEBASE_IMAGE_COMPRESSION_QUALITY: 60    # optional
      MEMEBASE_MAX_IMAGE_DIMENSION: 768         # optional
      MEMEBASE_PATH: ./database/memebase.db     # optional
      OLLAMA_API_URL: http://ollama:11434       # required
      OLLAMA_MODEL: gemma3:4b                   # optional
      KNOWLEDGEBASE_CHANNEL_IDS: channel_id     # optional

    volumes:
      - /etc/nobert/database:/database
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ./ollama-data:/root/.ollama
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 4G
```
