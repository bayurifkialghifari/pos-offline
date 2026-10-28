import { expect, test } from "@playwright/test"

for (const theme of ["light", "dark"] as const) {
  test(
    "keeps responsive Home order and backup last in the " + theme + " theme",
    async ({ page }) => {
      await page.goto("/settings")
      const toggle = page.getByRole("switch", { name: "Mode Gelap" })
      if (theme === "dark") await toggle.click()
      await page.goto("/")
      const main = page.getByRole("main")
      await expect(
        main.getByRole("heading", { name: "Tren penjualan" }),
      ).toBeVisible()
      await expect(page.locator("html")).toHaveClass(
        theme === "dark" ? /dark/ : /^(?!.*dark)/,
      )
      await expect(main).not.toContainText(
        "Usaha berjalan, data tetap di perangkat",
      )
      const tools = main.getByRole("navigation", { name: "Kelola toko" })
      const links = await tools.getByRole("link").allTextContents()
      expect(links.map((label) => label.trim()).slice(0, 2)).toEqual([
        "Produk",
        "Satuan produk",
      ])
      const sections = main.locator("section")
      await expect(sections.first()).toContainText(
        (page.viewportSize()?.width ?? 0) < 768
          ? "Ringkasan hari ini"
          : "Kelola toko",
      )
      await expect(sections.last()).toContainText("Cadangkan data")
      const backup = sections
        .last()
        .getByRole("link", { name: "Cadangkan data" })
      await expect(backup.locator("svg")).toHaveCount(2)
      await expect(
        main.getByRole("article", { name: "Penjualan hari ini" }),
      ).toContainText(/Rp\s*0/)
      expect(
        await main.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true)

      await tools
        .getByRole("link", { name: "Satuan produk", exact: true })
        .click()
      await expect(page).toHaveURL(/settings\/units$/)
      await expect(main).toContainText("Kilogram")
      await page.goto("/")
      await backup.click()
      await expect(page).toHaveURL(/settings\/backup$/)
      await expect(
        page.getByRole("button", { name: "Ekspor semua data" }),
      ).toBeVisible()
    },
  )
}
