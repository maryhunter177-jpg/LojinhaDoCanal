import { ImageResponse } from 'next/og';
export const alt =
  'Lojinha do Canal Mary Hunter — cursos de programação e achadinhos para seu setup';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 70,
          background: '#f8f5fd',
          color: '#302345',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 34 }}>
          Mary Hunter
          <span style={{ marginLeft: 24, color: '#8e71b9', fontSize: 22 }}>
            LOJINHA DO CANAL
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 1.05,
          }}
        >
          <div>Seu próximo nível</div>
          <div>começa por aqui.</div>
        </div>
        <div style={{ display: 'flex', fontSize: 27, color: '#80678f' }}>
          Aprenda algo novo. Encontre seu próximo achado.
        </div>
      </div>
    ),
    size,
  );
}
