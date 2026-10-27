import {
  MAX_UNCOMPRESSED_BYTES,
  MAX_ZIP_ENTRIES,
  UTF8_DECODER,
  rejectSpreadsheet,
} from "./spreadsheet-guards"
function readUint16(view: DataView, offset: number): number {
  if (offset < 0 || offset + 2 > view.byteLength) rejectSpreadsheet()
  return view.getUint16(offset, true)
}

function readUint32(view: DataView, offset: number): number {
  if (offset < 0 || offset + 4 > view.byteLength) rejectSpreadsheet()
  return view.getUint32(offset, true)
}

function endOfCentralDirectory(view: DataView): number {
  for (
    let offset = view.byteLength - 22;
    offset >= Math.max(0, view.byteLength - 65_557);
    offset--
  ) {
    if (
      readUint32(view, offset) === 0x06054b50 &&
      offset + 22 + readUint16(view, offset + 20) === view.byteLength
    ) {
      return offset
    }
  }
  return rejectSpreadsheet()
}

function zipEntryNames(bytes: Uint8Array): Set<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const end = endOfCentralDirectory(view)
  if (readUint16(view, end + 4) !== 0 || readUint16(view, end + 6) !== 0)
    rejectSpreadsheet()

  const count = readUint16(view, end + 10)
  const directorySize = readUint32(view, end + 12)
  const directoryOffset = readUint32(view, end + 16)
  if (
    !count ||
    count > MAX_ZIP_ENTRIES ||
    directoryOffset + directorySize > end
  )
    rejectSpreadsheet()

  const names = new Set<string>()
  let totalUncompressed = 0
  let offset = directoryOffset
  for (let index = 0; index < count; index++) {
    if (readUint32(view, offset) !== 0x02014b50) rejectSpreadsheet()
    const flags = readUint16(view, offset + 8)
    const compression = readUint16(view, offset + 10)
    const compressedSize = readUint32(view, offset + 20)
    const uncompressedSize = readUint32(view, offset + 24)
    const nameLength = readUint16(view, offset + 28)
    const extraLength = readUint16(view, offset + 30)
    const commentLength = readUint16(view, offset + 32)
    const localOffset = readUint32(view, offset + 42)
    const entryEnd = offset + 46 + nameLength + extraLength + commentLength
    if (
      entryEnd > directoryOffset + directorySize ||
      flags & 1 ||
      (compression !== 0 && compression !== 8)
    )
      rejectSpreadsheet()

    const name = UTF8_DECODER.decode(
      bytes.subarray(offset + 46, offset + 46 + nameLength),
    )
    if (
      !name ||
      name.startsWith("/") ||
      name.includes("\\") ||
      name.split("/").includes("..") ||
      names.has(name)
    )
      rejectSpreadsheet()
    if (readUint32(view, localOffset) !== 0x04034b50) rejectSpreadsheet()
    const dataOffset =
      localOffset +
      30 +
      readUint16(view, localOffset + 26) +
      readUint16(view, localOffset + 28)
    if (dataOffset + compressedSize > bytes.byteLength) rejectSpreadsheet()

    names.add(name)
    totalUncompressed += uncompressedSize
    if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) rejectSpreadsheet()
    offset = entryEnd
  }
  if (offset !== directoryOffset + directorySize) rejectSpreadsheet()
  return names
}

function decodeXml(entries: Record<string, Uint8Array>, name: string): string {
  const content = entries[name]
  if (!content) rejectSpreadsheet()
  const xml = UTF8_DECODER.decode(content)
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) rejectSpreadsheet()
  return xml
}

export async function preflightXlsx(bytes: Uint8Array): Promise<void> {
  const names = zipEntryNames(bytes)
  const required = [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
  ]
  if (
    required.some((name) => !names.has(name)) ||
    ![...names].some(
      (name) => name.startsWith("xl/worksheets/") && name.endsWith(".xml"),
    )
  )
    rejectSpreadsheet()
  if (
    [...names].some(
      (name) =>
        name.startsWith("xl/externalLinks/") ||
        name.startsWith("xl/embeddings/") ||
        /(?:^|\/)vbaProject(?:Signature)?\.bin$/i.test(name),
    )
  )
    rejectSpreadsheet()

  const { unzipSync } = await import("fflate")
  const entries = unzipSync(bytes)
  const contentTypes = decodeXml(entries, "[Content_Types].xml")
  if (
    !/spreadsheetml\.sheet\.main\+xml/i.test(contentTypes) ||
    /macroEnabled|vbaProject/i.test(contentTypes)
  )
    rejectSpreadsheet()

  for (const [name, content] of Object.entries(entries)) {
    if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue
    const xml = UTF8_DECODER.decode(content)
    if (/<!DOCTYPE|<!ENTITY|\bTargetMode\s*=\s*["']External["']/i.test(xml))
      rejectSpreadsheet()
    if (
      name.startsWith("xl/worksheets/") &&
      /<(?:[A-Za-z_][\w.-]*:)?f(?:\s|\/|>)/i.test(xml)
    )
      rejectSpreadsheet()
  }
}
