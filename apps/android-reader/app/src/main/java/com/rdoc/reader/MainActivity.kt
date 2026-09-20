package com.rdoc.reader

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.appbar.MaterialToolbar
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    private val openDocument = registerForActivityResult(
        object : ActivityResultContracts.OpenDocument() {
            override fun createIntent(context: Context, input: Array<String>): Intent {
                return super.createIntent(context, input).apply {
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
                }
            }
        }
    ) { uri: Uri? ->
        if (uri != null) loadFromUri(uri, takePersistable = true)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.subtitle = getString(R.string.app_subtitle)

        webView = findViewById(R.id.webview)
        applySystemBarInsets(toolbar)
        configureWebView(webView)
        installPredictiveBack()
        showWelcome()

        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_OPEN, 0, R.string.menu_open)
            .setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS)
        menu.add(0, MENU_RECENT, 1, R.string.menu_recent)
            .setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM)
        menu.add(0, MENU_ABOUT, 2, R.string.menu_about)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            MENU_OPEN -> {
                launchOpenPicker()
                return true
            }
            MENU_RECENT -> {
                showRecentPicker()
                return true
            }
            MENU_ABOUT -> {
                startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.about_url)))
                )
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    private fun launchOpenPicker() {
        openDocument.launch(
            arrayOf(
                "*/*",
                "text/html",
                "application/vnd.rdoc+html",
                "application/rdoc+html",
                "text/plain",
                "application/octet-stream"
            )
        )
    }

    private fun applySystemBarInsets(toolbar: MaterialToolbar) {
        val root = findViewById<View>(R.id.root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            toolbar.setPadding(bars.left, bars.top, bars.right, toolbar.paddingBottom)
            v.setPadding(0, 0, 0, bars.bottom)
            // Keep left/right on toolbar; WebView full-bleed horizontally under cutouts via toolbar pad.
            WindowInsetsCompat.CONSUMED
        }
    }

    private fun installPredictiveBack() {
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        )
    }

    private fun configureWebView(wv: WebView) {
        val settings = wv.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        wv.webChromeClient = WebChromeClient()
        wv.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return false
                val url = uri.toString()
                when {
                    url.startsWith("rdoc-action://open") -> {
                        launchOpenPicker()
                        return true
                    }
                    url.startsWith("rdoc-action://recent") -> {
                        showRecentPicker()
                        return true
                    }
                    url.startsWith("http://") || url.startsWith("https://") -> {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                        return true
                    }
                    url.startsWith("about:") || url.startsWith("data:") || url.startsWith("#") -> {
                        return false
                    }
                }
                return true
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return
        when (intent.action) {
            Intent.ACTION_VIEW -> {
                intent.data?.let { loadFromUri(it, takePersistable = true) }
            }
            Intent.ACTION_SEND -> {
                streamUriFromSend(intent)?.let { loadFromUri(it, takePersistable = true) }
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                streamUrisFromSendMultiple(intent).firstOrNull()?.let {
                    loadFromUri(it, takePersistable = true)
                }
            }
        }
    }

    private fun streamUriFromSend(intent: Intent): Uri? {
        val clip = intent.clipData
        if (clip != null && clip.itemCount > 0) {
            clip.getItemAt(0).uri?.let { return it }
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(Intent.EXTRA_STREAM)
        }
    }

    private fun streamUrisFromSendMultiple(intent: Intent): List<Uri> {
        val list = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)
        }
        return list?.filterNotNull().orEmpty()
    }

    private fun loadFromUri(uri: Uri, takePersistable: Boolean) {
        if (takePersistable) {
            tryTakePersistableRead(uri)
        }

        if (!canReadUri(uri)) {
            Toast.makeText(this, R.string.err_permission, Toast.LENGTH_LONG).show()
            return
        }

        val html = readUriAsUtf8(uri) ?: return
        val title = extractTitle(html) ?: getString(R.string.app_name)
        supportActionBar?.title = title
        RecentStore.remember(this, uri, title)
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
    }

    private fun tryTakePersistableRead(uri: Uri) {
        try {
            contentResolver.takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
        } catch (_: SecurityException) {
            // VIEW/SEND grants are often temporary; SAF OpenDocument persistable works when offered.
        }
    }

    private fun canReadUri(uri: Uri): Boolean {
        val persisted = contentResolver.persistedUriPermissions.any {
            it.uri == uri && it.isReadPermission
        }
        if (persisted) return true
        return try {
            contentResolver.openInputStream(uri)?.use { true } ?: false
        } catch (_: SecurityException) {
            false
        } catch (_: Exception) {
            false
        }
    }

    private fun showRecentPicker() {
        val items = RecentStore.load(this)
        if (items.isEmpty()) {
            Toast.makeText(this, R.string.recent_empty, Toast.LENGTH_SHORT).show()
            return
        }
        val labels = items.map { it.first }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle(R.string.menu_recent)
            .setItems(labels) { _, which ->
                val uri = Uri.parse(items[which].second)
                if (!canReadUri(uri)) {
                    Toast.makeText(this, R.string.err_permission_reopen, Toast.LENGTH_LONG).show()
                    return@setItems
                }
                loadFromUri(uri, takePersistable = false)
            }
            .setNeutralButton(R.string.recent_clear) { _, _ ->
                RecentStore.clear(this)
                Toast.makeText(this, R.string.recent_cleared, Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun readUriAsUtf8(uri: Uri): String? {
        return try {
            contentResolver.openInputStream(uri)?.use { input ->
                BufferedReader(InputStreamReader(input, StandardCharsets.UTF_8)).use { it.readText() }
            }
        } catch (e: Exception) {
            Toast.makeText(this, e.message ?: getString(R.string.err_read), Toast.LENGTH_LONG).show()
            null
        }
    }

    private fun extractTitle(html: String): String? {
        val titleRe = Regex("<title[^>]*>([^<]*)</title>", RegexOption.IGNORE_CASE)
        titleRe.find(html)?.groupValues?.getOrNull(1)?.trim()?.takeIf { it.isNotEmpty() }?.let {
            return it
        }
        val manRe = Regex(
            "<script[^>]*type=[\"']application/rdoc\\+json[\"'][^>]*>([\\s\\S]*?)</script>",
            RegexOption.IGNORE_CASE
        )
        val body = manRe.find(html)?.groupValues?.getOrNull(1) ?: return null
        val titleField = Regex("\"title\"\\s*:\\s*\"([^\"]+)\"").find(body)?.groupValues?.getOrNull(1)
        return titleField?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun showWelcome() {
        val html = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
              <title>rdoc Reader</title>
              <style>
                :root {
                  color-scheme: light dark;
                  --cream: #f7fff9;
                  --paper: #eef6f1;
                  --ink: #1a262f;
                  --muted: #4a6358;
                  --accent: #0b6e4f;
                  --mint: #7bc68e;
                  --lh: 1.65;
                }
                @media (prefers-color-scheme: dark) {
                  :root {
                    --cream: #0f1a15;
                    --paper: #15231c;
                    --ink: #e8f5ee;
                    --muted: #9bb5a6;
                  }
                }
                * { box-sizing: border-box; }
                body {
                  margin: 0;
                  min-height: 100vh;
                  display: grid;
                  place-items: center;
                  font-family: "Roboto", system-ui, sans-serif;
                  color: var(--ink);
                  background:
                    radial-gradient(700px 380px at 10% -10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%),
                    linear-gradient(168deg, var(--cream), var(--paper));
                  padding: 2rem 1.35rem 2.5rem;
                }
                main {
                  width: min(100%, 22.5rem);
                  text-align: center;
                }
                .mark {
                  width: 72px; height: 72px; margin: 0 auto 1.1rem;
                  border-radius: 18px;
                  box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 22%, transparent);
                }
                h1 {
                  margin: 0;
                  font-family: Georgia, "Noto Serif", serif;
                  font-size: 2rem;
                  font-weight: 700;
                  letter-spacing: -0.03em;
                  color: var(--accent);
                  line-height: 1.15;
                }
                .lede {
                  margin: 0.7rem 0 0;
                  font-size: 1.05rem;
                  line-height: var(--lh);
                  color: var(--ink);
                }
                p {
                  margin: 0.65rem 0 0;
                  font-size: 0.98rem;
                  line-height: var(--lh);
                  color: var(--muted);
                }
                .actions {
                  display: grid;
                  gap: 0.65rem;
                  margin-top: 1.6rem;
                }
                a.cta {
                  display: block;
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 1rem;
                  padding: 0.95rem 1.1rem;
                  min-height: 3rem;
                  border-radius: 12px;
                  line-height: 1.2;
                }
                a.primary {
                  background: var(--accent);
                  color: #f7fff9;
                }
                a.secondary {
                  background: color-mix(in srgb, var(--accent) 12%, transparent);
                  color: var(--accent);
                  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
                }
                .hint {
                  margin-top: 1.35rem;
                  font-size: 0.9rem;
                }
                .hint a { color: var(--accent); font-weight: 600; }
                code { color: var(--accent); font-size: 0.95em; }
              </style>
            </head>
            <body>
              <main>
                <svg class="mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="rdoc">
                  <rect width="512" height="512" rx="112" fill="#F7FFF9"/>
                  <path fill="#0B6E4F" d="M150 88h176c8.8 0 16 7.2 16 16v40c0 22.1 17.9 40 40 40h40c8.8 0 16 7.2 16 16v204c0 26.5-21.5 48-48 48H150c-26.5 0-48-21.5-48-48V136c0-26.5 21.5-48 48-48z"/>
                  <path fill="#F7FFF9" d="M342 88l86 86h-46c-22.1 0-40-17.9-40-40V88z"/>
                  <rect x="186" y="248" width="148" height="22" rx="11" fill="#7BC68E"/>
                  <rect x="186" y="292" width="118" height="22" rx="11" fill="#7BC68E"/>
                  <rect x="216" y="336" width="138" height="22" rx="11" fill="#7BC68E"/>
                  <text x="186" y="214" fill="#1A262F" font-family="Georgia, serif" font-size="92" font-weight="700">r</text>
                </svg>
                <h1>rdoc</h1>
                <p class="lede">Calm offline reading for self-contained documents.</p>
                <p>Open a bare <code>.rdoc</code> from the toolbar, Files, or another app — choose <strong>Always</strong> to set as default.</p>
                <div class="actions">
                  <a class="cta primary" href="rdoc-action://open">Open…</a>
                  <a class="cta secondary" href="rdoc-action://recent">Recent</a>
                </div>
                <p class="hint"><a href="https://github.com/DokaiiMob/rdoc#why-rdoc">What is .rdoc?</a></p>
              </main>
            </body>
            </html>
        """.trimIndent()
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
        supportActionBar?.title = getString(R.string.app_name)
    }

    companion object {
        private const val MENU_OPEN = 1
        private const val MENU_RECENT = 2
        private const val MENU_ABOUT = 3
    }
}
