import Combine
import Foundation
import WebKit

@MainActor
final class WebViewModel: ObservableObject {
  @Published var isLoading = true
  @Published var estimatedProgress: Double = 0
  @Published var canGoBack = false
  @Published var showNativeBack = false
  /// Flitt + 3DS — allow bank URLs in the same WebView until back on Sabagiro.
  @Published var paymentCheckoutActive = false

  let webView: WKWebView

  init() {
    let config = WKWebViewConfiguration()
    config.defaultWebpagePreferences.allowsContentJavaScript = true
    config.applicationNameForUserAgent = "SabagiroApp/1.0 iOS"
    config.websiteDataStore = .default()
    webView = WKWebView(frame: .zero, configuration: config)
    webView.isOpaque = false
    webView.backgroundColor = UIColor(red: 0.04, green: 0.04, blue: 0.04, alpha: 1)
    webView.scrollView.backgroundColor = webView.backgroundColor
    webView.allowsBackForwardNavigationGestures = true
    loadHome()
  }

  func loadHome() {
    isLoading = true
    estimatedProgress = 0
    webView.load(URLRequest(url: AppConfig.siteURL))
  }

  func goBack() {
    guard webView.canGoBack else { return }
    webView.goBack()
  }

  func updateNativeBackVisibility(for url: URL?) {
    guard let url, webView.canGoBack else {
      showNativeBack = false
      return
    }
    let host = url.host?.lowercased() ?? ""
    let onSabagiro = AppConfig.isSabagiroHost(host) || AppConfig.isLocalDevHost(host)
    showNativeBack = !onSabagiro
  }

  func reload() {
    webView.reload()
  }
}
