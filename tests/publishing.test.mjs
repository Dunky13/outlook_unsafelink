import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import chromeWebstoreUpload from 'chrome-webstore-upload';
import { errorMessages, publishExtension } from '../scripts/cws-publication.mjs';

async function fixture(t, scenario = 'published') {
  const dir = await mkdtemp(join(tmpdir(), 'cws-publication-'));
  const zipPath = join(dir, 'extension.zip');
  await writeFile(zipPath, 'PKfixture');
  const originalFetch = globalThis.fetch;
  t.after(async () => { globalThis.fetch = originalFetch; await rm(dir, { recursive: true, force: true }); });
  const calls = [];
  const logs = [];
  let submitted = false;
  const published = { state: 'PUBLISHED', distributionChannels: [{ crxVersion: '1.0.0', deployPercentage: 100 }] };
  globalThis.fetch = async (url, options = {}) => {
    calls.push(url);
    if (url === 'https://www.googleapis.com/oauth2/v4/token') {
      return scenario === 'auth-failure'
        ? Response.json({ error: 'invalid_grant' }, { status: 401 })
        : Response.json({ access_token: 'fixture-token' });
    }
    assert.equal(options.headers.Authorization, 'Bearer fixture-token');
    if (url === 'https://chromewebstore.googleapis.com/v2/publishers/fixture/items/fixture:fetchStatus') {
      assert.equal(options.method, 'GET');
      return Response.json({
        publishedItemRevisionStatus: scenario === 'duplicate-published' ? { ...published, distributionChannels: [{ crxVersion: '1.0.1' }] } : published,
        submittedItemRevisionStatus: submitted || scenario === 'duplicate-submitted' ? { state: 'PENDING_REVIEW', distributionChannels: [{ crxVersion: '1.0.1' }] } : undefined,
        lastAsyncUploadState: 'SUCCEEDED',
      });
    }
    assert.equal(options.method, 'POST');
    if (url === 'https://chromewebstore.googleapis.com/upload/v2/publishers/fixture/items/fixture:upload') {
      assert.equal(options.headers['X-Goog-Upload-Protocol'], 'raw');
      for await (const chunk of options.body) assert.ok(chunk.length);
      if (scenario === 'upload-http-failure') {
        return Response.json({ error: { message: 'Invalid package', details: [{ fieldViolations: [{ description: 'Manifest version must increase' }] }] } }, { status: 400 });
      }
      return Response.json({
        uploadState: scenario === 'upload-failed' ? 'FAILED' : scenario === 'async-upload' ? 'IN_PROGRESS' : 'SUCCEEDED',
        crxVersion: scenario === 'wrong-version' ? '9.9.9' : '1.0.1',
      });
    }
    assert.equal(url, 'https://chromewebstore.googleapis.com/v2/publishers/fixture/items/fixture:publish');
    assert.equal(options.body, '{"publishType":"DEFAULT_PUBLISH"}');
    submitted = true;
    if (scenario === 'publish-http-failure') return Response.json({ error: { message: 'Publication denied' } }, { status: 403 });
    return Response.json({ state: scenario === 'rejected' ? 'REJECTED' : scenario === 'pending' ? 'PENDING_REVIEW' : scenario === 'cancelled' ? 'CANCELLED' : 'PUBLISHED' });
  };
  const client = chromeWebstoreUpload({ extensionId: 'fixture', publisherId: 'fixture', clientId: 'fixture-client', clientSecret: 'fixture-secret', refreshToken: 'fixture-refresh' });
  return { calls, logs, run: statusOnly => publishExtension({ client, version: '1.0.1', zipPath, statusOnly, log: value => logs.push(value) }) };
}

test('status mode authenticates and reads v2 status without uploading or publishing', async t => {
  const f = await fixture(t);
  const result = await f.run(true);
  assert.equal(result.publishedItemRevisionStatus.distributionChannels[0].crxVersion, '1.0.0');
  assert.equal(f.calls.length, 2);
});

for (const scenario of ['published', 'pending', 'async-upload']) {
  test(`${scenario}: uploads through v2 and submits DEFAULT_PUBLISH with honest status`, async t => {
    const f = await fixture(t, scenario);
    await f.run(false);
    assert.equal(f.calls.filter(url => url.endsWith(':upload')).length, 1);
    assert.equal(f.calls.filter(url => url.endsWith(':publish')).length, 1);
    assert.equal(f.calls.filter(url => url.endsWith(':fetchStatus')).length, scenario === 'async-upload' ? 3 : 2);
    assert.ok(f.logs.some(value => value.startsWith(`Submission state: ${scenario === 'pending' ? 'PENDING_REVIEW' : 'PUBLISHED'}.`)));
    assert.ok(f.logs.every(value => !value.includes('fixture-token') && !value.includes('fixture-secret')));
  });
}

for (const scenario of ['duplicate-published', 'duplicate-submitted', 'auth-failure', 'upload-http-failure', 'upload-failed', 'wrong-version']) {
  test(`${scenario}: fails without requesting publication`, async t => {
    const f = await fixture(t, scenario);
    await assert.rejects(f.run(false));
    assert.ok(!f.calls.some(url => url.endsWith(':publish')));
    if (scenario.startsWith('duplicate')) assert.ok(!f.calls.some(url => url.endsWith(':upload')));
  });
}

for (const scenario of ['publish-http-failure', 'rejected', 'cancelled']) {
  test(`${scenario}: does not report a successful submission`, async t => {
    const f = await fixture(t, scenario);
    await assert.rejects(f.run(false));
    assert.ok(!f.logs.some(value => value.startsWith('Submission state:')));
  });
}

test('provider details explain package rejections and invalid OAuth grants', () => {
  const invalid = new Error('Invalid package');
  invalid.cause = { details: [{ fieldViolations: [{ description: 'Manifest version must increase' }] }] };
  assert.deepEqual(errorMessages(invalid), ['Invalid package', 'Manifest version must increase']);
  const auth = new Error('Invalid grant');
  auth.cause = 'invalid_grant';
  assert.match(errorMessages(auth).join('\n'), /Reauthorise/);
});
