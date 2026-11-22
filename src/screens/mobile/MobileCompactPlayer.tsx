/**
 * @fileoverview Player compacto do editor mobile (Tela 6). Abre pelo ícone "Ouvir" do
 * cabeçalho sem fechar o teclado, com os mesmos controles e a mesma ordem do player da
 * leitura (`R3`, `R19`, `R20`). Usado pelo editor simulado e pelo editor do celular real.
 */
import React from 'react';
import {
  CloseIcon,
  NextParagraphIcon,
  PauseIcon,
  PlayIcon,
  PrevParagraphIcon,
  SpeedIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { useTranslation } from '../../i18n/useTranslation';
import { formatLocalizedRate } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';

type SansaoAudio = ReturnType<typeof useSansaoAudio>;

const COMPACT_STRINGS = {
  'pt-BR': {
    collapse: 'Recolher',
    play: 'Reproduzir narração',
    pause: 'Pausar narração',
  },
  'en-US': {
    collapse: 'Collapse',
    play: 'Play narration',
    pause: 'Pause narration',
  },
  'es-ES': {
    collapse: 'Contraer',
    play: 'Reproducir narración',
    pause: 'Pausar narración',
  },
} as const;

interface MobileCompactPlayerProps {
  audio: SansaoAudio;
  onClose: () => void;
  /**
   * No celular real, os botões não podem tirar o foco do texto, senão o teclado fecha.
   * Com `keepFocus`, o toque não move o foco (o clique continua funcionando).
   */
  keepFocus?: boolean;
}

export const MobileCompactPlayer: React.FC<MobileCompactPlayerProps> = ({
  audio,
  onClose,
  keepFocus = false,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = COMPACT_STRINGS[siteLanguage];
  const localizedRate = formatLocalizedRate(audio.playbackRate, siteLanguage);
  const preventBlur = keepFocus
    ? (e: React.PointerEvent | React.MouseEvent) => e.preventDefault()
    : undefined;

  return (
    <section
      className="mobile-compact-player-drawer"
      aria-label={t.mobile.compactPlayerTitle}
    >
      <div className="mobile-progress-track" aria-hidden="true">
        <div
          className="mobile-progress-fill"
          style={{ width: `${audio.progressPercent}%` }}
        />
      </div>

      <div className="mobile-compact-player-header">
        <div className="mobile-audio-meta-left">
          <LanguageBadge language="pt" showIcon={false} />
          <span className="mobile-audio-counter">
            {t.mobile.paragraphOf(audio.currentParagraph, audio.totalParagraphs)}
          </span>
        </div>
        <button
          type="button"
          className="mobile-compact-close-btn"
          aria-label={t.mobile.collapsePlayerAria}
          onMouseDown={preventBlur}
          onClick={onClose}
        >
          <CloseIcon size={14} />
          <span>{extra.collapse}</span>
        </button>
      </div>

      <div className="mobile-audio-controls">
        <button
          type="button"
          className="mobile-audio-btn mobile-audio-btn--primary"
          aria-pressed={audio.isPlaying}
          aria-label={audio.isPlaying ? extra.pause : extra.play}
          onMouseDown={preventBlur}
          onClick={audio.togglePlay}
        >
          {audio.isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          <span>{audio.isPlaying ? t.mobile.pause : t.mobile.play}</span>
        </button>

        <button
          type="button"
          className="mobile-audio-btn"
          aria-label={t.mobile.prevAria}
          onMouseDown={preventBlur}
          onClick={audio.prevParagraph}
        >
          <PrevParagraphIcon size={18} />
          <span>{t.mobile.prev}</span>
        </button>

        <button
          type="button"
          className="mobile-audio-btn"
          aria-label={t.mobile.nextAria}
          onMouseDown={preventBlur}
          onClick={audio.nextParagraph}
        >
          <NextParagraphIcon size={18} />
          <span>{t.mobile.next}</span>
        </button>

        <button
          type="button"
          className="mobile-audio-btn mobile-audio-btn--rate"
          aria-label={t.mobile.speedAria(localizedRate)}
          onMouseDown={preventBlur}
          onClick={audio.cyclePlaybackRate}
        >
          <SpeedIcon size={16} />
          <span>{localizedRate}</span>
        </button>
      </div>
    </section>
  );
};
