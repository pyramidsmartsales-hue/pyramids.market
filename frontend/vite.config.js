// Vite configuration to ensure the build works on static hosts.
//
// - Sets the base URL to '/' so asset paths resolve correctly when
//   deployed at the root of a domain. Without this, Vite may emit
//   relative references that break on some hosts.
// - Includes the React plugin so JSX and Fast Refresh work.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use the root of the domain as the base for all assets.  This is
  // important for static hosting platforms (e.g. Render) where the
  // dashboard is served from the top-level URL. If you deploy the
  // frontend under a sub-path, adjust this value accordingly.
  base: '/',
});