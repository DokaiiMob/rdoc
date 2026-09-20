'use strict';

/**
 * Optional manual check against GitHub Releases.
 * No electron-updater dependency; OFF unless settings.autoUpdateCheck is true.
 */

const https = require('https');

const REPO = 'DokaiiMob/rdoc';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`;

/**
 * @param {string} currentVersion
 * @returns {Promise<{ updateAvailable: boolean, latest: string, url: string, notes: string }>}
 */
function checkLatestRelease(currentVersion) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      RELEASES_API,
      {
        headers: {
          'User-Agent': `rdoc-desktop-reader/${currentVersion}`,
          Accept: 'application/vnd.github+json',
        },
        timeout: 12000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`GitHub API ${res.statusCode}`));
            return;
          }
          try {
            const json = JSON.parse(body);
            const tag = String(json.tag_name || '').replace(/^v/i, '');
            const latest = tag || String(json.name || '');
            const url =
              json.html_url || `https://github.com/${REPO}/releases/latest`;
            const notes = String(json.body || '').slice(0, 500);
            resolve({
              updateAvailable: Boolean(latest) && isNewer(latest, currentVersion),
              latest: latest || currentVersion,
              url,
              notes,
            });
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Update check timed out'));
    });
  });
}

function parseVer(v) {
  return String(v)
    .replace(/^v/i, '')
    .split(/[.-]/)
    .map((p) => {
      const n = parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

function isNewer(latest, current) {
  const a = parseVer(latest);
  const b = parseVer(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

module.exports = { checkLatestRelease, isNewer };
