import { expect, test } from "@playwright/test"

test("a manual expense reduces the cash counted when closing a session", async ({
  page,
}) => {
  await page.goto("/cashier")
  await page.getByLabel("Modal awal (uang di laci)").fill("50000")
  await page.getByRole("button", { name: "Buka Kasir", exact: true }).click()
  await expect(page.getByRole("main")).toContainText("Kasir Terbuka")

  await page.goto("/cashflow")
  await page.getByRole("main").locator("button.fixed").click()
  await page.getByLabel("Nominal", { exact: true }).fill("5000")
  await page.getByLabel("Catatan (opsional)").fill("Cash drawer expense")
  await page.getByRole("button", { name: "Simpan", exact: true }).click()
  await expect(page.getByRole("main")).toContainText("Cash drawer expense")
  await page.reload()
  await expect(page.getByRole("main")).toContainText("Cash drawer expense")

  await page.goto("/cashier")
  await page.getByRole("button", { name: "Tutup Kasir", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Uang aktual dihitung")).toHaveValue("45.000")
  await dialog.getByRole("button", { name: "Tutup Sesi", exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByRole("main")).toContainText("45.000")
  await expect(page.getByRole("main")).toContainText("Pas")
})
