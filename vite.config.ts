import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Get key from .env or environment variables
  let apiKey = env.API_KEY || process.env.API_KEY || '';
  
  // Clean the key (remove quotes if user added them by mistake, and trim whitespace)
  apiKey = apiKey.replace(/["']/g, "").trim();

  // --- DEBUGGING LOGS ---
  console.log("\n\n=========================================================");
  console.log(" 🚀 STARTING VITE SERVER");
  console.log("=========================================================");
  if (apiKey && !apiKey.includes('ضع_مفتاح')) {
    console.log(" ✅ SUCCESS: API_KEY loaded!");
    console.log("    Length: " + apiKey.length + " characters");
    console.log("    Preview: " + apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));
  } else {
    console.log(" ❌ ERROR: API_KEY is MISSING.");
    console.log("    OPTION 1: Open 'api_key.txt' and paste your key there.");
    console.log("    OPTION 2: Create a '.env' file with API_KEY=your_key");
  }
  console.log("=========================================================\n\n");
  
  return {
    plugins: [react()],
    base: '/Clipboard-Manager/',
    define: {
      // Polyfill process.env.API_KEY for the app
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})