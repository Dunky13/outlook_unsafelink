# Chrome Web Store publishing — Un-Safelink Outlook

Last updated: 2026-10-20.

Existing listing: https://chromewebstore.google.com/detail/pgchfppjhohfigdgfnglmbbeiingokmi/

The extension replaces encoded Microsoft Safe Links with their original URLs on the Outlook and Gmail pages listed in `manifest.json`. It declares no optional permissions or separate host permissions; its content scripts need access to the listed mail pages to replace these links. This migration changes publishing automation only. Listing copy, screenshots, privacy disclosures, visibility, and distribution settings are managed in the Developer Dashboard and were not changed or independently verified here.

## Publishing configuration

The build workflow uses Chrome Web Store API v2 through the locked `chrome-webstore-upload@6.0.1` library on Node.js 26.12.1. It retains the existing `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN` repository secrets. The `CHROME_PUBLISHER_ID` repository variable must contain the publisher account ID from the Developer Dashboard, not the extension ID or display name. It is configured for this repository.

Pull requests check syntax and package the extension without accessing the store. Pushes to `main` or `master` upload and submit for review. The existing `0.2.<workflow run number>` version scheme is preserved. The tested `scripts/publish-cws.mjs` checks versions, uploads, requests `DEFAULT_PUBLISH`, and reports provider status. `pnpm publish:cws --status` is read-only; the manually dispatched workflow defaults to status mode. Existing store visibility and rollout settings remain in effect.

The package includes only the manifest, content script, images, and license. See the [migration handoff](docs/cws-api-v2.md) or its [offline HTML version](docs/cws-api-v2.html) for evidence and release checks. API acceptance, Google review, and public availability are distinct states.

Documentation-only pushes no longer trigger publication. The OAuth credentials were renewed on October 20 and the v2 status check succeeds. The first authenticated upload rejected malformed metadata in the three smaller PNG icons. See the [icon repair handoff](docs/cws-icon-metadata.md) and [offline HTML version](docs/cws-icon-metadata.html). Verify the corrected package in the next publication run.
