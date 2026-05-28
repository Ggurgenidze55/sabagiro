import Combine
import Foundation
import WebKit

@MainActor
final class WebViewModel: ObservableObject {
  @Published var isLoading = true
  @Published var estimatedProgress: Double = 0
  @Published var canGoBack = false

  let webView: WKWebView

  init() {
    let config = WKWebViewConfiguration()
    config.defaultWebpagePreferences.allowsContentJavaScript = true
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

  func reload() {
    webView.reload()
  }
}
