const extToLanguage: Record<string, string> = {
  // JavaScript / TypeScript
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mtz: 'typescript',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  svg: 'xml',

  // Data / Config
  json: 'json',
  jsonc: 'json',
  jsonl: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'ini',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  env: 'bash',
  xml: 'xml',
  csv: 'plaintext',
  tsv: 'plaintext',

  // Shell / CLI
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  fish: 'bash',
  bat: 'batch',
  cmd: 'batch',
  ps1: 'powershell',
  psm1: 'powershell',

  // Python
  py: 'python',
  pyw: 'python',
  pyi: 'python',

  // Systems
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  swift: 'swift',
  m: 'objectivec',
  mm: 'objectivec',

  // Ruby / PHP / Lua
  rb: 'ruby',
  erb: 'ruby',
  php: 'php',
  lua: 'lua',

  // Other languages
  r: 'r',
  R: 'r',
  scala: 'scala',
  clj: 'clojure',
  ex: 'elixir',
  exs: 'elixir',
  hs: 'haskell',
  ml: 'ocaml',
  fs: 'fsharp',
 dart: 'dart',
  jl: 'julia',
  nim: 'nim',
  v: 'verilog',
  vhd: 'vhdl',

  // SQL
  sql: 'sql',
  psql: 'sql',
  mysql: 'sql',
  sqlite: 'sql',

  // Build / Infra
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmake: 'cmake',
  gradle: 'groovy',
  gradlew: 'groovy',

  // Docs / Text
  txt: 'plaintext',
  text: 'plaintext',
  log: 'plaintext',
  md: 'markdown',
  markdown: 'markdown',
  rst: 'plaintext',
  tex: 'latex',
  bib: 'bibtex',

  // Misc
  diff: 'diff',
  patch: 'diff',
  gitignore: 'plaintext',
  editorconfig: 'plaintext',
  prettierrc: 'json',
  eslintrc: 'json',
}

export function getLanguageForFile(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return null

  // Check full filename first (e.g. "Dockerfile", "Makefile")
  const fullLower = fileName.toLowerCase()
  if (fullLower === 'dockerfile') return 'dockerfile'
  if (fullLower === 'makefile' || fullLower === 'gnumakefile') return 'makefile'
  if (fullLower === '.gitignore' || fullLower === '.gitattributes') return 'plaintext'
  if (fullLower === '.editorconfig') return 'plaintext'
  if (fullLower === 'cmakelists.txt') return 'cmake'

  return extToLanguage[ext] || null
}

export function isTextFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return false // no extension = don't attempt

  // Only open files with known text/code extensions (allowlist)
  const textExts = new Set([
    // Code — languages
    'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts',
    'py', 'pyw', 'pyi', 'pyx',
    'rb', 'erb',
    'php',
    'go', 'rs', 'java', 'kt', 'kts', 'swift',
    'c', 'h', 'cpp', 'cxx', 'cc', 'hpp', 'hxx',
    'cs', 'fs', 'fsx', 'fsi',
    'scala', 'sc', 'clj', 'cljs', 'cljc',
    'r', 'R', 'm', 'mm',
    'dart', 'jl', 'nim', 'v', 'vhd',
    'lua', 'hs', 'ml', 'ex', 'exs',
    'zig', 'cr', 'sol',

    // Scripting / Shell
    'sh', 'bash', 'zsh', 'fish', 'ksh',
    'bat', 'cmd', 'ps1', 'psm1', 'psd1',
    'bashrc', 'zshrc', 'profile',

    // SQL
    'sql', 'psql', 'mysql', 'sqlite',

    // Web
    'html', 'htm', 'xhtml', 'vue', 'svelte',
    'css', 'scss', 'sass', 'less', 'styl',
    'xml', 'xsl', 'xslt', 'xsd', 'dtd',

    // Data / Config
    'json', 'jsonc', 'jsonl', 'json5',
    'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
    'env', 'properties', 'prop',
    'csv', 'tsv', 'psv',

    // Build / Infra
    'dockerfile', 'makefile', 'cmake', 'gradle',
    'tf', 'hcl', 'nomad', 'pkr',

    // Docs / Text
    'txt', 'text', 'log', 'md', 'markdown', 'rst',
    'tex', 'latex', 'bib', 'sty', 'cls',
    'diff', 'patch',
    'adoc', 'asciidoc',

    // Misc text
    'gitignore', 'gitattributes', 'editorconfig',
    'prettierrc', 'eslintrc', 'babelrc',
    'license', 'licence', 'authors', 'changelog',
    'passwd', 'shadow', 'hosts',
    'cfg', 'conf', 'config',
    'vue', 'svelte',
  ])

  // Full filename matches (no extension)
  const fullLower = fileName.toLowerCase()
  const textFileNames = new Set([
    'dockerfile', 'makefile', 'gnumakefile', 'cmakelists.txt',
    '.gitignore', '.gitattributes', '.editorconfig', '.eslintignore',
    '.prettierignore', '.npmignore', '.dockerignore',
    'license', 'licence', 'readme', 'changelog', 'authors',
    'contributing', 'copying', 'todo',
  ])

  if (textFileNames.has(fullLower)) return true
  return textExts.has(ext)
}
