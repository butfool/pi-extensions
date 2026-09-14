# @tifan/pi-btw

Ask Pi a private side question without adding it to the session.

## Install

```bash
pi install npm:@tifan/pi-btw
```

## Usage

Run `/btw <question>` while Pi is idle or working:

```text
/btw what does this error mean?
```

`pi-btw` opens a new Herdr pane to the right and runs a temporary no-tools Pi process with a snapshot of the current session context. The pane keeps the answer separate from the main session and does not take focus.

This is not a child session or a branch. It has no persisted session, tools, extensions, skills, or project context. You can ask follow-up questions, but `/fork`, `/branch`, `/compact`, and file operations cannot act on the parent session. Close the Herdr pane when you are done.

The process uses the current model and thinking level. It sees the committed current branch, including Pi's normal compaction state. Partial text from an active response may not be available yet.

`pi-btw` requires Pi's interactive TUI mode and Herdr.

## License

[MIT](https://github.com/tifandotme/pi-extensions/blob/master/LICENSE)
