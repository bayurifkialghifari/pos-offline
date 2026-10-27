import type { CellValue } from "read-excel-file/browser"
import type { SheetData } from "write-excel-file"
import { parseCsv } from "./csv-parser"
import { saveOrShare, utf8ToBase64 } from "./download"
import {
  MAX_COLUMNS,
  MAX_FILE_BYTES,
  MAX_ROWS,
  UTF8_DECODER,
  UnsupportedSpreadsheetError,
  rejectSpreadsheet,
} from "./spreadsheet-guards"
import { preflightXlsx } from "./xlsx-preflight"

export interface ExportSheet {
  name: string
  rows: Record<string, string | number>[]
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
function stringCell(value: CellValue<string> | null): string {
  if (value === null || value === Date) return ""
  return String(value)
}

function sheetHeaders(rows: ExportSheet["rows"]): string[] {
  const headers: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        headers.push(key)
      }
    }
  }
  return headers
}

function tabularRows(sheet: ExportSheet): (string | number)[][] {
  const headers = sheetHeaders(sheet.rows)
  return [
    headers,
    ...sheet.rows.map((row) => headers.map((header) => row[header] ?? "")),
  ]
}

function sheetData(sheet: ExportSheet): SheetData {
  return tabularRows(sheet).map((row) => row.map((value) => ({ value })))
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function exportXlsx(
  filename: string,
  sheets: ExportSheet[],
): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file")
  const blob = await writeXlsxFile(sheets.map(sheetData), {
    sheets: sheets.map((sheet) => sheet.name.slice(0, 31)),
  })
  await saveOrShare(filename, await blobToBase64(blob), XLSX_MIME)
}

function csvCell(value: string | number): string {
  const text = /^[=+\-@]/.test(String(value).trimStart())
    ? `'${value}`
    : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export async function exportCsv(
  filename: string,
  sheet: ExportSheet,
): Promise<void> {
  const csv = tabularRows(sheet)
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
  await saveOrShare(
    filename,
    utf8ToBase64(`\uFEFF${csv}`),
    "text/csv;charset=utf-8",
  )
}

export type RawRow = Record<string, string>

function recordsFromRows(rows: string[][]): RawRow[] {
  const [headers, ...data] = rows
  if (
    !headers?.length ||
    headers.some((header) => !header.trim()) ||
    new Set(headers).size !== headers.length
  )
    return []
  return data
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] ?? ""]),
      ),
    )
}

function assertTableLimits(rows: string[][]): void {
  if (rows.length > MAX_ROWS || rows.some((row) => row.length > MAX_COLUMNS))
    rejectSpreadsheet()
}

async function readCsv(file: File | Blob): Promise<RawRow[]> {
  if (file.size > MAX_FILE_BYTES) rejectSpreadsheet()
  const text = UTF8_DECODER.decode(await file.arrayBuffer()).replace(
    /^\uFEFF/,
    "",
  )
  const rows = parseCsv(text)
  assertTableLimits(rows)
  if (rows.some((row) => row.some((cell) => /^[=+\-@]/.test(cell.trimStart()))))
    rejectSpreadsheet()
  return recordsFromRows(rows)
}

async function readXlsx(file: File | Blob): Promise<RawRow[]> {
  if (file.size > MAX_FILE_BYTES) rejectSpreadsheet()
  const buffer = await file.arrayBuffer()
  await preflightXlsx(new Uint8Array(buffer))
  const { readSheet } = await import("read-excel-file/browser")
  const rows = await readSheet<string>(buffer, 1, {
    parseNumber: (value) => value,
  })
  const normalizedRows = rows.map((row) => row.map((cell) => stringCell(cell)))
  assertTableLimits(normalizedRows)
  return recordsFromRows(normalizedRows)
}

export async function readTabular(
  file: File | Blob,
  isCsv: boolean,
): Promise<RawRow[]> {
  try {
    return isCsv ? await readCsv(file) : await readXlsx(file)
  } catch (error) {
    if (error instanceof UnsupportedSpreadsheetError) throw error
    throw new UnsupportedSpreadsheetError()
  }
}
