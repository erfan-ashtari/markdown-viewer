const themeCssVariables: Record<string, string> = {
  light: `
    --bg-primary: #ffffff;
    --text-primary: #24292e;
    --text-secondary: #586069;
    --accent-color: #0366d6;
    --code-bg: #f6f8fa;
    --border-color: #e1e4e8;
    --md-heading: #1a1a2e;
    --md-strong: #24292e;
    --md-blockquote-border: #d0d7de;
    --md-blockquote-text: #57606a;
    --md-table-border: #d0d7de;
    --md-table-stripe: #f6f8fa;
  `,
  dark: `
    --bg-primary: #1e1e1e;
    --text-primary: #d4d4d4;
    --text-secondary: #a0a0a0;
    --accent-color: #4da3ff;
    --code-bg: #161616;
    --border-color: #404040;
    --md-heading: #e0e0e0;
    --md-strong: #ffffff;
    --md-blockquote-border: #555555;
    --md-blockquote-text: #999999;
    --md-table-border: #404040;
    --md-table-stripe: #2a2a2a;
  `,
  'github-dark': `
    --bg-primary: #0d1117;
    --text-primary: #c9d1d9;
    --text-secondary: #8b949e;
    --accent-color: #58a6ff;
    --code-bg: #161b22;
    --border-color: #30363d;
    --md-heading: #e6edf3;
    --md-strong: #f0f6fc;
    --md-blockquote-border: #3b4958;
    --md-blockquote-text: #8b949e;
    --md-table-border: #30363d;
    --md-table-stripe: #161b22;
  `,
  monokai: `
    --bg-primary: #272822;
    --text-primary: #f8f8f2;
    --text-secondary: #a6a68a;
    --accent-color: #66d9ef;
    --code-bg: #1e1f1c;
    --border-color: #49483e;
    --md-heading: #a6e22e;
    --md-strong: #f8f8f2;
    --md-blockquote-border: #75715e;
    --md-blockquote-text: #a6a68a;
    --md-table-border: #49483e;
    --md-table-stripe: #2d2e27;
  `,
  nord: `
    --bg-primary: #2e3440;
    --text-primary: #d8dee9;
    --text-secondary: #a0aabe;
    --accent-color: #88c0d0;
    --code-bg: #3b4252;
    --border-color: #4c566a;
    --md-heading: #eceff4;
    --md-strong: #eceff4;
    --md-blockquote-border: #4c566a;
    --md-blockquote-text: #a0aabe;
    --md-table-border: #4c566a;
    --md-table-stripe: #353c4a;
  `,
  dracula: `
    --bg-primary: #282a36;
    --text-primary: #f8f8f2;
    --text-secondary: #bfbfbf;
    --accent-color: #8be9fd;
    --code-bg: #21222c;
    --border-color: #44475a;
    --md-heading: #bd93f9;
    --md-strong: #ff79c6;
    --md-blockquote-border: #6272a4;
    --md-blockquote-text: #bfbfbf;
    --md-table-border: #44475a;
    --md-table-stripe: #2c2e3a;
  `,
  solarized: `
    --bg-primary: #002b36;
    --text-primary: #839496;
    --text-secondary: #93a1a1;
    --accent-color: #268bd2;
    --code-bg: #073642;
    --border-color: #586e75;
    --md-heading: #93a1a1;
    --md-strong: #fdf6e3;
    --md-blockquote-border: #586e75;
    --md-blockquote-text: #93a1a1;
    --md-table-border: #586e75;
    --md-table-stripe: #063440;
  `,
  'one-dark': `
    --bg-primary: #282c34;
    --text-primary: #abb2bf;
    --text-secondary: #888d95;
    --accent-color: #61afef;
    --code-bg: #21252b;
    --border-color: #3e4451;
    --md-heading: #e5c07b;
    --md-strong: #e06c75;
    --md-blockquote-border: #5c6370;
    --md-blockquote-text: #888d95;
    --md-table-border: #3e4451;
    --md-table-stripe: #252a32;
  `,
  material: `
    --bg-primary: #263238;
    --text-primary: #eeffff;
    --text-secondary: #a0a0a0;
    --accent-color: #82aaff;
    --code-bg: #1c2127;
    --border-color: #37474f;
    --md-heading: #c3e88d;
    --md-strong: #f07178;
    --md-blockquote-border: #546e7a;
    --md-blockquote-text: #a0a0a0;
    --md-table-border: #37474f;
    --md-table-stripe: #222c32;
  `,
  paper: `
    --bg-primary: #f5f5f5;
    --text-primary: #333333;
    --text-secondary: #555555;
    --accent-color: #0066cc;
    --code-bg: #e8e8e8;
    --border-color: #cccccc;
    --md-heading: #1a1a1a;
    --md-strong: #1a1a1a;
    --md-blockquote-border: #bbbbbb;
    --md-blockquote-text: #666666;
    --md-table-border: #cccccc;
    --md-table-stripe: #eeeeee;
  `,
  newsprint: `
    --bg-primary: #f7f3e9;
    --text-primary: #333333;
    --text-secondary: #555555;
    --accent-color: #8b0000;
    --code-bg: #e8e0d0;
    --border-color: #999999;
    --md-heading: #1a1a1a;
    --md-strong: #1a1a1a;
    --md-blockquote-border: #8b0000;
    --md-blockquote-text: #666666;
    --md-table-border: #999999;
    --md-table-stripe: #f0e8d8;
  `,
}

const printCss = `
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
  }

  pre, blockquote, table, img, .mermaid {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
    word-break: break-all;
  }

  a[href^="#"]::after,
  a[href^="javascript:"]::after {
    content: "";
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  img {
    max-width: 100% !important;
  }
}
`

export function buildHtmlDocument(body: string, options: { title?: string; theme?: string }): string {
  const title = options.title || 'Untitled'
  const themeVars = themeCssVariables[options.theme || 'light'] || themeCssVariables.light

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css">
  <style>
    :root {
      ${themeVars}
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
      color: var(--md-heading);
    }

    h1, h2 {
      padding-bottom: 0.3em;
      border-bottom: 1px solid var(--border-color);
    }

    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.85em; opacity: 0.8; }

    p {
      margin-bottom: 16px;
    }

    a {
      color: var(--accent-color);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    strong {
      font-weight: 600;
      color: var(--md-strong);
    }

    blockquote {
      margin: 16px 0;
      padding: 0 1em;
      color: var(--md-blockquote-text);
      border-left: 0.25em solid var(--md-blockquote-border);
    }

    ul, ol {
      padding-left: 2em;
      margin-bottom: 16px;
    }

    li {
      margin-top: 0.25em;
    }

    code {
      padding: 0.2em 0.4em;
      font-size: 85%;
      background-color: var(--code-bg);
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      color: var(--accent-color);
    }

    pre {
      margin-bottom: 16px;
      padding: 16px;
      font-size: 85%;
      line-height: 1.45;
      background-color: var(--code-bg);
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }

    pre code {
      padding: 0;
      background-color: transparent;
      border-radius: 0;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }

    table {
      display: block;
      width: 100%;
      overflow: auto;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    th, td {
      padding: 6px 13px;
      border: 1px solid var(--md-table-border);
    }

    th {
      font-weight: 600;
      background-color: var(--code-bg);
      color: var(--md-heading);
    }

    tr:nth-child(2n) {
      background-color: var(--md-table-stripe);
    }

    hr {
      height: 0.25em;
      margin: 24px 0;
      background-color: var(--border-color);
      border: 0;
    }

    .hljs {
      background: transparent !important;
      padding: 0 !important;
    }

    .katex-display {
      margin: 16px 0;
      overflow-x: auto;
    }

    ${printCss}
  </style>
</head>
<body>
  ${body}
</body>
</html>`
}
