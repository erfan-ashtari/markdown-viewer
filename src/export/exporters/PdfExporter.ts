import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { ExportOptions, Exporter } from '../types/ExportOptions'
import { buildHtmlDocument } from '../templates/html'

export class PdfExporter implements Exporter {
  async export(options: ExportOptions): Promise<void> {
    const htmlBody = await this.markdownToHtml(options.markdown)
    const fullHtml = buildHtmlDocument(htmlBody, {
      title: options.title,
      theme: options.theme,
    })

    const margins = options.pdfMargins || { top: 0, bottom: 0, left: 0, right: 0 }
    const pdfBuffer = await window.electronAPI?.exportPdf(fullHtml, margins)
    if (!pdfBuffer) {
      throw new Error('PDF export failed: no buffer returned')
    }

    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.title || 'export'}.pdf`
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
