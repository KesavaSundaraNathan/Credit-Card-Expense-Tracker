## Setup & PWA Builder Submission

1. Extract and install
   - Extract cardledger.zip
   - cd cardledger
   - npm install

2. Run locally
   - npm start
   - Opens at http://localhost:3000
   - Test light/dark theme toggle

3. Generate production build
   - npm run build
   - Verify build/ folder contains all assets

4. Submit to PWA Builder
   - Go to https://www.pwabuilder.com
   - Click "Start" → "Add your URL"
   - Enter http://localhost:3000 (or deployed URL)
   - PWA Builder scans and validates manifest.json
   - Download generated package

5. (Optional) Convert to MSIX
   - PWA Builder provides MSIX download
   - Run .msix installer on Windows 10/11
