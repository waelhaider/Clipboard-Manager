import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We cast process to any to avoid TS errors if @types/node is missing in some setups
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');

  // 1. Try to get key from standard .env or environment variables
  let apiKey = env.API_KEY || (process.env as any).API_KEY || '';

  // 2. FALLBACK: If no key found, look for 'api_key.txt' (Easier for Windows users to create)
  if (!apiKey || apiKey.includes('ضع_المفتاح')) {
    try {
      const txtPath = path.resolve(cwd, 'api_key.txt');
      if (fs.existsSync(txtPath)) {
        const fileContent = fs.readFileSync(txtPath, 'utf-8').trim();
        // Only use it if it looks like a real key (not the placeholder instructions)
        if (fileContent && !fileContent.includes('ضع_مفتاح')) {
            apiKey = fileContent;
            console.log(" ℹ️  Loaded API Key from api_key.txt");
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  }
  
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