import { BackupService, inspectBackup } from "@/services/backup/backup.service"
import { readRecovery } from "@/services/backup/recovery"
import { CheckoutService } from "@/services/checkout.service"
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { database, nominalLine, rice } from "./database"
describe("portable backup", () => {
  it("moves historical snapshots, Open Bills and media while preserving local credentials", async () => {
    const source = await database(),
      target = await database()
    try {
      const product = await rice(source.db)
      await source.db.run(
        "INSERT INTO settings VALUES ('store_name','Toko Beras',1)",
      )
      await source.db.run(
        "INSERT INTO settings VALUES ('pin_hash','source-secret',1)",
      )
      await target.db.run(
        "INSERT INTO settings VALUES ('pin_hash','target-secret',1)",
      )
      await target.db.run(
        "INSERT INTO settings VALUES ('device_id','device-two',1)",
      )
      await source.db.run(
        "INSERT INTO media (id,mime,data,created_at,updated_at) VALUES ('picture','image/png',?,1,1)",
        [
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw7kAAAAASUVORK5CYII=",
        ],
      )
      await source.db.run(
        "UPDATE products SET image_path='media://picture' WHERE id=?",
        [product.id],
      )
      const held = await new CheckoutService(source.db).hold({
        lines: [nominalLine(product.id)],
        deviceId: "device-one",
        devicePrefix: "ONE",
      })
      const bytes = await new BackupService(source.db).export()
      const validated = await inspectBackup(bytes)
      expect(
        validated.manifest.tables.settings.some(
          (s) => s.key.toString() === "pin_hash",
        ),
      ).toBe(false)
      await new BackupService(target.db).replace(validated)
      expect(
        (
          await target.db.query<{ value: string }>(
            "SELECT value FROM settings WHERE key='pin_hash'",
          )
        )[0]?.value,
      ).toBe("target-secret")
      expect(
        (await target.db.query<{ data: string }>("SELECT data FROM media"))[0]
          ?.data,
      ).toContain("iVBOR")
      expect(
        (
          await new CheckoutService(target.db).resume({
            saleId: held.sale.id,
            deviceId: "device-two",
          })
        ).items[0]?.line_total,
      ).toBe(10000)
      expect(await readRecovery()).toBeInstanceOf(Uint8Array)
    } finally {
      source.close()
      target.close()
    }
  })
  it("rejects invalid references and traversal before replacement", async () => {
    const { db, close } = await database()
    try {
      await rice(db)
      const archive = await new BackupService(db).export(),
        files = unzipSync(archive),
        raw = files["manifest.json"]
      if (!raw) throw new TypeError("Missing fixture manifest")
      const manifest = JSON.parse(strFromU8(raw))
      manifest.tables.products[0].unit_id = "missing"
      files["manifest.json"] = strToU8(JSON.stringify(manifest))
      await expect(inspectBackup(zipSync(files))).rejects.toThrow(/Referensi/)
      await expect(
        inspectBackup(zipSync({ "../secret": strToU8("bad"), ...files })),
      ).rejects.toThrow(/jalur/)
      expect(await db.query("SELECT * FROM products")).toHaveLength(1)
    } finally {
      close()
    }
  })
  it("rejects duplicate ZIP entries even when a decoder would overwrite them", async () => {
    const { db, close } = await database()
    try {
      await rice(db)
      const files = unzipSync(await new BackupService(db).export())
      const raw = files["manifest.json"]
      if (!raw) throw new TypeError("Missing fixture manifest")
      const archive = zipSync({
        "manifest.json": raw,
        "manifest.copy": raw,
      })
      const previous = strToU8("manifest.copy")
      const duplicate = strToU8("manifest.json")
      for (
        let offset = 0;
        offset <= archive.length - previous.length;
        offset++
      ) {
        if (previous.every((byte, index) => archive[offset + index] === byte))
          archive.set(duplicate, offset)
      }
      await expect(inspectBackup(archive)).rejects.toThrow(/duplikat/)
      expect(await db.query("SELECT * FROM products")).toHaveLength(1)
    } finally {
      close()
    }
  })
  it("rejects altered photo bytes using the recorded checksum", async () => {
    const { db, close } = await database()
    try {
      await db.run(
        "INSERT INTO media (id,mime,data,created_at,updated_at) VALUES ('picture','image/png',?,1,1)",
        [
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw7kAAAAASUVORK5CYII=",
        ],
      )
      const files = unzipSync(await new BackupService(db).export())
      const photo = files["media/picture.bin"]
      if (!photo) throw new TypeError("Missing fixture photo")
      photo[photo.length - 1] = 0
      await expect(inspectBackup(zipSync(files))).rejects.toThrow(/Checksum/)
      expect(await db.query("SELECT * FROM media")).toHaveLength(1)
    } finally {
      close()
    }
  })
  it("rolls back replacement when a real SQL write fails", async () => {
    const source = await database(),
      target = await database()
    try {
      await rice(source.db)
      await target.db.run(
        "INSERT INTO settings VALUES ('store_name','Existing store',1)",
      )
      const backup = await inspectBackup(
        await new BackupService(source.db).export(),
      )
      await target.db.execute(
        "CREATE TRIGGER reject_import BEFORE INSERT ON products BEGIN SELECT RAISE(ABORT,'write failed'); END;",
      )
      await expect(
        new BackupService(target.db).replace(backup),
      ).rejects.toThrow(/write failed/)
      expect(
        (
          await target.db.query<{ value: string }>(
            "SELECT value FROM settings WHERE key='store_name'",
          )
        )[0]?.value,
      ).toBe("Existing store")
      expect(await target.db.query("SELECT * FROM units")).toHaveLength(3)
    } finally {
      source.close()
      target.close()
    }
  })
})
