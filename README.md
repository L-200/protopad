# Protótipo do redesign do Wattpad (TP2 de IHC)

Protótipo navegável do Trabalho Prático 2 de Interação Humano-Computador (2026/2). Ele cobre as três funcionalidades redesenhadas do Wattpad: exploração e configurações de idioma (**W01**), leitura de capítulos com leitura em áudio (**W10**) e edição de capítulos (**W22**). Também cobre os 4 cenários do relatório e os 22 requisitos de IHC (**R1–R22**).

**Equipe:** Gabriel Almeida de Paula Fonseca, Lucas de Souza Cerveira Pereira, Matheus Ferreira Unten, Mikaelle Costa de Santana e Natasha Araújo Caxias.

## Como rodar

É preciso ter o **Node.js 18 ou mais novo**. A versão LTS de [nodejs.org](https://nodejs.org) já vem com o npm.

```bash
git clone https://github.com/L-200/protopad.git
cd protopad
npm install
npm run dev
```

Também dá para rodar sem git. No GitHub, use **Code → Download ZIP**, descompacte o arquivo e rode `npm install` e `npm run dev` dentro da pasta.

Depois abra **http://localhost:5173** no Chrome, no Edge ou no Firefox. O `npm install` precisa de internet uma vez. Depois disso, o protótipo funciona offline. Para parar o servidor, use `Ctrl+C` no terminal.

- **Leitura em voz alta:** o protótipo usa as vozes do navegador e do sistema, e a voz lê no idioma da história. Se não houver voz em português instalada, o player continua funcionando e avança os parágrafos em silêncio.
- **Voz neural Piper (opcional, só Linux x86_64):** `npm run setup:tts` baixa o Piper e duas vozes (mais de 100 MB) para a pasta `.tts/`. O script não roda no Windows nem no macOS, e a avaliação não depende dele.
- **Windows:** na primeira execução, o firewall pode perguntar se o Node.js pode acessar a rede. No próprio computador, o protótipo funciona mesmo sem essa permissão. Ela só é necessária para abrir o protótipo no celular.
- **Versão de produção:** `npm run build` e depois `npm run preview`, que abre em http://localhost:4173.

## Painel TP2 (para a avaliação)

O botão **"TP2 · …"**, no canto inferior direito, abre o painel do avaliador. O painel não faz parte da interface do Wattpad. Ele tem:

- **Presets de Cenários:** carrega cada cenário com as pré-condições do relatório.
- **Navegação Rápida (6 Telas):** abre qualquer uma das telas.
- **Acessibilidade (R21 / R22):** liga e desliga **Alto Contraste Escuro**, **Monitor NVDA (aria-live)** e **Lupa 200% (Foco)**.
- **Simulações de teste:**
  - mostrar o carrossel sem tradução (R9, Tela 1);
  - acionar a tecla de mídia do headset (R5, Tela 3);
  - restaurar o capítulo 9 do Sansão (Telas 5 e 6).
- **Requisitos desta tela:** mostra os cenários, os nós dos modelos HTA, os requisitos e os critérios de aceite da tela aberta.

O protótipo abre no **Cenário 3**: página inicial com o site em português e as histórias em inglês. Recarregar a página volta tudo ao estado inicial.

## Roteiro dos 4 cenários

Os números entre colchetes indicam as subtarefas do modelo HTA de cada cenário no relatório.

### Cenário 1 — Renata (leitor de tela e ampliação)

**Preset:** Alto Contraste, Lupa 200%, Monitor NVDA, velocidade 1,75x e capítulo 1.

1. Pressione `Tab`. O primeiro foco é o link "Ir para o player". `Enter` leva o foco à região "Ouvir", e a tecla `D` faz o mesmo. [1]
2. `Tab` percorre Reproduzir, Voltar parágrafo, Avançar parágrafo, Velocidade (1,75x) e Progresso. `Alt+P` inicia a leitura, e o monitor do NVDA mostra apenas "Reproduzindo". [2]
3. No painel, "R5 · Tecla de mídia do headset" pausa e retoma a leitura. [3]
4. `Alt+↑` duas vezes volta dois parágrafos. O monitor mostra a nova posição, por exemplo "Parágrafo 12 de 40". [4]
5. No seletor de capítulo, no topo, abra o Capítulo 2. O player continua no mesmo lugar, com a mesma ordem e em 1,75x. [5]

### Cenário 2 — Leonardo (editor no notebook)

**Preset:** rascunho do capítulo 3 aberto no editor. Na página inicial, o mesmo rascunho abre em "Escrever".

1. A barra de formatação aparece sem que seja preciso selecionar texto. [1]
2. Selecione o pensamento do parágrafo 3, pare o mouse em "Itálico" para ver a dica "Itálico (Ctrl+I)" e clique. O botão fica destacado. Repita no parágrafo 7. [2]
3. Clique na linha "\*\*\*" e em "Centro", e repita na segunda linha. Depois, com o cursor no fim do parágrafo 9, clique em "Separador de cena". [3]
4. Use "Inserir imagem" (ilustrações prontas) e "Adicionar enquete". [4]
5. Volte à página inicial pela seta no canto superior esquerdo; o rascunho é preservado. Confira os carrosséis e abra "Configurações de idioma". Volte ao editor por "Escrever". O botão "Conferir idioma" do editor leva direto às configurações. [5]
6. Clique em "Publicar" e depois em "Confirmar publicação". [6]

### Cenário 3 — Adriana (barreira de idioma)

**Preset:** página inicial, site em português, histórias em inglês e velocidade 1,0x.

1. Role os carrosséis. Os títulos estão em português, e cada história e lista tem um selo de idioma. [1]
2. Abra "Configurações de idioma". A frase do topo mostra "Site: Português (Brasil) · Histórias: English". Troque "Idioma das histórias recomendadas" para Português. Aparece a confirmação com "Desfazer". Feche a janela. [2]
3. Escolha uma história com o selo "Português" e abra o capítulo 1. O player "Ouvir" mostra o selo do idioma e uma dica ao passar o mouse. Clique em "Reproduzir" e escolha 1,25x em "Velocidade". [3]
4. Clique em "Voltar parágrafo" para repetir o trecho. [4]
5. Abra o Capítulo 2. A velocidade continua em 1,25x. [5]

### Cenário 4 — Sansão (celular com uma mão só)

**Preset:** simulador de celular de 390 × 844 px no capítulo 9, com velocidade 1,25x. Em janelas baixas, o simulador é reduzido para caber inteiro na tela.

1. Toque em "Reproduzir" e role o texto; o player fica fixo na base. Depois toque em "Voltar parágrafo". [1]
2. Toque em "Pausar", depois em "Editar", e toque no parágrafo 4, o fim da cena na taverna. [2]
3. Use "Nova linha", "Itálico", "Ditado por voz" (simulado) e "Itálico" de novo. [3]
4. Use "Nova linha", "Centro" e a tecla "\*\*\*". [4]
5. Toque em "Salvar". O protótipo volta à leitura na mesma velocidade. [5]
6. Use "Voltar parágrafo" até o fim da cena na taverna e "Reproduzir" para ouvir a transição entre as cenas. [6]

Durante a edição, "Ouvir" abre o player sem fechar o teclado. O botão "Cap. 9" troca para os outros capítulos e histórias da persona.

## Telas

| Tela | O que mostra | Cenários | Requisitos | Código |
| :--- | :--- | :--- | :--- | :--- |
| 1 · Página inicial | Carrosséis em português, selos de idioma e atalho para as configurações | 2 e 3 | R9, R16, R17 | `src/screens/home/` |
| 2 · Configurações de idioma | Janela e página com os dois campos, a frase de estado e "Desfazer" | 2 e 3 | R10, R15, R16, R18 | `src/screens/language/` |
| 3 · Leitura no notebook | Player fixo, atalhos, região "Ouvir", monitor do NVDA e Lupa | 1 e 3 | R1–R8, R16, R17, R21, R22 | `src/screens/reader-desktop/` |
| 4 · Editor no notebook | Barra fixa, dicas, estado ativo, inserções e publicação | 2 | R11–R16 | `src/screens/editor-desktop/` |
| 5 · Leitura no celular | Player fixo com alvos de 48 × 48 px | 4 | R1–R3, R6, R16, R19 | `src/screens/mobile/MobileReaderScreen.tsx` |
| 6 · Editor no celular | Barra acima do teclado, ditado e player compacto | 4 | R6, R13, R16, R19, R20 | `src/screens/mobile/MobileEditorScreen.tsx` |

## Testar num celular de verdade (opcional)

1. Conecte o celular e o computador na mesma rede Wi-Fi.
2. Rode `npm run dev` e abra no celular o endereço "Network" que o Vite mostra no terminal, por exemplo `http://192.168.0.10:5173`.
3. No celular, o protótipo abre direto no Cenário 4, em tela inteira, com o teclado e o ditado do próprio aparelho.

No computador, acrescente `?celular` ao fim do endereço para forçar esse modo. No celular, `?simulador` força a moldura do simulador.

## O que é simulado

Alguns recursos do sistema e de tecnologia assistiva não podem ser controlados por um site, então aparecem simulados:

- **Lupa 200% e Alto Contraste Escuro:** reproduzem a Lupa e o tema de alto contraste do Windows.
- **Monitor NVDA:** mostra o que a região aria-live anuncia. Um leitor de tela real também lê o protótipo.
- **Tecla de mídia do headset:** é um botão no painel.
- **Simulador de celular:** o teclado e o ditado por voz são simulados.
- **Imagem, vídeo e enquete:** usam conteúdo pronto, sem upload, e "Publicar" não envia nada.
- **Histórias:** são fictícias, e várias usam o mesmo texto de capítulo.

## Estrutura do projeto

```text
protopad/
├── index.html                     # Documento raiz (lang="pt-BR")
├── package.json
├── vite.config.ts                 # React + endpoint local /api/tts (Piper, opcional)
├── scripts/
│   ├── setup-piper.sh             # Instala o Piper e as vozes (opcional, Linux)
│   ├── piper-tts-plugin.mjs       # /api/tts e /api/tts/status
│   └── piper-tts-plugin.d.mts
└── src/
    ├── App.tsx                    # Telas, cabeçalho, link "Ir para o player" e painel
    ├── audio/ttsEngine.ts         # Leitura em voz alta (Piper, voz do navegador ou avanço silencioso)
    ├── components/shared/         # Cabeçalho, selos, ícones, capas, monitor NVDA, Lupa e Painel TP2
    ├── data/
    │   ├── mockStories.ts         # Histórias, carrosséis e rascunhos fictícios
    │   └── rastreabilidade.json   # Telas, cenários, nós HTA e requisitos
    ├── i18n/                      # Textos em português, inglês e espanhol
    ├── screens/
    │   ├── home/                  # Tela 1
    │   ├── language/              # Tela 2
    │   ├── reader-desktop/        # Tela 3
    │   ├── editor-desktop/        # Tela 4
    │   └── mobile/                # Telas 5 e 6 (simulador e celular real)
    ├── state/PrototypeContext.tsx # Estado global e presets dos cenários
    ├── styles/                    # Tokens, alto contraste e foco visível
    └── types/prototype.ts
```

## Problemas comuns

- **"node" ou "npm" não é reconhecido:** instale o Node.js LTS e abra um terminal novo.
- **Porta 5173 ocupada:** o Vite usa a próxima porta livre e mostra o endereço no terminal.
- **Sem som:** confira o volume e se o sistema tem voz em português. Mesmo sem voz, o player avança os parágrafos.
- **`npm run setup:tts` falha no Windows ou no macOS:** é esperado. O script só funciona no Linux, e a avaliação não depende dele.
