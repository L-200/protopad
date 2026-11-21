/**
 * @fileoverview Modal acessível da Tela 2 — Configurações de Idioma.
 * Renderiza o formulário dual (`R10`, `R15`, `R16`, `R18`) sobre backdrop modal com
 * aprisionamento de foco (focus trap), fechamento por `Escape` e restauração do foco
 * ao elemento acionador (WCAG 2.1).
 */
import React, { useEffect, useRef } from 'react';
import { CloseIcon, GlobeIcon } from '../../components/shared/Icons';
import { usePrototype } from '../../state/PrototypeContext';
import { LanguageSettingsForm } from './LanguageSettingsForm';
import './LanguageSettings.css';

/**
 * Diálogo modal de Configurações de Idioma (`role="dialog"`, `aria-modal="true"`).
 * Move o foco inicial para o botão de fechar e mantém o Tab restrito ao modal enquanto aberto.
 */
export const LanguageSettingsModal: React.FC = () => {
  const { closeLanguageModal } = usePrototype();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Salva o elemento focado antes da abertura para restaurá-lo ao fechar (WCAG 2.4.3)
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLanguageModal();
        return;
      }

      // Focus trap circular entre o primeiro e o último controle focável do diálogo
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [closeLanguageModal]);

  return (
    <div
      className="lang-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeLanguageModal();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lang-modal-title"
        className="lang-modal-card"
      >
        <div className="lang-modal-header">
          <div className="lang-modal-title-group">
            <span className="lang-modal-title-icon" aria-hidden="true">
              <GlobeIcon size={20} />
            </span>
            <h2 id="lang-modal-title" className="lang-modal-title">
              Configurações de idioma
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar"
            className="lang-modal-close"
            onClick={closeLanguageModal}
            title="Fechar"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <LanguageSettingsForm mode="modal" onSecondaryAction={closeLanguageModal} />
      </div>
    </div>
  );
};
