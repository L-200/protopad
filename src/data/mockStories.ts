/**
 * @fileoverview Catálogo offline de histórias, listas de leitura, capítulos e rascunhos iniciais
 * usados pelos 4 cenários de avaliação do protótipo (TP2 IHC 2026).
 * Fornece os 40 parágrafos em português dos Capítulos 1 e 2 para o Cenário 1 (Renata, R1/R3/R6/R21),
 * capítulos em inglês para alternância de voz TTS e selos de idioma (Adriana, R8/R17),
 * rascunho calibrado em 1.240 palavras para o Cenário 2 (Leonardo, R11–R15) e o Capítulo 9 mobile
 * para o Cenário 4 (Sansão, R19/R20).
 */
import {
  CarouselData,
  ChapterData,
  EditorBlock,
  LeonardoDraft,
  MobileBlock,
  SansaoChapter,
  StoryItem,
} from '../types/prototype';

/**
 * Conta palavras visíveis nos blocos textuais do editor (desconsiderando tags HTML e marcadores '***').
 *
 * @param blocks Blocos atuais do rascunho no editor desktop.
 * @returns Total de palavras contadas nos blocos de texto.
 */
export function countEditorBlocksWords(blocks: EditorBlock[]): number {
  return blocks.reduce((acc, block) => {
    if (block.type === 'separator' || block.type === 'image' || block.type === 'video' || block.type === 'poll') {
      return acc;
    }
    const plain = block.html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
    if (!plain || plain === '***') {
      return acc;
    }
    const tokens = plain.split(/\s+/).filter(Boolean);
    return acc + tokens.length;
  }, 0);
}

/**
 * Calcula a contagem total de palavras do rascunho do Leonardo somando o deslocamento inicial
 * calibrado (1.240 palavras no Capítulo 3) às alterações feitas em tempo real no editor (R15).
 *
 * @param draft Rascunho atual do editor desktop.
 * @returns Total de palavras exibido no cabeçalho do editor.
 */
export function computeLeonardoWordCount(draft: LeonardoDraft): number {
  return Math.max(0, draft.baseWordCountOffset + countEditorBlocksWords(draft.blocks));
}

const CAP_1_PARAGRAPHS: string[] = [
  'A chuva fina cobria os paralelepípedos da Rua das Acácias quando Mariana desligou o rádio da oficina e percebeu que o relógio da parede marcava sete e quarenta.',
  'Havia três semanas que o bairro inteiro comentava os cortes breves de energia sempre por volta daquele mesmo horário, como se alguém testasse um interruptor invisível.',
  'Ela recolheu a bolsa de lona, conferiu a trava da porta lateral e saiu sob a marquise estreita, observando os postes piscarem em sequência até a esquina.',
  'Na calçada oposta, a livraria de seu Augusto permanecia com uma única luminária acesa na vitrine, projetando sombras alongadas sobre os degraus molhados.',
  'Mariana atravessou a rua devagar, desviando das poças escuras que refletiam o letreiro alaranjado da farmácia a dois quarteirões dali.',
  'Antes de chegar à estação de trem, o celular vibrou no bolso do casaco com uma mensagem sem remetente salvo na agenda.',
  'O texto continha apenas seis palavras: “Não suba pela passarela norte hoje.”',
  'Ela parou sob a cobertura do ponto de ônibus para reler a frase duas vezes, tentando lembrar quem ainda usava aquele número antigo.',
  'Ninguém no trabalho sabia que ela costumava atravessar a passarela norte para encurtar o caminho até a casa da tia.',
  'O ônibus da linha circular passou levantando um véu de água suja, e por um instante o vidro embaçado escondeu a silhueta parada junto à banca de jornal.',
  'Quando o veículo se afastou, havia apenas um guarda-chuva preto caído perto do bueiro e o som distante de uma sirene apagando-se na avenida.',
  'Mariana guardou o telefone, ajustou a alça da mochila nos ombros e decidiu seguir pela alameda iluminada da praça central.',
  'O vento frio sacudia as folhas das figueiras antigas, derrubando gotas pesadas sobre o banco de ferro onde dois vizinhos costumavam jogar dominó à tarde.',
  'Mesmo com o movimento reduzido daquela terça-feira, a sensação de estar sendo observada crescia a cada quarteirão vencido.',
  'Ela acelerou o passo ao ouvir o estalo seco de um galho atrás dos arbustos do coreto, mas era apenas um gato cinzento saltando para o muro.',
  'Respirou fundo, soltou o ar devagar e riu baixo do próprio nervosismo antes de dobrar a esquina da padaria.',
  'O cheiro de pão recém-assado escapava pelas frestas da porta entreaberta e parecia devolver um pouco de normalidade à noite.',
  'Dona Lúcia acenou por trás do balcão enquanto organizava as bandejas de brioche, apontando com o queixo para a garrafa térmica de café.',
  'Mariana entrou apenas para pegar um pacote pequeno de broas e perguntar se a luz também tinha oscilado por ali.',
  'A padeira confirmou com um gesto cansado e comentou que a antena no alto do antigo moinho vinha emitindo um zumbido estranho desde o meio-dia.',
  'Aquele comentário reacendeu a lembrança de um caderno esquecido na gaveta do pai, cheio de anotações sobre frequências e mapas do vale.',
  'Ao sair da padaria, o céu parecia ainda mais baixo, tingido de um azul chumbo que anunciava tempestade mais forte durante a madrugada.',
  'Ela seguiu pela calçada de ladrilhos hidráulicos até alcançar o portão verde da casa número quarenta e dois.',
  'Tia Helena já aguardava na varanda com o xale nos ombros e a lanterna recarregável apoiada na mureta de tijolos.',
  'Sem perder tempo com rodeios, a senhora pediu que a sobrinha entrasse depressa e trancasse o trinco inferior.',
  'Sobre a mesa da cozinha descansava um envelope pardo sem selo, marcado apenas com o desenho discreto de uma torre inclinada.',
  'Alguém o havia deslizado por baixo da porta da sala menos de vinte minutos antes da chegada de Mariana.',
  'As duas se olharam em silêncio enquanto o vento fazia vibrar a vidraça estreita voltada para o quintal dos fundos.',
  'Com cuidado para não rasgar o papel espesso, Mariana abriu a aba colada com fita transparente e retirou uma fotografia em preto e branco.',
  'A imagem mostrava a passarela norte vista de cima, tomada por neblina, com um círculo desenhado a lápis em volta do terceiro poste.',
  'No verso da foto, a mesma caligrafia firme que ela reconhecera nos cadernos do pai trazia uma data de vinte anos atrás e um horário: oito e quinze.',
  'Mariana olhou para o relógio digital do fogão e viu que faltavam exatamente doze minutos para o horário anotado no papel.',
  'Tia Helena puxou uma cadeira devagar, sentou-se com as mãos apoiadas sobre a toalha xadrez e confessou que esperava por aquele aviso há meses.',
  'Segundo ela, o antigo vigia do moinho havia prometido enviar um sinal caso as máquinas do subsolo voltassem a ser ligadas.',
  'Um trovão surdo percorreu o telhado, seguido pelo apagar simultâneo da lâmpada da cozinha e dos postes do outro lado do muro.',
  'No escuro repentino, apenas a tela do celular sobre a mesa acendeu sozinha, mostrando um mapa com um ponto pulsante na direção do rio.',
  'A tia acendeu a lanterna e apontou o facho para o corredor estreito que levava até o porão fechado desde a última reforma.',
  'Antes que Mariana pudesse perguntar o que havia lá embaixo, o som metálico de um apito ecoou vindo exatamente do alto do moinho.',
  'Não era um alarme de fábrica nem o trem das oito, mas uma sequência curta de três notas que se repetiu com precisão mecânica.',
  'Mariana pegou o casaco novamente, ciente de que a resposta para o silêncio daquela cidade não caberia mais dentro de casa.',
];

const CAP_2_PARAGRAPHS: string[] = [
  'A névoa descia pela encosta do rio como uma cortina densa quando Mariana e tia Helena abriram o portão dos fundos rumo à viela de pedras.',
  'Cada passo no piso úmido produzia um som abafado, quase engolido pelo murmúrio constante da água batendo contra os pilares da ponte antiga.',
  'A lanterna iluminava apenas dois metros à frente, revelando fios de musgo agarrados às muretas e placas enferrujadas de um desvio desativado.',
  'Tia Helena caminhava com surpreendente firmeza, apoiando a mão esquerda na bengala de madeira e mantendo os olhos atentos às curvas da descida.',
  'Ao alcançarem o pé da ponte de ferro, o zumbido vindo do moinho tornou-se mais nítido, vibrando como uma corda tensa sob o pavimento.',
  'Mariana parou por um segundo junto ao primeiro arco metálico e tocou o corrimão gelado para testar se o tremor vinha da correnteza ou do subsolo.',
  'A vibração seguia um ritmo regular de quatro batidas curtas e uma pausa longa, idêntico ao padrão que ela ouvira no rádio da oficina semanas antes.',
  'Do outro lado da margem, duas janelas estreitas do terceiro andar do moinho piscaram em âmbar antes de se apagarem novamente.',
  'Alguém estava lá dentro usando o gerador auxiliar, apesar de a companhia elétrica manter o prédio desligado nos registros da prefeitura.',
  'Antes de pisar nas tábuas da ponte, Mariana conferiu o mapa no celular e notou que o ponto pulsante havia se deslocado para o arco central.',
  'O telefone perdeu sinal logo depois, deixando apenas a bússola girando devagar na tela escura até estabilizar rumo ao leste.',
  'As tábuas rangeram sob o peso das duas, mas nenhum outro ruído denunciou movimento na margem oposta.',
  'No meio da travessia, uma corrente de ar mais quente subiu do leito do rio, dissipando por segundos o nevoeiro ao redor dos cabos de aço.',
  'Presa à grade lateral estava uma caixa metálica pequena, pintada de cinza-fosco, com uma etiqueta plastificada amarrada por arame fino.',
  'Mariana aproximou a lanterna e leu o número de série gravado à mão na tampa: exatamente o código da última página do caderno do pai.',
  'Com o polegar ainda úmido da chuva, destravou o fecho lateral e encontrou um gravador portátil envolto em pano seco e um molho de três chaves.',
  'Tia Helena reconheceu de imediato o chaveiro de latão em forma de meia-lua que pertencera ao irmão antes do desaparecimento no inverno de dois mil e cinco.',
  'Nenhuma das duas ousou falar alto; o vento parecia carregar qualquer sussurro direto para a entrada escura do galpão à frente.',
  'Mariana apertou o botão de reprodução do pequeno aparelho encostado ao ouvido, mantendo o volume baixo para não ecoar na ponte.',
  'Depois de três segundos de chiado, uma voz grave e cansada começou a narrar as coordenadas de acesso à sala das turbinas.',
  'Não era a voz de seu Augusto nem a do vigia aposentado, mas a gravação intacta do próprio pai explicando por que ocultara os mapas da cidade.',
  'Ele dizia que a rede subterrânea não fora construída para distribuir energia comum, e sim para isolar os transmissores durante as tempestades magnéticas.',
  'Quando a fita mencionou a porta de serviço atrás das docas velhas, a luz distante de uma lanterna atravessou o pátio do moinho.',
  'As duas se abaixaram atrás da viga principal da ponte, desligando o facho luminoso no exato instante em que passos ressoaram no cascalho.',
  'Um vulto alto vestindo capa impermeável parou próximo ao marco de concreto e varreu a margem com um refletor estreito.',
  'O feixe passou por cima da grade onde elas se escondiam, iluminou a superfície turva da água e subiu lentamente até os cabos superiores.',
  'Durante quase um minuto inteiro, apenas o gotejar regular da chuva quebrava a imobilidade absoluta sobre as tábuas molhadas.',
  'Quando um apito curto respondeu do lado do galpão, o vulto girou os calcanhares e recuou pelo corredor lateral sem cruzar a ponte.',
  'Mariana soltou o ar que prendia no peito e guardou o gravador no bolso interno da jaqueta, apertando o zíper até o colarinho.',
  'Tia Helena indicou com um aceno que ainda restava menos de cinco minutos até a troca de turno mencionada no final do áudio.',
  'Elas terminaram de atravessar a ponte em passo rápido, deslizando para a sombra do muro baixo que contornava o terreno das docas.',
  'Entre trepadeiras espessas e caixotes empilhados, a porta de serviço de ferro verde permanecia quase oculta da rua principal.',
  'A segunda chave do molho girou na fechadura sem resistência, como se alguém tivesse lubrificado o mecanismo recentemente para facilitar a entrada.',
  'Ao empurrar a folha pesada, um corredor seco iluminado por pequenas luzes de emergência revelou escadas descendo em espiral.',
  'Nas paredes de cimento, setas pintadas a tinta amarela apontavam para o nível dois e indicavam a saída alternativa pelo antigo túnel ferroviário.',
  'No primeiro patamar, um quadro de avisos trazia horários atualizados à caneta com a letra firme do bilhete recebido em casa.',
  'Ao lado da lista de frequências havia um recado dobrado em quatro partes, preso por um ímã vermelho exatamente à altura dos olhos.',
  'Mariana abriu o papel e leu apenas uma frase escrita com pressa: “Se ouviram o terceiro sinal, liguem o painel oeste antes da meia-noite.”',
  'Do andar inferior subiu o som de engrenagens destravando, anunciando que a contagem regressiva para reabrir o sistema já havia começado.',
  'Segurando a lanterna com firmeza, Mariana olhou para a tia, recebeu um aceno seguro e deu o primeiro passo escada abaixo.',
];

const EN_CAP_1_PARAGRAPHS: string[] = [
  'Morning fog drifted across the wooden pier long before the first ferry horn echoed over the quiet bay.',
  'Clara adjusted the strap of her canvas satchel and stepped onto the damp planks, counting the moored trawlers along the eastern dock.',
  'Three boats were missing from their usual slips, leaving only coiled ropes and dark water lapping against the weathered pilings.',
  'At the end of the walkway, the harbor master office glowed with a single amber lamp behind salt-streaked glass.',
  'Inside, a kettle hissed softly while an open logbook lay beside an untouched mug of black coffee.',
  'Clara knocked twice on the doorframe before pushing it open to find the room unexpectedly empty.',
  'A brass pocket compass rested directly over the previous night entry, its needle trembling slightly toward the lighthouse channel.',
  'Outside, gulls circled low above the breakwater, calling sharply into the pale silver mist.',
  'She pulled her wool collar higher against the breeze and noticed fresh boot prints leading down the stone steps toward the seawall.',
  'Someone had left in a hurry less than ten minutes ago, dropping a folded tide chart beside the iron bollard.',
  'When Clara unfolded the paper, a handwritten note along the margin warned that the channel beacon had gone dark before dawn.',
  'In the distance, the faint hum of an outboard engine rose above the swell and vanished behind the outer rocks.',
  'She tucked the chart safely into her coat pocket and checked the battery level on her handheld radio.',
  'Static filled the harbor frequency for several seconds until a calm voice broke through asking anyone on shore to stand by.',
  'Stepping back onto the pier, Clara knew the routine inspection had just turned into a search across open water.',
];

const CAP_1: ChapterData = {
  id: 'cap-1',
  number: 1,
  title: 'Capítulo 1 — O primeiro sinal',
  paragraphs: CAP_1_PARAGRAPHS,
};

const CAP_2: ChapterData = {
  id: 'cap-2',
  number: 2,
  title: 'Capítulo 2 — A ponte de névoa',
  paragraphs: CAP_2_PARAGRAPHS,
};

const EN_CAP_1: ChapterData = {
  id: 'en-cap-1',
  number: 1,
  title: 'Chapter 1 — Morning Fog',
  paragraphs: EN_CAP_1_PARAGRAPHS,
};

/**
 * Catálogo estático de histórias e listas de leitura em português e inglês exibido na Home (Tela 1)
 * e consumido pelo leitor desktop (Tela 3) com selos de idioma (R17) e capítulos completos.
 */
export const MOCK_STORIES: StoryItem[] = [
  {
    id: 'cronicas-do-silencio',
    title: 'As Crônicas do Silêncio',
    author: 'Clara Monteiro',
    genre: 'Suspense',
    language: 'pt',
    reads: '148 mil',
    votes: '12,4 mil',
    parts: 18,
    synopsis:
      'Quando sinais misteriosos interrompem a energia do bairro às sete e quarenta, Mariana descobre um mapa esquecido que liga a antiga ponte de ferro aos túneis sob o moinho.',
    tags: ['Mistério', 'Suspense', 'Cidade Pequena', 'Brasil'],
    coverPalette: {
      bgPrimary: '#1D2939',
      bgSecondary: '#0F172A',
      accent: '#FF6122',
      textColor: '#FFFFFF',
      motif: 'horizon',
    },
    chapters: [CAP_1, CAP_2],
    isCompleted: false,
    isWattys: true,
  },
  {
    id: 'echoes-beyond-the-harbor',
    title: 'Echoes Beyond the Harbor',
    author: 'Daniel Brooks',
    genre: 'Mystery',
    language: 'en',
    reads: '92 mil',
    votes: '7,8 mil',
    parts: 12,
    synopsis:
      'An early-morning harbor inspector discovers missing trawlers, a deserted office, and a coded tide chart pointing toward a silent lighthouse.',
    tags: ['Mystery', 'Coastal', 'Drama', 'English'],
    coverPalette: {
      bgPrimary: '#2E1F5E',
      bgSecondary: '#161130',
      accent: '#00E5E5',
      textColor: '#FFFFFF',
      motif: 'waves',
    },
    chapters: [EN_CAP_1],
    isCompleted: true,
  },
  {
    id: 'cartas-de-outono',
    title: 'Cartas para Depois da Chuva',
    author: 'Beatriz Alencar',
    genre: 'Romance',
    language: 'pt',
    reads: '215 mil',
    votes: '19,1 mil',
    parts: 24,
    synopsis:
      'Dois desconhecidos trocam recados esquecidos dentro de livros emprestados em uma biblioteca municipal no centro de Belo Horizonte.',
    tags: ['Romance', 'Drama', 'Livros'],
    coverPalette: {
      bgPrimary: '#7C2D12',
      bgSecondary: '#431407',
      accent: '#FFC922',
      textColor: '#FFFFFF',
      motif: 'arcs',
    },
    chapters: [CAP_1, CAP_2],
    isCompleted: true,
  },
  {
    id: 'estrela-de-vidro',
    title: 'A Estrela de Vidro',
    author: 'Thiago Vasconcelos',
    genre: 'Ficção Científica',
    language: 'pt',
    reads: '84 mil',
    votes: '6,3 mil',
    parts: 16,
    synopsis:
      'Uma observadora de satélites intercepta uma transmissão vinda de um observatório abandonado nos Andes.',
    tags: ['Ficção Científica', 'Aventura', 'Espaço'],
    coverPalette: {
      bgPrimary: '#0D4F54',
      bgSecondary: '#072C30',
      accent: '#33F0F0',
      textColor: '#FFFFFF',
      motif: 'constellation',
    },
    chapters: [CAP_1, CAP_2],
  },
  {
    id: 'jardim-das-cinzas',
    title: 'O Jardim das Cinzas Claras',
    author: 'Helena Prado',
    genre: 'Fantasia',
    language: 'pt',
    reads: '310 mil',
    votes: '28,5 mil',
    parts: 32,
    synopsis:
      'Em um reino movido a relógios de areia, uma aprendiza descobre como restaurar estações inteiras sem despertar o conselho.',
    tags: ['Fantasia', 'Magia', 'Aventura'],
    coverPalette: {
      bgPrimary: '#3B19A9',
      bgSecondary: '#1E0D59',
      accent: '#ACA0E7',
      textColor: '#FFFFFF',
      motif: 'prism',
    },
    chapters: [CAP_1, CAP_2],
    isWattys: true,
  },
  {
    id: 'laminas-da-fronteira',
    title: 'Lâminas da Fronteira',
    author: 'Sansão Mendes',
    genre: 'Aventura',
    language: 'pt',
    reads: '67 mil',
    votes: '5,4 mil',
    parts: 11,
    synopsis:
      'Caio percorre rotas de fronteira entre vilarejos antigos e florestas fechadas após firmar um acordo perigoso na taverna.',
    tags: ['Aventura', 'Ação', 'Fantasia'],
    coverPalette: {
      bgPrimary: '#1E3A2F',
      bgSecondary: '#0F1F19',
      accent: '#4ADE80',
      textColor: '#FFFFFF',
      motif: 'geometric',
    },
    chapters: [CAP_1, CAP_2],
  },
  {
    id: 'sob-luz-de-nevoeiro',
    title: 'Sob a Luz do Nevoeiro',
    author: 'Marcos Oliveira',
    genre: 'Drama',
    language: 'pt',
    reads: '54 mil',
    votes: '4,2 mil',
    parts: 14,
    synopsis:
      'Um maestro aposentado retorna à cidade natal para reabrir o teatro fechado há duas décadas.',
    tags: ['Drama', 'Música', 'Família'],
    coverPalette: {
      bgPrimary: '#322864',
      bgSecondary: '#191436',
      accent: '#F54F78',
      textColor: '#FFFFFF',
      motif: 'waves',
    },
    chapters: [CAP_1, CAP_2],
  },
  {
    id: 'clockwork-seasons',
    title: 'Clockwork Seasons',
    author: 'Hannah Miller',
    genre: 'Fantasy',
    language: 'en',
    reads: '128 mil',
    votes: '11,2 mil',
    parts: 20,
    synopsis:
      'A young watchmaker apprentice uncovers an underground guild maintaining the balance between winter and spring.',
    tags: ['Fantasy', 'Steampunk', 'Adventure'],
    coverPalette: {
      bgPrimary: '#4A1D4D',
      bgSecondary: '#260B29',
      accent: '#FFC922',
      textColor: '#FFFFFF',
      motif: 'prism',
    },
    chapters: [EN_CAP_1],
  },
  {
    id: 'letters-across-winter',
    title: 'Letters Across Winter',
    author: 'Oliver Grant',
    genre: 'Romance',
    language: 'en',
    reads: '175 mil',
    votes: '14,9 mil',
    parts: 22,
    synopsis:
      'Two architecture students share studio notes in a snowy university town until an unexpected contest pairs them together.',
    tags: ['Romance', 'Campus', 'Contemporary'],
    coverPalette: {
      bgPrimary: '#1F3A5F',
      bgSecondary: '#0F1F36',
      accent: '#EF6C39',
      textColor: '#FFFFFF',
      motif: 'arcs',
    },
    chapters: [EN_CAP_1],
  },
  {
    id: 'lista-misterios-noturnos',
    title: 'Mistérios Noturnos & Suspense Urbano',
    author: 'Curadoria Comunidade BR',
    genre: 'Lista de Leitura',
    language: 'pt',
    reads: '42 mil',
    votes: '3,9 mil',
    parts: 15,
    synopsis:
      'Seleção de leitores brasileiros com histórias de suspense, mistério urbano e enigmas em cidades pequenas.',
    tags: ['Lista BR', 'Suspense', 'Mistério'],
    coverPalette: {
      bgPrimary: '#121212',
      bgSecondary: '#2A2A2A',
      accent: '#FF6122',
      textColor: '#FFFFFF',
      motif: 'horizon',
    },
    isReadingList: true,
    listStoryCount: 15,
    chapters: [CAP_1, CAP_2],
  },
  {
    id: 'lista-romances-brasileiros',
    title: 'Romances Contemporâneos em Português',
    author: 'Clube do Livro Wattpad',
    genre: 'Lista de Leitura',
    language: 'pt',
    reads: '68 mil',
    votes: '5,1 mil',
    parts: 20,
    synopsis:
      'Coletânea curada pela comunidade lusófona com romances acolhedores e narrativas cotidianas.',
    tags: ['Lista BR', 'Romance', 'Contemporâneo'],
    coverPalette: {
      bgPrimary: '#831843',
      bgSecondary: '#500724',
      accent: '#FFC922',
      textColor: '#FFFFFF',
      motif: 'arcs',
    },
    isReadingList: true,
    listStoryCount: 20,
    chapters: [CAP_1, CAP_2],
  },
  {
    id: 'lista-harbor-mysteries-en',
    title: 'Coastal Mysteries & Harbor Reads',
    author: 'Community Curators EN',
    genre: 'Reading List',
    language: 'en',
    reads: '59 mil',
    votes: '4,6 mil',
    parts: 14,
    synopsis:
      'Atmospheric coastal mysteries and maritime suspense selected by English-speaking readers.',
    tags: ['English List', 'Mystery', 'Harbor'],
    coverPalette: {
      bgPrimary: '#0F4C5C',
      bgSecondary: '#072730',
      accent: '#00E5E5',
      textColor: '#FFFFFF',
      motif: 'waves',
    },
    isReadingList: true,
    listStoryCount: 14,
    chapters: [EN_CAP_1],
  },
  {
    id: 'lista-fantasy-picks-en',
    title: 'Weekend Fantasy Picks',
    author: 'North Readers Guild',
    genre: 'Reading List',
    language: 'en',
    reads: '77 mil',
    votes: '6,2 mil',
    parts: 18,
    synopsis:
      'Curated fantasy worlds and weekend novellas written in English.',
    tags: ['English List', 'Fantasy', 'Adventure'],
    coverPalette: {
      bgPrimary: '#3B19A9',
      bgSecondary: '#1B0B4F',
      accent: '#FFC922',
      textColor: '#FFFFFF',
      motif: 'constellation',
    },
    isReadingList: true,
    listStoryCount: 18,
    chapters: [EN_CAP_1],
  },
];

/**
 * Monta os carrosséis da página inicial priorizando histórias e listas conforme `storiesLanguage`,
 * incluindo um carrossel de demonstração com `hasPtTranslation: false` para evidenciar a ocultação
 * de carrosséis sem tradução para o português (R9).
 *
 * @param storiesLanguage Idioma selecionado para recomendação de histórias (`'pt'`, `'en'` ou `'es'`).
 * @returns Lista ordenada de carrosséis exibidos na Home (Tela 1).
 */
export function buildCarousels(storiesLanguage: 'pt' | 'en' | 'es'): CarouselData[] {
  const ptStories = MOCK_STORIES.filter((s) => s.language === 'pt' && !s.isReadingList);
  const enStories = MOCK_STORIES.filter((s) => s.language === 'en' && !s.isReadingList);

  const primaryPool =
    storiesLanguage === 'en'
      ? [...enStories, ...ptStories.slice(0, 2)]
      : [...ptStories, MOCK_STORIES.find((s) => s.id === 'echoes-beyond-the-harbor')!];

  const readingListsPt = MOCK_STORIES.filter((s) => s.isReadingList && s.language === 'pt');
  const readingListsEn = MOCK_STORIES.filter((s) => s.isReadingList && s.language === 'en');

  const communityListItems: StoryItem[] =
    storiesLanguage === 'en'
      ? [
          ...readingListsEn,
          MOCK_STORIES.find((s) => s.id === 'echoes-beyond-the-harbor')!,
          ...readingListsPt.slice(0, 1),
        ]
      : [
          ...readingListsPt,
          MOCK_STORIES.find((s) => s.id === 'cronicas-do-silencio')!,
          MOCK_STORIES.find((s) => s.id === 'echoes-beyond-the-harbor')!,
        ];

  return [
    {
      id: 'proxima-leitura',
      titlePt: 'Sua próxima leitura está aqui',
      titleEn: 'Your next read is here',
      titleEs: 'Tu próxima lectura está aquí',
      hasPtTranslation: true,
      kind: 'stories',
      items: primaryPool,
    },
    {
      id: 'fuja-realidade',
      titlePt: 'Fuja da realidade',
      titleEn: 'Escape reality',
      titleEs: 'Escapa de la realidad',
      hasPtTranslation: true,
      kind: 'stories',
      items: [
        MOCK_STORIES.find((s) => s.id === 'jardim-das-cinzas')!,
        MOCK_STORIES.find((s) => s.id === 'estrela-de-vidro')!,
        MOCK_STORIES.find((s) => s.id === 'laminas-da-fronteira')!,
        MOCK_STORIES.find((s) => s.id === 'clockwork-seasons')!,
      ],
    },
    {
      id: 'listas-comunidade',
      titlePt: 'Listas de leitura da comunidade',
      titleEn: 'Community reading lists',
      titleEs: 'Listas de lectura de la comunidad',
      hasPtTranslation: true,
      kind: 'reading-lists',
      items: communityListItems,
    },
    {
      id: 'em-alta',
      titlePt: 'Em alta',
      titleEn: 'Trending now',
      titleEs: 'En tendencia',
      hasPtTranslation: true,
      kind: 'stories',
      items: [
        MOCK_STORIES.find((s) => s.id === 'cronicas-do-silencio')!,
        MOCK_STORIES.find((s) => s.id === 'cartas-de-outono')!,
        MOCK_STORIES.find((s) => s.id === 'sob-luz-de-nevoeiro')!,
        MOCK_STORIES.find((s) => s.id === 'letters-across-winter')!,
      ],
    },
    {
      id: 'sem-traducao-demo',
      titlePt: 'Seleção editorial internacional (sem tradução oficial)',
      titleEn: 'International Spotlight Picks (Untranslated)',
      titleEs: 'Selección internacional (sin traducción)',
      hasPtTranslation: false,
      kind: 'stories',
      items: [
        MOCK_STORIES.find((s) => s.id === 'clockwork-seasons')!,
        MOCK_STORIES.find((s) => s.id === 'letters-across-winter')!,
        MOCK_STORIES.find((s) => s.id === 'echoes-beyond-the-harbor')!,
      ],
    },
  ];
}

/**
 * Rascunho inicial do Leonardo (Cenário 2 / Tela 4):
 * - Capítulo 3 — O eco na escadaria
 * - 1.240 palavras calibradas dinamicamente
 * - 2 pensamentos sem itálico (parágrafos 3 e 7)
 * - 2 trocas de cena com '***' alinhadas à esquerda
 * - 1 troca de ponto de vista sem marcação (parágrafos 8 e 9)
 *
 * @returns Rascunho inicial pronto para edição na Tela 4.
 */
export function createInitialLeonardoDraft(): LeonardoDraft {
  const initialBlocks: EditorBlock[] = [
    {
      id: 'leo-b1',
      type: 'paragraph',
      html: 'O corredor do terceiro andar cheirava a verniz antigo e chuva retida nas venezianas fechadas desde o outono passado.',
      align: 'left',
    },
    {
      id: 'leo-b2',
      type: 'paragraph',
      html: 'Rafael apoiou a lanterna sobre o corrimão gasto, ouvindo o rangido lento de cada degrau enquanto observava a fresta sob a porta da biblioteca.',
      align: 'left',
    },
    {
      id: 'leo-b3',
      type: 'paragraph',
      html: 'Eu não deveria ter aberto aquela porta antes do amanhecer, pensou Rafael.',
      align: 'left',
    },
    {
      id: 'leo-b4',
      type: 'paragraph',
      html: '***',
      align: 'left',
    },
    {
      id: 'leo-b5',
      type: 'paragraph',
      html: 'Na cozinha do térreo, Helena organizava as xícaras em silêncio e conferia o bilhete deixado sobre o balcão de mármore.',
      align: 'left',
    },
    {
      id: 'leo-b6',
      type: 'paragraph',
      html: 'A tinta ainda fresca denunciava que alguém atravessara a casa poucos minutos antes de o portão bater com o vento.',
      align: 'left',
    },
    {
      id: 'leo-b7',
      type: 'paragraph',
      html: 'Se alguém descesse a escadaria agora, não haveria explicação possível.',
      align: 'left',
    },
    {
      id: 'leo-b8',
      type: 'paragraph',
      html: '***',
      align: 'left',
    },
    {
      id: 'leo-b9',
      type: 'paragraph',
      html: 'Do lado de fora, a neblina cobria o jardim lateral enquanto um vulto recolhia as chaves caídas junto ao chafariz seco.',
      align: 'left',
    },
    {
      id: 'leo-b10',
      type: 'paragraph',
      html: 'No sótão iluminado por uma única vela, Júlia fechou o caderno de anotações e encostou o ouvido na tubulação de ferro para acompanhar os passos no andar de baixo.',
      align: 'left',
    },
  ];

  const blockWords = countEditorBlocksWords(initialBlocks);
  const calibratedOffset = 1240 - blockWords;

  return {
    storyTitle: 'Sombras no Sobrado',
    chapterTitle: 'Capítulo 3 — O eco na escadaria',
    blocks: initialBlocks,
    baseWordCountOffset: calibratedOffset,
    saveStatus: 'Salvo',
    published: false,
    publishedAt: null,
  };
}

/**
 * Capítulo 9 inicial do Sansão (Cenário 4 / Telas 5 e 6):
 * - Cena na taverna terminando na fala do estalajadeiro
 * - Imediatamente colada à primeira linha da cena na floresta (sem pensamento nem '***')
 *
 * @returns Estado inicial do Capítulo 9 mobile para leitura e edição.
 */
export function createInitialSansaoChapter(): SansaoChapter {
  const blocks: MobileBlock[] = [
    {
      id: 'san-b1',
      text: 'A lareira da taverna estalava baixo enquanto a chuva batia contra as tábuas mal ajustadas da janela principal.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b2',
      text: 'Caio manteve o capuz erguido sobre os ombros e deslizou duas moedas gastas até o centro do balcão manchado de hidromel.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b3',
      text: 'Do outro lado da madeira, o homem de avental escuro desenrolou um pergaminho marcado com carvão e apontou para a passagem estreita entre os penhascos.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b4',
      text: '— Você tem até a lua cheia para decidir de que lado está — disse o estalajadeiro, empurrando o mapa sobre o balcão.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b5',
      text: 'O vento cortante balançava as copas dos pinheiros enquanto Caio seguia a trilha lamacenta sob a neblina.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b6',
      text: 'Cada passo entre as raízes expostas exigia cuidado redobrado para não denunciar sua posição aos batedores da guarda.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b7',
      text: 'Ao longe, entre as árvores altas, o brilho tênue de uma fogueira indicava que o acampamento avançado já estava montado.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
    {
      id: 'san-b8',
      text: 'Ele ajustou o punho da lâmina na cintura, respirou o ar gelado da madrugada e continuou avançando pela encosta.',
      bold: false,
      italic: false,
      underline: false,
      align: 'left',
    },
  ];

  return {
    storyTitle: 'Lâminas da Fronteira',
    chapterTitle: 'Capítulo 9 — O pacto na taverna',
    blocks,
    currentParagraph: 1,
    isPlaying: false,
    edited: false,
  };
}
