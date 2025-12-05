# Airtable-Connected Dynamic Form Builder

A full-stack MERN application that allows users to create dynamic forms using Airtable fields, apply conditional logic, and sync responses between Airtable and MongoDB.

## Features

- ✅ **Airtable OAuth Login** - Secure authentication using Airtable OAuth 2.0
- ✅ **Form Builder** - Create custom forms by selecting Airtable bases, tables, and fields
- ✅ **Conditional Logic** - Show/hide questions based on previous answers (AND/OR operators)
- ✅ **Form Viewer** - Fill out forms with real-time conditional logic evaluation
- ✅ **Response Management** - Save responses to both Airtable and MongoDB
- ✅ **Response Listing** - View all form responses from MongoDB
- ✅ **Webhook Sync** - Keep MongoDB in sync with Airtable changes

## Tech Stack

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **OAuth**: Airtable OAuth 2.0
- **API Integration**: Airtable REST API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Airtable account with OAuth app created

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd newtask
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

Or manually:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Airtable OAuth Setup

1. Go to [Airtable Developers](https://airtable.com/developers/web/guides/oauth-integration)
2. Create a new OAuth app
3. Set the redirect URI to: `http://localhost:5000/api/auth/airtable/callback` (for development)
4. Note down your **Client ID** and **Client Secret**

### 4. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB locally
- Start MongoDB service
- Connection string: `mongodb://localhost:27017/form-builder`

**Option B: MongoDB Atlas**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and database
- Get your connection string

### 5. Environment Configuration

**Backend (server/.env):**
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-random-secret-key
MONGODB_URI=mongodb://localhost:27017/form-builder
AIRTABLE_CLIENT_ID=your-client-id
AIRTABLE_CLIENT_SECRET=your-client-secret
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
CLIENT_URL=http://localhost:3000
```

**Frontend (client/.env):**
```bash
cp client/.env.example client/.env
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 6. Run the Application

**Development mode (runs both server and client):**
```bash
npm run dev
```

**Or run separately:**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
newtask/
├── server/                 # Backend Express server
│   ├── models/            # MongoDB models (User, Form, Response)
│   ├── routes/            # API routes (auth, forms, airtable, webhooks)
│   ├── utils/             # Utility functions (Airtable API, conditional logic)
│   ├── index.js           # Server entry point
│   └── package.json
├── client/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## Data Models

### User Model
- `airtableUserId` - Airtable user ID
- `email` - User email
- `name` - User name
- `accessToken` - OAuth access token
- `refreshToken` - OAuth refresh token
- `loginTimestamp` - Last login time

### Form Model
- `owner` - Reference to User
- `airtableBaseId` - Airtable base ID
- `airtableTableId` - Airtable table ID
- `formName` - Form name
- `questions` - Array of question objects with:
  - `questionKey` - Internal identifier
  - `airtableFieldId` - Airtable field ID
  - `label` - Question label
  - `type` - Field type (singleLineText, multilineText, singleSelect, etc.)
  - `required` - Boolean
  - `conditionalRules` - Conditional logic rules
  - `options` - Available options (for select fields)

### Response Model
- `formId` - Reference to Form
- `airtableRecordId` - Airtable record ID
- `answers` - JSON object with form answers
- `deletedInAirtable` - Boolean flag for deleted records

## Supported Field Types

The application supports the following Airtable field types:
- **singleLineText** - Short text input
- **multilineText** - Long text/textarea
- **singleSelect** - Single choice dropdown
- **multipleSelects** - Multiple choice checkboxes
- **multipleAttachments** - File upload (basic support)

All other Airtable field types are automatically filtered out.

## Conditional Logic

Conditional logic allows you to show/hide questions based on previous answers.

### Condition Structure
```javascript
{
  logic: "AND" | "OR",
  conditions: [
    {
      questionKey: "role",
      operator: "equals" | "notEquals" | "contains",
      value: "Engineer"
    }
  ]
}
```

### Example
- Show `githubUrl` only if `role` equals "Engineer"
- Show `portfolioUrl` if `role` equals "Designer" OR "Developer"

The `shouldShowQuestion()` function evaluates conditions in real-time as users fill out the form.

## API Endpoints

### Authentication
- `GET /api/auth/airtable` - Initiate OAuth flow
- `GET /api/auth/airtable/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Airtable Integration
- `GET /api/airtable/bases` - Get all bases
- `GET /api/airtable/bases/:baseId/tables` - Get tables in a base
- `GET /api/airtable/bases/:baseId/tables/:tableId/fields` - Get fields in a table

### Forms
- `POST /api/forms` - Create a new form
- `GET /api/forms` - Get all forms for authenticated user
- `GET /api/forms/:formId` - Get a specific form
- `PUT /api/forms/:formId` - Update a form
- `DELETE /api/forms/:formId` - Delete a form
- `POST /api/forms/:formId/submit` - Submit form response
- `GET /api/forms/:formId/responses` - Get all responses for a form
- `POST /api/forms/:formId/evaluate` - Evaluate conditional logic

### Webhooks
- `POST /webhooks/airtable` - Airtable webhook handler

## Webhook Configuration

To set up Airtable webhooks:

1. Go to your Airtable base settings
2. Navigate to Webhooks section
3. Create a new webhook
4. Set the webhook URL to: `https://your-backend-url.com/webhooks/airtable`
5. Select the events you want to listen to (record updates, deletions)

The webhook handler will:
- Update MongoDB records when Airtable records are updated
- Mark records as `deletedInAirtable: true` when deleted (soft delete)

## Deployment

### Frontend (Vercel/Netlify)

1. Build the React app:
```bash
cd client
npm run build
```

2. Deploy the `build` folder to Vercel or Netlify
3. Update `REACT_APP_API_URL` in environment variables

### Backend (Render/Railway)

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables:
   - `MONGODB_URI`
   - `AIRTABLE_CLIENT_ID`
   - `AIRTABLE_CLIENT_SECRET`
   - `AIRTABLE_REDIRECT_URI` (update to production URL)
   - `CLIENT_URL` (update to production frontend URL)
   - `SESSION_SECRET`

4. Update Airtable OAuth redirect URI to production callback URL

## Testing

The conditional logic function is pure and testable:

```javascript
const { shouldShowQuestion } = require('./server/utils/conditionalLogic');

const rules = {
  logic: 'AND',
  conditions: [
    { questionKey: 'role', operator: 'equals', value: 'Engineer' }
  ]
};

const answers = { role: 'Engineer' };
console.log(shouldShowQuestion(rules, answers)); // true
```

## Troubleshooting

### OAuth Issues
- Ensure redirect URI matches exactly in Airtable OAuth settings
- Check that `AIRTABLE_CLIENT_ID` and `AIRTABLE_CLIENT_SECRET` are correct
- Verify CORS settings allow your frontend URL

### MongoDB Connection
- Check MongoDB is running (if local)
- Verify connection string format
- Check network access (if using Atlas)

### Form Submission Errors
- Verify Airtable field IDs match
- Check field types are supported
- Ensure access token hasn't expired

## License

ISC

## Author

Built for MERN Stack Interview Task

