# adertha-client
the react client app for the adertha project - the reunification

## Run

Needs JDK 21 and Node, with the `adertha` repo cloned next to this one.

```sh
npm install
npm run app          # dev: core from ../adertha source + UI, opened in an app window (Ctrl+C stops all)
npm run dist         # installer for the current OS → release/ (bundles core + trimmed Java runtime)
```

Pushing a `v*` tag builds Windows, macOS and Linux installers in CI and attaches them to a GitHub Release.
