/**
 * @fileoverview Moldura simuladora de smartphone (`390 × 844 px`) compartilhada pelas
 * Telas 5 e 6 (Cenário 4 — Sansão no metrô).
 * Isola o viewport mobile com barra de status realista e painel lateral de apoio
 * exibindo o passo a passo de demonstração, estado sincronizado do Cap. 9 e botão
 * de restauração inicial (`R19`, `R20`).
 */
import React from 'react';
import { usePrototype } from '../../state/PrototypeContext';
import { formatPlaybackRate } from './useSansaoAudio';
import './MobileScreens.css';

interface MobileFrameProps {
  screenLabel: string;
  children: React.ReactNode;
}

/**
 * Container que emoldura as telas mobile em 390×844 px sem sobrepor conteúdo e
 * apresenta o painel lateral de estado em tempo real para o Cenário 4.
 */
export const MobileFrame: React.FC<MobileFrameProps> = ({
  screenLabel,
  children,
}) => {
  const { sansaoChapter, playbackRate, resetSansaoChapter } = usePrototype();
  const totalBlocks = sansaoChapter.blocks.length;

  return (
    <div className="mobile-stage">
      <div
        className="mobile-device-bezel"
        aria-label={`Simulador de smartphone 390 por 844 pixels — ${screenLabel}`}
      >
        <div className="mobile-frame">
          <div className="mobile-status-bar" aria-hidden="true">
            <span>08:14</span>
            <span className="mobile-status-notch" />
            <span className="mobile-status-indicators">
              <span className="mobile-signal-bars">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>5G</span>
              <span className="mobile-battery">
                <span className="mobile-battery-level" />
              </span>
            </span>
          </div>
          {children}
        </div>
      </div>

      <aside
        className="mobile-demo-aside"
        aria-label="Guia de demonstração do Cenário 4"
      >
        <span className="mobile-demo-badge">Cenário 4 · Sansão no metrô</span>
        <h2 className="mobile-demo-title">{screenLabel}</h2>
        <p className="mobile-demo-desc">
          Viewport mobile dedicado de <strong>390 × 844 px</strong> com alvos
          de toque <strong>≥ 48 × 48 px</strong> na zona do polegar, sem
          sobrepor nenhuma linha de texto.
        </p>

        <ol className="mobile-demo-steps">
          <li>
            Na <strong>Tela 5</strong>, use <em>Reproduzir</em> e{' '}
            <em>Voltar</em> (múltiplos toques) com velocidade{' '}
            <strong>{formatPlaybackRate(playbackRate)}</strong>.
          </li>
          <li>
            Toque em <strong>Editar</strong> para abrir a{' '}
            <strong>Tela 6</strong> já posicionada entre a taverna e a floresta.
          </li>
          <li>
            Role a barra acima do teclado para ativar <em>Itálico</em> (ou
            desativar um toque acidental), use <strong>Ditado por voz</strong>,
            adicione <code>***</code> centralizado e expanda o player pelo ícone
            de fones sem fechar o teclado.
          </li>
          <li>
            Toque em <strong>Salvar</strong> para conferir o capítulo atualizado
            na Tela 5 com velocidade preservada.
          </li>
        </ol>

        <div className="mobile-demo-status" aria-live="polite">
          <span>
            <strong>Posição atual:</strong> Parágrafo{' '}
            {sansaoChapter.currentParagraph} de {totalBlocks}
          </span>
          <span>
            <strong>Velocidade global:</strong>{' '}
            {formatPlaybackRate(playbackRate)}
          </span>
          <span>
            <strong>Estado do Cap. 9:</strong>{' '}
            {sansaoChapter.edited ? 'Editado e salvo' : 'Versão inicial (taverna + floresta coladas)'}
          </span>
        </div>

        <button
          type="button"
          className="btn-pill-secondary"
          style={{ minHeight: '48px', width: '100%' }}
          onClick={resetSansaoChapter}
        >
          Restaurar Cap. 9 inicial
        </button>
      </aside>
    </div>
  );
};
