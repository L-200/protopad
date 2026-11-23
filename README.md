# Wattpad Redesign — Protótipo Interativo (TP2 IHC 2026)

Protótipo funcional e navegável em **React + Vite + TypeScript** desenvolvido para o **Trabalho Prático 2 de Interação Humano-Computador (IHC 2026)**, cobrindo integralmente as 3 funcionalidades redesenhadas do Wattpad (**W01 — Idioma**, **W10 — Leitura em Áudio** e **W22 — Edição de Capítulos**), os **22 requisitos consolidados (`R1`–`R22`)** e os **4 cenários/HTAs** das personas avaliadas (**Renata**, **Adriana**, **Leonardo** e **Sansão**).

> **100% offline e leve:** zero chamadas externas de rede e zero assets pesados — todas as capas (`aspect-ratio: 16/25`), ilustrações do editor, favicon e ícones são renderizados como componentes/SVGs inline.

---

## Pré-requisitos

- **Node.js** `>= 18` (testado em `v24.19.0`)
- **npm** `>= 9` (testado em `11.17.0`)

## Instalação e Execução

```bash
# 1. Acesse a pasta da aplicação do protótipo
cd prototipo/app

# 2. Instale as dependências
npm install

# 3. (Opcional, recomendado no Linux) Baixe o motor neural offline Piper TTS (PT-BR e EN-US)
npm run setup:tts

# 4. Inicie o servidor de desenvolvimento (Vite — acessível localmente e na rede Wi-Fi/LAN)
npm run dev
```

### Scripts disponíveis (`prototipo/app`)

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Sobe o servidor local e em rede (`host: true`, `allowedHosts: true`, porta `5173`) com HMR e endpoint `/api/tts` (Piper neural offline quando instalado). |
| `npm run setup:tts` | Instala localmente o binário Piper TTS (Linux x86_64) e as vozes neurais `pt_BR-faber-medium` e `en_US-lessac-medium` em `.tts/` (ignorado pelo Git). |
| `npm run build` | Executa verificação estrita de tipos (`tsc --noEmit`) e gera o bundle otimizado em `dist/`. |
| `npm run preview` | Serve localmente e na rede LAN (`0.0.0.0:4173`, `allowedHosts: true`) o build de produção gerado em `dist/` (com suporte a `/api/tts`). |

### Suíte de Verificação Automatizada nos 3 Ambientes (`prototipo/e2e`)

O repositório inclui uma suíte E2E isolada em **Playwright + Google Chrome** (`prototipo/e2e/`) que valida todos os **22 requisitos (`R1`–`R22`)** e cenários (Tiers 1 a 5) nos **3 ambientes**:
1. **`desktop-pc`**: Navegador Desktop (`1366×860` e simulação de Zoom 200% `640×480`) — Telas 1 a 4 (Renata, Adriana e Leonardo).
2. **`mobile-emulated-390x844`**: Simulador mobile `390 × 844 px` embutido no próprio protótipo no PC (`MobileFrame` + `MobileReaderScreen` + `MobileEditorScreen` com teclado QWERTY virtual, tanto na moldura centralizada em `1366×860` quanto em viewport `390×844`, com e sem `prefers-reduced-motion: reduce`).
3. **`mobile-real-lan`**: Navegador mobile real acessado via IP da rede local (`http://<IP_LAN>:4173/?celular`, `isMobile: true`, `hasTouch: true` e simulação de `visualViewport` do teclado nativo) — cobrindo as Tarefas A, B e C do Sansão.

```bash
cd prototipo/e2e
npm install
npx playwright install chrome   # se o Google Chrome/Chromium ainda não estiver instalado
npm run typecheck
npx playwright test
```

| Comando (`prototipo/e2e`) | Descrição |
| :--- | :--- |
| `npm test` | Executa todos os projetos. |
| `npm run test:desktop` | Apenas o projeto `desktop-pc`. |
| `npm run test:mobile-emulated` | Apenas o projeto `mobile-emulated-390x844`. |
| `npm run test:mobile-lan` | Apenas o projeto `mobile-real-lan`. |
| `npm run test:list` | Lista os testes sem executá-los. |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`). |

O relatório completo da auditoria com a matriz `R1–R22 × 3 ambientes` encontra-se em `prototipo/specs/auditoria_requisitos_3_ambientes.md`.

---

### Testar o Cenário 4 e as Tarefas A, B e C do Sansão num celular real em rede (LAN)

1. Conecte o computador e o celular na mesma rede Wi-Fi.
2. Rode `npm run dev` (porta `5173`) ou `npm run build && npm run preview` (porta `4173`) em `prototipo/app`. O Vite exibirá o endereço `Network`, por exemplo `http://192.168.0.82:5173`.
3. Abra esse endereço no navegador do celular. O protótipo detecta automaticamente o aparelho (`pointer: coarse` + tela `<= 600px`) e abre direto na **Tela 5 (Leitura Mobile)** em tela inteira (`DeviceRoot`), com velocidade **`1,25x`** e sem a pílula flutuante do `EvaluatorHub`.
4. **Seletor de Histórias e Capítulos na Tela 5 (`>= 48 × 48 px`):** permite executar todas as tarefas do Sansão descritas no relatório:
   - **Tarefa C / Cenário 4 (padrão):** *Cap. 9 — O pacto na taverna* (`Cinzas de Valdoria`, editável) — ouvir o capítulo para revisar, notar a transição brusca entre os parágrafos 4 e 5, tocar em **Editar** (Tela 6), inserir o pensamento em itálico e o separador `***` centralizado, conferir no player compacto sem fechar o teclado e salvar.
   - **Tarefa B:** *Cap. 7 — A travessia do desfiladeiro* (`Cinzas de Valdoria`, editável) — corrigir pelo celular o pensamento sem itálico e centralizar o separador `***`.
   - **Tarefa A:** *Cap. 1 — O nevoeiro da plataforma* (PT-BR, somente leitura) e *Ch. 1 — Lights Across the Pier* (Inglês, somente leitura) — ouvir uma história nova no trajeto a `1,25x`, rolar o capítulo mantendo o player fixo na base, usar *"Voltar parágrafo"* após ruído e ver o selo de idioma (`Português` / `English`) e a voz acompanharem o idioma da história (`R8`, `R17`).
5. **Edição na Tela 6:**
   - Tanto no simulador do PC quanto no celular real, a formatação (**Negrito**, **Itálico**, **Sublinhado**, **Esquerda**, **Centro**, **Direita**) funciona **tanto antes de digitar/ditar** (modo toggle sem seleção) **quanto sobre trechos de texto selecionados/destacados**.
   - Ao mudar de tela (por exemplo, de Leitura para Edição, de Edição para Leitura ou para qualquer outra tela/preset), a reprodução de áudio é interrompida automaticamente para nunca continuar tocando em segundo plano.

No computador, adicione `?celular` ao final da URL para forçar o modo celular nativo ou `?simulador` no celular para forçar a moldura `390 × 844`.

---

## Telas Implementadas

| # | Tela | Arquivo Principal | Funcionalidades & Requisitos |
| :---: | :--- | :--- | :--- |
| **1** | **Página Inicial / Exploração (Desktop)** | `src/screens/home/HomeScreen.tsx` | **W01** · `R9`, `R16`, `R17` |
| **2** | **Configurações de Idioma (Modal + Rota Dedicada)** | `src/screens/language/LanguageSettingsModal.tsx`<br>`src/screens/language/LanguageSettingsScreen.tsx` | **W01** · `R10`, `R15`, `R16`, `R18` |
| **3** | **Leitura de Capítulo Desktop (Cap. 1, Cap. 2 e English)** | `src/screens/reader-desktop/DesktopReaderScreen.tsx`<br>`src/screens/reader-desktop/DesktopAudioPlayer.tsx` | **W10, W01** · `R1`–`R8`, `R16`, `R17`, `R21`, `R22` |
| **4** | **Editor de Capítulos Desktop (Rascunho Cap. 3)** | `src/screens/editor-desktop/DesktopEditorScreen.tsx`<br>`src/screens/editor-desktop/EditorToolbar.tsx` | **W22, W01** · `R11`–`R16` |
| **5** | **Leitura de Capítulo Mobile (simulador `390 × 844 px` ou celular real — Cap. 9, Cap. 7 e Cap. 1 PT/EN)** | `src/screens/mobile/MobileReaderScreen.tsx` | **W10** · `R1`–`R3`, `R6`, `R16`, `R19` |
| **6** | **Editor de Capítulos Mobile (simulador `390 × 844 px` ou celular real — Cap. 9 e Cap. 7)** | `src/screens/mobile/MobileEditorScreen.tsx` (simulador)<br>`src/screens/mobile/MobileEditorNative.tsx` (celular real)<br>`src/screens/mobile/MobileCompactPlayer.tsx` | **W22, W10** · `R6`, `R13`, `R16`, `R19`, `R20` |

---

## Hub do Avaliador e Presets dos 4 Cenários (`EvaluatorHub`)

No canto inferior direito da interface desktop, o botão recolhível **Hub de Avaliação** (`src/components/shared/EvaluatorHub.tsx`) permite alternar instantaneamente entre os **4 presets oficiais** com todas as pré-condições carregadas, navegar diretamente entre as 6 telas, acionar **Alto Contraste Escuro**, **Monitor NVDA** e **Lupa 200%**, usar **Simulações de teste** (mostrar carrossel sem tradução do `R9` na Home, simular tecla de mídia do headset do `R5` na Tela 3 e restaurar o Cap. 9 nas Telas 5 e 6) e abrir a gaveta **"Requisitos desta tela"** (`src/data/rastreabilidade.json`).
- Em janelas estreitas (`<= 1279 px`) nas Telas 5 e 6 do simulador, o `EvaluatorHub` posiciona-se automaticamente no fluxo normal abaixo da moldura `390 × 844` para nunca sobrepor o player nem o teclado virtual.
- No modo celular real (`IS_PHONE_DEVICE` / `?celular`), o `EvaluatorHub` não é exibido.

1. **Cenário 1 — Renata (Desktop · Baixa visão + NVDA + Lupa):**
   - Ativa **Alto Contraste Escuro**, **Lupa 200%**, velocidade **`1,75x`**, **Monitor NVDA** (`aria-live="polite"`) e abre o **Cap. 1** (40 parágrafos em português). Os botões **Alto Contraste** e **Lupa 200%** também estão diretamente disponíveis na barra `#funbar` da Tela 3.
   - 1.º elemento focável via `Tab`: skip link `"Ir para o player"` (`R4`). Tecla `D` salta diretamente para a região `"Ouvir"` sem iniciar/pausar o áudio (`R21`).
2. **Cenário 2 — Leonardo (Desktop · Autor no Editor):**
   - Abre o **Editor Desktop** com o rascunho do **Cap. 3** (`"Rascunho • 1.240 palavras • Salvo"`), contendo 2 pensamentos sem itálico, 2 separadores `***` desalinhados à esquerda e 1 troca de cena sem marcação.
   - Barra fixa permanente com 2 grupos, tooltips no hover/foco, `aria-pressed`, formatação com e sem seleção prévia, `Separador de cena` (`***` centralizado), `Inserir imagem`, `Inserir vídeo`, `Adicionar enquete` e preservação do rascunho ao conferir idioma.
3. **Cenário 3 — Adriana (Desktop · Idioma Dual + Leitura em Áudio):**
   - Abre a **Home** em tema claro com **`Site: Português (Brasil) · Histórias: English`** e velocidade **`1,0x`**.
   - Permite identificar listas marcadas com selo `"English"`, alternar o idioma das histórias com confirmação imediata + **`Desfazer`** (`R18`), inspecionar a ocultação do carrossel sem tradução (`R9`), ajustar velocidade `1,25x` no Cap. 1 e confirmar persistência no Cap. 2.
4. **Cenário 4 — Sansão (Mobile · Uma mão só no metrô):**
   - Abre a **Tela 5 (Leitura Mobile)** no **Cap. 9** com velocidade **`1,25x`**, alvos `>= 48 × 48 px` (`gap >= 8 px`), rótulos completos (`Reproduzir`/`Pausar`, `Voltar parágrafo`, `Avançar parágrafo`, `1,25x`), linha fina indicativa de progresso (`4 px`) e seletor de capítulos para as Tarefas A, B e C.
   - Ao tocar em **"Editar"**, pausa o áudio e abre a **Tela 6** com barra de formatação ancorada acima do teclado (virtual QWERTY com **Ditado por voz** no simulador; teclado e microfone nativos do aparelho no celular real), formatação com ou sem seleção de texto e player compacto expansível **sem fechar o teclado**.

---

## Estrutura de Pastas

```text
prototipo/
├── specs/
│   ├── auditoria_requisitos_3_ambientes.md # Matriz completa R1–R22 × 3 ambientes (PC, Simulador 390×844, Celular LAN)
│   ├── briefing_telas.md                   # Especificação consolidada das 6 telas e variações HTA
│   ├── rastreabilidade.json                # Matriz canônica R1–R22 <-> Telas <-> Cenários
│   └── qa_report.md                        # Relatório de auditoria QA/WCAG inicial
├── e2e/                                    # Suíte automatizada Playwright (Tiers 1–5; `npm run test:list` lista os testes)
│   ├── playwright.config.ts                # Projetos desktop-pc, mobile-emulated-390x844 e mobile-real-lan
│   ├── helpers/                            # Monitores de console/rede, contraste WCAG, geometria e visualViewport
│   ├── tests/                              # 9 arquivos .spec.ts (tier1-smoke, tier2 Renata/Adriana/Leonardo, tier3 mobile, tier4 cenários, tier5 adversariais)
│   └── results/                            # playwright-results.json e audit-evidence.json (gerados a cada execução)
└── app/
    ├── README.md
    ├── index.html                          # Documento raiz com <html lang="pt-BR"> e favicon SVG inline
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts                      # React + host LAN + middleware local Piper TTS (/api/tts)
    ├── scripts/
    │   ├── setup-piper.sh                  # Instalador offline do Piper TTS e vozes PT-BR / EN-US
    │   ├── piper-tts-plugin.mjs            # Plugin Vite (/api/tts e /api/tts/status com cache WAV)
     │   └── piper-tts-plugin.d.mts          # Tipos do plugin Piper
    └── src/
        ├── main.tsx                        # Bootstrap React
        ├── App.tsx                         # Shell global, skip link R4, roteamento das 6 telas e Hub
        ├── audio/
        │   └── ttsEngine.ts                # Motor TTS unificado (Piper + unlock LAN + Web Speech + stopAllAudioPlayback)
        ├── i18n/
        │   ├── translations.ts             # Dicionário completo pt-BR, en-US e es-ES
        │   └── useTranslation.ts           # Hook reativo de tradução da interface
        ├── styles/
        │   ├── tokens.css                  # Tokens de design Wattpad + overrides WCAG AA/AAA + Alto Contraste
        │   └── global.css                  # Reset acessível, .skip-link, :focus-visible, EvaluatorHub responsivo
        ├── types/
        │   └── prototype.ts                # Contratos TypeScript globais (incluindo MobileStoryChapter)
        ├── state/
        │   └── PrototypeContext.tsx        # Estado global (rotas, idiomas + Desfazer, player, rascunhos, presets)
        ├── data/
        │   ├── mockStories.ts              # Catálogo desktop e mobile (Cap. 9, Cap. 7, Cap. 1 PT e Cap. 1 EN)
        │   └── rastreabilidade.json
        ├── components/shared/
        │   ├── Icons.tsx                   # Ícones SVG inline acessíveis
        │   ├── StoryCoverSvg.tsx           # Gerador de capas SVG 16:25 offline
        │   ├── LanguageBadge.tsx           # Selo curto de idioma localizado (R17)
        │   ├── WattpadHeader.tsx           # Header global responsivo com busca AA e menu de idioma dual
        │   ├── NvdaAnnouncer.tsx           # Região aria-live="polite" + monitor visual de anúncios (R21)
        │   ├── FocusMagnifier.tsx          # Simulador de Lupa 200% sem colisão para parágrafos e controles (R2, R22)
        │   ├── EvaluatorHub.tsx            # Controle recolhível de presets e rastreabilidade R1–R22
         │   └── evaluatorEvents.ts          # Eventos compartilhados entre o Hub e as telas
        └── screens/
            ├── home/                       # Tela 1 — Home / Exploração Desktop
            ├── language/                   # Tela 2 — Configurações de Idioma (Modal + Rota Dedicada)
            ├── reader-desktop/             # Tela 3 — Leitura Desktop (#funbar Alto Contraste + Lupa 200%) + Player W10
            ├── editor-desktop/             # Tela 4 — Editor Desktop W22 (EditorToolbar + EditorModals: imagem, vídeo, enquete)
            └── mobile/                     # Telas 5 e 6 — Leitura e Editor Mobile (simulador 390×844 e celular real LAN)
                 ├── deviceMode.ts           # Detecção de celular real / simulador (?celular, ?simulador)
                 ├── MobileFrame.tsx         # Moldura simulada 390×844
                 └── useSansaoAudio.ts       # Hook de áudio das Telas 5 e 6
```
