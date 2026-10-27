# QRIS

## Behavior

Read static QRIS from local payload/image. Generate dynamic amount/CRC and QR code locally from authoritative checkout total. Cashier manually confirms settlement; the app does not contact a payment provider.

The parser validates TLV boundaries, mandatory merchant fields and the final UTF-8 CRC before accepting a payload. Dynamic generation replaces the initiation method and amount fields, preserves merchant data and regenerates the checksum. The requested-rupiah total remains authoritative even when the weighed quantity is rounded.

## Implementation

[QR image facade](../app/lib/qris.ts), [payload validation and generation](../app/lib/qris-payload.ts) and [payment dialog](../app/components/organisms/pos/PaymentDialog.vue).

## Acceptance checks

Configure a valid QRIS payload and verify the nominal total in the dynamic QR. Malformed QRIS shows an actionable error.

Unit tests verify exact amount replacement and reject corrupted checksums. A customer's banking application and actual merchant settlement require a separate live-payment check.
