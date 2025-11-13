import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "https://pms.miscos.in/pms/client/",
  plugins: [react()],
})
