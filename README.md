# FreshGround Field Locations — auto-refreshing dashboard

Runs with zero manual input once deployed: refreshes every ~5 minutes,
Monday-Friday 06:00-19:00 UK time (auto-adjusts for BST/GMT), and stays
frozen outside that window and on weekends.

## How it works

- `index.html` — the map page. Polls `data.json` every 60s and redraws markers.
- `data.json` — the live data. Overwritten automatically by the GitHub Action.
- `.github/workflows/refresh-data.yml` — runs every 5 min in GitHub's cloud,
  checks if it's currently inside the working window, and if so calls NetSuite
  and commits the new `data.json`.
- `netsuite-restlet/getFieldLocations.js` — the NetSuite-side script that
  the Action calls. **Needs a NetSuite admin/developer to deploy this.**
- `scripts/fetch_and_write.py` — what the Action runs to call the RESTlet.

## One-time setup (needs NetSuite admin access)

1. Deploy `netsuite-restlet/getFieldLocations.js` as a RESTlet (see comments
   in that file for exact steps). Adjust the field IDs inside it to match
   however saved search 2876's columns are actually structured — the ones
   in the file are placeholders.
2. Set up Token-Based Authentication for the role the RESTlet is deployed
   under (Setup > Integration > Manage Integrations, then Setup > Users/Roles
   > Access Tokens). This is separate from the OAuth2 login setting that
   was previously blocked — TBA doesn't need that checkbox.
3. Grant that role View access to Employee records (this was the second
   permission error hit earlier).

## One-time setup (GitHub side)

1. Create the repo (or a folder in `freshground-techhub`) and push everything
   in this folder, keeping the file structure as-is.
2. In the repo's Settings > Secrets and variables > Actions, add:
   - `NETSUITE_RESTLET_URL`
   - `NETSUITE_ACCOUNT_ID`
   - `NETSUITE_CONSUMER_KEY`
   - `NETSUITE_CONSUMER_SECRET`
   - `NETSUITE_TOKEN_ID`
   - `NETSUITE_TOKEN_SECRET`
3. Settings > Pages > enable GitHub Pages on this repo/folder.
4. Settings > Actions > General > Workflow permissions > set to
   "Read and write permissions" (so the Action can commit `data.json`).

## After that

Nothing to do. The Action runs every 5 minutes, only acts inside the working
window, and the page picks up new data within a minute of it landing. Point
EmbedSignage at the GitHub Pages URL and leave it.
