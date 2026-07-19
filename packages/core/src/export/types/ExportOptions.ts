export enum ExportFormat {
  HTML = 'html',
  PDF = 'pdf',
}

export interface PdfMargins {
  top: number
  bottom: number
  left: number
  right: number
}

export interface ExportOptions {
  format: ExportFormat
  markdown: string
  title?: string
  theme?: string
  pdfMargins?: PdfMargins
}

export interface Exporter {
  export(options: ExportOptions): Promise<void>
}
