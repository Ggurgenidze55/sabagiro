package ge.sabagiro.app

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class SabagiroWebViewClient(
    private val onPaymentFlowChange: (Boolean) -> Unit,
    private val onPageStarted: () -> Unit,
    private val onPageFinished: () -> Unit,
    private val paymentCheckoutActive: () -> Boolean,
) : WebViewClient() {

    private fun applyPaymentFlowState(uri: Uri) {
        AppConfig.paymentFlowStateChange(uri)?.let(onPaymentFlowChange)
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        url?.let { applyPaymentFlowState(Uri.parse(it)) }
        onPageStarted()
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        url?.let { applyPaymentFlowState(Uri.parse(it)) }
        view?.let { applyViewportFix(it, url) }
        onPageFinished()
    }

    private fun applyViewportFix(view: WebView, url: String?) {
        if (url == null) return
        val uri = Uri.parse(url)
        val host = uri.host?.lowercase() ?: return
        if (!AppConfig.isSabagiroHost(host) && !AppConfig.isLocalDevHost(host)) return
        view.evaluateJavascript(VIEWPORT_FIX_JS, null)
    }

    private companion object {
        private const val VIEWPORT_FIX_JS = """
            (function () {
              var meta = document.querySelector('meta[name="viewport"]');
              if (meta) {
                var content = meta.getAttribute('content') || '';
                if (content.indexOf('viewport-fit') < 0) {
                  meta.setAttribute(
                    'content',
                    content.replace(/\s*,\s*$/, '') + ', viewport-fit=cover'
                  );
                }
              }

              document.documentElement.classList.add('sabagiro-android-shell', 'sabagiro-in-app');
              if (document.getElementById('sabagiro-android-viewport-fix')) return;

              var style = document.createElement('style');
              style.id = 'sabagiro-android-viewport-fix';
              style.textContent =
                '.sabagiro-android-shell, .sabagiro-android-shell body { min-height: 100vh !important; }' +
                '.sabagiro-android-shell .page, .sabagiro-android-shell .site-shell, .sabagiro-android-shell .site-page { min-height: 100vh !important; }' +
                '@media (max-width: 899px) { .sabagiro-android-shell .hero { min-height: calc(100vh - 11.5rem) !important; } }' +
                '.sabagiro-android-shell .nav-panel { height: 100vh !important; max-height: 100vh !important; }' +
                '.sabagiro-in-app .app-downloads { display: none !important; }';
              document.head.appendChild(style);
            })();
            """
    }

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val uri = request.url

        when (uri.scheme?.lowercase()) {
            "tel", "mailto", "geo", "maps" -> {
                view.context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                return true
            }
        }

        applyPaymentFlowState(uri)

        if (AppConfig.shouldStayInApp(uri, paymentCheckoutActive())) {
            return false
        }

        if (uri.scheme == "http" || uri.scheme == "https") {
            view.context.startActivity(Intent(Intent.ACTION_VIEW, uri))
            return true
        }

        return false
    }
}
