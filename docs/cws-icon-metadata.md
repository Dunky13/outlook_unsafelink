# Chrome Web Store icon metadata repair

Date: 2026-10-20. Scope: repair Outlook Un-Safelink's API v2 upload failure and verify publication. Merge and release are authorised when CI allows.

## Cause

After the OAuth credentials were renewed, the [real publication run 39434013183](https://github.com/Dunky13/outlook_unsafelink/actions/runs/39434013183) authenticated and fetched the published 0.2.1 revision. Google rejected the 0.2.7 package with INVALID_PACKAGE and identified images/icon16.png, images/icon32.png, and images/icon48.png as unprocessable. The 128 px icon was not rejected.

All four files declare PNG colour type 6 (RGBA). Each rejected file contains a one-byte bKGD chunk, which is the layout for an indexed palette. For colour type 6, PNG requires three two-byte colour samples. The 128 px file already has a valid six-byte bKGD chunk.

The [PNG specification](https://www.w3.org/TR/png-3/#11bKGD) defines this structure. File-type identification, image dimensions, valid chunk CRCs, and successful image-data decompression alone had not detected the malformed metadata.

## Repair

Remove only the invalid optional bKGD chunk from the 16, 32, and 48 px assets: 13 bytes per file, including its framing and CRC. The IHDR and IDAT chunks are byte-for-byte unchanged. The 128 px icon, manifest, scripts, and dimensions are unchanged.

Add tests for every manifest icon: PNG signature and declared dimensions, chunk bounds and CRCs, bKGD length for the declared colour type, image-data decompression, and expected non-interlaced scanline size. These tests run in the existing PR and release pnpm test step.

## Evidence

- Before repair, the new icon test failed for exactly the three files Google rejected: bKGD length 1 did not equal the required 6. The 128 px case passed.
- After repair, all four icon tests pass. The complete 18-test publishing/icon suite is queued locally and will also run in GitHub CI before merge. Node syntax checks and git diff --check pass. This JavaScript scope uses neither TypeScript nor ESLint.
- Original IDAT chunk SHA-256 values are preserved by the repair: 16 px 00ed2e7f220f7b208361f61a2fc953d60230a8b69e70b94c8798141784c7123e; 32 px af0c62e95b57f07abae48fdae32a346042cf3bc0de26435202decf77404c8e60; 48 px 3cfed9fe641ce7896190effccf4543ea5ee0ba98dc7261b07c9a6651fc0e776c.

## Delivery

The workflow generates the next version as 0.2.<workflow run number>. Verify CI on the repair commit, merge to master, and inspect the resulting upload/submission run. Provider acceptance of the corrected assets remains to be verified after this commit. Google review and public availability remain separate from upload acceptance.

The shared renewed OAuth client now successfully authenticates for QuoteURL and Outlook. The GitHub review extension retains its existing OAuth client. QuoteURL 0.0.8 was uploaded and submitted as PENDING_REVIEW; GitHub review buttons 1.1.4 is PUBLISHED at 100% according to its latest v2 status check.

[Offline HTML version](cws-icon-metadata.html).
