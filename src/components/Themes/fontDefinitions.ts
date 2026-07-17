export interface FontCombo {
  id: string
  name: string
  category: 'english' | 'persian'
  body: string
  heading: string
  code: string
  math: string
  import: string
  bodyStyle?: React.CSSProperties
  headingStyle?: React.CSSProperties
}

export const fontCombos: FontCombo[] = [
  // ===== English Font Combinations =====
  {
    id: 'default',
    name: 'System Default',
    category: 'english',
    body: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    code: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
    math: 'KaTeX_Math, Times New Roman, serif',
    import: '',
  },
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    category: 'english',
    body: 'Inter',
    heading: 'Inter',
    code: 'JetBrains Mono',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    category: 'english',
    body: 'Libre Baskerville',
    heading: 'Playfair Display',
    code: 'Fira Code',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@600;700;800&family=Fira+Code:wght@400;500&display=swap',
  },
  {
    id: 'writing',
    name: 'Writing',
    category: 'english',
    body: 'Lora',
    heading: 'Merriweather',
    code: 'Source Code Pro',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:wght@700;900&family=Source+Code+Pro:wght@400;500&display=swap',
  },
  {
    id: 'technical',
    name: 'Technical',
    category: 'english',
    body: 'IBM Plex Sans',
    heading: 'IBM Plex Sans',
    code: 'IBM Plex Mono',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'english',
    body: 'Source Serif 4',
    heading: 'Montserrat',
    code: 'Fira Code',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@600;700;800&family=Fira+Code:wght@400;500&display=swap',
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    category: 'english',
    body: 'Charter, Georgia',
    heading: 'Roboto Slab',
    code: 'Roboto Mono',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@600;700;800&family=Roboto+Mono:wght@400;500&display=swap',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: 'english',
    body: 'Manrope',
    heading: 'Space Grotesk',
    code: 'JetBrains Mono',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  {
    id: 'academic',
    name: 'Academic',
    category: 'english',
    body: 'Crimson Pro',
    heading: 'EB Garamond',
    code: 'IBM Plex Mono',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=EB+Garamond:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap',
  },
  {
    id: 'mono-focused',
    name: 'Mono Focused',
    category: 'english',
    body: 'Fira Sans',
    heading: 'Space Grotesk',
    code: 'JetBrains Mono',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },

  // ===== Persian Font Combinations =====
  {
    id: 'persian-vazir',
    name: 'Vazirmatn',
    category: 'persian',
    body: 'Vazirmatn',
    heading: 'Vazirmatn',
    code: 'Fira Code',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap',
  },
  {
    id: 'persian-iran',
    name: 'IRANSans',
    category: 'persian',
    body: 'IRANSans',
    heading: 'IRANSans',
    code: 'Fira Code',
    math: 'KaTeX_Math',
    import: 'https://cdn.jsdelivr.net/gh/rastikerdar/iransans-font@v33.0.3/dist/IRANSans.css',
  },
  {
    id: 'persian-shabnam',
    name: 'Shabnam + Vazir',
    category: 'persian',
    body: 'Shabnam',
    heading: 'Vazirmatn',
    code: 'Fira Code',
    math: 'KaTeX_Math',
    import: 'https://fonts.googleapis.com/css2?family=Shabnam:wght@400;500;700&family=Vazirmatn:wght@600;700;800;900&family=Fira+Code:wght@400;500&display=swap',
  },
]

export const getFontCombo = (id: string): FontCombo =>
  fontCombos.find(f => f.id === id) || fontCombos[0]
