import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Heart } from 'lucide-react';
import type { CatalogItem } from '@ofertas/core';
import { MaryAvatar } from './mary-avatar';
import { ProductCarousel } from './product-carousel';
export type Shop = 'shopee' | 'mercadolivre';
const names = { shopee: 'Shopee', mercadolivre: 'Mercado Livre' };
export function MarketplaceLogo({ shop }: { shop: Shop }) {
  return (
    <Image
      className={`marketplace-logo logo-${shop}`}
      src={
        shop === 'shopee'
          ? '/images/shopee-logo.svg'
          : '/images/mercadolivre-logo.png'
      }
      alt={`Logo ${names[shop]}`}
      width={shop === 'shopee' ? 180 : 128}
      height={shop === 'shopee' ? 58 : 128}
      unoptimized
    />
  );
}
export function ShopDirectory() {
  return (
    <section
      id="lojas"
      className="shop-directory page-width"
      aria-labelledby="shops-heading"
    >
      <span className="eyebrow">CADA LOJINHA TEM SEU CANTINHO</span>
      <h2 id="shops-heading">Escolha onde quer descobrir.</h2>
      <p>
        Os achados da Shopee e do Mercado Livre têm vitrines próprias. Escolha a
        sua.
      </p>
      <div className="shop-directory-grid">
        {(['shopee', 'mercadolivre'] as const).map((shop) => (
          <Link
            key={shop}
            href={shop === 'shopee' ? '/shopee' : '/mercado-livre'}
            className={`shop-directory-card directory-${shop}`}
          >
            <div className="directory-brand">
              <span className="marketplace-logo-plate">
                <MarketplaceLogo shop={shop} />
              </span>
              <span className="directory-plus">+</span>
              <MaryAvatar size={60} decorative />
            </div>
            <span className="eyebrow">SELEÇÃO DA MARY</span>
            <h3>Achadinhos na {names[shop]}</h3>
            <p>
              {shop === 'shopee'
                ? 'Um toque de laranja para descobrir seu próximo upgrade.'
                : 'Games, acessórios e detalhes para o seu universo.'}
            </p>
            <span className="directory-enter">
              Entrar na lojinha <ArrowUpRight size={20} />
            </span>
          </Link>
        ))}
      </div>
      <p className="amazon-coming">
        Amazon <span>em breve</span>
      </p>
    </section>
  );
}
export function ShopHero({
  shop,
  items,
}: {
  shop: Shop;
  items: CatalogItem[];
}) {
  return (
    <section className="shop-hero page-width" aria-labelledby="hero-title">
      <div className="shop-hero-copy">
        <div className="shop-cobrand">
          <span className="marketplace-logo-plate">
            <MarketplaceLogo shop={shop} />
          </span>
          <span className="cobrand-divider">+</span>
          <div className="shop-mary-signature">
            <MaryAvatar size={48} decorative />
            <span>
              Mary Hunter<small>CURADORIA DO CANAL</small>
            </span>
          </div>
        </div>
        <div className="eyebrow">SUA COMUNIDADE. SEUS ACHADINHOS.</div>
        <h1 id="hero-title">
          O toque da Mary.
          <br />
          <span>Os achados da {names[shop]}.</span>
        </h1>
        <p>
          {shop === 'shopee'
            ? 'Escolhas para as suas lives, seu setup e tudo que a gente curte. Uma lojinha com laranja Shopee e a nossa dose de lilás.'
            : 'Do próximo jogo aos detalhes do seu setup. Uma seleção com o amarelo Mercado Livre e a personalidade do canal.'}
        </p>
        <a href="#explorar" className="button primary shop-browse">
          Explorar {items.length} {items.length === 1 ? 'produto' : 'produtos'}{' '}
          <ArrowDown size={17} />
        </a>
        <div className="shop-hero-disclosure">
          <Heart size={15} />
          <span>
            Links de afiliado · você finaliza a compra na {names[shop]}.
          </span>
        </div>
      </div>
      <div className="shop-hero-art">
        <div className="shop-halo" />
        <ProductCarousel key={shop} items={items} />
        <div className="shop-avatar-seal">
          <MaryAvatar size={90} variant="community" decorative />
          <span>
            Escolhidos
            <br />
            para a comunidade ♡
          </span>
        </div>
        <span className="shop-art-star" aria-hidden="true">
          ✳
        </span>
      </div>
    </section>
  );
}
