export interface AdminAuthClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
  rpc(name: 'is_catalog_admin'): PromiseLike<{ data: unknown; error: unknown }>;
}
export async function requireCatalogAdmin(
  client: AdminAuthClient,
): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error('Entre com uma conta administrativa para continuar.');
  const permission = await client.rpc('is_catalog_admin');
  if (permission.error || permission.data !== true)
    throw new Error('Esta conta não tem acesso ao catálogo.');
  return data.user.id;
}
