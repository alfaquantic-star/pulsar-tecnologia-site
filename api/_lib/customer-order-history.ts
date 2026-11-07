/**
 * One read-only, server-side query shared by the customer order route.
 * The verified Supabase Auth UUID is the only permitted ownership key.
 * No email, user_metadata, or request query param is used for authorization.
 */
export const CUSTOMER_ORDER_COLUMNS =
  'id,order_number,customer_id,customer_name,customer_email,items,subtotal,discount_amount,shipping_price,shipping_carrier,shipping_service,total_amount,payment_method,payment_status,shipping_status,tracking_code,shipping_address,created_at';

type ReadOnlyOrderQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (size: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
      };
    };
  };
};
type ReadOnlyOrdersDatabase = { from: (table: string) => ReadOnlyOrderQuery };

export async function getCustomerOrdersByVerifiedId(db: ReadOnlyOrdersDatabase, verifiedAuthUserId: string) {
  // Fail closed for missing or non-UUID identities before touching the database.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verifiedAuthUserId)) {
    throw new Error('Verified user ID required');
  }
  const { data, error } = await db.from('orders')
    .select(CUSTOMER_ORDER_COLUMNS)
    .eq('customer_id', verifiedAuthUserId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error('Orders unavailable');
  return data ?? [];
}
