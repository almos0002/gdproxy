# Google Drive Video Proxy with Cloudflare Workers

This project creates a reverse proxy using Cloudflare Workers to stream Google Drive videos through the gdplayer.vip service.

## Features

- Convert Google Drive file IDs to streamable video URLs
- Stream videos at different quality levels (360p, 720p, 1080p)
- Simple web interface for testing and generating links
- Proxy all requests through Cloudflare Workers

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/get-started/) (Cloudflare Workers CLI)
- Cloudflare account

### Installation

1. Install Wrangler CLI globally:
   ```bash
   npm install -g wrangler
   ```

2. Login to your Cloudflare account:
   ```bash
   wrangler login
   ```

3. Configure your `wrangler.toml` file:
   - Update the `zone_name` to your actual domain
   - Optionally, change the worker name

### Development

To test locally:

```bash
wrangler dev
```

### Deployment

To deploy to Cloudflare Workers:

```bash
wrangler publish
```

## Usage

1. Access the web interface at your worker URL
2. Enter a Google Drive file ID
3. Click "Generate Stream" to create a streamable link
4. Use the watch page to view the video at different quality levels

## API Endpoints

- `GET /`: Web interface
- `GET /api/get-video?file_id=YOUR_DRIVE_ID`: Generate a stream URL
- `GET /watch/SLUG`: Watch the video in a player interface
- `GET /stream/SLUG/QUALITY`: Stream the actual video (quality: 360, 720, 1080)

## Notes

- This is for educational purposes only
- Respect terms of service for all third-party services used
- Be aware of the limitations of Cloudflare Workers (CPU time, memory, etc.)
