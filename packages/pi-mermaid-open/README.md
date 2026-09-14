# @tifan/pi-mermaid-open

Find Mermaid diagrams that Pi left unrendered and show one in a terminal image viewer.

<video controls muted loop playsinline width="960">
  <source
    src="https://raw.githubusercontent.com/tifandotme/pi-extensions/refs/heads/master/packages/pi-mermaid-open/assets/demo.mp4"
    type="video/mp4"
  />
</video>

![Mermaid diagram viewer demo](https://raw.githubusercontent.com/tifandotme/pi-extensions/refs/heads/master/packages/pi-mermaid-open/assets/demo.webp)

## How it works

- Scans assistant messages in the current branch for ` ```mermaid ` and ` ```mmd ` fences.
- Hides diagrams that Pi already rendered and labels skipped diagrams by reason.
- Renders diagrams as 4x PNGs with `@mermaid-js/mermaid-cli`.
- Uses a non-blocking Herdr overlay with Kitty graphics when available.
- Uses Pi's image viewer in other TUI sessions.
- Saves PNGs under `<agent-dir>/artifacts/mermaid/` outside TUI mode.
- In Herdr, use `+`/`=` and `-` to zoom, `h`/`j`/`k`/`l` or the arrow keys to pan, `0` to reset, and Enter or Escape to close.

## Install

```bash
pi install npm:@tifan/pi-mermaid-open
```

## Requirements

- Bun is optional. The extension uses `bunx -y @mermaid-js/mermaid-cli` when Bun is available and falls back to `npx -y @mermaid-js/mermaid-cli`.
- Herdr with Kitty graphics support is optional. In a compatible Herdr TUI session, `/mermaid-open` automatically links the bundled Herdr plugin, so you do not need to install it separately. Other TUI sessions use Pi's image viewer.
- Network access on first use unless Mermaid CLI is already cached.
- A Chromium browser available to Puppeteer. The extension skips Puppeteer's automatic browser download, so Puppeteer must find an existing cache or configured browser executable.

## Commands

- `/mermaid-open`: Pick a Mermaid diagram from recent assistant messages, render it, and open the PNG.

## Release notes

See [CHANGELOG.md](https://github.com/tifandotme/pi-extensions/blob/master/packages/pi-mermaid-open/CHANGELOG.md)

## License

[MIT](https://github.com/tifandotme/pi-extensions/blob/master/LICENSE)
