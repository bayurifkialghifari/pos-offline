import { crc16, isValidQris, makeDynamicPayload } from "@/lib/qris-payload"
import { describe, expect, it } from "vitest"

const body = "0002010102115204541153033605802ID5904TOKO6007BANDUNG6304"
const staticQr = body + crc16(body)

describe("offline dynamic QRIS", () => {
  it("sets one exact nominal and replaces it when reused", () => {
    expect(crc16("123456789")).toBe("29B1")
    expect(isValidQris(staticQr)).toBe(true)
    const dynamic = makeDynamicPayload(staticQr, 10000)
    expect(dynamic).toContain("010212")
    expect(dynamic).toContain("540510000")
    expect(isValidQris(dynamic)).toBe(true)
    const changed = makeDynamicPayload(dynamic, 25000)
    expect(changed).toContain("540525000")
    expect(changed).not.toContain("540510000")
    expect(isValidQris(changed)).toBe(true)
  })
  it("rejects corrupted checksums, malformed TLV and fractional rupiah", () => {
    expect(isValidQris(staticQr.slice(0, -4) + "0000")).toBe(false)
    expect(isValidQris("0002010102115802ID6304FFFF")).toBe(false)
    expect(isValidQris(staticQr + "000201")).toBe(false)
    for (const amount of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(() => makeDynamicPayload(staticQr, amount)).toThrow(/Nominal/)
  })
})
