# Spreadsheet IO

## Behavior

Preview/import product XLSX/CSV with unit symbols; missing satuan defaults to pcs. Integer rupiah and displayed stock conversion, unknown/inactive-unit rejection. Export product/transaction/item/cashflow sheets with snapshot unit/base/mode/total fields. CSV formula-like text is escaped.

## Implementation

[app/services/products/productIo.ts](../app/services/products/productIo.ts).

## Acceptance checks

Import 1.5 kg and store 1500g. Reject invalid price/unknown unit. Export requested nominal and its base quantity/unit factor.
