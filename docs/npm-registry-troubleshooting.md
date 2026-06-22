# npm registry troubleshooting

If `npm install` fails with `403 Forbidden` for a public package such as `@eslint/js`, the source code is usually not the problem. The request is being blocked by the active network, proxy, npm registry mirror, or organization policy before npm can download dependencies.

## What to try locally

1. Confirm the registry points at npmjs:

   ```sh
   npm config get registry
   npm ping --registry=https://registry.npmjs.org/
   ```

2. Check whether proxy-related environment variables are forcing npm through a restricted proxy:

   ```sh
   env | sort | grep -Ei 'npm|proxy|registry'
   ```

3. If your organization requires an internal npm mirror, configure that approved registry instead of npmjs:

   ```sh
   npm config set registry https://your-approved-registry.example.com/
   npm install
   ```

4. If you are on GitHub Actions and only public packages are used, the included `Web CI` workflow uses `https://registry.npmjs.org/` and should work unless the runner or organization blocks npm registry traffic.

## Expected verification after dependencies install

Run these commands from the repository root:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```
