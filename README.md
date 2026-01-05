# Family Quest Dashboard

A gamified task management dashboard for tracking your family's Habitica progress together. Supports up to 9 family members with secure, encrypted storage of API credentials.

## Features

- Track multiple family members' Habitica stats, tasks, and achievements
- Secure AES encryption for API credentials
- Real-time sync with Habitica API
- Responsive design for desktop and mobile
- Task management with group task support
- Demo mode for testing

## Development

### Prerequisites

Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Setup

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd family-quest-companion

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy to Vercel

This project is ready to deploy to Vercel. Follow these steps:

1. **Install Vercel CLI** (optional, for CLI deployment):
   ```sh
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Vercel will automatically detect the Vite configuration
   - Click "Deploy"

3. **Deploy via Vercel CLI**:
   ```sh
   vercel
   ```

The project includes a [vercel.json](vercel.json) configuration file that:
- Sets the build command to `npm run build`
- Configures the output directory as `dist`
- Sets up proper SPA routing (all routes serve index.html for client-side routing)
