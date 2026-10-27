import { readTabular } from "@/lib/xlsx"
import { describe, expect, it } from "vitest"

describe("spreadsheet boundary", () => {
  it("preserves UTF-8, quoted commas, newlines and escaped quotes", async () => {
    const csv =
      '\uFEFFnama,harga_jual\r\n"Beras, premium",15000\r\n"Minyak\n""lokal""",18000'
    expect(await readTabular(new Blob([csv]), true)).toEqual([
      { nama: "Beras, premium", harga_jual: "15000" },
      { nama: 'Minyak\n"lokal"', harga_jual: "18000" },
    ])
  })
  it.each([
    'nama,harga\n"unfinished,1000',
    'nama,harga\n"quoted"suffix,1000',
    "nama,harga\n =SUM(A1),1000",
    "nama,harga\n@command,1000",
  ])("rejects malformed or executable CSV: %s", async (csv) => {
    await expect(readTabular(new Blob([csv]), true)).rejects.toThrow(
      /spreadsheet/,
    )
  })
  it("rejects files over the byte limit and invalid XLSX containers", async () => {
    await expect(
      readTabular(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), true),
    ).rejects.toThrow(/spreadsheet/)
    await expect(
      readTabular(new Blob(["not a workbook"]), false),
    ).rejects.toThrow(/spreadsheet/)
  })
})
