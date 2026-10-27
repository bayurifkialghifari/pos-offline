import { expect, test } from "@playwright/test"
import packageInfo from "../../package.json" with { type: "json" }

test("opens About from the bottom of settings, traps focus and restores it", async ({
  page,
}) => {
  await page.goto("/settings")
  const main = page.getByRole("main")
  await expect(main.getByRole("link", { name: "Satuan produk" })).toHaveCount(0)
  await expect(main.locator("section").last()).toContainText("Cadangkan data")
  const opener = main.getByRole("button", { name: /Tentang aplikasi/ })
  await opener.click()
  const dialog = page.getByRole("dialog", { name: "Tentang aplikasi" })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/settings$/)
  await expect(dialog).toContainText("Versi " + packageInfo.version)
  await expect(dialog).toContainText("Changelog bawaan")
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
})
