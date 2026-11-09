/**
 * Read-only store catalog checks for checkout launch. Product variants must
 * match their kit promise; a mismatched black/blue kit risks wrong fulfillment.
 * Never update or expose customer data. A naming mismatch is a review blocker,
 * not an automatic catalog mutation.
 */
export type KitAuditProduct = { id: string; name: string; is_active: boolean };
export type KitAuditKit = { id: string; name: string; is_active: boolean; items: unknown };

const variant = (text: string): 'black' | 'blue' | null => {
  const lower = text.toLocaleLowerCase('pt-BR');
  const black = /\bpret[ao]s?\b/.test(lower);
  const blue = /\bazul\b|\bazuis\b/.test(lower);
  return black === blue ? null : black ? 'black' : 'blue';
};

export function auditActiveKitMappings(products: KitAuditProduct[], kits: KitAuditKit[]) {
  const index = new Map(products.map(product => [product.id, product]));
  const issues: Array<{ kitId: string; reason: 'missing_product' | 'invalid_quantity' | 'variant_conflict' | 'invalid_composition' }> = [];
  let reviewed = 0;
  for (const kit of kits) {
    if (!kit.is_active) continue;
    reviewed++;
    if (!Array.isArray(kit.items) || kit.items.length === 0) {
      issues.push({ kitId: kit.id, reason: 'invalid_composition' });
      continue;
    }
    for (const item of kit.items) {
      if (!item || typeof item !== 'object' || typeof (item as any).productId !== 'string') {
        issues.push({ kitId: kit.id, reason: 'invalid_composition' }); continue;
      }
      const { productId, quantity } = item as { productId: string; quantity: unknown };
      if (!Number.isInteger(quantity) || Number(quantity) <= 0 || Number(quantity) > 200) {
        issues.push({ kitId: kit.id, reason: 'invalid_quantity' }); continue;
      }
      const product = index.get(productId);
      if (!product || !product.is_active) {
        issues.push({ kitId: kit.id, reason: 'missing_product' }); continue;
      }
      const kitColor = variant(kit.name);
      const productColor = variant(product.name);
      if (kitColor && productColor && kitColor !== productColor) {
        issues.push({ kitId: kit.id, reason: 'variant_conflict' });
      }
    }
  }
  return { reviewed, issueCount: issues.length, issues, valid: issues.length === 0 };
}
