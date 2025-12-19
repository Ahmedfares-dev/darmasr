# DarMasr Elections App

A comprehensive election management system for compound buildings, built with Node.js, Express, MongoDB, and React.

## Features

- 🏢 **Building Management**: Create and manage buildings in the compound
- 🗳️ **Election Management**: Create elections for each building with unique numbers
- 👥 **Resident Management**: Manage residents for each building
- 📝 **Nomination System**: Residents can nominate themselves with statements, qualifications, and goals
- ✅ **Approval Workflow**: Admin can approve or reject nominations
- 🗳️ **Voting System**: Residents can vote during election period (one vote per resident)
- 🏆 **Winner Management**: Automatic vote tallying and winner confirmation workflow
- 📊 **Dashboard**: View elections, nominations, votes, and winners

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: React, React Router, Axios
- **Build Tool**: Vite

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/darmasr
   JWT_SECRET=your-secret-key-change-this-in-production
   NODE_ENV=development
   ```

5. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

## Running the Application

### Development Mode

Run both backend and frontend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend:**
```bash
npm run server
```

**Frontend:**
```bash
npm run client
```

The backend will run on `http://localhost:5000`
The frontend will run on `http://localhost:5173`

### Production Mode with PM2

PM2 is a process manager for Node.js applications that keeps your application running in the background and automatically restarts it if it crashes.

**Quick Start (Recommended):**
```bash
# One command to start everything (checks env, creates logs, starts PM2)
npm start
# or
./start.sh
```

**Manual Start:**

**1. Prerequisites:**
```bash
npm install -g pm2
```

**2. Verify Environment Variables:**
```bash
npm run check-env
```

**3. Start the application:**
```bash
# Development mode (runs both API + Client dev server)
npm run pm2:start

# Production mode (builds frontend, serves from backend)
npm run pm2:start:prod
```

**4. Verify Both Processes Are Running:**
```bash
npm run verify-pm2
```

You should see **2 processes** in development mode:
- `darmasr-api` - Backend API (port 5000)
- `darmasr-client` - Frontend Vite dev server (port 5173)

**5. Useful PM2 Commands:**
```bash
# Check status
npm run pm2:status

# View all logs
npm run pm2:logs

# View specific logs
npm run pm2:logs:api      # Backend logs only
npm run pm2:logs:client   # Frontend logs only

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Delete from PM2
npm run pm2:delete

# Monitor (real-time monitoring)
npm run pm2:monit

# Verify both processes
npm run verify-pm2
```

**6. Environment Variables:**
Make sure your `.env` file is properly configured. You can use `.env.example` as a template:
```bash
cp .env.example .env
# Then edit .env with your actual values
```

**Required Environment Variables:**
- `JWT_SECRET` - Secret key for JWT token generation
- `MONGODB_URI` - MongoDB connection string
- `S3_ACCESS_KEY` - S3 access key for file uploads
- `S3_SECRET_KEY` - S3 secret key for file uploads
- `S3_BUCKET` - S3 bucket name

**Optional Environment Variables:**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `S3_REGION` - S3 region (default: us-central-1)
- `S3_ENDPOINT` - S3 endpoint URL
- `S3_VERIFY_BUCKET` - Verify bucket exists (default: true)
- `S3_USE_ACL` - Use ACL for S3 (default: false)
- `VITE_API_URL` - Frontend API URL

**Access Points:**
- Backend API: `http://your-server:5000`
- Frontend: `http://your-server:5173`
- Health Check: `http://your-server:5000/api/health`

**PM2 Configuration:**
The PM2 configuration is in `ecosystem.config.js`. It includes:
- Automatic restart on crash
- Memory limits (1GB for API, 500MB for client)
- Log file management
- Environment-specific settings
- Absolute paths for reliable server deployment

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## API Endpoints

### Buildings
- `GET /api/buildings` - Get all buildings
- `GET /api/buildings/:id` - Get building by ID
- `POST /api/buildings` - Create building
- `PUT /api/buildings/:id` - Update building
- `DELETE /api/buildings/:id` - Delete building

### Elections
- `GET /api/elections` - Get all elections (optional query: `buildingId`)
- `GET /api/elections/:id` - Get election details
- `POST /api/elections` - Create election
- `PUT /api/elections/:id` - Update election
- `POST /api/elections/:id/tally` - Tally votes and determine winner
- `DELETE /api/elections/:id` - Delete election

### Residents
- `GET /api/residents` - Get all residents (optional query: `buildingId`)
- `GET /api/residents/:id` - Get resident by ID
- `POST /api/residents` - Create resident
- `PUT /api/residents/:id` - Update resident
- `DELETE /api/residents/:id` - Delete resident

### Nominations
- `GET /api/nominations` - Get all nominations (optional queries: `electionId`, `status`)
- `GET /api/nominations/:id` - Get nomination by ID
- `POST /api/nominations` - Create nomination (self-nomination)
- `POST /api/nominations/:id/approve` - Approve nomination
- `POST /api/nominations/:id/reject` - Reject nomination
- `PUT /api/nominations/:id` - Update nomination
- `DELETE /api/nominations/:id` - Delete nomination

### Votes
- `GET /api/votes` - Get all votes (optional query: `electionId`)
- `GET /api/votes/:id` - Get vote by ID
- `POST /api/votes` - Cast a vote
- `GET /api/votes/election/:electionId/count` - Get vote count for election
- `DELETE /api/votes/:id` - Delete vote

### Winners
- `GET /api/winners` - Get all winners (optional queries: `status`, `buildingId`)
- `GET /api/winners/:id` - Get winner by ID
- `GET /api/winners/election/:electionId` - Get winner by election ID
- `POST /api/winners/:id/confirm` - Confirm winner
- `POST /api/winners/:id/reject` - Reject winner
- `GET /api/winners/building/:buildingId/confirmed` - Get confirmed winners for building

## Workflow

1. **Create Buildings**: Add buildings to the compound
2. **Add Residents**: Register residents for each building
3. **Create Elections**: Create elections for buildings with start/end dates
4. **Nominations**: Residents nominate themselves before election starts
5. **Approval**: Admin approves/rejects nominations
6. **Voting**: During election period, residents vote (one vote per resident)
7. **Tally**: After election ends, tally votes to determine winner
8. **Confirmation**: Admin confirms the winner

## Data Models

### Building
- `number` (String, unique)
- `name` (String)
- `address` (String)
- `status` (Enum: active, inactive)

### Resident
- `buildingId` (ObjectId, ref: Building)
- `fullName` (String)
- `unit` (String)
- `email` (String)
- `phone` (String)
- `idDocument` (String)
- `isActive` (Boolean)

### Election
- `buildingId` (ObjectId, ref: Building)
- `number` (Number, unique per building)
- `title` (String)
- `description` (String)
- `startDate` (Date)
- `endDate` (Date)
- `status` (Enum: scheduled, running, ended, winner_pending, winner_confirmed)

### Nomination
- `electionId` (ObjectId, ref: Election)
- `residentId` (ObjectId, ref: Resident)
- `statement` (String)
- `qualifications` (String)
- `goals` (String)
- `status` (Enum: pending, approved, rejected)

### Vote
- `electionId` (ObjectId, ref: Election)
- `residentId` (ObjectId, ref: Resident)
- `nominationId` (ObjectId, ref: Nomination)
- `castAt` (Date)

### Winner
- `electionId` (ObjectId, ref: Election, unique)
- `nominationId` (ObjectId, ref: Nomination)
- `voteCount` (Number)
- `status` (Enum: pending, confirmed, rejected)
- `confirmedBy` (ObjectId, ref: Resident)
- `confirmedAt` (Date)

## License

ISC

