// Modelo de bloques del editor de campañas + render a HTML de email
// (table-based, estilos inline, ancho máx 600px — compatible con clientes de correo).

export type Align = 'left' | 'center' | 'right';

export type Block =
  | { id: string; type: 'heading'; text: string; align: Align }
  | { id: string; type: 'text'; text: string; align: Align }
  | { id: string; type: 'button'; text: string; url: string; align: Align; bg: string; color: string }
  | { id: string; type: 'image'; src: string; alt: string; href: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'spacer'; size: number };

export type BlockType = Block['type'];

export interface CampaignStyle {
  bg: string;         // fondo del email (fuera del contenido)
  contentBg: string;  // fondo del bloque de contenido
  text: string;       // color de texto base
  accent: string;     // color de acento (botones por defecto)
  muted: string;      // separadores / footer
  headingFont: string;
  bodyFont: string;
  radius: number;     // radio del contenedor
  logoUrl?: string;   // si está, muestra header con logo
  headerBg?: string;  // fondo del header del logo
}

// ---------- Temas / estéticas ----------
export interface Theme { key: string; name: string; emoji: string; style: CampaignStyle }

const SERIF = "'Georgia',serif";
const SANS = "Arial,Helvetica,sans-serif";
const SYSTEM = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
// Logo B2Better (mismo que usan los correos transaccionales — logo negro sobre header blanco).
export const B2BETTER_LOGO = 'https://cdn.jsdelivr.net/gh/leopecom1/b2better-app-landing@main/assets/logotipo-black.png';

export const THEMES: Theme[] = [
  { key: 'b2better', name: 'B2Better', emoji: '💠', style: { bg: '#0A0A0B', contentBg: '#111114', text: '#F0F0F0', accent: '#0404FB', muted: '#5C5C66', headingFont: SYSTEM, bodyFont: SYSTEM, radius: 24, logoUrl: B2BETTER_LOGO, headerBg: '#FFFFFF' } },
  { key: 'calido', name: 'Cálido', emoji: '🟦', style: { bg: '#f2f1ec', contentBg: '#ffffff', text: '#1A1A2E', accent: '#3D5A80', muted: '#8a8a99', headingFont: SERIF, bodyFont: SANS, radius: 16 } },
  { key: 'minimal', name: 'Minimal', emoji: '⬜', style: { bg: '#ffffff', contentBg: '#ffffff', text: '#1f2937', accent: '#111827', muted: '#9ca3af', headingFont: SANS, bodyFont: SANS, radius: 4 } },
  { key: 'oscuro', name: 'Oscuro', emoji: '⬛', style: { bg: '#14141c', contentBg: '#1e1e2a', text: '#ececf3', accent: '#C9A96E', muted: '#8a8a99', headingFont: SERIF, bodyFont: SANS, radius: 16 } },
  { key: 'natura', name: 'Natura', emoji: '🟩', style: { bg: '#eef2ee', contentBg: '#ffffff', text: '#1A1A2E', accent: '#7B9E87', muted: '#96a396', headingFont: SERIF, bodyFont: SANS, radius: 20 } },
  { key: 'promo', name: 'Promo', emoji: '🟧', style: { bg: '#fff4e6', contentBg: '#ffffff', text: '#1A1A2E', accent: '#E07A5F', muted: '#b0a79e', headingFont: SANS, bodyFont: SANS, radius: 22 } },
  { key: 'oro', name: 'Elegante', emoji: '🟨', style: { bg: '#f7f5f0', contentBg: '#ffffff', text: '#2b2b2b', accent: '#C9A96E', muted: '#a99f8c', headingFont: SERIF, bodyFont: SERIF, radius: 8 } },
];

// Bloques iniciales del template B2Better (para campañas nuevas).
export function b2betterStarter(): Block[] {
  return [
    { ...newBlock('heading'), text: 'Novedades de B2Better' } as Block,
    { ...newBlock('text'), text: 'Hola {{first_name}}, te contamos algo nuevo que preparamos para vos.' } as Block,
    { ...newBlock('button', '#0404FB'), text: 'Abrir la app' } as Block,
  ];
}

export const DEFAULT_STYLE: CampaignStyle = THEMES[0].style;

export function styleFrom(partial?: Partial<CampaignStyle> | null): CampaignStyle {
  return { ...DEFAULT_STYLE, ...(partial || {}) };
}

export function newBlock(type: BlockType, accent = DEFAULT_STYLE.accent): Block {
  const id = (crypto.randomUUID?.() ?? String(Math.random())).slice(0, 8);
  switch (type) {
    case 'heading': return { id, type, text: 'Título de tu correo', align: 'left' };
    case 'text': return { id, type, text: 'Escribí acá tu mensaje. Podés usar {{first_name}} para personalizar con el nombre del contacto.', align: 'left' };
    case 'button': return { id, type, text: 'Ver más', url: 'https://', align: 'center', bg: accent, color: '#ffffff' };
    case 'image': return { id, type, src: '', alt: '', href: '' };
    case 'divider': return { id, type };
    case 'spacer': return { id, type, size: 24 };
  }
}

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function richText(s: string): string {
  return esc(s).replace(/\n/g, '<br/>');
}

function renderBlock(b: Block, s: CampaignStyle): string {
  const pad = 'padding:8px 32px;';
  switch (b.type) {
    case 'heading':
      return `<tr><td style="${pad}text-align:${b.align};font-family:${s.headingFont};font-size:26px;line-height:1.25;font-weight:700;color:${s.text};">${richText(b.text)}</td></tr>`;
    case 'text':
      return `<tr><td style="${pad}text-align:${b.align};font-family:${s.bodyFont};font-size:16px;line-height:1.6;color:${s.text};">${richText(b.text)}</td></tr>`;
    case 'button': {
      const align = b.align === 'left' ? 'left' : b.align === 'right' ? 'right' : 'center';
      return `<tr><td style="${pad}" align="${align}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${b.bg}" style="border-radius:10px;">
          <a href="${esc(b.url)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${s.bodyFont};font-size:16px;font-weight:700;color:${b.color};text-decoration:none;border-radius:10px;">${esc(b.text)}</a>
        </td></tr></table>
      </td></tr>`;
    }
    case 'image': {
      if (!b.src) return '';
      const img = `<img src="${esc(b.src)}" alt="${esc(b.alt)}" width="536" style="width:100%;max-width:536px;height:auto;display:block;border:0;border-radius:8px;"/>`;
      const inner = b.href ? `<a href="${esc(b.href)}" target="_blank">${img}</a>` : img;
      return `<tr><td style="padding:8px 32px;">${inner}</td></tr>`;
    }
    case 'divider':
      return `<tr><td style="padding:12px 32px;"><div style="border-top:1px solid ${s.muted}33;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
    case 'spacer':
      return `<tr><td style="font-size:0;line-height:0;height:${b.size}px;">&nbsp;</td></tr>`;
  }
}

export function renderEmail(
  blocks: Block[],
  opts: { preheader?: string; style?: CampaignStyle; brand?: string } = {},
): string {
  const s = opts.style ?? DEFAULT_STYLE;
  const brand = opts.brand ?? 'B2Better';
  const body = blocks.map((b) => renderBlock(b, s)).join('\n');
  const preheader = opts.preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${esc(opts.preheader)}</span>`
    : '';

  const header = s.logoUrl
    ? `<tr><td align="center" style="background:${s.headerBg ?? '#ffffff'};padding:26px 40px;">
         <img src="${esc(s.logoUrl)}" alt="${esc(brand)}" width="140" style="display:block;width:140px;height:auto;margin:0 auto;border:0;"/>
       </td></tr>`
    : `<tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${s.bg};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${s.bg};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${s.contentBg};border-radius:${s.radius}px;overflow:hidden;">
    ${header}
    <tr><td style="height:12px;font-size:0;line-height:0;">&nbsp;</td></tr>
    ${body}
    <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
    <tr><td style="padding:20px 32px;text-align:center;font-family:${s.bodyFont};font-size:12px;line-height:1.6;color:${s.muted};">
      <b style="color:${s.muted};">${esc(brand)}</b> — Bienestar emocional para emprendedores.<br/>
      Recibís este correo porque sos parte de ${esc(brand)}. <a href="{{unsubscribe_url}}" style="color:${s.muted};text-decoration:underline;">Darme de baja</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
