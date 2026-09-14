---
name: readme-assets
description: Standardizes README media assets for packages that must render on GitHub, npm, and pi.dev. Use when adding, converting, optimizing, moving, or linking README assets, screenshots, GIFs, videos, diagrams, or images in Markdown package docs.
---

# README Assets

## Defaults

- Use WebP for screenshots and static README images.
- Use animated WebP for short, silent demos when broad inline-image support matters. Use GIF only as a fallback.
- Use H.264 MP4 when smooth, full-fidelity video matters. Treat HTML `<video>` as progressive enhancement and include a direct fallback link.
- Do not rely on MOV files or GitHub user-attachment URLs. pi.dev may render video HTML as a link or reject it.
- Store package media under `packages/<package>/assets/`.
- Use absolute raw GitHub URLs, not relative paths, so images render on GitHub, npm, and pi.dev.
- Use descriptive alt text.

## URL format

```md
![Describe the image](https://raw.githubusercontent.com/tifandotme/pi-extensions/refs/heads/master/packages/<package>/assets/<image>.webp)
```

For video, add both the progressive-enhancement embed and a visible fallback:

```html
<video controls muted loop playsinline width="960">
  <source
    src="https://raw.githubusercontent.com/tifandotme/pi-extensions/refs/heads/master/packages/PACKAGE/assets/DEMO.mp4"
    type="video/mp4"
  />
</video>

[Open the demo
video](https://raw.githubusercontent.com/tifandotme/pi-extensions/refs/heads/master/packages/PACKAGE/assets/DEMO.mp4)
```

## Workflow

1. Put source media in a temporary location and output media in the package `assets/` directory.
2. Convert PNG/JPEG screenshots to `.webp` with `cwebp` when available.
3. Convert short MOV/MP4 demos to animated `.webp` with `ffmpeg` and `img2webp`, or to H.264 `.mp4` when 30 fps and readable motion matter. Omit audio unless it is part of the demo.
4. For MP4, add a `<video controls>` element with a raw GitHub source and a separate direct-link fallback.
5. Update README image links to the raw GitHub URL format above.
6. Remove temporary or superseded media files only when the README no longer references them.
7. Verify no stale media references remain:

```bash
rg -n "assets/.*\.(gif|jpe?g|mp4|mov|png|webp)|images/|\.(gif|jpe?g|mp4|mov|png|webp)" README.md packages/*/README.md
```

## Optimization

- Prefer the default `cwebp` output first. It is usually enough for terminal or UI screenshots.
- If files remain large, try `cwebp -m 6 -q 75 input.png -o output.webp` and compare visual quality before replacing.
- Do not over-optimize small screenshots for marginal savings.

## Compatibility notes

- GitHub READMEs support relative paths, but npm and pi.dev may not preserve the same repository context.
- Raw GitHub URLs are the safest shared format across GitHub, npm, and pi.dev.
- Animated WebP and GIF render through normal image markup. HTML video support varies, so always keep the MP4 link visible.
