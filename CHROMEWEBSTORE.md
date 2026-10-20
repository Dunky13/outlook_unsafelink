# Chrome Web Store publishing — Un-Safelink Outlook

Last updated: 2026-10-20.

Existing listing: https://chromewebstore.google.com/detail/pgchfppjhohfigdgfnglmbbeiingokmi/

The extension replaces encoded Microsoft Safe Links with their original URLs on the Outlook and Gmail pages listed in `manifest.json`. It declares no optional permissions or separate host permissions; its content scripts need access to the listed mail pages to replace these links. This migration changes publishing automation only. Listing copy, screenshots, privacy disclosures, visibility, and distribution settings are managed in the Developer Dashboard and were not changed or independently verified here.

## Publishing configuration

The build workflow uses Chrome Web Store API v2 through `chrome-webstore-upload-cli@4.0.2` on Node.js 24. It retains the existing `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN` repository secrets. The `CHROME_PUBLISHER_ID` repository variable must contain the publisher account ID from the Developer Dashboard, not the extension ID or display name. It is configured for this repository.

Pull requests check syntax and package the extension without accessing the store. Pushes to `main` or `master` upload and submit for review. The existing `0.2.<workflow run number>` version scheme is preserved. Running the CLI without a subcommand requests `DEFAULT_PUBLISH`; `upload` alone would leave a draft. Existing store visibility and rollout settings remain in effect.

The package includes only the manifest, content script, images, and license. See the [migration handoff](docs/cws-api-v2.md) or its [offline HTML version](docs/cws-api-v2.html) for evidence and release checks. API acceptance, Google review, and public availability are distinct states.
