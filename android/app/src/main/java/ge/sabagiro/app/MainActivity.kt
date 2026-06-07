package ge.sabagiro.app

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import ge.sabagiro.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var paymentCheckoutActive = false
    private var splashHidden = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applyWindowInsets()
        setupWebView()
        setupNativeBackButton()
        setupBackNavigation()
        loadHome()
    }

    private fun applyWindowInsets() {
        // Match iOS shell: status bar inset on top, edge-to-edge at the bottom.
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0, bars.top, 0, 0)
            insets
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.webView
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.loadsImagesAutomatically = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = false
        settings.textZoom = 100
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.userAgentString = "${settings.userAgentString} SabagiroApp/1.0 Android"

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.setBackgroundColor(getColor(R.color.sabagiro_background))

        webView.setDownloadListener { url, _, _, mimeType, _ ->
            val uri = Uri.parse(url)
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                if (mimeType != null || url.endsWith(".apk", ignoreCase = true)) {
                    setDataAndType(uri, mimeType ?: "application/vnd.android.package-archive")
                }
            }
            try {
                startActivity(intent)
            } catch (_: ActivityNotFoundException) {
                startActivity(Intent(Intent.ACTION_VIEW, uri))
            }
        }

        webView.webViewClient = SabagiroWebViewClient(
            onPaymentFlowChange = { active -> paymentCheckoutActive = active },
            onPageStarted = {
                binding.progressTrack.visibility = View.VISIBLE
                binding.progressBar.visibility = View.VISIBLE
            },
            onPageFinished = {
                updateNativeBackButton()
                hideSplashIfNeeded()
            },
            paymentCheckoutActive = { paymentCheckoutActive },
        )

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                val trackWidth = binding.progressTrack.width
                if (trackWidth <= 0) return
                val barWidth = (trackWidth * (newProgress / 100f)).toInt()
                binding.progressBar.layoutParams.width = barWidth
                binding.progressBar.requestLayout()

                if (newProgress >= 100) {
                    binding.progressTrack.visibility = View.GONE
                    binding.progressBar.visibility = View.GONE
                    hideSplashIfNeeded()
                }
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?,
            ): Boolean {
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                transport.webView = binding.webView
                resultMsg.sendToTarget()
                return true
            }
        }
    }

    private fun setupNativeBackButton() {
        binding.nativeBackButton.setOnClickListener {
            if (binding.webView.canGoBack()) {
                binding.webView.goBack()
            }
        }
    }

    private fun updateNativeBackButton() {
        val show = AppConfig.shouldShowNativeBack(binding.webView.url?.let(Uri::parse), binding.webView.canGoBack())
        binding.nativeBackButton.visibility = if (show) View.VISIBLE else View.GONE
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (binding.webView.canGoBack()) {
                        binding.webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )
    }

    private fun loadHome() {
        binding.webView.loadUrl(AppConfig.siteUrl.toString())
    }

    private fun hideSplashIfNeeded() {
        if (splashHidden) return
        splashHidden = true
        binding.splashOverlay.animate()
            .alpha(0f)
            .setDuration(350)
            .withEndAction { binding.splashOverlay.visibility = View.GONE }
            .start()
    }
}
