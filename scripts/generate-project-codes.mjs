import { mkdir, writeFile } from "node:fs/promises"
import assert from "node:assert/strict"
import { qrPng, barcodePng, decodeAny } from "barqrcode"

// Generate once rather than shipping WASM to every arcade visitor.
const destination = new URL("../public/projects/", import.meta.url)
const packageUrl = "https://www.npmjs.com/package/barqrcode"
const barcodeValue = "BARQRCODE"
const qr = await qrPng(packageUrl, {
  size: 256,
  sizeMode: "fit",
  margin: 2,
  ecc: "M",
})
const barcode = await barcodePng(barcodeValue, {
  format: "code128",
  moduleWidth: 3,
  height: 80,
  quiet: 10,
})

assert.equal(await decodeAny(qr), packageUrl)
assert.equal(await decodeAny(barcode), barcodeValue)
await mkdir(destination, { recursive: true })
await writeFile(new URL("barqrcode-qr.png", destination), qr)
await writeFile(new URL("barqrcode-barcode.png", destination), barcode)
console.log("Generated and decoded QR → npm; Code 128 → BARQRCODE.")
