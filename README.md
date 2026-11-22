# Wattpad Redesign — Protótipo Interativo (TP2 IHC 2026)

Protótipo funcional e navegável em **React + Vite + TypeScript** desenvolvido para o **Trabalho Prático 2 de Interação Humano-Computador (IHC 2026)**, cobrindo integralmente as 3 funcionalidades redesenhadas do Wattpad (**W01 — Idioma**, **W10 — Leitura em Áudio** e **W22 — Edição de Capítulos**), os **22 requisitos consolidados (`R1`–`R22`)** e os **4 cenários/HTAs** das personas avaliadas.

> **100% offline e leve:** zero chamadas externas de rede e zero assets pesados — todas as capas (`aspect-ratio: 16/25`), ilustrações do editor e ícones são renderizados como componentes SVG inline.

---

## Pré-requisitos

- **Node.js** `>= 18` (testado em `v24.19.0`)
- **npm** `>= 9` (testado em `11.17.0`)

## Instalação e Execução

```bash
# 1. Acesse o diretório da aplicação
cd prototipo/app

# 2. Instale as dependências
npm install

# 3. (Opcional, recomendado no Linux) Baixe o motor neural offline Piper TTS (PT-BR e EN-US)
npm run setup:tts

# 4. Inicie o servidor de desenvolvimento (Vite)
npm run dev
```

### Outros scripts disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Sobe o servidor local com HMR e endpoint `/api/tts` (Piper neural offline quando instalado). |
| `npm run setup:tts` | Instala localmente o binário Piper TTS (Linux x86_64) e as vozes neurais `pt_BR-faber-medium` e `en_US-lessac-medium` em `.tts/` (ignorado pelo Git). |
| `npm run build` | Executa verificação estrita de tipos (`tsc --noEmit`) e gera o bundle otimizado em `dist/`. |
| `npm run preview` | Serve localmente o build de produção gerado em `dist/` (com suporte a `/api/tts`). |

---

## Telas Implementadas

| # | Tela | Arquivo Principal | Funcionalidades & Requisitos |
| :---: | :--- | :--- | :--- |
| **1** | **Página Inicial / Exploração (Desktop)** | `src/screens/home/HomeScreen.tsx` | **W01** · `R9`, `R16`, `R17` |
| **2** | **Configurações de Idioma (Modal + Rota Dedicada)** | `src/screens/language/LanguageSettingsModal.tsx`<br>`src/screens/language/LanguageSettingsScreen.tsx` | **W01** · `R10`, `R15`, `R16`, `R18` |
| **3** | **Leitura de Capítulo Desktop (Cap. 1, Cap. 2 e English)** | `src/screens/reader-desktop/DesktopReaderScreen.tsx`<br>`src/screens/reader-desktop/DesktopAudioPlayer.tsx` | **W10, W01** · `R1`–`R8`, `R16`, `R17`, `R21`, `R22` |
| **4** | **Editor de Capítulos Desktop (Rascunho Cap. 3)** | `src/screens/editor-desktop/DesktopEditorScreen.tsx`<br>`src/screens/editor-desktop/EditorToolbar.tsx` | **W22, W01** · `R8`, `R11`–`R16` |
| **5** | **Leitura de Capítulo Mobile (`390 × 844 px` — Cap. 9)** | `src/screens/mobile/MobileReaderScreen.tsx` | **W10** · `R1`–`R3`, `R6`, `R19` |
| **6** | **Editor de Capítulos Mobile (`390 × 844 px` — Cap. 9)** | `src/screens/mobile/MobileEditorScreen.tsx` | **W22, W10** · `R19`, `R20` |

---

## Hub do Avaliador e Presets dos 4 Cenários (`EvaluatorHub`)

No canto inferior direito da interface, o botão recolhível **Hub de Avaliação** (`src/components/shared/EvaluatorHub.tsx`) permite alternar instantaneamente entre os **4 presets oficiais** com todas as pré-condições carregadas, navegar diretamente entre as 6 telas e abrir a gaveta **"Requisitos desta tela"** (alimentada por `src/data/rastreabilidade.json`):

1. **Cenário 1 — Renata (Desktop · Baixa visão + NVDA + Lupa):**
   - Ativa **Alto Contraste Escuro**, velocidade **`1,75x`**, **Monitor NVDA** (`aria-live="polite"`) e abre o **Cap. 1** (40 parágrafos em português).
   - 1.º elemento focável via `Tab`: skip link `"Ir para o player"` (`R4`). Tecla `D` salta diretamente para a região `"Ouvir"` sem iniciar/pausar o áudio (`R21`).
2. **Cenário 2 — Leonardo (Desktop · Autor no Editor):**
   - Abre o **Editor Desktop** com o rascunho do **Cap. 3** (`"Rascunho • 1.240 palavras • Salvo"`), contendo 2 pensamentos sem itálico, 2 separadores `***` desalinhados à esquerda e 1 troca de cena sem marcação.
   - Barra fixa permanente com 2 grupos, tooltips no hover/foco, `aria-pressed`, `Separador de cena` (`***` centralizado), `Inserir imagem`, `Inserir vídeo`, `Adicionar enquete` e preservação do rascunho ao conferir idioma na Home/Configurações.
3. **Cenário 3 — Adriana (Desktop · Idioma Dual + Leitura em Áudio):**
   - Abre a **Home** em tema claro com **`Site: Português (Brasil) · Histórias: English`** e velocidade **`1,0x`**.
   - Permite identificar listas marcadas com selo `"English"`, alternar o idioma das histórias com confirmação + **`Desfazer`** (`R18`), testar o toggle demonstrativo de carrosséis sem tradução (`R9`), ajustar velocidade `1,25x` no Cap. 1 e confirmar persistência no Cap. 2 (além de testar uma história em `English` no player).
4. **Cenário 4 — Sansão (Mobile `390 × 844 px` · Uma mão só no metrô):**
   - Abre a **Tela 5 (Leitura Mobile)** no **Cap. 9** (cena na taverna colada à cena na floresta) com velocidade **`1,25x`**, alvos `≥ 48 × 48 px` (`gap ≥ 8 px`) e linha fina indicativa de progresso.
   - Ao tocar em **"Editar"**, abre a **Tela 6** com teclado virtual simulado (**Ditado por voz** + digitação manual), barra de formatação ancorada acima do teclado com rolagem horizontal e player recolhido em ícone compacto que se expande **sem fechar o teclado**.

---

## Atalhos de Teclado Implementados

### Tela 3 — Leitura de Capítulo Desktop (W10)
| Atalho | Ação |
| :--- | :--- |
| `Tab` (1.º foco) | Foca o skip link `"Ir para o player"` e move foco para `#audio-player-region` sem iniciar/pausar áudio (`R4`, `R21`). |
| `D` | Simula navegação por landmark do NVDA até a região `"Ouvir"` sem iniciar/pausar áudio (`R4`, `R21`). |
| `Alt + P` | Alterna `Reproduzir` / `Pausar` com anúncio curto no NVDA (`R5`, `R21`). |
| `Alt + ↑` | Volta 1 parágrafo e anuncia `"Parágrafo X de 40"` (`R5`, `R7`, `R21`). |
| `Alt + ↓` | Avança 1 parágrafo e anuncia `"Parágrafo X de 40"` (`R5`, `R7`, `R21`). |
| *Headset / Media Session* | Suporte a `navigator.mediaSession` + botão simulador `"Tecla de mídia do headset"` no sub-header (`R5`). |

### Tela 4 — Editor de Capítulos Desktop (W22)
| Atalho | Ação |
| :--- | :--- |
| `Ctrl + B` | Alterna **Negrito** (com seleção ou em modo toggle sem seleção) (`R12`, `R13`). |
| `Ctrl + I` | Alterna **Itálico** (com seleção ou em modo toggle sem seleção) (`R12`, `R13`). |
| `Ctrl + U` | Alterna **Sublinhado** (com seleção ou em modo toggle sem seleção) (`R12`, `R13`). |
| `Tab` / `←` / `→` / `Home` / `End` | Navega por todos os botões da barra fixa exibindo tooltips no foco (`R11`, `R12`). |
| `Esc` | Fecha modais de inserção, pré-visualização, publicação e configurações de idioma restaurando o foco. |

---

## Acessibilidade (WCAG 2.1 AA/AAA) e Síntese de Voz Neural

- **Contraste verificado:** tokens CSS em `src/styles/tokens.css` garantem `≥ 4,5:1` em textos normais (`#121212`, `#676767`, `#CD4008`, `#006E3F`, `#007070` sobre claro) e `≥ 3:1` em bordas/elementos gráficos (`#767676`, `#00838A`), evitando uso de `#FF6122` como texto sobre branco (`R22`).
- **Alto Contraste Escuro (`[data-theme="high-contrast"]`):** fundo `#121212`, texto `#FFFFFF` (`18,73:1`), foco reforçado `3px solid #FFC922` e estados sempre comunicados por ícone + rótulo/borda (nunca apenas por cor).
- **Motor TTS Neural Offline (`Piper TTS` + `src/audio/ttsEngine.ts`):** sintetiza parágrafos localmente via `/api/tts` com vozes neurais `pt_BR-faber-medium` e `en_US-lessac-medium`, cache em disco (`.tts/cache/`), pré-carregamento do próximo parágrafo e elemento `<audio>` singleton persistente (evitando expiração de ativação de áudio no Firefox entre parágrafos, capítulos e livros).
- **Internacionalização completa (`src/i18n/`):** alterar **"Idioma do site (menus e botões)"** entre `Português (Brasil)`, `English (US)` e `Español` atualiza em tempo real cabeçalhos, carrosséis, leitor, barra e modais do editor (`R15`), telas mobile e confirmações com `Desfazer` (`R18`).
- **Convivência silenciosa com NVDA (`R21`):** a região `<div aria-live="polite">` (`NvdaAnnouncer.tsx`) emite anúncios curtos apenas em interações explícitas do usuário ou foco no controle de progresso — nunca gera spam a cada avanço automático de parágrafo.
- **Lupa 200% (`FocusMagnifier.tsx`):** exclusiva da Tela 3 (desativa-se automaticamente ao navegar para Explorar ou outras telas); amplia em 200% o texto completo de qualquer parágrafo clicado, focado ou sob o mouse, acompanha a leitura ativa e segue o foco de teclado (`Tab`) pelos controles da barra inferior fixa `#audio-player-region`.
- **Modais acessíveis:** todos os diálogos (Configurações de Idioma e os 5 modais do Editor) implementam `role="dialog"`, `aria-modal="true"`, foco inicial, aprisionamento de `Tab`/`Shift+Tab`, fechamento por `Esc` e restauração de foco.

---

## Estrutura de Pastas

```text
prototipo/
├── specs/
│   ├── briefing_telas.md          # Especificação consolidada das 6 telas e variações HTA
│   ├── rastreabilidade.json       # Matriz canônica R1–R22 <-> Telas <-> Cenários
│   └── qa_report.md               # Relatório de auditoria QA/WCAG e verificação pós-correção
└── app/
    ├── .gitignore                 # Ignora node_modules/, dist/ e .tts/ (binário e modelos)
    ├── README.md
    ├── index.html                 # Documento raiz com <html lang="pt-BR">
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts             # Configura React + middleware local Piper TTS (/api/tts)
    ├── scripts/
    │   ├── setup-piper.sh         # Instalador offline do Piper TTS e vozes PT-BR / EN-US
    │   ├── piper-tts-plugin.mjs   # Plugin Vite (/api/tts e /api/tts/status com cache WAV)
    │   └── piper-tts-plugin.d.mts
    └── src/
        ├── main.tsx               # Bootstrap React
        ├── App.tsx                # Shell global, skip link R4, roteamento das 6 telas e Hub
        ├── audio/
        │   └── ttsEngine.ts       # Motor TTS unificado (Piper neural local + singleton Audio + fallback)
        ├── i18n/
        │   ├── translations.ts    # Dicionário completo pt-BR, en-US e es-ES
        │   └── useTranslation.ts  # Hook reativo de tradução da interface
        ├── styles/
        │   ├── tokens.css         # Tokens de design Wattpad + overrides WCAG + Alto Contraste
        │   └── global.css         # Reset acessível, .skip-link, :focus-visible, botões pill, tooltips
        ├── types/
        │   └── prototype.ts       # Contratos TypeScript globais do protótipo
        ├── state/
        │   └── PrototypeContext.tsx # Estado global (rotas, idiomas + Desfazer, player, rascunhos, presets)
        ├── data/
        │   ├── mockStories.ts     # Catálogo, Cap. 1 e 2 (40 parágrafos), história EN, Cap. 3 e Cap. 9
        │   └── rastreabilidade.json
        ├── components/shared/
        │   ├── Icons.tsx          # Biblioteca enxuta de ícones SVG inline acessíveis
        │   ├── StoryCoverSvg.tsx  # Gerador de capas SVG 16:25 offline
        │   ├── LanguageBadge.tsx  # Selo curto de idioma (R17)
        │   ├── WattpadHeader.tsx  # Header global com busca AA e dropdown de idioma dual
        │   ├── NvdaAnnouncer.tsx  # Região aria-live="polite" + monitor visual de anúncios (R21)
        │   ├── FocusMagnifier.tsx # Simulador de Lupa 200% para parágrafos e controles (R2, R22)
        │   └── EvaluatorHub.tsx   # Controle recolhível de presets e rastreabilidade R1–R22
        └── screens/
            ├── home/              # Tela 1 — Home / Exploração Desktop
            ├── language/          # Tela 2 — Configurações de Idioma (Modal + Rota Dedicada)
            ├── reader-desktop/    # Tela 3 — Leitura Desktop + Player Acessível W10
            ├── editor-desktop/    # Tela 4 — Editor de Capítulos Desktop W22 (layout compacto)
            └── mobile/            # Telas 5 e 6 — Frame 390×844 Leitura e Editor Mobile
```

---

## Rastreabilidade Rápida (`R1`–`R22`)

| Faixa | Funcionalidade | Resumo |
| :--- | :--- | :--- |
| `R1`–`R7`, `R21`, `R22` | **W10 (Leitura em Áudio)** | Player completo desde Cap. 1 em barra inferior fixa, ordem fixa dos 5 controles, skip link + landmark `"Ouvir"`, atalhos `Alt+P`/`↑`/`↓` + headset, velocidade persistida, PT-BR, convivência silenciosa com NVDA e Alto Contraste + Lupa. |
| `R8`–`R10`, `R15`–`R18` | **W01 (Idioma e Consistência)** | Nome único `"Ouvir"` + `lang` declarado, carrosséis traduzidos ou ocultos, configurações em 2 campos com exemplo + frase de estado + `Desfazer`, editor/publicação 100% PT-BR, rótulos curtos com ícone e selos de idioma. |
| `R11`–`R14` | **W22 (Editor Desktop)** | Barra fixa permanente navegável por teclado, tooltips PT-BR com atalhos, `aria-pressed` + destaque (com/sem seleção e estilos combinados), `Inserir imagem`, `Inserir vídeo`, `Separador de cena` (`***` centralizado) e `Adicionar enquete`. |
| `R19`, `R20` | **W10 + W22 (Mobile `390×844`)** | Alvos `≥ 48 × 48 px` (`gap ≥ 8 px`) na metade inferior, linha fina indicativa no player, barra de formatação com rolagem horizontal acima do teclado virtual (com Ditado por voz) e player compacto expansível sem fechar o teclado. |
