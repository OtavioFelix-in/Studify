// Paletas de cor (clara e escura), tipos de tarefa e cores de matéria.
// Os componentes pegam a paleta ativa via useTheme() (src/theme-context.js).

// Paleta "Caneta azul": papel de caderno #F3EFE6, tinta #1F3A93, margem vermelha #C8442F;
// no escuro, fundo #16181D e cartão #1F2229.
export const palettes = {
  light: {
    background: '#F3EFE6',
    card: '#FBF9F4',
    primary: '#1F3A93',
    onPrimary: '#FBF9F4',
    primaryLight: '#DCE1EE',
    text: '#22201C',
    textMuted: '#7A746A',
    border: '#E4DED1',
    success: '#3F7D4E',
    danger: '#C8442F',
  },
  dark: {
    background: '#16181D',
    card: '#1F2229',
    primary: '#8EA4E8',
    onPrimary: '#16181D',
    primaryLight: '#272E42',
    text: '#ECE8DF',
    textMuted: '#8F8A80',
    border: '#2C2F36',
    success: '#7FB58C',
    danger: '#E07A62',
  },
};

// Bricolage Grotesque, carregada no App.js. Com fonte própria o Android ignora
// fontWeight, então cada peso é uma família.
export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  extrabold: 'BricolageGrotesque_800ExtraBold',
};

// Cores fixas por tipo (funcionam bem nos dois temas).
export const taskTypes = {
  prova: { label: 'Prova', icon: 'file-pen-line', color: '#C8442F' },
  trabalho: { label: 'Trabalho', icon: 'book-open', color: '#3D6FB6' },
  tarefa: { label: 'Tarefa', icon: 'pencil', color: '#8A8275' },
};

// Paleta para escolher a cor de cada matéria.
export const SUBJECT_COLORS = [
  '#1F3A93', // azul
  '#C8442F', // vermelho
  '#3F7D4E', // verde
  '#D08A2E', // mostarda
  '#6A4C93', // roxo
  '#2E8A99', // ciano
  '#8D6E63', // marrom
  '#5C6470', // grafite
];

// Cor de matéria usada como texto: no escuro, clareia para não sumir no cartão.
export function subjectTextColor(color, isDark) {
  if (!color || !isDark) return color;
  const n = parseInt(color.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * 0.45);
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const CONFETTI_COLORS = ['#1F3A93', '#C8442F', '#D08A2E', '#3F7D4E', '#8EA4E8'];
