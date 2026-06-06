package ge.sabagiro.app

import android.net.Uri

object AppConfig {
    /** Production site loaded in the app shell. */
    val siteUrl: Uri = Uri.parse("https://www.sabagiro.ge/")

    private val sabagiroHostSuffixes = listOf("sabagiro.ge", "vercel.app")
    private val paymentGatewayHostSuffixes = listOf("flitt.com")

    private val allowsLocalhost: Boolean = BuildConfig.DEBUG

    fun isSabagiroHost(host: String): Boolean {
        val h = host.lowercase()
        return sabagiroHostSuffixes.any { suffix -> h == suffix || h.endsWith(".$suffix") }
    }

    fun isLocalDevHost(host: String): Boolean {
        if (!allowsLocalhost) return false
        val h = host.lowercase()
        return h == "localhost" || h == "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.0.2.2")
    }

    fun isPaymentGatewayHost(host: String): Boolean {
        val h = host.lowercase()
        return paymentGatewayHostSuffixes.any { suffix -> h == suffix || h.endsWith(".$suffix") }
    }

    /** Keep navigation inside the WebView (not Chrome Custom Tabs). */
    fun shouldStayInApp(uri: Uri, paymentCheckoutActive: Boolean): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return false
        if (scheme != "http" && scheme != "https") return false
        val host = uri.host?.lowercase() ?: return false
        if (isSabagiroHost(host) || isLocalDevHost(host)) return true
        if (isPaymentGatewayHost(host)) return true
        if (paymentCheckoutActive) return true
        return false
    }

    /** `true` = payment flow started, `false` = returned to site after pay. */
    fun paymentFlowStateChange(uri: Uri): Boolean? {
        val host = uri.host?.lowercase() ?: return null
        val path = uri.path?.lowercase() ?: "/"

        if (isPaymentGatewayHost(host)) return true

        if (isSabagiroHost(host) || isLocalDevHost(host)) {
            if (path.startsWith("/payment/")) return true
            if (path == "/account" || path.startsWith("/account/")) return false
            if (path == "/cart" || path == "/events" || path.startsWith("/events/")) return false
        }

        return null
    }
}
