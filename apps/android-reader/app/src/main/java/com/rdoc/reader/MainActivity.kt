package com.rdoc.reader

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    private val openDocument = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) loadFromUri(uri)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        supportActionBar?.subtitle = "Responsive Document"

        webView = findViewById(R.id.webview)
        configureWebView(webView)
        showWelcome()

        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_OPEN, 0, "Open…").setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == MENU_OPEN) {
            openDocument.launch(arrayOf("*/*", "text/html", "application/vnd.rdoc+html", "text/plain"))
            return true
        }
        return super.onOptionsItemSelected(item)
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
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return !(url.startsWith("about:") || url.startsWith("data:") || url.startsWith("#"))
            }
        }
    }

    private fun handleIntent(intent: Intent) {
        val action = intent.action
        if (Intent.ACTION_VIEW == action) {
            val uri = intent.data
            if (uri != null) {
                loadFromUri(uri)
                return
            }
        }
        if (Intent.ACTION_SEND == action && intent.type != null) {
            @Suppress("DEPRECATION")
            val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            if (uri != null) loadFromUri(uri)
        }
    }

    private fun loadFromUri(uri: Uri) {
        try {
            contentResolver.takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
        } catch (_: SecurityException) {
            // Not all providers support persistable grants.
        }

        val html = readUriAsUtf8(uri)
        if (html == null) {
            Toast.makeText(this, "Could not read file", Toast.LENGTH_LONG).show()
            return
        }
        val title = extractTitle(html) ?: "rdoc"
        supportActionBar?.title = title
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
    }

    private fun readUriAsUtf8(uri: Uri): String? {
        return try {
            contentResolver.openInputStream(uri)?.use { input ->
                BufferedReader(InputStreamReader(input, StandardCharsets.UTF_8)).use { it.readText() }
            }
        } catch (e: Exception) {
            Toast.makeText(this, e.message ?: "Read error", Toast.LENGTH_LONG).show()
            null
        }
    }

    private fun extractTitle(html: String): String? {
        val titleRe = Regex("<title[^>]*>([^<]*)</title>", RegexOption.IGNORE_CASE)
        titleRe.find(html)?.groupValues?.getOrNull(1)?.trim()?.takeIf { it.isNotEmpty() }?.let { return it }
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
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>rdoc Reader</title>
              <style>
                :root { color-scheme: light dark; }
                body {
                  margin: 0; min-height: 100vh; display: grid; place-items: center;
                  font-family: system-ui, sans-serif;
                  background: linear-gradient(160deg, #0B6E4F22, #1A3D3222);
                  color: CanvasText; padding: 1.5rem;
                }
                main { text-align: center; max-width: 22rem; }
                h1 { font-size: 1.6rem; margin: 0 0 0.5rem; }
                p { opacity: 0.85; line-height: 1.45; }
              </style>
            </head>
            <body>
              <main>
                <h1>rdoc Reader</h1>
                <p>Open a bare <strong>.rdoc</strong> file from the menu, Files, or another app.</p>
                <p>JavaScript micro-runtime is enabled for TOC, theme, and footnotes.</p>
              </main>
            </body>
            </html>
        """.trimIndent()
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
        supportActionBar?.title = "rdoc Reader"
    }

    companion object {
        private const val MENU_OPEN = 1
    }
}
