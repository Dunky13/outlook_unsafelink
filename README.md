# Un-Safelink Outlook

Microsoft has introduced "safelinks" that supposedly scans url for malicious contents.

This also inherently introduces the ability to do:
* Man-in-the-middle
* Tracking of user clicks
* Possibly a lot of (unnecessary) redirects
* Lack of readability.

This extension parses the safelinks and replaces it with the original URL which is encoded into the safelinks url.
