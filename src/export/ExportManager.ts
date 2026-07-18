import { ExportFormat, ExportOptions, Exporter } from './types/ExportOptions'
import { HtmlExporter } from './exporters/HtmlExporter'
import { PdfExporter } from './exporters/PdfExporter'

export class ExportManager {
  private exporters: Map<ExportFormat, Exporter> = new Map()

  register(format: ExportFormat, exporter: Exporter): void {
    this.exporters.set(format, exporter)
  }

  async export(options: ExportOptions): Promise<void> {
    const exporter = this.exporters.get(options.format)
    if (!exporter) {
      throw new Error(`No exporter registered for format: ${options.format}`)
    }
    await exporter.export(options)
  }

  static create(): ExportManager {
    const manager = new ExportManager()
    manager.register(ExportFormat.HTML, new HtmlExporter())
    manager.register(ExportFormat.PDF, new PdfExporter())
    return manager
  }
}
