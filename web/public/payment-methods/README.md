# Payment method logos

Place your logo images in this folder. The app loads them automatically.

| File | Used for |
|------|----------|
| `telebirr.png` (or `.jpg`) | Telebirr |
| `cbe.png` (or `.jpg`) | CBE |
| `cash.png` (or `.jpg`) | Cash |
| `bank.png`, `bank.jpg`, or `bank.svg` | Other bank |

**Recommended:** PNG or JPG, square, at least 64×64 px. The app loads **PNG first**, then **JPG**, then the **SVG** placeholder if needed.

**After adding or replacing images, restart the dev server** (`npm start`) so Angular picks up new files in `public/`.
