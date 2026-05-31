# My API

A clean, extensible NestJS API for personal usage with built-in support for Bearer token authentication and in-memory caching. Make your own endpoints for anything you want: AI calls, getting data, calling webhooks for apps, devices or testing.

This example include parsers for YouTube and Telegram channels, but you can easily add more by following the modular structure.

## Features

- ✅ **Extendable structure**: Easily add new endpoints with a modular design
- ✅ **Bearer Token Authentication**: Optional API security via bearer tokens from environment variables
- ✅ **In-Memory Caching**: Fast response times with configurable TTL
- ✅ **Redis/Memcache Support**: Optional distributed caching (future implementation)
- ✅ **Swagger Documentation**: Interactive API documentation at `/api/docs`
- ✅ **Comprehensive Tests**: Unit tests, integration tests, and E2E tests
- ✅ **Docker Support**: Multi-stage Dockerfile and docker-compose for easy deployment
- ✅ **CI/CD Pipelines**: GitHub Actions for testing and Docker image publishing
- ✅ **Clean Architecture**: Modular design with clear separation of concerns

## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/talyguryn/my-api
   cd my-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (`.env`)
   ```env
   PORT=3000
   NODE_ENV=development

   # Optional: Add a bearer token to protect your API
   API_BEARER_TOKEN=your_secret_token_here

   # Cache configuration (memory is default)
   CACHE_DRIVER=memory
   CACHE_TTL=3600
   ```

### Running the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

#### Using Docker Compose
```bash
docker-compose up -d
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api/docs`

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### YouTube
- **GET** `/api/youtube/channel?channel=@channelName` - Get YouTube channel information
  - Supports: `@username`, channel ID, or full URL
  - Returns: subscribers, videos, views, description, avatar

### Telegram
- **GET** `/api/telegram/channel?channel=telegram` - Get Telegram channel information
  - Returns: subscribers, title, description, avatar

### Query Parameters
- `channel` (required) - Channel identifier
- `forceRefresh` (optional) - Force cache refresh (default: false)

### Authentication

All endpoints (except health check) are protected by Bearer token authentication when `API_BEARER_TOKEN` is configured and `@ApiSecurity('bearer')` is used in the controller. Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer your_secret_token_here" \
  http://localhost:3000/api/youtube/channel?channel=@google
```

If `API_BEARER_TOKEN` is not set in `.env`, all requests are allowed.

## Project Structure

```
src/
├── config/              # Configuration management
├── decorators/          # Custom decorators (@Public)
├── guards/              # Authentication guards
├── modules/
│   ├── cache/          # Caching service (in-memory)
│   ├── youtube/        # YouTube parser module
│   └── telegram/       # Telegram parser module
├── app.controller.ts   # Main app controller
├── app.module.ts       # Main app module
└── main.ts             # Application entry point

test/                   # E2E tests
docker/                 # Dockerfile for containerization
.github/workflows/      # GitHub Actions CI/CD
```

## Testing

```bash
# Unit tests
npm test

# Unit tests with coverage
npm test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Caching

The application includes an in-memory cache service. Cache entries automatically expire after the configured TTL (default: 3600 seconds / 1 hour).

### Cache Keys Format
- YouTube: `youtube:{channel_identifier}`
- Telegram: `telegram:{channel_name}`

### Clearing Cache

To force refresh data without waiting for TTL expiration:

```bash
GET /api/youtube/channel?channel=@google&forceRefresh=true
```

## Adding New Modules

To add a new module (e.g., for another social media platform or API), follow these steps:

1. **Create module structure**
   ```
   src/modules/newservice/
   ├── newservice.module.ts
   ├── newservice.controller.ts
   ├── newservice.service.ts
   ├── newservice.dto.ts
   ├── newservice.service.spec.ts
   └── newservice.controller.spec.ts
   ```

2. **Implement Service** with caching support
3. **Create DTOs** for request/response validation
4. **Add Controller** with Swagger documentation
5. **Register Module** in `app.module.ts`
6. **Write Tests** for service and controller

Example: Check `src/modules/youtube/` for reference implementation.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `API_BEARER_TOKEN` | `` | Bearer token for API authentication (optional) |
| `CACHE_DRIVER` | `memory` | Cache driver: memory, redis, memcache |
| `CACHE_TTL` | `3600` | Cache time-to-live in seconds |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `MEMCACHE_SERVERS` | `localhost:11211` | Memcache servers (comma-separated) |
| `LOG_LEVEL` | `debug` | Logging level |

## Error Handling

The API returns standard HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Invalid or missing bearer token
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Failed to fetch data from source

## Performance Considerations

- **Caching**: Responses are cached in memory to reduce external API calls
- **Timeouts**: HTTP requests have 15-second timeouts
- **Validation**: Input validation prevents malformed requests
- **Health Checks**: Docker and application level health checks ensure reliability

## Future Enhancements

- [ ] Redis support for distributed caching
- [ ] Memcache support for distributed caching
- [ ] ChatGPT API integration
- [ ] Rate limiting
- [ ] Request logging and monitoring
- [ ] Scheduled cache cleanup
- [ ] Database integration for historical data
- [ ] WebSocket support for real-time updates

## License

MIT

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.
