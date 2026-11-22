/**
 * @fileoverview Painel flutuante do avaliador para inspeção dos 4 cenários de IHC e rastreabilidade R1–R22.
 * Permite alternar presets (Renata, Leonardo, Adriana e Sansão), navegar diretamente entre as 6 telas,
 * acionar simuladores de acessibilidade (Alto Contraste, Monitor NVDA e Lupa 200%) e consultar critérios
 * de aceite de `rastreabilidade.json` vinculados à tela ativa.
 * Posicionado ao final do DOM em `App.tsx` para não roubar o 1.º foco do skip link na Tela 3 (R4).
 */
import React, { useMemo, useState } from 'react';
import rastreabilidadeData from '../../data/rastreabilidade.json';
import { usePrototype } from '../../state/PrototypeContext';
import { PersonaPresetId, ScreenId } from '../../types/prototype';
import { dispatchHeadsetMediaKey } from './evaluatorEvents';
import {
  ClipboardListIcon,
  CloseIcon,
  ContrastIcon,
  HeadphonesIcon,
  VolumeIcon,
  ZoomInIcon,
} from './Icons';

/** Especificação de um requisito canônico (`R1`–`R22`) carregada de `rastreabilidade.json`. */
interface RequirementSpec {
  id: string;
  titulo: string;
  funcionalidade: string;
  origem: string;
  reforcado_por: string[];
  prioridade: string;
  resumo: string;
  telas: string[];
  cenarios: string[];
  criterio_aceite: string;
}

/** Mapeamento de funcionalidades, nós HTA, requisitos e critérios de aceite por tela. */
interface ScreenTraceabilitySpec {
  titulo: string;
  funcionalidades: string[];
  cenarios: string[];
  hta_nos: string[];
  requisitos_ids: string[];
  criterios_aceite: string[];
}

/** Estrutura tipada do arquivo `rastreabilidade.json`. */
interface TraceabilityJson {
  telas: Record<ScreenId, ScreenTraceabilitySpec>;
  requisitos: Record<string, RequirementSpec>;
}

const TRACEABILITY = rastreabilidadeData as unknown as TraceabilityJson;

const PRESET_OPTIONS: Array<{
  id: PersonaPresetId;
  label: string;
  summary: string;
}> = [
  {
    id: 'renata',
    label: 'Cenário 1 — Renata',
    summary: 'Alto Contraste · Lupa 200% · NVDA · 1,75x · Cap. 1 (40p)',
  },
  {
    id: 'leonardo',
    label: 'Cenário 2 — Leonardo',
    summary: 'Editor Desktop · Cap. 3 rascunho (1.240 palavras)',
  },
  {
    id: 'adriana',
    label: 'Cenário 3 — Adriana',
    summary: 'Home · Site PT / Histórias EN · Listas e selos',
  },
  {
    id: 'sansao',
    label: 'Cenário 4 — Sansão',
    summary: 'Mobile 390×844 · 1,25x · Cap. 9 (taverna/floresta)',
  },
];

const SCREEN_LINKS: Array<{ id: ScreenId; shortLabel: string }> = [
  { id: 'tela_1_home', shortLabel: 'Tela 1 · Home' },
  { id: 'tela_2_idioma', shortLabel: 'Tela 2 · Idioma' },
  { id: 'tela_3_leitura_desktop', shortLabel: 'Tela 3 · Leitura' },
  { id: 'tela_4_editor_desktop', shortLabel: 'Tela 4 · Editor' },
  { id: 'tela_5_leitura_mobile', shortLabel: 'Tela 5 · Leitura Mobile' },
  { id: 'tela_6_editor_mobile', shortLabel: 'Tela 6 · Editor Mobile' },
];

const SECTION_TITLE_STYLE: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '14px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

/** Estilo das linhas de ação do painel, com destaque quando a opção está ativa. */
function toggleRowStyle(active: boolean): React.CSSProperties {
  return {
    minHeight: '42px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-input-aa)',
    backgroundColor: active ? 'var(--btn-active-bg)' : 'var(--bg-page)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 700,
    textAlign: 'left',
  };
}

/**
 * Painel compacto retrátil exibido no canto inferior direito (ajustado acima da barra do player na Tela 3)
 * para apoiar demonstrações e verificações de requisitos durante a avaliação do protótipo.
 */
export const EvaluatorHub: React.FC = () => {
  const {
    activeScreen,
    navigateTo,
    activePreset,
    applyPersonaPreset,
    theme,
    toggleHighContrast,
    showNvdaMonitor,
    setShowNvdaMonitor,
    magnifierEnabled,
    setMagnifierEnabled,
    hideUntranslatedCarousels,
    setHideUntranslatedCarousels,
    resetSansaoChapter,
  } = usePrototype();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'controles' | 'requisitos'>(
    'controles'
  );
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  const screenSpec = useMemo(
    () => TRACEABILITY.telas[activeScreen],
    [activeScreen]
  );

  const screenRequirements = useMemo(() => {
    if (!screenSpec) return [];
    return screenSpec.requisitos_ids
      .map((reqId) => TRACEABILITY.requisitos[reqId])
      .filter(Boolean);
  }, [screenSpec]);

  const selectedRequirement = useMemo(() => {
    if (!selectedReqId) return screenRequirements[0] ?? null;
    const found = screenRequirements.find((r) => r.id === selectedReqId);
    return found ?? screenRequirements[0] ?? null;
  }, [selectedReqId, screenRequirements]);

  const activePresetLabel =
    PRESET_OPTIONS.find((p) => p.id === activePreset)?.label ?? 'Cenário';

  const isReaderDesktop = activeScreen === 'tela_3_leitura_desktop';
  const isMobileScreen =
    activeScreen === 'tela_5_leitura_mobile' ||
    activeScreen === 'tela_6_editor_mobile';

  const closeHub = () => {
    setIsOpen(false);
    if (activeScreen === 'tela_3_leitura_desktop') {
      document.querySelector<HTMLElement>('.app-shell')?.focus({ preventScroll: true });
    }
  };

  return (
    <aside
      data-evaluator-hub="true"
      aria-label="Painel do avaliador do protótipo TP2"
      className={[
        'evaluator-hub',
        isReaderDesktop ? 'evaluator-hub--reader-desktop' : '',
        isMobileScreen ? 'evaluator-hub--mobile-screen' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Barra compacta flutuante sempre acessível sem roubar o 1.º Tab (R4) */}
      <div className="evaluator-hub-pill">
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              setActiveTab('controles');
              setIsOpen(true);
            } else if (activeTab === 'controles') {
              closeHub();
            } else {
              setActiveTab('controles');
            }
          }}
          aria-expanded={isOpen && activeTab === 'controles'}
          style={{
            minHeight: '36px',
            padding: '0 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor:
              isOpen && activeTab === 'controles'
                ? 'var(--btn-primary-bg)'
                : 'var(--bg-surface)',
            color:
              isOpen && activeTab === 'controles'
                ? 'var(--btn-primary-text)'
                : 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {isOpen ? 'Painel TP2' : `TP2 · ${activePresetLabel}`}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              setActiveTab('requisitos');
              setIsOpen(true);
            } else if (activeTab === 'requisitos') {
              closeHub();
            } else {
              setActiveTab('requisitos');
            }
          }}
          aria-expanded={isOpen && activeTab === 'requisitos'}
          style={{
            minHeight: '36px',
            padding: '0 12px',
            borderRadius: 'var(--radius-pill)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor:
              isOpen && activeTab === 'requisitos'
                ? 'var(--btn-brand-bg)'
                : 'var(--bg-notice)',
            color:
              isOpen && activeTab === 'requisitos'
                ? 'var(--btn-brand-text)'
                : 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          <ClipboardListIcon size={15} />
          <span>Requisitos desta tela ({screenRequirements.length})</span>
        </button>

        {isOpen && (
          <button
            type="button"
            aria-label="Recolher painel do avaliador"
            onClick={closeHub}
            style={{
              minWidth: '36px',
              minHeight: '36px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {/* Gaveta expandida abrindo para cima dentro da viewport */}
      {isOpen && (
        <div
          style={{
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: isReaderDesktop ? 'calc(100vh - 156px)' : 'calc(100vh - 120px)',
            overflowY: 'auto',
            padding: '14px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-input-aa)',
            boxShadow: 'var(--shadow-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {activeTab === 'controles' ? (
            <>
              {/* Presets dos 4 Cenários */}
              <section aria-label="Presets de cenários">
                <h2 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Presets de Cenários
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PRESET_OPTIONS.map((preset) => {
                    const isSelected = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => applyPersonaPreset(preset.id)}
                        style={{
                          minHeight: '44px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'left',
                          border: isSelected
                            ? '2px solid var(--btn-active-border)'
                            : '1px solid var(--divider)',
                          backgroundColor: isSelected
                            ? 'var(--btn-active-bg)'
                            : 'var(--bg-surface)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>
                          {preset.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {preset.summary}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Navegação Direta das 6 Telas */}
              <section aria-label="Navegação direta entre telas">
                <h2 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Navegação Rápida (6 Telas)
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '6px',
                  }}
                >
                  {SCREEN_LINKS.map((item) => {
                    const isCurrent = activeScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-current={isCurrent ? 'page' : undefined}
                        onClick={() => navigateTo(item.id)}
                        style={{
                          minHeight: '40px',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          fontWeight: 700,
                          textAlign: 'left',
                          border: isCurrent
                            ? '2px solid var(--btn-primary-bg)'
                            : '1px solid var(--border-input-aa)',
                          backgroundColor: isCurrent
                            ? 'var(--btn-primary-bg)'
                            : 'var(--bg-page)',
                          color: isCurrent
                            ? 'var(--btn-primary-text)'
                            : 'var(--text-primary)',
                        }}
                      >
                        {item.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Toggles de Acessibilidade */}
              <section aria-label="Simuladores de acessibilidade">
                <h2 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Acessibilidade (R21 / R22)
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    aria-pressed={theme === 'high-contrast'}
                    onClick={toggleHighContrast}
                    style={{
                      minHeight: '42px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-input-aa)',
                      backgroundColor:
                        theme === 'high-contrast'
                          ? 'var(--btn-active-bg)'
                          : 'var(--bg-page)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <ContrastIcon size={17} />
                      <span>Alto Contraste Escuro</span>
                    </span>
                    <span>{theme === 'high-contrast' ? 'Ativo' : 'Desligado'}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={showNvdaMonitor}
                    onClick={() => setShowNvdaMonitor(!showNvdaMonitor)}
                    style={{
                      minHeight: '42px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-input-aa)',
                      backgroundColor: showNvdaMonitor
                        ? 'var(--btn-active-bg)'
                        : 'var(--bg-page)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <VolumeIcon size={17} />
                      <span>Monitor NVDA (aria-live)</span>
                    </span>
                    <span>{showNvdaMonitor ? 'Visível' : 'Oculto'}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={magnifierEnabled}
                    onClick={() => setMagnifierEnabled(!magnifierEnabled)}
                    style={{
                      minHeight: '42px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-input-aa)',
                      backgroundColor: magnifierEnabled
                        ? 'var(--btn-active-bg)'
                        : 'var(--bg-page)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <ZoomInIcon size={17} />
                      <span>Lupa 200% (Foco)</span>
                    </span>
                    <span>{magnifierEnabled ? 'Ativa' : 'Desligada'}</span>
                  </button>
                </div>
              </section>

              {/* Simulações que não fazem parte da interface do usuário */}
              <section aria-label="Simulações de teste">
                <h2 style={SECTION_TITLE_STYLE}>Simulações de teste</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeScreen === 'tela_1_home' && (
                    <button
                      type="button"
                      aria-pressed={!hideUntranslatedCarousels}
                      onClick={() =>
                        setHideUntranslatedCarousels(!hideUntranslatedCarousels)
                      }
                      style={toggleRowStyle(!hideUntranslatedCarousels)}
                    >
                      <span>R9 · Mostrar carrossel sem tradução</span>
                      <span>{hideUntranslatedCarousels ? 'Oculto' : 'Visível'}</span>
                    </button>
                  )}

                  {isReaderDesktop && (
                    <button
                      type="button"
                      onClick={dispatchHeadsetMediaKey}
                      style={toggleRowStyle(false)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <HeadphonesIcon size={17} />
                        <span>R5 · Tecla de mídia do headset (Play/Pausa)</span>
                      </span>
                    </button>
                  )}

                  {(activeScreen === 'tela_5_leitura_mobile' ||
                    activeScreen === 'tela_6_editor_mobile') && (
                    <button
                      type="button"
                      onClick={resetSansaoChapter}
                      style={toggleRowStyle(false)}
                    >
                      <span>Restaurar o Cap. 9 inicial (Sansão)</span>
                    </button>
                  )}

                  {activeScreen !== 'tela_1_home' &&
                    !isReaderDesktop &&
                    activeScreen !== 'tela_5_leitura_mobile' &&
                    activeScreen !== 'tela_6_editor_mobile' && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Nenhuma simulação extra nesta tela.
                      </p>
                    )}
                </div>
              </section>
            </>
          ) : (
            /* Gaveta de Rastreabilidade (rastreabilidade.json) */
            <section aria-label="Requisitos rastreados para a tela ativa">
              {screenSpec ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-aa)' }}>
                      {screenSpec.cenarios.join(' · ')}
                    </div>
                    <h2 style={{ margin: '2px 0 4px', fontSize: '16px', fontWeight: 700 }}>
                      {screenSpec.titulo}
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Nós HTA: {screenSpec.hta_nos.join(' | ')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Requisitos (R1–R22) — clique para detalhar:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {screenRequirements.map((req) => {
                        const isSelected = selectedRequirement?.id === req.id;
                        return (
                          <button
                            key={req.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedReqId(req.id)}
                            style={{
                              minHeight: '32px',
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '12px',
                              fontWeight: 700,
                              border: '1.5px solid var(--border-input-aa)',
                              backgroundColor: isSelected
                                ? 'var(--btn-primary-bg)'
                                : 'var(--bg-surface)',
                              color: isSelected
                                ? 'var(--btn-primary-text)'
                                : 'var(--text-primary)',
                            }}
                          >
                            {req.id} · {req.prioridade}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedRequirement && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-input-aa)',
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {selectedRequirement.id}: {selectedRequirement.titulo}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Origem: {selectedRequirement.origem}
                        {selectedRequirement.reforcado_por.length > 0
                          ? ` (+ ${selectedRequirement.reforcado_por.join(', ')})`
                          : ''}
                      </div>
                      <div>{selectedRequirement.resumo}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal-text-aa)' }}>
                        Aceite: {selectedRequirement.criterio_aceite}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Critérios de Aceite da Tela:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {screenSpec.criterios_aceite.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Nenhuma especificação encontrada para {activeScreen}.
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </aside>
  );
};
