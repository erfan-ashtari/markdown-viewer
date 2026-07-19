import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { ExportOptions, Exporter } from '../types/ExportOptions'
import { buildHtmlDocument } from '../templates/html'

export class HtmlExporter implements Exporter {
  async export(options: ExportOptions): Promise<void> {
    const htmlBody = await this.markdownToHtml(options.markdown)
    const fullHtml = buildHtmlDocument(htmlBody, {
      title: options.title,
      theme: options.theme,
    })

    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.title || 'export'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  private async markdownToHtml(markdown: string): Promise<string> {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown)

    return String(result)
  }
}
