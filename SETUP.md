# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=generate-a-random-secret-key-here
MONGODB_URI=mongodb://localhost:27017/form-builder
AIRTABLE_CLIENT_ID=your-client-id-from-airtable
AIRTABLE_CLIENT_SECRET=your-client-secret-from-airtable
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
CLIENT_URL=http://localhost:3000
```

**Frontend (`client/.env`):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Airtable OAuth Setup

1. Visit: https://airtable.com/developers/web/guides/oauth-integration
2. Click "Create a new OAuth app" (or edit your existing app)
3. Fill in:
   - **App name**: Form Builder (or any name)
   - **Redirect URI**: `http://localhost:5000/api/auth/airtable/callback` (must match exactly, no trailing slash)
   - **Scopes**: Select these scopes:
     - `data.records:read` - See the data in records
     - `data.records:write` - Create, edit, and delete records
     - `schema.bases:read` - See the structure of a base
     - `schema.bases:write` - Edit the structure of a base
4. **IMPORTANT**: Click "Save" or "Update" at the bottom of the page to save your changes
5. Copy the **Client ID** and **Client Secret** to your `server/.env` file
6. **Wait 1-2 minutes** after saving for Airtable to propagate the changes
7. Make sure you're authorizing with the same Airtable account that created the OAuth app (for development mode)

### 4. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB: https://www.mongodb.com/try/download/community
- Start MongoDB service
- Use connection string: `mongodb://localhost:27017/form-builder`

**Option B: MongoDB Atlas (Cloud)**
- Sign up: https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Create a database user
- Whitelist your IP (or use 0.0.0.0/0 for development)
- Copy connection string to `MONGODB_URI`

### 5. Run the Application

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000).

### 6. Access the Application

- Open browser: http://localhost:3000
- Click "Login with Airtable"
- Authorize the application
- You'll be redirected back to the dashboard

## Testing the Application

1. **Create a Form:**
   - Click "Create New Form"
   - Select an Airtable base
   - Select a table
   - Choose fields to include
   - Configure question labels and requirements
   - Add conditional logic (optional)
   - Save the form

2. **Fill Out a Form:**
   - Click "View Form" on any form
   - Fill in the fields
   - Conditional logic will show/hide questions in real-time
   - Submit the form

3. **View Responses:**
   - Click "View Responses" on any form
   - See all submitted responses from MongoDB

## Troubleshooting

**OAuth not working?**
- Check redirect URI matches exactly in Airtable settings
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check browser console for errors

**MongoDB connection failed?**
- Ensure MongoDB is running (if local)
- Verify connection string format
- Check network/firewall settings (if Atlas)

**Forms not loading?**
- Check backend is running on port 5000
- Verify CORS settings in server/index.js
- Check browser network tab for API errors

## Next Steps

- Set up Airtable webhooks for production
- Deploy frontend to Vercel/Netlify
- Deploy backend to Render/Railway
- Update environment variables for production URLs

