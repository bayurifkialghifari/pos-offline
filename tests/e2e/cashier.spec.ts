import { expect, test, type Page } from "@playwright/test"

async function createRice(page: Page) {
  await page.goto("/products/new")
  await page.getByLabel("Nama Produk", { exact: false }).fill("Beras Premium")
  await page.getByLabel("Satuan jual").selectOption("unit-kg")
  await page.getByLabel("Harga Jual", { exact: false }).fill("15000")
  await page.getByRole("switch", { name: "Lacak Stok" }).click()
  await page.getByLabel("Jumlah Stok", { exact: false }).fill("10")
  await page.getByRole("button", { name: "Simpan Produk", exact: true }).click()
  await expect(page).toHaveURL(/products$/)
}

async function addNominal(page: Page, interruptSave = false) {
  await page.goto("/pos")
  await page.getByRole("button", { name: /Beras Premium/ }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Nominal rupiah" }).click()
  await dialog.getByLabel("Berapa rupiah?").fill("10000")
  await expect(dialog).toContainText("0,667 kg")
  if (interruptSave) {
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.transaction.db.name !== "jeepSqliteStore")
          return put.call(this, value, key)
        document.documentElement.dataset.cartSaveBlocked = "true"
        const keepActive = () => {
          const request = this.get("posofflineSQLite.db")
          request.onsuccess = keepActive
        }
        keepActive()
        return this.get("posofflineSQLite.db")
      }
    })
  }
  await dialog.getByRole("button", { name: "Tambah ke keranjang" }).click()
  await expect(dialog).toBeHidden()
  if (interruptSave)
    await expect(page.locator("html")).toHaveAttribute(
      "data-cart-save-blocked",
      "true",
    )
}

test("starts with local SQLite and makes no external startup requests", async ({
  page,
}) => {
  const failures: string[] = []
  const external: string[] = []
  page.on("pageerror", (error) => failures.push(error.message))
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname !== "127.0.0.1"
    )
      external.push(url.href)
  })
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Tren penjualan" }),
  ).toBeVisible()
  await page.goto("/settings/units")
  await expect(page.getByRole("main")).toContainText("Kilogram")
  expect(failures).toEqual([])
  expect(external).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test("charges exact nominal, restores a draft, holds and completes an Open Bill", async ({
  page,
}) => {
  await createRice(page)
  await addNominal(page, true)
  await page.reload()
  await page.getByRole("button", { name: /Lihat Keranjang/ }).click()
  let dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("0,667 kg")
  await dialog
    .getByRole("button", { name: "Tahan Pesanan", exact: true })
    .click()
  dialog = page.getByRole("dialog").filter({ hasText: "Label pesanan" })
  await dialog.getByLabel("Label pesanan").fill("Meja 4")
  await dialog
    .getByRole("button", { name: "Tahan Pesanan", exact: true })
    .click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await page
    .getByRole("button", { name: /Open Bill/ })
    .first()
    .click()
  dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("Meja 4")
  await dialog.getByRole("button", { name: /Lanjutkan/ }).click()
  dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: /Bayar/ }).click()
  dialog = page.getByRole("dialog").filter({ hasText: "Total Tagihan" })
  await dialog.getByRole("button", { name: "Uang pas" }).click()
  await dialog.getByRole("button", { name: "Selesaikan Pembayaran" }).click()
  await expect(page.getByTestId("success-overlay")).toContainText(
    "Transaksi Berhasil",
  )
  await expect(page.getByTestId("success-overlay")).toContainText("10.000")
  await page.goto("/products")
  await expect(page.getByRole("main")).toContainText("9,333 kg")
  await page.goto("/transactions")
  await page
    .getByRole("main")
    .getByRole("link")
    .filter({ hasText: "10.000" })
    .first()
    .click()
  await expect(page.getByRole("main")).toContainText("0,667 kg")
  await expect(page.getByRole("main")).toContainText("10.000")
  await page.goto("/")
  const summary = page.getByRole("article", { name: "Penjualan hari ini" })
  await expect(summary).toContainText(/Rp\s*10\.000/)
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    await expect(summary).toContainText("1 transaksi selesai")
    await expect(summary).toContainText(/Rata-rata\s*Rp\s*10\.000/)
  } else {
    await expect(
      page
        .getByRole("article")
        .filter({ has: page.getByText("Transaksi", { exact: true }) }),
    ).toContainText("1")
    await expect(
      page.getByRole("article").filter({ hasText: "Rata-rata" }),
    ).toContainText(/Rp\s*10\.000/)
  }
  const activity = page.getByRole("region", { name: "Aktivitas terbaru" })
  await expect(activity.getByRole("link").first()).toContainText("10.000")
  await expect(activity.getByRole("link").first()).toContainText("Selesai")
})

test("quantity dialog traps focus and returns focus on Escape", async ({
  page,
}) => {
  await createRice(page)
  await page.goto("/pos")
  const product = page.getByRole("button", { name: /Beras Premium/ })
  await product.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  for (let index = 0; index < 9; index++) {
    await page.keyboard.press("Tab")
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(product).toBeFocused()
})

test("exports a portable archive and cancellation or invalid import keeps the catalog", async ({
  page,
}) => {
  await createRice(page)
  await page.goto("/settings/backup")
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Ekspor semua data" }).click()
  const download = await downloadPromise
  const path = await download.path()
  if (!path) throw new TypeError("Backup download is missing")
  const picker = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Pilih file cadangan" }).click()
  await (await picker).setFiles(path)
  await expect(page.getByRole("dialog")).toContainText("Ganti data toko?")
  await page.getByRole("dialog").getByRole("button", { name: "Batal" }).click()
  const invalid = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Pilih file cadangan" }).click()
  await (
    await invalid
  ).setFiles({
    name: "invalid.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("invalid archive"),
  })
  await expect(page.getByRole("alert")).toBeVisible()
  await page.goto("/products")
  await expect(page.getByRole("main")).toContainText("Beras Premium")
  await expect(page.getByRole("main")).toContainText("10 kg")
})

test("restores products and custom units on another device and clears its cart", async ({
  page,
  browser,
  baseURL,
}) => {
  await createRice(page)
  await page.goto("/settings/units")
  await page.getByLabel("Nama", { exact: true }).fill("Gram")
  await page.getByLabel("Simbol", { exact: true }).fill("g")
  await page
    .getByRole("combobox", { name: "Jenis", exact: true })
    .selectOption("weight")
  await page.getByRole("button", { name: "Simpan satuan" }).click()
  await expect(page.getByRole("main")).toContainText("Gram")
  await page.goto("/settings/backup")
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Ekspor semua data" }).click()
  const path = await (await downloadPromise).path()
  if (!path) throw new TypeError("Backup download is missing")
  const target = await browser.newContext({ baseURL })
  try {
    const device = await target.newPage()
    await createRice(device)
    await addNominal(device)
    await device.reload()
    await expect(
      device.getByRole("button", { name: /Lihat Keranjang/ }),
    ).toBeVisible()
    await device.goto("/settings/backup")
    const picker = device.waitForEvent("filechooser")
    await device.getByRole("button", { name: "Pilih file cadangan" }).click()
    await (await picker).setFiles(path)
    await device
      .getByRole("dialog")
      .getByRole("button", { name: "Ganti semua data" })
      .click()
    await expect(device).toHaveURL(/\/$/)
    await expect(
      device.getByRole("heading", { name: "Tren penjualan" }),
    ).toBeVisible()
    await device.goto("/products")
    await expect(device.getByRole("main")).toContainText("Beras Premium")
    await expect(device.getByRole("main")).toContainText("10 kg")
    await device.goto("/pos")
    await expect(
      device.getByRole("button", { name: /Beras Premium/ }),
    ).toBeVisible()
    await expect(
      device.getByRole("button", { name: /Lihat Keranjang/ }),
    ).toHaveCount(0)
    await device.goto("/settings/units")
    await expect(device.getByRole("main")).toContainText("Gram")
    await device.reload()
    await expect(device.getByRole("main")).toContainText("Gram")
  } finally {
    await target.close()
  }
})
