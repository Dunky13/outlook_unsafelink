import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { crc32, inflateSync } from 'node:zlib';
import manifest from '../manifest.json' with { type: 'json' };

for (const [size, path] of Object.entries(manifest.icons)) {
  test(`${path} is a valid PNG at its declared size`, async () => {
    const bytes = await readFile(new URL(`../${path}`, import.meta.url));
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
    assert.equal(bytes.readUInt32BE(16), Number(size));
    assert.equal(bytes.readUInt32BE(20), Number(size));
    const depth = bytes[24];
    const colour = bytes[25];
    const imageData = [];
    let offset = 8;
    let ended = false;
    while (offset < bytes.length) {
      const length = bytes.readUInt32BE(offset);
      const end = offset + 12 + length;
      assert.ok(end <= bytes.length, 'Chunk must fit inside the file');
      const type = bytes.toString('ascii', offset + 4, offset + 8);
      const data = bytes.subarray(offset + 8, end - 4);
      assert.equal(bytes.readUInt32BE(end - 4), crc32(bytes.subarray(offset + 4, end - 4)), `${type} CRC must be valid`);
      if (type === 'bKGD') {
        // PNG specifies six bytes for truecolour backgrounds, including RGBA.
        const lengths = { 0: 2, 2: 6, 3: 1, 4: 2, 6: 6 };
        assert.equal(data.length, lengths[colour], `bKGD length must match colour type ${colour}`);
      }
      if (type === 'IDAT') imageData.push(data);
      if (type === 'IEND') ended = true;
      offset = end;
    }
    assert.ok(ended, 'PNG must contain IEND');
    const scanlines = inflateSync(Buffer.concat(imageData));
    assert.ok(scanlines.length > 0, 'Image data must decompress');
    if (bytes[28] === 0) {
      const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
      const rowLength = 1 + Math.ceil(Number(size) * channels[colour] * depth / 8);
      assert.equal(scanlines.length, Number(size) * rowLength);
    }
  });
}
