import { expect, test } from "@playwright/test"
import packageInfo from "../../package.json" with { type: "json" }

const endpoint =
  "https://api.github.com/repos/bayurifkialghifari/pos-offline/releases/latest"
const newerTag =
  "v" +
  packageInfo.version.replace(/\d+$/, (patch) => String(Number(patch) + 1))
const newerRelease = {
  tag_name: newerTag,
  draft: false,
  prerelease: false,
  body: "Release notes from the update test fixture.",
  html_url: `https://github.com/bayurifkialghifari/pos-offline/releases/tag/${newerTag}`,
  assets: [
    {
      name: `pos-offline-${newerTag}.apk`,
      size: 1024,
      browser_download_url: `https://github.com/bayurifkialghifari/pos-offline/releases/download/${newerTag}/pos-offline-${newerTag}.apk`,
    },
    {
      name: "SHA256SUMS.txt",
      size: 200,
      browser_download_url: `https://github.com/bayurifkialghifari/pos-offline/releases/download/${newerTag}/SHA256SUMS.txt`,
    },
  ],
} as const

test("checks manually inside the settings About dialog", async ({ page }) => {
  let requests = 0
  await page.route(endpoint, async (route) => {
    requests++
    await route.fulfill({ json: newerRelease })
  })
  await page.goto("/settings")
  await page.getByRole("button", { name: /Tentang aplikasi/ }).click()
  const dialog = page.getByRole("dialog", { name: "Tentang aplikasi" })
  await expect(
    dialog.getByRole("button", { name: "Periksa pembaruan" }),
  ).toBeEnabled()
  expect(requests).toBe(0)
  await dialog.getByRole("button", { name: "Periksa pembaruan" }).click()
  await expect(dialog).toContainText("Tersedia " + newerTag)
  await expect(dialog).toContainText(newerRelease.body)
  expect(requests).toBe(1)
  await expect(page).toHaveURL(/settings$/)
})

test("checks only on request and does not offer the installed version", async ({
  page,
}) => {
  let requests = 0
  const tag = "v" + packageInfo.version
  await page.route(endpoint, async (route) => {
    requests++
    await route.fulfill({
      json: {
        ...newerRelease,
        tag_name: tag,
        assets: newerRelease.assets.map((asset) => ({
          ...asset,
          name: asset.name.replace(newerTag, tag),
          browser_download_url: asset.browser_download_url.replaceAll(
            newerTag,
            tag,
          ),
        })),
      },
    })
  })
  await page.goto("/settings/about")
  await expect(
    page.getByRole("button", { name: "Periksa pembaruan" }),
  ).toBeEnabled()
  expect(requests).toBe(0)

  await page.getByRole("button", { name: "Periksa pembaruan" }).click()

  await expect(page.getByRole("status")).toContainText(
    "Belum ada versi lebih baru",
  )
  expect(requests).toBe(1)
  await expect(page.getByRole("main")).not.toContainText("Tersedia " + tag)
})

test("shows newer release notes after a manual update check", async ({
  page,
}) => {
  await page.route(endpoint, (route) => route.fulfill({ json: newerRelease }))
  await page.goto("/settings/about")

  await page.getByRole("button", { name: "Periksa pembaruan" }).click()

  await expect(page.getByRole("main")).toContainText("Tersedia " + newerTag)
  await expect(page.getByRole("main")).toContainText(newerRelease.body)
  await expect(
    page.getByRole("button", { name: "Unduh & pasang" }),
  ).toHaveCount(0)
})

test("allows another manual check after an offline failure", async ({
  page,
}) => {
  await page.route(endpoint, (route) => route.abort("internetdisconnected"))
  await page.goto("/settings/about")
  await page.getByRole("button", { name: "Periksa pembaruan" }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Periksa pembaruan" }),
  ).toBeEnabled()
  await page.unroute(endpoint)
  await page.route(endpoint, (route) => route.fulfill({ json: newerRelease }))

  await page.getByRole("button", { name: "Periksa pembaruan" }).click()

  await expect(page.getByRole("alert")).toHaveCount(0)
  await expect(page.getByRole("main")).toContainText("Tersedia " + newerTag)
})

test("rejects a release whose assets are outside the configured repository", async ({
  page,
}) => {
  await page.route(endpoint, (route) =>
    route.fulfill({
      json: {
        ...newerRelease,
        assets: newerRelease.assets.map((asset) => ({
          ...asset,
          browser_download_url: asset.browser_download_url.replace(
            "bayurifkialghifari/pos-offline",
            "other/repo",
          ),
        })),
      },
    }),
  )
  await page.goto("/settings/about")

  await page.getByRole("button", { name: "Periksa pembaruan" }).click()

  await expect(page.getByRole("alert")).toBeVisible()
  await expect(page.getByRole("main")).not.toContainText("Tersedia " + newerTag)
})
