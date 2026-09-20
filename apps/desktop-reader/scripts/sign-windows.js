'use strict';

/**
 * Windows Authenticode signing hook for electron-builder (OPTIONAL).
 *
 * Status: DEFERRED — do not fake or stub-sign builds.
 * This hook is NOT wired in package.json by default (signAndEditExecutable: false).
 *
 * When a real code-signing certificate is available:
 * 1. Set env CSC_LINK (path/URL to .pfx) and CSC_KEY_PASSWORD
 *    (or WIN_CSC_LINK / WIN_CSC_KEY_PASSWORD).
 * 2. In package.json build.win:
 *      - "signAndEditExecutable": true
 *      - "sign": "./scripts/sign-windows.js"
 *    Or omit "sign" and use electron-builder's built-in signtool integration.
 * 3. Prefer EV/OV Authenticode certs trusted by SmartScreen.
 *
 * @param {object} configuration electron-builder custom Windows sign config
 */
exports.default = async function signWindows(configuration) {
  const hasCert =
    process.env.CSC_LINK ||
    process.env.WIN_CSC_LINK ||
    process.env.CSC_KEY_PASSWORD ||
    process.env.WIN_CSC_KEY_PASSWORD;

  if (!hasCert) {
    throw new Error(
      'Windows code signing is deferred. Set CSC_LINK / CSC_KEY_PASSWORD ' +
        '(real Authenticode cert) or remove the sign hook. Do not fake signing.',
    );
  }

  // Prefer electron-builder stock signing once credentials exist:
  // remove this file from build.win.sign and let CSC_* drive signtool.
  void configuration;
  throw new Error(
    'Credentials detected, but custom sign hook is a stub. ' +
      'Remove build.win.sign and use electron-builder built-in signing with CSC_LINK.',
  );
};
