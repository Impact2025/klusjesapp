import { genkit } from 'genkit';

// Configure for OpenRouter directly
const openRouterKey = process.env.OPENROUTER_API_KEY;

export const ai = genkit({
  plugins: [],
  model: 'openai/gpt-4o-mini',
});

// If we have an OpenRouter key, configure the API endpoint
if (openRouterKey) {
  // We'll handle the OpenRouter API calls directly in the flow
  console.log('OpenRouter API key found, using OpenRouter for AI blog generation');
} else {
  console.log('No OpenRouter API key found, falling back to default configuration');
}