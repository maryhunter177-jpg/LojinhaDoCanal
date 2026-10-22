'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaryAvatar } from './mary-avatar';
import { ThemeToggle } from './theme-toggle';
import { LearningPaths } from './learning-paths';
import { ShopHero, ShopDirectory, MarketplaceLogo } from './shop-branding';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  Heart,
  Menu,
  PackageOpen,
  Play,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  filterCatalogItems,
  getDisplayPriceCents,
  type CatalogItem,
  type CatalogPlatform,
  type StorefrontSection,
} from '@ofertas/core';

type Kind = 'all' | 'course' | 'product';
type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc';
type Source = 'demo' | 'local' | 'supabase' | 'unavailable';
const FAVORITES_KEY = 'mary-hunter:favorites:v1';
const platformNames: Record<CatalogPlatform, string> = {
  hotmart: 'Hotmart',
  shopee: 'Shopee',
  amazon: 'Amazon',
  mercadolivre: 'Mercado Livre',
};
const levelNames = {
  iniciante: 'Para começar',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function Storefront({
  items,
  source,
  section = 'home',
}: {
  items: CatalogItem[];
  source: Source;
  section?: StorefrontSection;
}) {
  const isShop = section === 'shopee' || section === 'mercadolivre';
  const isCoursePage = section === 'courses';
  const [kind, setKind] = useState<Kind>(isShop ? 'product' : 'course');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const platform = isShop ? section : 'hotmart';
  const [sort, setSort] = useState<Sort>('featured');
  const [saved, setSaved] = useState<string[]>([]);
  const [onlySaved, setOnlySaved] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(isShop ? 12 : 8);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [storageNotice, setStorageNotice] = useState(false);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deferredSearch = useDeferredValue(search);
  const scopedSavedCount = items.filter((item) =>
    saved.includes(item.id),
  ).length;

  useEffect(() => {
    setNow(Date.now());
    try {
      const raw: unknown = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) ?? '[]',
      );
      if (
        !Array.isArray(raw) ||
        raw.length > 200 ||
        !raw.every((id: unknown) => typeof id === 'string')
      )
        throw new Error('Invalid local favorites');
      setSaved(raw as string[]);
    } catch {
      setStorageNotice(true);
    }
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (selected && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [selected]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (
        event.key === '/' &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  const categories = useMemo(
    () => [
      ...new Set(
        items
          .filter((item) => kind === 'all' || item.kind === kind)
          .map((item) => item.category),
      ),
    ],
    [items, kind],
  );
  const filtered = useMemo(
    () =>
      filterCatalogItems(
        items,
        { search: deferredSearch, kind, category, platform, sort },
        now,
      ).filter((item) => !onlySaved || saved.includes(item.id)),
    [
      items,
      deferredSearch,
      kind,
      category,
      platform,
      sort,
      onlySaved,
      saved,
      now,
    ],
  );
  const hasFilters = Boolean(search || category !== 'all' || onlySaved);
  const headline = onlySaved
    ? 'Seus favoritos desta página.'
    : kind === 'course'
      ? 'Um novo conhecimento te espera.'
      : kind === 'product'
        ? `Achadinhos da ${platformNames[platform]}.`
        : 'Sua próxima descoberta.';

  function explore(favorites = false) {
    setKind(isShop ? 'product' : 'course');
    setCategory('all');
    setOnlySaved(favorites);
    setMobileMenu(false);
    setVisibleCount(isShop ? 12 : 8);
    document.getElementById('explorar')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
  }
  function toggleFavorite(item: CatalogItem) {
    const next = saved.includes(item.id)
      ? saved.filter((id) => id !== item.id)
      : [...saved, item.id].slice(-200);
    setSaved(next);
    setToast(
      next.includes(item.id)
        ? 'Salvo nas suas descobertas ♡'
        : 'Item removido dos salvos',
    );
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      setStorageNotice(true);
    }
  }
  function clearFilters() {
    setSearch('');
    setCategory('all');
    setOnlySaved(false);
    setKind(isShop ? 'product' : 'course');
    setVisibleCount(isShop ? 12 : 8);
  }
  function hasLiveLink(item: CatalogItem) {
    return item.published && item.affiliateUrl !== null;
  }
  function itemPrice(item: CatalogItem) {
    return now === undefined ? null : getDisplayPriceCents(item, now);
  }

  return (
    <div className={`storefront-shell shell-${section}`}>
      <div className="announcement">
        <span className="announcement-star">✳</span> O cantinho de descobertas
        da nossa comunidade <span className="announcement-heart">♡</span>
      </div>
      <header className="site-header">
        <div className="nav-wrap">
          <Link
            className="brand"
            href="/"
            aria-label={
              isCoursePage
                ? 'Mary Hunter — início'
                : 'Lojinha do Canal Mary Hunter — início'
            }
          >
            <MaryAvatar size={42} className="brand-avatar" decorative />
            <span>
              <strong>
                Mary Hunter<span className="brand-dot">.</span>
              </strong>
              <small>
                {isCoursePage ? 'CURSOS DO CANAL' : 'LOJINHA DO CANAL'}
              </small>
            </span>
          </Link>
          <nav
            className={`main-nav ${mobileMenu ? 'is-open' : ''}`}
            aria-label="Navegação principal"
          >
            <Link
              href="/"
              className={section === 'home' ? 'nav-active' : ''}
              aria-current={section === 'home' ? 'page' : undefined}
            >
              Início
            </Link>
            <Link
              href="/cursos"
              className={section === 'courses' ? 'nav-active' : ''}
              aria-current={section === 'courses' ? 'page' : undefined}
            >
              Cursos
            </Link>
            <Link
              href="/shopee"
              className={section === 'shopee' ? 'nav-active' : ''}
              aria-current={section === 'shopee' ? 'page' : undefined}
            >
              Shopee
            </Link>
            <Link
              href="/mercado-livre"
              className={section === 'mercadolivre' ? 'nav-active' : ''}
              aria-current={section === 'mercadolivre' ? 'page' : undefined}
            >
              Mercado Livre
            </Link>
            <a
              href="https://www.youtube.com/@maryhunteroficial"
              target="_blank"
              rel="noopener noreferrer"
            >
              O canal <ArrowUpRight size={13} />
            </a>
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            <button
              className={`saved-button ${onlySaved ? 'selected' : ''}`}
              onClick={() => explore(!onlySaved)}
              aria-label={`Ver favoritos desta página, ${scopedSavedCount} itens salvos`}
            >
              <Heart size={18} />
              <span>Salvos</span>
              {scopedSavedCount > 0 && <b>{scopedSavedCount}</b>}
            </button>
            <span className="nav-divider" />
            <a
              className="channel-button"
              href="https://www.youtube.com/@maryhunteroficial"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Play size={13} fill="currentColor" /> Ir para o canal{' '}
              <ArrowUpRight size={14} />
            </a>
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="conteudo" className={`storefront-view view-${kind}`}>
        {isShop ? (
          <ShopHero shop={section} items={items} />
        ) : (
          <section className="hero page-width" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="tiny-star">✳</span>{' '}
                {isCoursePage
                  ? 'APRENDA. PRATIQUE. CRIE.'
                  : 'DA LIVE PARA O SEU DIA A DIA'}
              </div>
              <h1 id="hero-title">
                Seu <em>próximo nível</em>
                <br />
                começa por aqui<span className="hero-period">.</span>
              </h1>
              <p>
                {isCoursePage ? (
                  <>
                    Programação, desenvolvimento de jogos e dados.
                    <br className="desktop-break" />
                    Escolha sua trilha e aprenda um passo de cada vez.
                  </>
                ) : (
                  <>
                    Aprender algo novo. Dar um upgrade no setup.
                    <br className="desktop-break" />
                    Aqui tem um pouco de tudo que a gente curte.
                  </>
                )}
              </p>
              <div className="hero-buttons">
                <Link href="/cursos#explorar" className="button primary">
                  Explorar cursos <ArrowUpRight size={18} />
                </Link>
                <a
                  href={isCoursePage ? '#trilhas' : '#lojas'}
                  className="button secondary"
                >
                  {isCoursePage ? 'Ver trilhas de estudo' : 'Escolher uma loja'}{' '}
                  <ArrowRight size={17} />
                </a>
              </div>
              <div className="hero-signature">
                <MaryAvatar size={30} className="signature-avatar" decorative />
                <span>
                  Uma seleção da <strong>Mary, para a comunidade.</strong>
                </span>
                <span className="signature-scribble">♡</span>
              </div>
            </div>
            <div
              className="hero-art has-avatar"
              aria-label="Avatar gamer da Mary Hunter com seu setup e um editor de código"
              role="img"
            >
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-grid" />
              <div className="hero-avatar-portrait">
                <Image
                  src="/images/mary-gamer.png"
                  alt="Mary Hunter com headset, boné e controle de videogame"
                  width={1024}
                  height={1536}
                  sizes="(max-width: 640px) 240px, 300px"
                  preload
                />
              </div>
              <span className="art-spark spark-one">✳</span>
              <span className="art-spark spark-two">+</span>
              <div className="editor-window">
                <div className="editor-toolbar">
                  <div className="window-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>minha_proxima_versao.py</span>
                  <Code2 size={14} />
                </div>
                <div className="editor-body">
                  <span className="code-comment"># um passo de cada vez</span>
                  <div>
                    <span className="line-number">01</span>
                    <span className="code-purple">def</span>{' '}
                    <span className="code-yellow">proximo_nivel</span>():
                  </div>
                  <div>
                    <span className="line-number">02</span>
                    <span className="code-indent">
                      aprender = <span className="code-purple">True</span>
                    </span>
                  </div>
                  <div>
                    <span className="line-number">03</span>
                    <span className="code-indent">
                      criar = <span className="code-purple">True</span>
                    </span>
                  </div>
                  <div>
                    <span className="line-number">04</span>
                    <span className="code-indent code-green">
                      return &quot;vamos nessa!&quot;
                    </span>
                  </div>
                  <div className="editor-output">
                    <span>❯</span> Olá, novas possibilidades!{' '}
                    <span className="code-cursor" />
                  </div>
                </div>
                <div className="editor-status">
                  <span>
                    <i /> all good
                  </span>
                  <span>Python · UTF-8</span>
                </div>
              </div>
              <div className="floating-tag">
                <span>
                  <Sparkles size={17} />
                </span>
                <div>
                  <b>Pequenas descobertas.</b>
                  <small>Grandes possibilidades.</small>
                </div>
                <ArrowUpRight size={20} />
              </div>
              <div className="art-keycap">
                esc<small>da rotina</small>
              </div>
            </div>
          </section>
        )}
        <div className="values-strip page-width">
          <span>
            <BookOpen size={17} /> Conhecimento para levar com você
          </span>
          <span>
            {isCoursePage ? (
              <>
                <Code2 size={17} /> Do primeiro código ao seu projeto
              </>
            ) : (
              <>
                <ShoppingBag size={17} /> Achados para o seu universo
              </>
            )}
          </span>
          <span>
            <Heart size={17} /> Da Mary, com carinho
          </span>
        </div>
        {section === 'home' && <ShopDirectory />}
        <section
          id="explorar"
          className="catalog-section page-width"
          aria-labelledby="catalog-heading"
        >
          <div className="section-top">
            <div>
              <span className="eyebrow">
                {isCoursePage
                  ? 'CONHECIMENTO PARA O SEU PRÓXIMO PASSO'
                  : 'A LOJINHA TÁ ABERTA'}
              </span>
              <h2 id="catalog-heading">{headline}</h2>
            </div>
            <span className="section-note">
              {isShop
                ? `Curadoria Mary Hunter · ${platformNames[platform]}`
                : 'Pra aprender, criar e se divertir'}{' '}
              <span>↗</span>
            </span>
          </div>
          <div className="catalog-toolbar">
            <div className="catalog-scope">
              {isShop ? (
                <MarketplaceLogo shop={section} />
              ) : (
                <BookOpen size={20} />
              )}
              <span>
                {items.length}{' '}
                {isShop ? 'produtos nesta loja' : 'cursos para explorar'}
              </span>
            </div>
            <div className="search-tools">
              <label className="catalog-search">
                <Search size={18} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(isShop ? 12 : 8);
                  }}
                  placeholder={
                    isShop
                      ? `Buscar na ${platformNames[platform]}`
                      : 'Qual curso você quer encontrar?'
                  }
                  aria-label="Buscar cursos e produtos"
                />
                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd>/</kbd>
                )}
              </label>
              <button
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal size={17} />
                <span>Filtros</span>
              </button>
            </div>
          </div>
          {!isShop && kind !== 'all' && (
            <div className={`collection-banner collection-${kind}`}>
              <div className="collection-symbol" aria-hidden="true">
                {kind === 'course' ? (
                  <Code2 size={34} />
                ) : (
                  <ShoppingBag size={34} />
                )}
              </div>
              <div className="collection-copy">
                <span className="collection-label">
                  {kind === 'course'
                    ? 'MARY HUNTER / LEARNING LAB'
                    : 'MARY HUNTER / SETUP & ACHADOS'}
                </span>
                <h3>
                  {kind === 'course'
                    ? 'Seu próximo projeto começa com conhecimento.'
                    : 'Escolhas que dão personalidade ao seu setup.'}
                </h3>
                <p>
                  {kind === 'course'
                    ? 'Explore programação, desenvolvimento e dados. Encontre o tema e o nível para continuar aprendendo.'
                    : 'Periféricos, áudio e detalhes para jogar, criar e deixar seu cantinho com a sua cara.'}
                </p>
                <div className="collection-topics">
                  {kind === 'course' ? (
                    <>
                      <span>01 / Fundamentos</span>
                      <span>02 / Desenvolvimento</span>
                      <span>03 / Dados</span>
                    </>
                  ) : (
                    <>
                      <span>Periféricos</span>
                      <span>Áudio & vídeo</span>
                      <span>Seu cantinho</span>
                    </>
                  )}
                </div>
              </div>
              <MaryAvatar
                size={88}
                variant={kind === 'course' ? 'portrait' : 'community'}
                className="collection-avatar"
                decorative
              />
            </div>
          )}
          {kind !== 'product' && !onlySaved && source !== 'unavailable' && (
            <LearningPaths items={items} onSelect={setSelected} />
          )}
          <div className="category-row" aria-label="Categorias">
            <button
              className={category === 'all' ? 'active' : ''}
              onClick={() => setCategory('all')}
            >
              Todas as categorias
            </button>
            {categories.map((name) => (
              <button
                key={name}
                className={category === name ? 'active' : ''}
                onClick={() => {
                  setCategory(name);
                  setVisibleCount(isShop ? 12 : 8);
                }}
              >
                {name}
              </button>
            ))}
          </div>
          {showFilters && (
            <div className="expanded-filters">
              <label>
                Ordenar por
                <select
                  aria-label="Ordenar descobertas"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                >
                  <option value="featured">
                    {isCoursePage
                      ? 'Destaques dos cursos'
                      : 'Destaques da lojinha'}
                  </option>
                  <option value="newest">Mais recentes</option>
                  <option value="price-asc">Menor preço confirmado</option>
                  <option value="price-desc">Maior preço confirmado</option>
                </select>
              </label>
              <label className="saved-filter">
                <input
                  type="checkbox"
                  checked={onlySaved}
                  onChange={(event) => setOnlySaved(event.target.checked)}
                />
                <Heart size={15} /> Só os meus salvos
              </label>
            </div>
          )}
          {source === 'demo' && (
            <div className="preview-note">
              <span className="preview-dot" />
              <p>
                <strong>Uma prévia da lojinha.</strong> Alguns itens ainda são
                prévias ilustrativas e estão sem link de compra. Os itens com
                botão de compra já têm link de afiliado.
              </p>
              <span>PRÉVIA</span>
            </div>
          )}
          {storageNotice && (
            <p className="storage-notice">
              Os favoritos estão disponíveis apenas nesta sessão porque seu
              navegador bloqueou o armazenamento local.
            </p>
          )}
          <div className="results-line">
            <span aria-live="polite">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'descoberta' : 'descobertas'}
              {onlySaved ? ' salvas nesta página' : ''}
              {search ? ` para “${search}”` : ' esperando por você'}
            </span>
            {hasFilters ? (
              <button onClick={clearFilters}>
                Limpar filtros <X size={12} />
              </button>
            ) : (
              <span className="curated-label">
                <span className="tiny-star">✳</span> SELECIONADOS COM CARINHO
              </span>
            )}
          </div>
          {source === 'unavailable' ? (
            <div className="empty-state">
              <PackageOpen size={34} />
              <h3>Uma pausa nas descobertas.</h3>
              <p>
                O catálogo está indisponível neste momento. Tente novamente em
                instantes.
              </p>
              <button
                className="button primary"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {onlySaved ? <Heart size={36} /> : <Search size={36} />}
              <h3>
                {onlySaved
                  ? 'Guarde o que te inspira.'
                  : 'Ainda não encontramos esse achado.'}
              </h3>
              <p>
                {onlySaved
                  ? 'Toque no coração de um curso ou produto para encontrar suas descobertas por aqui.'
                  : 'Experimente outro termo ou escolha uma categoria diferente.'}
              </p>
              <button className="button secondary" onClick={clearFilters}>
                Explorar todas as descobertas <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div
              className={`product-grid ${filtered.length === 1 ? 'single-result' : ''}`}
            >
              {filtered.slice(0, visibleCount).map((item) => (
                <article
                  className={`catalog-card card-${item.kind}`}
                  key={item.id}
                >
                  <div className={`card-image ${item.kind}`}>
                    <button
                      className="card-image-button"
                      onClick={() => setSelected(item)}
                      aria-label={`Ver detalhes: ${item.title}`}
                    >
                      <Image
                        src={
                          item.imageUrl ??
                          (item.kind === 'course'
                            ? '/images/course-1.svg'
                            : '/images/product-1.svg')
                        }
                        alt={
                          item.kind === 'course'
                            ? `Ilustração do tema de ${item.title}`
                            : `Ilustração de ${item.title}`
                        }
                        width={640}
                        height={400}
                        unoptimized
                        loading="lazy"
                      />
                    </button>
                    {item.badge && (
                      <span className="card-badge">{item.badge}</span>
                    )}
                    <button
                      className={`favorite-icon ${saved.includes(item.id) ? 'is-saved' : ''}`}
                      onClick={() => toggleFavorite(item)}
                      aria-label={`${saved.includes(item.id) ? 'Remover dos salvos' : 'Salvar'}: ${item.title}`}
                      aria-pressed={saved.includes(item.id)}
                    >
                      <Heart
                        size={17}
                        fill={saved.includes(item.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                    <span className={`kind-label ${item.kind}`}>
                      {item.kind === 'course' ? (
                        <BookOpen size={12} />
                      ) : (
                        <ShoppingBag size={12} />
                      )}{' '}
                      {item.kind === 'course' ? 'CURSO' : 'ACHADINHO'}
                    </span>
                  </div>
                  <div className="card-content">
                    <div className="card-meta">
                      <span>{item.category}</span>
                      <span className={`platform-name ${item.platform}`}>
                        <i />
                        {platformNames[item.platform]}
                      </span>
                    </div>
                    <button
                      className="card-title"
                      onClick={() => setSelected(item)}
                    >
                      {item.title}
                    </button>
                    <p className="card-subtitle">
                      {item.kind === 'course'
                        ? item.courseLevel
                          ? `${levelNames[item.courseLevel]} · Curso online`
                          : 'Conhecimento para ir além'
                        : 'Um novo detalhe para o seu setup'}
                    </p>
                    <div className="card-bottom">
                      <div>
                        {itemPrice(item) !== null ? (
                          <>
                            <small>Preço confirmado</small>
                            <strong className="price-value">
                              {money.format((itemPrice(item) ?? 0) / 100)}
                            </strong>
                          </>
                        ) : (
                          <span className="price-unavailable">
                            {hasLiveLink(item)
                              ? 'Confira na plataforma'
                              : item.kind === 'course'
                                ? 'Descubra algo novo'
                                : 'Encontre seu próximo upgrade'}
                          </span>
                        )}
                      </div>
                      <button
                        className="card-explore"
                        onClick={() => setSelected(item)}
                        aria-label={`Conhecer ${item.title}`}
                      >
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                    {hasLiveLink(item) && (
                      <a
                        className="button primary card-buy-link"
                        href={`/go/${item.slug}`}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                      >
                        {isCoursePage
                          ? 'Conhecer o curso'
                          : 'Clique aqui para comprar'}{' '}
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <div className="card-disclosure">
                      {hasLiveLink(item)
                        ? 'link de afiliado · compra na plataforma'
                        : 'Prévia ilustrativa · sem link de compra'}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {filtered.length > visibleCount && (
            <div className="load-more">
              <button
                className="button secondary"
                onClick={() => setVisibleCount(visibleCount + 8)}
              >
                Mais descobertas <ArrowDown size={15} />
              </button>
              <span>
                {Math.min(visibleCount, filtered.length)} de {filtered.length}
              </span>
            </div>
          )}
          {!isCoursePage && (
            <div className="marketplaces marketplace-links">
              <span>BOAS DESCOBERTAS, EM BOAS COMPANHIAS</span>
              <div>
                <b className="market-hotmart">◉ hotmart</b>
                <Link href="/shopee" aria-label="Visitar lojinha Shopee">
                  <MarketplaceLogo shop="shopee" />
                </Link>
                <span className="market-soon">
                  amazon<small>em breve</small>
                </span>
                <Link
                  href="/mercado-livre"
                  aria-label="Visitar lojinha Mercado Livre"
                >
                  <MarketplaceLogo shop="mercadolivre" />
                </Link>
              </div>
            </div>
          )}
        </section>
        {!isCoursePage && (
          <section className="community-banner page-width">
            <div className="community-icon community-avatar">
              <MaryAvatar size={120} variant="community" decorative />
            </div>
            <div className="community-copy">
              <span className="eyebrow">A GENTE SE ENCONTRA NO CANAL</span>
              <h2>
                A live acaba.
                <br />A comunidade <em>continua.</em>
              </h2>
              <p>
                Games, programação, conversas e um monte de descobertas.
                <br />
                Chega mais. Esse cantinho também é seu.
              </p>
            </div>
            <a
              className="button community-button"
              href="https://www.youtube.com/@maryhunteroficial"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conhecer o canal <ArrowUpRight size={18} />
            </a>
            <span className="community-spark" aria-hidden="true">
              ✳
            </span>
          </section>
        )}
        <div className="affiliate-note page-width">
          <Heart size={17} />
          <p>
            <strong>Transparência faz parte.</strong>{' '}
            {isCoursePage
              ? 'Os cursos usam links de afiliado. Ao se inscrever por eles, você pode apoiar o canal sem pagar a mais. Confira o conteúdo, o preço e as condições na plataforma do curso.'
              : 'Alguns links são de afiliada: ao comprar por eles, você pode apoiar o canal sem pagar a mais. Preços e disponibilidade são confirmados na plataforma.'}
          </p>
          <Link href="/privacidade">
            Saiba mais <ChevronRight size={14} />
          </Link>
        </div>
      </main>
      <footer className="site-footer page-width">
        <Link className="brand footer-brand" href="/">
          <MaryAvatar size={42} className="brand-avatar" decorative />
          <span>
            <strong>
              Mary Hunter<span className="brand-dot">.</span>
            </strong>
            <small>
              {isCoursePage ? 'CURSOS DO CANAL' : 'LOJINHA DO CANAL'}
            </small>
          </span>
        </Link>
        <span>
          Feito para a nossa comunidade, com carinho <Heart size={12} />
        </span>
        <div>
          <Link href="/privacidade">Privacidade e transparência</Link>
          <Link href="/admin">
            Área da Mary <ArrowUpRight size={12} />
          </Link>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      <dialog
        className="details-dialog"
        ref={dialogRef}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        aria-labelledby="detail-title"
      >
        {selected && (
          <div className="details-inner">
            <button
              className="dialog-close"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar detalhes"
            >
              <X size={21} />
            </button>
            <Image
              className="dialog-image"
              src={selected.imageUrl ?? '/images/course-1.svg'}
              alt={`Ilustração de ${selected.title}`}
              width={640}
              height={400}
              unoptimized
            />
            <div className="details-copy">
              <span className="eyebrow">
                {selected.kind === 'course'
                  ? 'APRENDA ALGO NOVO'
                  : 'UM UPGRADE NO SEU UNIVERSO'}{' '}
                · {platformNames[selected.platform]}
              </span>
              <h2 id="detail-title">{selected.title}</h2>
              <p>{selected.description}</p>
              <div className="detail-tags">
                <span>{selected.category}</span>
                {selected.courseLevel && (
                  <span>{levelNames[selected.courseLevel]}</span>
                )}
              </div>
              {itemPrice(selected) !== null && (
                <div className="detail-price">
                  <strong>
                    {money.format((itemPrice(selected) ?? 0) / 100)}
                  </strong>
                  <small>
                    Conferido em{' '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(selected.confirmedAt ?? ''))}
                    . O preço final é o da plataforma.
                  </small>
                </div>
              )}
              <div className="details-actions">
                {hasLiveLink(selected) ? (
                  <a
                    className="button primary"
                    href={`/go/${selected.slug}`}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                  >
                    {selected.kind === 'course'
                      ? 'Conhecer o curso'
                      : 'Clique aqui para comprar'}{' '}
                    <ExternalLink size={17} />
                  </a>
                ) : (
                  <div className="detail-preview">
                    <Sparkles size={18} />
                    <span>
                      Esta é uma prévia. O link e as condições serão adicionados
                      antes da publicação.
                    </span>
                  </div>
                )}
                <button
                  className="button secondary"
                  onClick={() => toggleFavorite(selected)}
                >
                  <Heart
                    size={17}
                    fill={saved.includes(selected.id) ? 'currentColor' : 'none'}
                  />
                  {saved.includes(selected.id) ? 'Salvo' : 'Salvar para depois'}
                </button>
              </div>
              {hasLiveLink(selected) && (
                <p className="detail-affiliate">
                  link de afiliado · a compra é feita diretamente na{' '}
                  {platformNames[selected.platform]}.
                </p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
