import test from 'node:test';
import assert from 'node:assert/strict';
import { isConfirmedTestUserPayment } from '../api/_lib/mp-test-user-identity.ts';

const args = {
  liveMode: true,
  payerId: 3788866380,
  collectorId: 3789059782,
  authenticatedSellerId: 3789059782,
  configuredSellerId: '3789059782',
  configuredBuyerId: '3788866380',
  accessToken: 'APP_USR-example-nonsecret'
};
test('test buyer & seller matched allow MP live-mode test sessions', () => {
  assert.equal(isConfirmedTestUserPayment(args),true);
});
test('missing buyer configuration fails closed',()=>{
  assert.equal(isConfirmedTestUserPayment({...args,configuredBuyerId:undefined}),false);
});
test('wrong buyer or seller fails closed',()=>{
  assert.equal(isConfirmedTestUserPayment({...args,payerId:123456789}),false);
  assert.equal(isConfirmedTestUserPayment({...args,collectorId:123456789}),false);
  assert.equal(isConfirmedTestUserPayment({...args,authenticatedSellerId:123456789}),false);
});
test('only explicitly test-account token is accepted for live-mode sessions',()=>{
  assert.equal(isConfirmedTestUserPayment({...args,accessToken:'TEST-secret'}),false);
  assert.equal(isConfirmedTestUserPayment({...args,accessToken:'APP_USR-example-nonsecret',configuredBuyerId:args.configuredSellerId}),false);
});
test('non-live mode remains allowed when seller is independently authenticated upstream',()=>{
  assert.equal(isConfirmedTestUserPayment({...args,liveMode:false,configuredBuyerId:undefined}),true);
});
