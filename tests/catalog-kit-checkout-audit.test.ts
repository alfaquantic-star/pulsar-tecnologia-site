import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditActiveKitMappings } from '../api/_lib/catalog-launch-audit.ts';
const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const products = [
  { id:'blue',name:'Placa Google Azul NFC',is_active:true },
  { id:'black',name:'Placa Google Preta NFC',is_active:true }
];
test('kit color must match its linked product color', () => {
  const audit = auditActiveKitMappings(products,[
    { id:'black-kit',name:'Kit 50 Placas Pretas',is_active:true,items:[{productId:'blue',quantity:50}] },
    { id:'blue-kit',name:'Kit 5 Placas Azuis',is_active:true,items:[{productId:'blue',quantity:5}] }
  ]);
  assert.equal(audit.valid,false);
  assert.deepEqual(audit.issues,[{kitId:'black-kit',reason:'variant_conflict'}]);
});
test('inactive and nonexistent products and invalid quantities block readiness', () => {
  const audit=auditActiveKitMappings(products,[
    { id:'bad-qty',name:'Kit sem cor',is_active:true,items:[{productId:'blue',quantity:0}] },
    { id:'missing',name:'Kit sem produto',is_active:true,items:[{productId:'not-real',quantity:1}] },
    { id:'inactive-kit',name:'Kit antigo',is_active:false,items:[] }
  ]);
  assert.equal(audit.reviewed,2);
  assert.equal(audit.issueCount,2);
  assert.deepEqual(audit.issues.map(x=>x.reason),['invalid_quantity','missing_product']);
});
test('admin preview reports catalog mapping and checkout does not apply an automatic unverified coupon',()=>{
  const server=source('api/admin/me.ts');
  const client=source('src/context/StoreContext.tsx');
  assert.match(server,/catalogKitMappingsValid: catalogAudit\?\.valid === true/);
  assert.match(server,/catalogKitIssues: catalogAudit/);
  assert.match(client,/useState<string \| null>\(null\)/);
  assert.doesNotMatch(client,/setAppliedCoupon\] = useState<string \| null>\('PULSAR10'\)/);
});
