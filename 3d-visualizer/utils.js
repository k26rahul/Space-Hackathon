export const axisToDimension = {
  x: 'width',
  y: 'height',
  z: 'depth',
};

export class ColorProvider {
  static colors = [
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x8800ff, 0x0088ff,
    0x88ff00, 0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xffaa00, 0xaa00ff,
    0x00aaff, 0xaaff00,
  ];

  constructor(colors = ColorProvider.colors) {
    this.colors = colors;
    this.index = 0;
  }

  getNextColor() {
    const color = this.colors[this.index];
    this.index = (this.index + 1) % this.colors.length;
    return color;
  }
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Data copied to clipboard!');
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
