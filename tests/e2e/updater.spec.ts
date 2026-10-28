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

test("checks manually from the inline Settings version card", async ({
  page,
}) => {
  let requests = 0
  await page.route(endpoint, async (route) => {
    requests++
    await route.fulfill({ json: newerRelease })
  })
  await page.goto("/settings")
  const card = page.getByRole("region", { name: "Aplikasi", exact: true })
  await expect(
    card.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeEnabled()
  expect(requests).toBe(0)
  await card.getByRole("button", { name: "Lihat changelog" }).click()
  await expect(
    page.getByRole("dialog", { name: "Changelog aplikasi" }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  expect(requests).toBe(0)
  await card.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(card).toContainText("Tersedia " + newerTag)
  await expect(card).toContainText(newerRelease.body)
  expect(requests).toBe(1)
  await expect(
    card.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  await expect(card).toContainText("Cek lagi mulai")
  await page.reload()
  await expect(card).toContainText("Tersedia " + newerTag)
  await expect(
    card.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  expect(requests).toBe(1)
  await page.goto("/settings/about")
  await expect(page.getByRole("main")).toContainText("Tersedia " + newerTag)
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  expect(requests).toBe(1)
  await page.goto("/settings")
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
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeEnabled()
  expect(requests).toBe(0)

  await page.getByRole("button", { name: "Cek pembaruan" }).click()

  await expect(page.getByRole("status")).toContainText("Versi sudah terbaru")
  expect(requests).toBe(1)
  await expect(page.getByRole("main")).not.toContainText("Tersedia " + tag)
})

test("shows newer release notes after a manual update check", async ({
  page,
}) => {
  await page.route(endpoint, (route) => route.fulfill({ json: newerRelease }))
  await page.goto("/settings/about")

  await page.getByRole("button", { name: "Cek pembaruan" }).click()

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
  await page.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeEnabled()
  await page.unroute(endpoint)
  await page.route(endpoint, (route) => route.fulfill({ json: newerRelease }))

  await page.getByRole("button", { name: "Cek pembaruan" }).click()

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

  await page.getByRole("button", { name: "Cek pembaruan" }).click()

  await expect(page.getByRole("alert")).toBeVisible()
  await expect(page.getByRole("main")).not.toContainText("Tersedia " + newerTag)
})

test("clears an earlier update offer after a failed recheck", async ({
  page,
}) => {
  const checkedAt = new Date("2026-10-28T06:00:00Z")
  await page.clock.install({ time: checkedAt })
  await page.route(endpoint, (route) => route.fulfill({ json: newerRelease }))
  await page.goto("/settings")
  await page.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(page.getByRole("main")).toContainText("Tersedia " + newerTag)
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  await page.clock.fastForward(60 * 60 * 1000)
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeEnabled()
  await page.unroute(endpoint)
  let requests = 0
  await page.route(endpoint, (route) => {
    requests++
    return route.fulfill({
      status: 403,
      headers: {
        "x-ratelimit-remaining": "0",
        "access-control-expose-headers": "x-ratelimit-remaining",
      },
    })
  })
  await page.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(page.getByRole("alert")).toContainText(
    "Batas pemeriksaan GitHub",
  )
  await expect(page.getByRole("main")).not.toContainText("Tersedia " + newerTag)
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  await page.reload()
  await expect(page.getByRole("alert")).toContainText(
    "Batas pemeriksaan GitHub",
  )
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  expect(requests).toBe(1)
})

test("enables manual checking at expiry without a background request", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-28T06:00:00Z") })
  let requests = 0
  await page.route(endpoint, (route) => {
    requests++
    return route.fulfill({ status: 404 })
  })
  await page.goto("/settings/about")
  await page.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(page.getByRole("status")).toContainText("Versi sudah terbaru")
  await page.reload()
  await expect(page.getByRole("status")).toContainText("Versi sudah terbaru")
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()

  await page.clock.fastForward(60 * 60 * 1000 - 1000)

  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  await page.clock.fastForward(1000)
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeEnabled()
  await expect(page.locator("#update-cooldown")).toHaveCount(0)
  expect(requests).toBe(1)
  await page.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(
    page.getByRole("button", { name: "Cek pembaruan" }),
  ).toBeDisabled()
  expect(requests).toBe(2)
})

test("renders release HTML as text without executing it", async ({ page }) => {
  const body =
    '<img src="invalid" onerror="document.documentElement.dataset.executed = true">'
  await page.route(endpoint, (route) =>
    route.fulfill({ json: { ...newerRelease, body } }),
  )
  await page.goto("/settings/about")
  await page.getByRole("button", { name: "Cek pembaruan" }).click()
  await expect(page.getByRole("main")).toContainText(body)
  await expect(page.locator('img[src="invalid"]')).toHaveCount(0)
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-executed",
    "true",
  )
})
