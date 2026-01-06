

## Project Specification

This project is a NestJS-based API for managing learned words and associated audio files. It uses MongoDB for data storage and supports file uploads, health checks, and pagination.

### Main Features

- **Words Management**: Create, update, list, and delete words, each with associated metadata and audio files.
- **File Uploads**: Audio files are uploaded and stored in a configurable directory.
- **Health Checks**: HTTP and MongoDB health endpoints using NestJS Terminus.
- **Pagination**: List words with pagination support.
- **Swagger API Documentation**: Available at `/api` endpoint.

### Environment Variables

The application uses the following environment variables (see `env-example`):

```env
PORT=3000                # Server port
MONGO_URI=mongodb://localhost:27017/talkiemartin  # MongoDB connection string
FILES_PATH=uploads       # Directory for uploaded files
```

### Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `env-example` to `.env` and fill in your values.

3. **Run the project**
   ```bash
   npm run start         # Start in development
   npm run dev           # Start in watch mode
   npm run start:prod    # Start in production
   ```

4. **Run tests**
   ```bash
   npm run test          # Unit tests
   npm run test:e2e      # End-to-end tests
   npm run test:cov      # Test coverage
   ```

5. **API Documentation**
   - Visit `http://localhost:PORT/api` for Swagger UI.

### Folder Structure

```
src/
  app.module.ts
  main.ts
  files/
    files.module.ts
    files.service.ts
  health/
    health.controller.ts
    health.module.ts
  pipes/
    file-validation.pipe.ts
  words/
    words.controller.ts
    words.module.ts
    words.service.ts
    dto/
      pagination-response.dto.ts
      pagination.dto.ts
      uodate-words.dto.ts
      word-params.dto.ts
      words-response.dto.ts
      words.dto.ts
    schemas/
      words.schema.ts
test/
  app.e2e-spec.ts
  jest-e2e.json
```

### Technologies Used

- NestJS
- MongoDB (via Mongoose)
- Swagger
- Multer (file uploads)
- Terminus (health checks)
- Class-validator & class-transformer

---

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```


- [![Bearer](https://github.com/kondrei/TalkieMartin-BE/actions/workflows/bearer.yml/badge.svg)](https://github.com/kondrei/TalkieMartin-BE/actions/workflows/bearer.yml)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
