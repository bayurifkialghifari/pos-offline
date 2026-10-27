import { rejectSpreadsheet } from "./spreadsheet-guards"
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  let afterQuote = false

  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index++
        } else {
          quoted = false
          afterQuote = true
        }
      } else {
        cell += character
      }
      continue
    }
    if (
      afterQuote &&
      character !== "," &&
      character !== "\r" &&
      character !== "\n"
    )
      rejectSpreadsheet()
    if (character === '"') {
      if (cell) rejectSpreadsheet()
      quoted = true
      afterQuote = false
    } else if (character === ",") {
      row.push(cell)
      cell = ""
      afterQuote = false
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      afterQuote = false
    } else {
      cell += character
    }
  }
  if (quoted) rejectSpreadsheet()
  if (cell || row.length || afterQuote) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}
