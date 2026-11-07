import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerBearerAuthorized } from '../supabase/functions/pulsar-mp-test-queue-worker/auth.ts';

const key = 'test-only-integration-secret-1234567890-abcdef';
test('worker rejects missing, weak, or wrong credentials', async () => {
  assert.equal(await workerBearerAuthorized(null, key), false);
  assert.equal(await workerBearerAuthorized('', key), false);
  assert.equal(await workerBearerAuthorized('Bearer wrong', key), false);
  assert.equal(await workerBearerAuthorized('Basic ' + key, key), false);
  assert.equal(await workerBearerAuthorized('Bearer ' + key, undefined), false);
  assert.equal(await workerBearerAuthorized('Bearer ' + key, 'short-secret'), false);
  assert.equal(await workerBearerAuthorized('Bearer ' + key + '!', key), false);
  assert.equal(await workerBearerAuthorized('Bearer ' + 'x'.repeat(600), key), false);
});
test('worker accepts only exact strong secret', async () => {
  assert.equal(await workerBearerAuthorized('Bearer ' + key, key), true);
  assert.equal(await workerBearerAuthorized('Bearer ' + key.toUpperCase(), key), false);
});
