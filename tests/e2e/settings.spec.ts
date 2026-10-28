import { expect, test } from "@playwright/test"
import { dismissActiveDialog } from "../../app/composables/useHardwareBack"
import packageInfo from "../../package.json" with { type: "json" }

test("shows the version after backup and opens a focus-trapped changelog", async ({
  page,
}) => {
  await page.goto("/settings")
  const main = page.getByRole("main")
  await expect(main.getByRole("link", { name: "Satuan produk" })).toHaveCount(0)
  const sections = main.locator("section")
  await expect(sections.nth((await sections.count()) - 2)).toContainText(
    "Cadangkan data",
  )
  await expect(sections.last()).toContainText("Versi " + packageInfo.version)
  await expect(sections.last().getByRole("status")).toHaveText(
    "Belum diperiksa",
  )
  await expect(
    main.getByRole("heading", { name: "Changed", exact: true }),
  ).toHaveCount(0)
  const opener = main.getByRole("button", { name: "Lihat changelog" })
  await opener.click()
  const dialog = page.getByRole("dialog", { name: "Changelog aplikasi" })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/settings$/)
  await expect(dialog).toContainText("Versi " + packageInfo.version)
  await expect(dialog.getByRole("list").first()).toBeVisible()
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press("Tab")
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  await opener.click()
  await dialog.getByRole("button", { name: "Tutup", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  await opener.click()
  expect(await page.evaluate(dismissActiveDialog)).toBe(true)
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test("keeps profile persistence and readable narrow phone identity", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.goto("/settings")
  const name = "Toko Sembako Padalarang Cabang Utama"
  await page.getByLabel("Nama Toko", { exact: true }).fill(name)
  await page
    .getByLabel("Pemilik", { exact: true })
    .fill("Pemilik Toko Padalarang")
  await page.getByRole("button", { name: "Simpan Profil" }).click()
  await page.reload()
  await expect(page.getByLabel("Nama Toko", { exact: true })).toHaveValue(name)
  await expect(
    page.getByRole("region", { name: "Identitas toko" }),
  ).toContainText(name)
  expect(
    await page
      .getByRole("main")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true)
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name)
  expect(
    await page
      .getByRole("main")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true)
})
