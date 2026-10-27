export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024
export const MAX_ZIP_ENTRIES = 256
export const MAX_ROWS = 10_000
export const MAX_COLUMNS = 64
export const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true })
const UNSUPPORTED_SPREADSHEET_MESSAGE =
  "Berkas spreadsheet tidak valid atau tidak didukung."

export class UnsupportedSpreadsheetError extends Error {
  override readonly name = "UnsupportedSpreadsheetError"

  constructor() {
    super(UNSUPPORTED_SPREADSHEET_MESSAGE)
  }
}

export function rejectSpreadsheet(): never {
  throw new UnsupportedSpreadsheetError()
}
