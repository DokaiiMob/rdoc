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
        menu.add(0, MENU_OPEN, 0, R.string.menu_open).setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM)
        menu.add(0, MENU_RECENT, 1, R.string.menu_recent)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            MENU_OPEN -> {
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
                return true
            }
            MENU_RECENT -> {
                showRecentPicker()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
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
                val url = request?.url?.toString() ?: return false
                return !(url.startsWith("about:") || url.startsWith("data:") || url.startsWith("#"))
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
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>rdoc Reader</title>
              <style>
                :root { color-scheme: light dark; }
                body {
                  margin: 0; min-height: 100vh; display: grid; place-items: center;
                  font-family: system-ui, sans-serif;
                  background: linear-gradient(160deg, #0B6E4F22, #1A3D3222);
                  color: CanvasText; padding: 1.5rem;
                  box-sizing: border-box;
                }
                main { text-align: center; max-width: 22rem; }
                h1 { font-size: 1.6rem; margin: 0 0 0.5rem; }
                p { opacity: 0.85; line-height: 1.45; }
              </style>
            </head>
            <body>
              <main>
                <h1>rdoc Reader</h1>
                <p>Open a bare <strong>.rdoc</strong> from the menu, Files, or another app — choose <strong>Always</strong> to set as default.</p>
                <p>A .rdoc is a self-contained HTML polyglot — offline, adaptive, integrity-hashed.</p>
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
    }
}
