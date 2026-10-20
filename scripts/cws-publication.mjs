export function summarizeStatus(status) {
  return {
    published: status.publishedItemRevisionStatus,
    submitted: status.submittedItemRevisionStatus,
    lastAsyncUploadState: status.lastAsyncUploadState,
    takenDown: status.takenDown,
    warned: status.warned,
  };
}

export async function publishExtension({ client, version, zipPath, statusOnly = false, log = console.log }) {
  const token = await client.fetchToken();
  const before = await client.get(token);
  log(`Store status: ${JSON.stringify(summarizeStatus(before))}`);
  if (statusOnly) return before;

  const revisions = [before.publishedItemRevisionStatus, before.submittedItemRevisionStatus];
  if (revisions.some(revision => revision?.distributionChannels?.some(channel => channel.crxVersion === version))) {
    throw new Error(`Version ${version} is already published or submitted. Increment manifest.json before uploading, or use --status to check its progress.`);
  }

  const upload = await client.uploadExisting(zipPath, token, 300);
  if (upload.uploadState !== 'SUCCEEDED') {
    throw new Error(`Upload did not succeed: ${upload.uploadState}. Publication was not requested.`);
  }
  if (upload.crxVersion && upload.crxVersion !== version) {
    throw new Error(`Uploaded version ${upload.crxVersion} does not match manifest version ${version}. Publication was not requested.`);
  }
  log(`Upload accepted for version ${version}.`);
  const submission = await client.publish('DEFAULT_PUBLISH', token);
  if (!['PUBLISHED', 'PENDING_REVIEW'].includes(submission.state)) {
    throw new Error(`Publication was not accepted: ${submission.state}. Check the Developer Dashboard.`);
  }
  log(`Submission state: ${submission.state}. Public availability must be verified separately.`);
  const after = await client.get(token);
  log(`Store status: ${JSON.stringify(summarizeStatus(after))}`);
  return after;
}

export function errorMessages(error) {
  const messages = [error.message || 'Chrome Web Store request failed.'];
  const details = error.cause?.details;
  for (const detail of Array.isArray(details) ? details : []) {
    if (typeof detail.message === 'string') messages.push(detail.message);
    if (typeof detail.reason === 'string') messages.push(detail.reason);
    for (const violation of Array.isArray(detail.fieldViolations) ? detail.fieldViolations : []) {
      if (typeof violation.description === 'string') messages.push(violation.description);
    }
  }
  if (error.cause === 'invalid_grant') {
    messages.push('OAuth grant rejected. Reauthorise this publisher account and update the repository OAuth secrets.');
  }
  return messages;
}
