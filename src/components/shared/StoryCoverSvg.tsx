/**
 * @fileoverview Gerador determinístico de capas em SVG offline para histórias e listas de leitura.
 * Garante carregamento instantâneo sem dependências externas, proporção fixa 16:25 e contraste
 * legível na faixa inferior do título (R22), com opção decorativa ou semântica (`role="img"`).
 */
import React from 'react';
import { CoverMotif, StoryItem } from '../../types/prototype';

/**
 * Propriedades do componente `StoryCoverSvg`.
 */
interface StoryCoverSvgProps {
  /** Dados da história ou lista cujos título, gênero, autor e paleta alimentam a capa. */
  story: StoryItem;
  /** Largura CSS do contêiner da capa (padrão `'100%'`). */
  width?: number | string;
  /** Classes CSS opcionais aplicadas ao invólucro externo. */
  className?: string;
  /** Quando `true` (padrão), oculta o SVG da árvore de acessibilidade para evitar leitura duplicada em cards. */
  decorative?: boolean;
}

/**
 * Renderiza o grafismo vetorial de fundo correspondente ao motivo configurado na paleta da capa.
 *
 * @param motif Identificador do padrão geométrico.
 * @param accent Cor de destaque da paleta da história.
 * @returns Elementos SVG decorativos do motivo escolhido.
 */
function renderMotif(motif: CoverMotif, accent: string): React.ReactNode {
  switch (motif) {
    case 'horizon':
      return (
        <>
          <circle cx="128" cy="128" r="54" fill={accent} fillOpacity="0.88" />
          <path
            d="M0 240 Q70 212 128 232 T256 226 L256 400 L0 400 Z"
            fill="#000000"
            fillOpacity="0.28"
          />
          <line
            x1="28"
            y1="205"
            x2="228"
            y2="205"
            stroke="#FFFFFF"
            strokeOpacity="0.32"
            strokeWidth="2"
          />
        </>
      );
    case 'waves':
      return (
        <>
          <path
            d="M0 160 C55 125 110 195 168 155 C205 130 232 140 256 155 L256 400 L0 400 Z"
            fill={accent}
            fillOpacity="0.24"
          />
          <path
            d="M0 205 C64 175 120 235 190 198 C222 181 242 190 256 200 L256 400 L0 400 Z"
            fill={accent}
            fillOpacity="0.36"
          />
          <circle cx="192" cy="86" r="24" fill={accent} fillOpacity="0.85" />
        </>
      );
    case 'arcs':
      return (
        <>
          <circle cx="128" cy="145" r="78" stroke={accent} strokeWidth="2.5" strokeOpacity="0.7" fill="none" />
          <circle cx="128" cy="145" r="52" stroke={accent} strokeWidth="2" strokeOpacity="0.5" fill="none" />
          <circle cx="128" cy="145" r="22" fill={accent} fillOpacity="0.85" />
        </>
      );
    case 'prism':
      return (
        <>
          <polygon
            points="128,46 216,196 40,196"
            fill={accent}
            fillOpacity="0.26"
            stroke={accent}
            strokeWidth="2.5"
          />
          <polygon
            points="128,78 186,182 70,182"
            fill="#FFFFFF"
            fillOpacity="0.12"
          />
        </>
      );
    case 'constellation':
      return (
        <>
          <circle cx="62" cy="84" r="4" fill={accent} />
          <circle cx="144" cy="68" r="5" fill={accent} />
          <circle cx="196" cy="116" r="4" fill={accent} />
          <circle cx="114" cy="146" r="4.5" fill={accent} />
          <circle cx="168" cy="178" r="3.5" fill={accent} />
          <path
            d="M62 84 L144 68 L196 116 L168 178 L114 146 Z"
            stroke={accent}
            strokeOpacity="0.55"
            strokeWidth="1.8"
            fill="none"
          />
        </>
      );
    case 'geometric':
    default:
      return (
        <>
          <rect
            x="48"
            y="58"
            width="160"
            height="160"
            rx="16"
            transform="rotate(14 128 138)"
            fill={accent}
            fillOpacity="0.22"
            stroke={accent}
            strokeWidth="2"
          />
          <rect
            x="78"
            y="88"
            width="100"
            height="100"
            rx="10"
            transform="rotate(-12 128 138)"
            fill="#FFFFFF"
            fillOpacity="0.12"
          />
        </>
      );
  }
}

/**
 * Quebra o título da história em até 4 linhas curtas (~16 caracteres) para evitar
 * transbordamento horizontal dentro do `viewBox` 256×400 do SVG.
 *
 * @param title Título completo da história ou lista.
 * @returns Lista de linhas ajustadas à largura da capa.
 */
function splitTitleLines(title: string): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= 16 || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === 3) break;
  }
  if (current && lines.length < 4) {
    lines.push(current);
  }
  return lines;
}

/**
 * Renderiza a capa vetorial da história em proporção 16:25 com gradiente, motivo gráfico,
 * faixa escurecida para garantir contraste AA do texto e metadados de gênero/autor.
 *
 * @param props Propriedades do componente `StoryCoverSvg`.
 */
export const StoryCoverSvg: React.FC<StoryCoverSvgProps> = ({
  story,
  width = '100%',
  className,
  decorative = true,
}) => {
  const gradId = `cover-grad-${story.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { bgPrimary, bgSecondary, accent, textColor, motif } = story.coverPalette;
  const titleLines = splitTitleLines(story.title);
  const startY = 258 - (titleLines.length - 1) * 14;

  return (
    <div
      className={className}
      style={{
        width,
        aspectRatio: '16 / 25',
        borderRadius: 'var(--radius-cover)',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid var(--divider)',
        backgroundColor: bgSecondary,
      }}
    >
      <svg
        viewBox="0 0 256 400"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : `Capa de ${story.title}`}
        focusable="false"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bgPrimary} />
            <stop offset="100%" stopColor={bgSecondary} />
          </linearGradient>
        </defs>

        <rect width="256" height="400" fill={`url(#${gradId})`} />

        {/* Grafismo geométrico sutil */}
        {renderMotif(motif, accent)}

        {/* Faixa inferior legível para título */}
        <rect
          x="0"
          y="218"
          width="256"
          height="182"
          fill="#000000"
          fillOpacity="0.45"
        />

        {/* Chip de gênero no topo */}
        <rect
          x="18"
          y="20"
          width="112"
          height="24"
          rx="12"
          fill="#000000"
          fillOpacity="0.45"
        />
        <text
          x="28"
          y="36"
          fill={textColor}
          fontSize="11"
          fontWeight="700"
          fontFamily='"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
          letterSpacing="0.5"
        >
          {story.genre.toUpperCase().slice(0, 16)}
        </text>

        {/* Título */}
        <text
          x="20"
          y={startY}
          fill={textColor}
          fontSize="22"
          fontWeight="700"
          fontFamily='"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
        >
          {titleLines.map((line, index) => (
            <tspan key={`${line}-${index}`} x="20" dy={index === 0 ? 0 : 26}>
              {line}
            </tspan>
          ))}
        </text>

        {/* Linha de acento + autor */}
        <rect x="20" y="344" width="38" height="4" rx="2" fill={accent} />
        <text
          x="20"
          y="368"
          fill={textColor}
          fillOpacity="0.92"
          fontSize="14"
          fontWeight="600"
          fontFamily='"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
        >
          {story.author.slice(0, 26)}
        </text>
      </svg>
    </div>
  );
};
