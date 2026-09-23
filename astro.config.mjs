// Static site generated from content/. See CLAUDE.md section 2 for commands.
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aicitizenaction.org',
  srcDir: './site',
  publicDir: './site/public',
  outDir: process.env.AICA_OUT ?? './dist',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false }
});
