/**
 * @fileoverview Região viva real (`aria-live="polite"`) e monitor visual opcional para simular
 * a convivência silenciosa com o leitor de tela NVDA.
 * Atende aos requisitos R7 (nomes e estados anunciados em PT-BR) e R21 (anúncios curtos
 * somente sob ação explícita de controles, sem anúncios automáticos entre parágrafos),
 * além do Cenário 1 (Renata).
 */
import React from 'react';
import { usePrototype } from '../../state/PrototypeContext';
import { NvdaLogSource } from '../../types/prototype';
import { CloseIcon, VolumeIcon } from './Icons';

const SOURCE_LABELS: Record<NvdaLogSource, string> = {
  control: 'Controle',
  progress: 'Progresso',
  editor: 'Editor',
  system: 'Sistema',
};

/**
 * Renderiza a região `role="status"` consumida por leitores de tela reais e, quando
 * habilitado (`showNvdaMonitor`), um painel flutuante com o histórico dos últimos anúncios
 * para inspeção em avaliações de IHC (Cenário 1 / R21).
 */
export const NvdaAnnouncer: React.FC = () => {
  const {
    nvdaLiveMessage,
    nvdaLog,
    clearNvdaLog,
    showNvdaMonitor,
    setShowNvdaMonitor,
  } = usePrototype();

  return (
    <>
      {/* Região live real para leitores de tela (R7 / R21) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="nvda-live-region"
      >
        {nvdaLiveMessage}
      </div>

      {/* Monitor visual opcional (ativado no preset Renata ou pelo Hub) */}
      {showNvdaMonitor && (
        <aside
          aria-label="Monitor de anúncios NVDA"
          data-nvda-monitor="true"
          style={{
            position: 'fixed',
            bottom: '92px',
            left: '16px',
            width: '320px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '300px',
            zIndex: 850,
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-input-aa)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-elevated)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-notice)',
              borderBottom: '1px solid var(--divider)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <VolumeIcon size={17} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>
                  Monitor NVDA (aria-live)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Silencioso entre parágrafos (R21)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={clearNvdaLog}
                style={{
                  minHeight: '34px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-input-aa)',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Limpar
              </button>
              <button
                type="button"
                aria-label="Ocultar monitor NVDA"
                onClick={() => setShowNvdaMonitor(false)}
                style={{
                  minWidth: '34px',
                  minHeight: '34px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-input-aa)',
                }}
              >
                <CloseIcon size={15} />
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--divider)',
              fontSize: '13px',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
              Último anúncio:{' '}
            </span>
            <span style={{ fontWeight: 700 }}>
              {nvdaLiveMessage || 'Nenhum anúncio emitido ainda'}
            </span>
          </div>

          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: '8px 12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {nvdaLog.length === 0 ? (
              <li style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Acione Reproduzir/Pausar, Voltar/Avançar parágrafo ou foque a barra de progresso para ver os anúncios curtos.
              </li>
            ) : (
              nvdaLog.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--divider)',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontWeight: 700,
                    }}
                  >
                    <span>{SOURCE_LABELS[entry.source]}</span>
                    <span>{entry.timestamp}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{entry.text}</span>
                </li>
              ))
            )}
          </ul>
        </aside>
      )}
    </>
  );
};
