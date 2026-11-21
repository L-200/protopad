/**
 * @fileoverview Tela 6 — Editor de Capítulo Mobile com Teclado Virtual (`390 × 844 px`).
 * Implementa a barra de formatação horizontal ancorada acima do teclado virtual (`R20`)
 * com alvos `>= 48 × 48 px` (`R19`), teclado QWERTY simulado com Ditado por voz aplicando
 * o estilo ativo sem seleção prévia, inserção direta de separador `***` centralizado e
 * player compacto expansível no topo para conferência sem dispensar o teclado (Cenário 4).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronLeftIcon,
  CloseIcon,
  HeadphonesIcon,
  ItalicIcon,
  MicIcon,
  NextParagraphIcon,
  PauseIcon,
  PlayIcon,
  PrevParagraphIcon,
  SceneSeparatorIcon,
  SpeedIcon,
  UnderlineIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { usePrototype } from '../../state/PrototypeContext';
import { MobileBlock, TextAlign } from '../../types/prototype';
import { MobileFrame } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';
import './MobileScreens.css';

interface ActiveStyleState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
}

const DEFAULT_STYLE: ActiveStyleState = {
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
};

const DICTATED_THOUGHT =
  'Caio soube naquele instante que não haveria volta se cruzasse a fronteira.';

const QWERTY_ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const QWERTY_ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const QWERTY_ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

/**
 * Localiza o índice padrão do cursor logo após a cena da taverna e antes da cena
 * da floresta para que a Tela 6 já abra posicionada no ponto de edição do Cenário 4.
 */
function findDefaultInsertionIndex(blocks: MobileBlock[]): number {
  if (blocks.length === 0) return -1;
  // Bloco 4 (índice 3) marca a fala do estalajadeiro, logo antes da cena na floresta
  const forestIdx = blocks.findIndex((b) =>
    b.text.toLowerCase().includes('floresta')
  );
  if (forestIdx > 0) {
    return forestIdx - 1;
  }
  return Math.min(3, blocks.length - 1);
}

/**
 * Editor mobile do Cap. 9 com compositor inline entre blocos, barra de formatação
 * rolável horizontalmente e teclado virtual simulado sempre acessível.
 */
export const MobileEditorScreen: React.FC = () => {
  const { sansaoChapter, updateSansaoChapter, navigateTo } = usePrototype();

  const [draftBlocks, setDraftBlocks] = useState<MobileBlock[]>(() =>
    sansaoChapter.blocks.map((b) => ({ ...b }))
  );
  const [insertAfterIndex, setInsertAfterIndex] = useState<number>(() =>
    findDefaultInsertionIndex(sansaoChapter.blocks)
  );
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState<string>('');
  const [activeStyle, setActiveStyle] =
    useState<ActiveStyleState>(DEFAULT_STYLE);
  const [isCompactPlayerExpanded, setIsCompactPlayerExpanded] =
    useState<boolean>(false);
  const [dictationState, setDictationState] = useState<
    'idle' | 'listening' | 'done'
  >('idle');
  const [dictationCount, setDictationCount] = useState<number>(0);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const dictationTimerRef = useRef<number | null>(null);

  const {
    isPlaying,
    currentParagraph,
    totalParagraphs,
    rateLabel,
    progressPercent,
    togglePlay,
    prevParagraph,
    nextParagraph,
    cyclePlaybackRate,
  } = useSansaoAudio(draftBlocks);

  // Sincroniza quando o usuário clica em "Restaurar Cap. 9 inicial" no painel lateral
  useEffect(() => {
    if (!sansaoChapter.edited) {
      setDraftBlocks(sansaoChapter.blocks.map((b) => ({ ...b })));
      setInsertAfterIndex(findDefaultInsertionIndex(sansaoChapter.blocks));
      setEditingBlockId(null);
      setComposerText('');
      setActiveStyle(DEFAULT_STYLE);
      setDictationCount(0);
      setDictationState('idle');
    }
  }, [sansaoChapter.edited, sansaoChapter.blocks]);

  useEffect(() => {
    return () => {
      if (dictationTimerRef.current !== null) {
        window.clearTimeout(dictationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    composerRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [insertAfterIndex]);

  const buildBlockFromText = (
    rawText: string,
    style: ActiveStyleState,
    forceSeparator = false
  ): MobileBlock => {
    const trimmed = rawText.trim();
    const isSep = forceSeparator || trimmed === '***';
    return {
      id: `mob-blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: isSep ? '***' : trimmed,
      bold: isSep ? false : style.bold,
      italic: isSep ? false : style.italic,
      underline: isSep ? false : style.underline,
      align: forceSeparator ? 'center' : style.align,
      isSeparator: isSep,
    };
  };

  /**
   * Converte o texto do compositor (ou customText) em um `MobileBlock` aplicando o
   * estilo ativo e insere após `insertAfterIndex`, mantendo a sequência de blocos.
   */
  const commitComposerBlock = (customText?: string, forceSeparator = false) => {
    const textToCommit = customText !== undefined ? customText : composerText;
    if (!textToCommit.trim() && !forceSeparator) {
      return draftBlocks;
    }
    const newBlock = buildBlockFromText(
      textToCommit,
      activeStyle,
      forceSeparator
    );
    const nextBlocks = [...draftBlocks];
    const safeInsertPos = Math.max(
      0,
      Math.min(insertAfterIndex + 1, nextBlocks.length)
    );
    nextBlocks.splice(safeInsertPos, 0, newBlock);
    setDraftBlocks(nextBlocks);
    setInsertAfterIndex(safeInsertPos);
    setComposerText('');
    return nextBlocks;
  };

  const handleToggleStyle = (key: 'bold' | 'italic' | 'underline') => {
    const nextVal = !activeStyle[key];
    setActiveStyle((prev) => ({ ...prev, [key]: nextVal }));
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) => (b.id === editingBlockId ? { ...b, [key]: nextVal } : b))
      );
    }
  };

  const handleSetAlign = (align: TextAlign) => {
    setActiveStyle((prev) => ({ ...prev, align }));
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) => (b.id === editingBlockId ? { ...b, align } : b))
      );
    }
  };

  /**
   * Comita eventual texto pendente no compositor e insere um bloco separador `***`
   * já centralizado logo em seguida (`R20`).
   */
  const handleInsertSeparator = () => {
    setEditingBlockId(null);
    let working = draftBlocks;
    let cursor = insertAfterIndex;
    if (composerText.trim()) {
      const committed = buildBlockFromText(composerText, activeStyle, false);
      working = [...draftBlocks];
      const pos = Math.max(0, Math.min(cursor + 1, working.length));
      working.splice(pos, 0, committed);
      cursor = pos;
    }
    const sepBlock = buildBlockFromText('***', { ...activeStyle, align: 'center' }, true);
    const sepPos = Math.max(0, Math.min(cursor + 1, working.length));
    const finalBlocks = [...working];
    finalBlocks.splice(sepPos, 0, sepBlock);
    setDraftBlocks(finalBlocks);
    setInsertAfterIndex(sepPos);
    setComposerText('');
    setActiveStyle((prev) => ({ ...prev, align: 'center' }));
  };

  /**
   * Simula captação de voz em PT-BR no Cenário 4: primeiro ditado insere o pensamento
   * preservando formatações ativas (ex.: Itálico); ditados seguintes facilitam `***`.
   */
  const handleDictate = () => {
    if (dictationTimerRef.current !== null) {
      window.clearTimeout(dictationTimerRef.current);
    }
    setEditingBlockId(null);
    setDictationState('listening');

    dictationTimerRef.current = window.setTimeout(() => {
      if (dictationCount === 0 && !composerText.trim()) {
        setComposerText(DICTATED_THOUGHT);
      } else if (composerText.trim()) {
        commitComposerBlock(composerText, false);
        setComposerText('***');
        setActiveStyle((prev) => ({ ...prev, align: 'center' }));
      } else {
        setComposerText('***');
        setActiveStyle((prev) => ({ ...prev, align: 'center' }));
      }
      setDictationCount((c) => c + 1);
      setDictationState('done');
    }, 220);
  };

  const handleVirtualKey = (char: string) => {
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) =>
          b.id === editingBlockId ? { ...b, text: b.text + char } : b
        )
      );
      return;
    }
    setComposerText((prev) => {
      const nextChar = prev.length === 0 ? char.toUpperCase() : char.toLowerCase();
      return prev + nextChar;
    });
  };

  const handleVirtualPunctuation = (symbol: string) => {
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) =>
          b.id === editingBlockId ? { ...b, text: b.text + symbol } : b
        )
      );
      return;
    }
    setComposerText((prev) => prev + symbol);
  };

  const handleBackspace = () => {
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) =>
          b.id === editingBlockId ? { ...b, text: b.text.slice(0, -1) } : b
        )
      );
      return;
    }
    setComposerText((prev) => prev.slice(0, -1));
  };

  const handleNewLine = () => {
    if (editingBlockId) {
      setEditingBlockId(null);
      return;
    }
    if (composerText.trim()) {
      commitComposerBlock(composerText, false);
    }
  };

  /**
   * Persiste os blocos editados (incluindo o compositor pendente) no estado do Cap. 9
   * e retorna à Tela 5 preservando a velocidade global (`R6`, `R19`, `R20`).
   */
  const handleSave = () => {
    let finalBlocks = draftBlocks;
    if (composerText.trim()) {
      finalBlocks = commitComposerBlock(composerText, false);
    }
    updateSansaoChapter((prev) => ({
      ...prev,
      blocks: finalBlocks,
      edited: true,
      currentParagraph: Math.max(
        1,
        Math.min(prev.currentParagraph, finalBlocks.length)
      ),
    }));
    navigateTo('tela_5_leitura_mobile');
  };

  const handleSelectBlock = (block: MobileBlock, index: number) => {
    setInsertAfterIndex(index);
    setActiveStyle({
      bold: block.bold,
      italic: block.italic,
      underline: block.underline,
      align: block.align,
    });
    setEditingBlockId((prev) => (prev === block.id ? null : block.id));
  };

  const activeStyleLabels: string[] = [];
  if (activeStyle.bold) activeStyleLabels.push('Negrito');
  if (activeStyle.italic) activeStyleLabels.push('Itálico');
  if (activeStyle.underline) activeStyleLabels.push('Sublinhado');
  activeStyleLabels.push(
    activeStyle.align === 'center'
      ? 'Centro'
      : activeStyle.align === 'right'
        ? 'Direita'
        : 'Esquerda'
  );

  return (
    <MobileFrame screenLabel="Tela 6 — Editor Mobile">
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-touch-btn"
          aria-label="Cancelar edição e voltar à leitura"
          onClick={() => navigateTo('tela_5_leitura_mobile')}
        >
          <ChevronLeftIcon size={18} />
          <span>Voltar</span>
        </button>

        <div className="mobile-header-titles">
          <span className="mobile-header-story">Modo Edição</span>
          <span className="mobile-header-chapter">Editar Cap. 9</span>
        </div>

        <button
          type="button"
          className={`mobile-touch-btn ${
            isCompactPlayerExpanded ? 'mobile-touch-btn--active' : ''
          }`.trim()}
          aria-expanded={isCompactPlayerExpanded}
          aria-label={
            isCompactPlayerExpanded
              ? 'Recolher player de áudio'
              : 'Expandir player de áudio'
          }
          onClick={() => setIsCompactPlayerExpanded((open) => !open)}
        >
          <HeadphonesIcon size={18} />
          <span>Ouvir</span>
        </button>

        <button
          type="button"
          className="mobile-touch-btn mobile-touch-btn--primary"
          aria-label="Salvar alterações do capítulo"
          onClick={handleSave}
        >
          Salvar
        </button>
      </header>

      {/* Player compacto expansível sem fechar o teclado virtual (R19) */}
      {isCompactPlayerExpanded && (
        <section
          className="mobile-compact-player-drawer"
          aria-label="Player compacto para conferência durante a edição"
        >
          <div className="mobile-progress-track" aria-hidden="true">
            <div
              className="mobile-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mobile-compact-player-header">
            <div className="mobile-audio-meta-left">
              <LanguageBadge language="pt" showIcon={false} />
              <span className="mobile-audio-counter" aria-live="polite">
                Parágrafo {currentParagraph} de {totalParagraphs}
              </span>
            </div>
            <button
              type="button"
              className="mobile-compact-close-btn"
              aria-label="Recolher player compacto"
              onClick={() => setIsCompactPlayerExpanded(false)}
            >
              <CloseIcon size={14} />
              <span>Recolher</span>
            </button>
          </div>

          <div className="mobile-audio-controls">
            <button
              type="button"
              className="mobile-audio-btn mobile-audio-btn--primary"
              aria-pressed={isPlaying}
              aria-label={
                isPlaying ? 'Pausar narração' : 'Reproduzir narração'
              }
              onClick={togglePlay}
            >
              {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
            </button>

            <button
              type="button"
              className="mobile-audio-btn"
              aria-label="Voltar parágrafo"
              onClick={prevParagraph}
            >
              <PrevParagraphIcon size={18} />
              <span>Voltar</span>
            </button>

            <button
              type="button"
              className="mobile-audio-btn"
              aria-label="Avançar parágrafo"
              onClick={nextParagraph}
            >
              <NextParagraphIcon size={18} />
              <span>Avançar</span>
            </button>

            <button
              type="button"
              className="mobile-audio-btn mobile-audio-btn--rate"
              aria-label={`Alterar velocidade de reprodução, atual ${rateLabel}`}
              onClick={cyclePlaybackRate}
            >
              <SpeedIcon size={16} />
              <span>{rateLabel}</span>
            </button>
          </div>
        </section>
      )}

      <main
        className="mobile-editor-scroll"
        aria-label="Área de edição do Capítulo 9"
      >
        <div className="mobile-editor-context-hint">
          <span>Toque em um parágrafo para editar ou inserir abaixo</span>
          <span>{draftBlocks.length} blocos</span>
        </div>

        {draftBlocks.map((block, index) => {
          const isEditingThis = editingBlockId === block.id;
          const isAnchor = index === insertAfterIndex;
          const isPlayingThis = index + 1 === currentParagraph;
          const isSep = Boolean(block.isSeparator || block.text.trim() === '***');

          return (
            <React.Fragment key={block.id}>
              {isEditingThis ? (
                <div style={{ marginBottom: '8px' }}>
                  <textarea
                    className="mobile-editor-inline-textarea"
                    aria-label={`Editar parágrafo ${index + 1}`}
                    value={block.text}
                    style={{
                      textAlign: block.align,
                      fontWeight: block.bold ? 700 : 400,
                      fontStyle: block.italic ? 'italic' : 'normal',
                      textDecoration: block.underline ? 'underline' : 'none',
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftBlocks((prev) =>
                        prev.map((b) =>
                          b.id === block.id
                            ? {
                                ...b,
                                text: val,
                                isSeparator: val.trim() === '***',
                              }
                            : b
                        )
                      );
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '4px',
                    }}
                  >
                    <button
                      type="button"
                      className="mobile-kbd-action-btn"
                      style={{ minHeight: '48px', padding: '0 14px' }}
                      onClick={() => setEditingBlockId(null)}
                    >
                      Inserir novo parágrafo abaixo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`mobile-editor-block ${
                    isAnchor ? 'mobile-editor-block--anchor' : ''
                  } ${isPlayingThis ? 'mobile-editor-block--playing' : ''}`.trim()}
                  style={{
                    textAlign: block.align,
                    fontWeight: block.bold ? 700 : 400,
                    fontStyle: block.italic ? 'italic' : 'normal',
                    textDecoration: block.underline ? 'underline' : 'none',
                    letterSpacing: isSep ? '0.25em' : undefined,
                  }}
                  aria-label={`Parágrafo ${index + 1}: ${block.text}. Toque para editar`}
                  onClick={() => handleSelectBlock(block, index)}
                >
                  {block.text}
                </button>
              )}

              {isAnchor && !editingBlockId && (
                <div
                  className="mobile-editor-composer"
                  aria-label="Novo parágrafo em edição"
                >
                  <div className="mobile-editor-composer-top">
                    <span>
                      Cursor após parágrafo {index + 1}
                      {(index === 3 ||
                        block.text.toLowerCase().includes('estalajadeiro')) &&
                        ' (fim da taverna)'}
                    </span>
                    <span className="mobile-style-chips">
                      {activeStyleLabels.map((lbl) => (
                        <span key={lbl} className="mobile-style-chip">
                          {lbl}
                        </span>
                      ))}
                    </span>
                  </div>

                  <div className="mobile-composer-input-wrap">
                    <textarea
                      ref={composerRef}
                      className="mobile-composer-textarea"
                      rows={2}
                      placeholder="Digite ou toque em 'Ditado por voz'..."
                      aria-label="Texto do novo parágrafo"
                      value={composerText}
                      style={{
                        textAlign: activeStyle.align,
                        fontWeight: activeStyle.bold ? 700 : 400,
                        fontStyle: activeStyle.italic ? 'italic' : 'normal',
                        textDecoration: activeStyle.underline
                          ? 'underline'
                          : 'none',
                      }}
                      onChange={(e) => setComposerText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNewLine();
                        }
                      }}
                    />
                    {!composerText && (
                      <span
                        className="mobile-caret-indicator"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {dictationState !== 'idle' && (
                    <div className="mobile-dictation-status" role="status">
                      <MicIcon size={14} />
                      <span>
                        {dictationState === 'listening'
                          ? 'Captando voz em Português...'
                          : 'Ditado inserido com a formatação ativa.'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </main>

      {/* Barra de formatação horizontal ancorada acima do teclado virtual (R20) */}
      <div
        className="mobile-format-toolbar-wrap"
        role="toolbar"
        aria-label="Barra de formatação e alinhamento"
      >
        <div className="mobile-format-toolbar">
          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.bold}
            aria-label="Negrito"
            onClick={() => handleToggleStyle('bold')}
          >
            <BoldIcon size={18} />
            <span>Negrito</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.italic}
            aria-label="Itálico"
            onClick={() => handleToggleStyle('italic')}
          >
            <ItalicIcon size={18} />
            <span>Itálico</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.underline}
            aria-label="Sublinhado"
            onClick={() => handleToggleStyle('underline')}
          >
            <UnderlineIcon size={18} />
            <span>Sublinhado</span>
          </button>

          <span className="mobile-format-divider" aria-hidden="true" />

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.align === 'left'}
            aria-label="Alinhar à esquerda"
            onClick={() => handleSetAlign('left')}
          >
            <AlignLeftIcon size={18} />
            <span>Esquerda</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.align === 'center'}
            aria-label="Alinhar ao centro"
            onClick={() => handleSetAlign('center')}
          >
            <AlignCenterIcon size={18} />
            <span>Centro</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.align === 'right'}
            aria-label="Alinhar à direita"
            onClick={() => handleSetAlign('right')}
          >
            <AlignRightIcon size={18} />
            <span>Direita</span>
          </button>

          <span className="mobile-format-divider" aria-hidden="true" />

          <button
            type="button"
            className="mobile-format-btn"
            aria-label="Inserir separador de cena ***"
            onClick={handleInsertSeparator}
          >
            <SceneSeparatorIcon size={18} />
            <span>Separador ***</span>
          </button>
        </div>
      </div>

      {/* Teclado virtual simulado sempre aberto na edição */}
      <section
        className="mobile-keyboard"
        aria-label="Teclado virtual com ditado por voz"
      >
        <div className="mobile-keyboard-actions">
          <button
            type="button"
            className={`mobile-dictate-btn ${
              dictationState === 'listening' ? 'mobile-dictate-btn--listening' : ''
            }`.trim()}
            onClick={handleDictate}
          >
            <MicIcon size={18} />
            <span>
              {dictationState === 'listening' ? 'Ouvindo...' : 'Ditado por voz'}
            </span>
          </button>

          <button
            type="button"
            className="mobile-kbd-action-btn"
            aria-label="Nova linha"
            onClick={handleNewLine}
          >
            <span>↵ Nova linha</span>
          </button>

          <button
            type="button"
            className="mobile-kbd-action-btn"
            aria-label="Inserir asteriscos separadores"
            onClick={handleInsertSeparator}
          >
            <span>***</span>
          </button>
        </div>

        <div className="mobile-kbd-row">
          {QWERTY_ROW_1.map((key) => (
            <button
              key={key}
              type="button"
              className="mobile-kbd-key"
              onClick={() => handleVirtualKey(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="mobile-kbd-row">
          {QWERTY_ROW_2.map((key) => (
            <button
              key={key}
              type="button"
              className="mobile-kbd-key"
              onClick={() => handleVirtualKey(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="mobile-kbd-row">
          {QWERTY_ROW_3.map((key) => (
            <button
              key={key}
              type="button"
              className="mobile-kbd-key"
              onClick={() => handleVirtualKey(key)}
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            className="mobile-kbd-key mobile-kbd-key--wide"
            aria-label="Apagar caractere"
            onClick={handleBackspace}
          >
            ⌫ Apagar
          </button>
        </div>

        <div className="mobile-kbd-row">
          <button
            type="button"
            className="mobile-kbd-key"
            aria-label="Vírgula"
            onClick={() => handleVirtualPunctuation(', ')}
          >
            ,
          </button>
          <button
            type="button"
            className="mobile-kbd-key mobile-kbd-key--space"
            onClick={() => handleVirtualPunctuation(' ')}
          >
            Espaço
          </button>
          <button
            type="button"
            className="mobile-kbd-key"
            aria-label="Ponto final"
            onClick={() => handleVirtualPunctuation('.')}
          >
            .
          </button>
          <button
            type="button"
            className="mobile-kbd-key mobile-kbd-key--wide"
            aria-label="Confirmar linha"
            onClick={handleNewLine}
          >
            ↵
          </button>
        </div>
      </section>
    </MobileFrame>
  );
};
