# Audiobook Listener - Simplified Deployment

## Branch Structure

**gh-pages** is now the main development branch. This simplifies the deployment process.

## Development Workflow

1. **Make changes** to your code in the `src/` directory
2. **Build** the app:
   ```bash
   npm run build
   ```
3. **Copy build to root** for GitHub Pages:
   ```powershell
   Copy-Item -Path build/* -Destination . -Recurse -Force
   ```
4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin gh-pages
   ```

## Quick Deploy Script

For convenience, you can use this one-liner to build and copy:

```powershell
npm run build; Copy-Item -Path build/* -Destination . -Recurse -Force; git add asset-manifest.json index.html service-worker.js static/ favicon.svg; git commit -m "Deploy update"; git push origin gh-pages
```

## GitHub Pages Settings

The site is deployed from the `gh-pages` branch, serving files from the root (`/`).

- **Live URL**: https://gabby-f.github.io/AudiobookListener/
- **Branch**: gh-pages
- **Folder**: / (root)

## Notes

- The `build/` folder is tracked in git on this branch (unlike typical React projects)
- Root level files (`index.html`, `service-worker.js`, etc.) are copies from `build/` for GitHub Pages
- `node_modules/` is still gitignored to save space
