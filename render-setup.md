# Deploying to Render

This guide explains how to deploy this application to Render while properly configuring your API keys.

## Setting Up Environment Variables on Render

1. Create a new Web Service on Render and connect it to your GitHub repository.

2. In the "Environment" section of your Render dashboard, add the following environment variables:

   - `PORT`: 8080 (Render's default port)
   - `NODE_ENV`: production
   - `OPENAI_API_KEY`: Your actual OpenAI API key
   - `OPENAI_MODEL`: gpt-4-turbo (or your preferred model)
   - Any other environment variables your application needs

3. Build Command: `npm install`

4. Start Command: `node src/server.js`

## Important Notes

- **Never commit API keys directly to your code**. Always use environment variables.
- The application is configured to read API keys from environment variables, so it will work correctly when deployed to Render.
- Make sure your GitHub repository doesn't contain any actual API keys before pushing.

## Testing Your Deployment

After deployment, you can verify that your application is using the environment variables correctly by checking the logs in the Render dashboard.

## Troubleshooting

- If you're getting authentication errors with the OpenAI API, double-check that you've entered the correct API key in Render's environment variables.
- If the application fails to start, check the logs for any missing environment variables or other configuration issues. 