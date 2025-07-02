import { defineConfig } from 'vite'
import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  server: {
    allowedHosts: ["https://declarative-document-updates-demo-production.up.railway.app/"]
  }
})