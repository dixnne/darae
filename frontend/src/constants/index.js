const API_URL = "http://localhost:8000";

const PALETTES = [
  ["#F7CFD8", "#F4F8D3", "#A6D6D6", "#8E7DBE"],
  ["#FFEDFA", "#FFB8E0", "#EC7FA9", "#BE5985"],
  ["#A8DF8E", "#F0FFDF", "#FFD8DF", "#FFAAB8"],
  ["#EFECE3", "#8FABD4", "#4A70A9", "#000000"],
  ["#FFF2E0", "#C0C9EE", "#A2AADB", "#898AC4"],
  ["#FA5C5C", "#FD8A6B", "#FEC288", "#FBEF76"],
  ["#0046FF", "#73C8D2", "#F5F1DC", "#FF9013"],
  ["#B77466", "#FFE1AF", "#E2B59A", "#957C62"],
  ["#FFEAC5", "#FFDBB5", "#6C4E31", "#603F26"]
];

const ISO_LANGS = [
  { code: 'ko', name: 'Coreano' },
  { code: 'ja', name: 'Japonés' },
  { code: 'en', name: 'Inglés' },
  { code: 'fr', name: 'Francés' },
  { code: 'de', name: 'Alemán' },
  { code: 'zh', name: 'Chino' }
];

const AVATARS = ["User", "BrainCircuit", "Languages", "Book", "Globe", "MessageCircle"];

export { API_URL, PALETTES, ISO_LANGS, AVATARS };