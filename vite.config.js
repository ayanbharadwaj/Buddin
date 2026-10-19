import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The /api/anthropic dev proxy that used to live here injected
// ANTHROPIC_API_KEY into every proxied request, which handed any page or
// script running in the dev browser unauthenticated, unmetered access to the
// Anthropic API on the developer's key. It had zero callers — nothing in src/,
// components/, lib/ or main.jsx ever fetched that path — and it contradicted
// the README's promise that the key never reaches the browser. Removed.
export default defineConfig({
  plugins: [react()],
})
