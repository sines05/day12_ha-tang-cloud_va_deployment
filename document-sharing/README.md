# VNU Document Sharing Platform

This project is a document sharing platform for Vietnam National University (VNU) students, comprising a frontend application built with React and a backend API deployed on Cloudflare Workers.

## Key Features

*   **Document Management**: Upload, search, and view academic documents.
*   **Categorization**: Documents are categorized by university, course, and lecturer.
*   **Lecturer Reviews**: Students can view and contribute reviews for lecturers.
*   **Secure Downloads**: Integration with Telegram Bot API for storing and managing document files, ensuring a secure and efficient download process.
*   **Pagination and Search**: Supports searching for documents and lecturer reviews with filtering and pagination options.

## Technologies Used

### Frontend (`vnu`)

*   **React**: A JavaScript library for building user interfaces.
*   **Vite**: A fast build tool for modern web projects.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
*   **React Router DOM**: For managing routing within the application.
*   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.

### Backend (`exam-worker`)

*   **Cloudflare Workers**: A serverless platform for deploying APIs.
*   **Hono**: An ultrafast, lightweight web framework for the Edge.
*   **Supabase**: An open-source Backend-as-a-Service (BaaS), used for the database (PostgreSQL) and authentication.
*   **Telegram Bot API**: Used to securely and efficiently store document files.
*   **Cloudflare KV**: A key-value data store used for rate limiting.
*   **Cloudflare Durable Objects**: Provides stateful coordination for implementing the rate limiter.
*   **Vitest**: A fast unit testing framework.

## Project Structure (Monorepo)

The project is structured as a monorepo with two primary packages:

*   `vnu/`: Contains the source code for the React frontend application.
*   `exam-worker/`: Contains the source code for the Cloudflare Worker backend service.

**Note**: The `package.json` file in the root directory appears to contain legacy dependencies and is not actively used for managing the project. Dependencies should be managed within their respective packages (`vnu/` and `exam-worker/`).

## Local Development Setup

### Prerequisites

*   Node.js (version 18 or higher)
*   npm
*   Cloudflare Account
*   Supabase Account
*   Telegram Bot Token and Channel ID

### 1. Install Dependencies

From the project root, run the following commands to install dependencies for both packages:

```bash
# Install frontend dependencies
npm install --prefix ./vnu

# Install backend dependencies
npm install --prefix ./exam-worker
```

### 2. Configure Backend (`exam-worker`)

#### 2.1. Cloudflare Resources

The backend uses a KV Namespace and a Durable Object for rate limiting.

1.  **Create KV Namespace**: Run the following command to create the required KV namespace for storing rate limit data.
    ```bash
    npx wrangler kv:namespace create RATE_LIMIT_STORE
    ```
2.  **Update `wrangler.jsonc`**: The command will output an `id`. Copy this `id` and paste it into the `exam-worker/wrangler.jsonc` file, replacing the placeholder value.

    ```jsonc
    // exam-worker/wrangler.jsonc
    "kv_namespaces": [
        {
            "binding": "RATE_LIMIT_STORE",
            "id": "YOUR_NEWLY_CREATED_KV_ID" 
        }
    ],
    ```

The `RATE_LIMITER` Durable Object is already defined in the code and configured in `wrangler.jsonc`. Wrangler will handle its setup during local development and deployment.

#### 2.2. Environment Variables

Create a `.dev.vars` file in the `exam-worker/` directory and add the following environment variables:

```
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
TELEGRAM_CHANNEL_ID="YOUR_TELEGRAM_CHANNEL_ID"
```

*   **`SUPABASE_URL`** and **`SUPABASE_ANON_KEY`**: Obtain these from your Supabase project settings.
*   **`TELEGRAM_BOT_TOKEN`**: Create a new Telegram bot via BotFather to get the token.
*   **`TELEGRAM_CHANNEL_ID`**: The ID of the Telegram channel where the bot will store documents. Ensure the bot is an administrator in the channel.

### 3. Run the Project

Run the frontend and backend concurrently from the project root.

```bash
# Run the backend (in a separate terminal)
npm run dev --prefix ./exam-worker
# The worker will run on http://localhost:8787

# Run the frontend (in another terminal)
npm run dev --prefix ./vnu
# The React app will run on http://localhost:5173
```

## API Endpoints (Backend)

*   `GET /api/universities`: Retrieves a list of universities.
*   `GET /api/documents`: Retrieves a list of documents with pagination, search, and filtering.
*   `GET /api/documents/:id`: Retrieves details of a specific document.
*   `POST /api/documents`: Uploads a new document.
*   `GET /api/download/file/:fileId`: Downloads a specific document file.
*   `GET /api/reviews`: Retrieves a list of lecturer reviews with search and filtering.

## Deployment

### Backend (Cloudflare Workers)

To deploy the backend, run the deploy command from the `exam-worker` directory. Ensure you have configured a production KV namespace in your Cloudflare dashboard and updated `wrangler.jsonc` accordingly.

```bash
# Navigate to the backend directory
cd exam-worker

# Deploy to Cloudflare
npm run deploy
```

### Frontend (Static Hosting)

The frontend can be deployed to any static hosting service (e.g., Cloudflare Pages, Vercel, Netlify).

```bash
# Navigate to the frontend directory
cd vnu

# Build the static files
npm run build
```

The `dist/` directory will contain the built static files ready for deployment.
