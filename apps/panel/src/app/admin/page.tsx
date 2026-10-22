'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  catalogFormSchema,
  catalogItemSchema,
  type CatalogItem,
} from '@ofertas/core';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { requireCatalogAdmin } from './auth';
import './admin.css';
import { MaryAvatar } from '@/components/mary-avatar';
import { ThemeToggle } from '@/components/theme-toggle';

type CatalogForm = ReturnType<typeof catalogFormSchema.parse>;
const emptyForm = (): CatalogForm =>
  catalogFormSchema.parse({
    slug: 'novo-item',
    title: 'Novo item',
    kind: 'course',
    platform: 'hotmart',
  });
function fromRow(row: Record<string, unknown>): CatalogItem {
  return catalogItemSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    kind: row.kind,
    platform: row.platform,
    category: row.category,
    tags: row.tags,
    imageUrl: row.image_url,
    affiliateUrl: row.affiliate_url,
    priceCents: row.price_cents,
    currency: row.currency,
    badge: row.badge,
    featured: row.featured,
    sortOrder: row.sort_order,
    published: row.published,
    courseLevel: row.course_level,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
function toRow(item: CatalogForm) {
  return {
    slug: item.slug,
    title: item.title,
    description: item.description,
    kind: item.kind,
    platform: item.platform,
    category: item.category,
    tags: item.tags,
    image_url: item.imageUrl,
    affiliate_url: item.affiliateUrl,
    price_cents: item.priceCents,
    currency: item.currency,
    badge: item.badge,
    featured: item.featured,
    sort_order: item.sortOrder,
    published: item.published,
    course_level: item.courseLevel,
    confirmed_at: item.confirmedAt,
  };
}

export default function AdminPage() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [priceConfirmed, setPriceConfirmed] = useState(false);

  async function list(supabase: SupabaseClient) {
    await requireCatalogAdmin(supabase);
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (error)
      throw new Error(
        'Não foi possível carregar o catálogo. Confira a conexão e as permissões.',
      );
    const rows: unknown = data;
    if (!Array.isArray(rows))
      throw new Error('O catálogo retornou dados inválidos.');
    setItems(
      rows.map((row: unknown) => {
        if (row === null || typeof row !== 'object' || Array.isArray(row))
          throw new Error('Item do catálogo inválido.');
        return fromRow(row as Record<string, unknown>);
      }),
    );
    setAuthorized(true);
  }

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    async function initialize() {
      try {
        const supabase = createBrowserSupabaseClient();
        if (!supabase) {
          if (active) setConfigured(false);
          return;
        }
        if (active) setClient(supabase);
        const { data, error } = await supabase.auth.getUser();
        if (data.user && !error && active) await list(supabase);
        const subscription = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT' && active) {
            setAuthorized(false);
            setItems([]);
            setShowEditor(false);
          }
        });
        unsubscribe = () => subscription.data.subscription.unsubscribe();
      } catch {
        if (active)
          setMessage(
            'Não foi possível abrir a administração. Verifique sua conta e a configuração do Supabase.',
          );
      } finally {
        if (active) setReady(true);
      }
    }
    void initialize();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      setPassword('');
      if (error)
        throw new Error('Não foi possível entrar. Confira e-mail e senha.');
      await list(client);
    } catch (error: unknown) {
      setAuthorized(false);
      setItems([]);
      setMessage(
        error instanceof Error ? error.message : 'Não foi possível entrar.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (!client) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await client.auth.signOut();
      if (error)
        throw new Error('Não foi possível encerrar a sessão. Tente novamente.');
      setAuthorized(false);
      setItems([]);
      setShowEditor(false);
      setPassword('');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erro ao sair.');
    } finally {
      setBusy(false);
    }
  }
  function edit(item?: CatalogItem) {
    setEditing(item?.id ?? null);
    setForm(item ? catalogFormSchema.parse(item) : emptyForm());
    setPriceConfirmed(false);
    setShowEditor(true);
    setMessage('');
  }
  function patch<K extends keyof CatalogForm>(key: K, value: CatalogForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'priceCents' || key === 'affiliateUrl')
      setPriceConfirmed(false);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setMessage('');
    try {
      await requireCatalogAdmin(client);
      if (form.priceCents !== null && !priceConfirmed)
        throw new Error(
          'Confira o preço e marque a confirmação antes de salvar.',
        );
      const parsed = catalogFormSchema.safeParse({
        ...form,
        tags: form.tags.filter(Boolean),
        confirmedAt: form.priceCents === null ? null : new Date().toISOString(),
      });
      if (!parsed.success) {
        setMessage(
          parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(' · '),
        );
        return;
      }
      const query = editing
        ? client
            .from('catalog_items')
            .update(toRow(parsed.data))
            .eq('id', editing)
        : client.from('catalog_items').insert(toRow(parsed.data));
      const { error } = await query;
      if (error)
        throw new Error(
          'Não foi possível salvar. Confira o slug único, os campos e sua permissão.',
        );
      await list(client);
      setShowEditor(false);
      setMessage('Item salvo.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }
  async function changeItem(item: CatalogItem, remove: boolean) {
    if (
      !client ||
      (remove &&
        !window.confirm(
          `Excluir “${item.title}” definitivamente? Esta ação não pode ser desfeita.`,
        ))
    )
      return;
    setBusy(true);
    setMessage('');
    try {
      await requireCatalogAdmin(client);
      const { error } = await (remove
        ? client.from('catalog_items').delete().eq('id', item.id)
        : client
            .from('catalog_items')
            .update({ published: false })
            .eq('id', item.id));
      if (error)
        throw new Error(
          'Não foi possível alterar o item. Confira a conexão e sua permissão.',
        );
      await list(client);
      if (editing === item.id) setShowEditor(false);
      setMessage(
        remove
          ? 'Item excluído.'
          : 'Item arquivado e removido do catálogo público.',
      );
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erro ao alterar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          <MaryAvatar size={44} decorative />
          <span className="admin-brand-copy">
            Lojinha do Canal<span>Mary Hunter / administração</span>
          </span>
        </a>
        <div className="admin-header-actions">
          <ThemeToggle />
          <a href="/">Ver catálogo ↗</a>
        </div>
      </header>
      <section className="admin-intro">
        <span className="admin-eyebrow">SEU CATÁLOGO, DO SEU JEITO</span>
        <h1>Os achados da Mary, do seu jeito.</h1>
        <p>Cadastre cursos e produtos com seus links de afiliado.</p>
      </section>
      {!ready ? (
        <p role="status">Verificando acesso…</p>
      ) : !configured ? (
        <section className="admin-card">
          <h2>Conecte seu catálogo</h2>
          <p>
            A administração precisa da conexão pública do Supabase. Configure o
            projeto seguindo o README do painel e publique novamente.
          </p>
          <p>
            O catálogo de demonstração continua disponível na página inicial.
          </p>
        </section>
      ) : !authorized ? (
        <section className="admin-card admin-login">
          <h2>Entrar na administração</h2>
          <p>
            Use uma conta previamente autorizada. O cadastro é feito pelo
            responsável pelo catálogo.
          </p>
          <form onSubmit={(event) => void login(event)}>
            <label>
              E-mail
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button disabled={busy} type="submit">
              {busy ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="admin-toolbar">
            <div>
              <strong>{items.length} itens cadastrados</strong>
              <p>Rascunhos e arquivados ficam fora da página pública.</p>
            </div>
            <div className="admin-actions">
              <button disabled={busy} onClick={() => edit()}>
                + Novo item
              </button>
              <button
                className="admin-secondary"
                disabled={busy}
                onClick={() => void logout()}
              >
                Sair
              </button>
            </div>
          </div>
          {showEditor && (
            <section className="admin-card">
              <h2>{editing ? 'Editar item' : 'Novo item'}</h2>
              <form
                className="admin-editor"
                onSubmit={(event) => void save(event)}
              >
                <label>
                  Título
                  <input
                    required
                    value={form.title}
                    onChange={(event) => patch('title', event.target.value)}
                  />
                </label>
                <label>
                  Slug
                  <input
                    required
                    value={form.slug}
                    placeholder="nome-do-item"
                    onChange={(event) => patch('slug', event.target.value)}
                  />
                </label>
                <label>
                  Tipo
                  <select
                    value={form.kind}
                    onChange={(event) =>
                      patch(
                        'kind',
                        event.target.value === 'course' ? 'course' : 'product',
                      )
                    }
                  >
                    <option value="course">Curso</option>
                    <option value="product">Produto</option>
                  </select>
                </label>
                <label>
                  Plataforma
                  <select
                    value={form.platform}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (
                        value === 'hotmart' ||
                        value === 'shopee' ||
                        value === 'amazon' ||
                        value === 'mercadolivre'
                      )
                        patch('platform', value);
                    }}
                  >
                    <option value="hotmart">Hotmart</option>
                    <option value="shopee">Shopee</option>
                    <option value="amazon">Amazon (rascunho)</option>
                    <option value="mercadolivre">Mercado Livre</option>
                  </select>
                </label>
                <label>
                  Categoria
                  <input
                    value={form.category}
                    onChange={(event) => patch('category', event.target.value)}
                  />
                </label>
                <label>
                  Tags (separadas por vírgula)
                  <input
                    value={form.tags.join(', ')}
                    onChange={(event) =>
                      patch(
                        'tags',
                        event.target.value.split(',').map((tag) => tag.trim()),
                      )
                    }
                  />
                </label>
                <label className="admin-wide">
                  Descrição
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      patch('description', event.target.value)
                    }
                  />
                </label>
                <label className="admin-wide">
                  Link de afiliado
                  <input
                    type="url"
                    value={form.affiliateUrl ?? ''}
                    onChange={(event) =>
                      patch('affiliateUrl', event.target.value || null)
                    }
                  />
                  <small>
                    Para publicar, use um link autorizado da Hotmart ou Shopee.
                  </small>
                </label>
                <label className="admin-wide">
                  Imagem
                  <input
                    value={form.imageUrl ?? ''}
                    placeholder="/images/minha-imagem.webp ou https://…"
                    onChange={(event) =>
                      patch('imageUrl', event.target.value || null)
                    }
                  />
                  <small>
                    Use uma imagem local ou uma URL HTTPS que você pode
                    utilizar.
                  </small>
                </label>
                <label>
                  Preço em centavos (opcional)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.priceCents ?? ''}
                    placeholder="Ex.: 4990 equivale a R$ 49,90"
                    onChange={(event) =>
                      patch(
                        'priceCents',
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                  <small>Deixe vazio para exibir “consultar preço”.</small>
                </label>
                <label>
                  Nível do curso
                  <select
                    value={form.courseLevel ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      patch(
                        'courseLevel',
                        value === 'iniciante' ||
                          value === 'intermediario' ||
                          value === 'avancado'
                          ? value
                          : null,
                      );
                    }}
                  >
                    <option value="">Não informado</option>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </label>
                <label>
                  Selo (opcional)
                  <input
                    value={form.badge ?? ''}
                    onChange={(event) =>
                      patch('badge', event.target.value || null)
                    }
                  />
                </label>
                <label>
                  Ordem de exibição
                  <input
                    type="number"
                    step="1"
                    value={form.sortOrder}
                    onChange={(event) =>
                      patch('sortOrder', Number(event.target.value))
                    }
                  />
                </label>
                {form.priceCents !== null && (
                  <label className="admin-check admin-wide">
                    <input
                      type="checkbox"
                      checked={priceConfirmed}
                      onChange={(event) =>
                        setPriceConfirmed(event.target.checked)
                      }
                    />
                    Conferi este preço na página da oferta agora. A data da
                    confirmação será registrada ao salvar.
                  </label>
                )}
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      patch('featured', event.target.checked)
                    }
                  />
                  Destacar item
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) =>
                      patch('published', event.target.checked)
                    }
                  />
                  Publicar no catálogo
                </label>
                <div className="admin-actions admin-wide">
                  <button disabled={busy} type="submit">
                    {busy ? 'Salvando…' : 'Salvar item'}
                  </button>
                  <button
                    className="admin-secondary"
                    disabled={busy}
                    type="button"
                    onClick={() => setShowEditor(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}
          <section className="admin-list" aria-label="Itens cadastrados">
            {items.length === 0 ? (
              <div className="admin-card">
                <h2>Seu primeiro achado começa aqui.</h2>
                <p>
                  Adicione um curso ou produto e confira os dados antes de
                  publicar.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <article className="admin-card admin-item" key={item.id}>
                  <div>
                    <span className="admin-pill">
                      {item.published ? 'Publicado' : 'Rascunho / arquivado'}
                    </span>
                    <h2>{item.title}</h2>
                    <p>
                      {item.category} · {item.platform} ·{' '}
                      {item.kind === 'course' ? 'Curso' : 'Produto'}
                    </p>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="admin-secondary"
                      disabled={busy}
                      onClick={() => edit(item)}
                    >
                      Editar
                    </button>
                    {item.published && (
                      <button
                        className="admin-secondary"
                        disabled={busy}
                        onClick={() => void changeItem(item, false)}
                      >
                        Arquivar
                      </button>
                    )}
                    <button
                      className="admin-danger"
                      disabled={busy}
                      onClick={() => void changeItem(item, true)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
      {message && (
        <p className="admin-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
      <footer className="admin-footer">
        Links de afiliado. Preços devem ser conferidos na origem antes da
        publicação.
      </footer>
    </main>
  );
}
