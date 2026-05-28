import SwiftUI
import WebKit

struct SabagiroWebView: UIViewRepresentable {
  @ObservedObject var model: WebViewModel

  func makeCoordinator() -> Coordinator {
    Coordinator(model: model)
  }

  func makeUIView(context: Context) -> WKWebView {
    model.webView.navigationDelegate = context.coordinator
    model.webView.uiDelegate = context.coordinator
    model.webView.addObserver(
      context.coordinator,
      forKeyPath: #keyPath(WKWebView.estimatedProgress),
      options: .new,
      context: nil
    )
    model.webView.addObserver(
      context.coordinator,
      forKeyPath: #keyPath(WKWebView.canGoBack),
      options: .new,
      context: nil
    )
    return model.webView
  }

  func updateUIView(_ uiView: WKWebView, context: Context) {}

  static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
    uiView.removeObserver(coordinator, forKeyPath: #keyPath(WKWebView.estimatedProgress))
    uiView.removeObserver(coordinator, forKeyPath: #keyPath(WKWebView.canGoBack))
  }

  final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
    private let model: WebViewModel

    init(model: WebViewModel) {
      self.model = model
    }

    private func shouldNavigateInApp(_ url: URL) -> Bool {
      guard url.scheme == "http" || url.scheme == "https" else { return false }
      let host = url.host?.lowercased() ?? ""
      if host == "sabagiro.vercel.app" || host.hasSuffix(".vercel.app") {
        return true
      }
      if AppConfig.allowsLocalhost && (host == "localhost" || host == "127.0.0.1") {
        return true
      }
      return false
    }

    private func openInSameWebView(_ webView: WKWebView, url: URL) {
      webView.load(URLRequest(url: url))
    }

    override func observeValue(
      forKeyPath keyPath: String?,
      of object: Any?,
      change: [NSKeyValueChangeKey: Any]?,
      context: UnsafeMutableRawPointer?
    ) {
      guard let webView = object as? WKWebView else { return }
      Task { @MainActor in
        if keyPath == #keyPath(WKWebView.estimatedProgress) {
          model.estimatedProgress = webView.estimatedProgress
        }
        if keyPath == #keyPath(WKWebView.canGoBack) {
          model.canGoBack = webView.canGoBack
        }
      }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
      Task { @MainActor in
        model.isLoading = true
      }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
      Task { @MainActor in
        model.isLoading = false
        model.estimatedProgress = 1
      }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
      Task { @MainActor in
        model.isLoading = false
      }
    }

    func webView(
      _ webView: WKWebView,
      createWebViewWith configuration: WKWebViewConfiguration,
      for navigationAction: WKNavigationAction,
      windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
      if let url = navigationAction.request.url, shouldNavigateInApp(url) {
        openInSameWebView(webView, url: url)
      }
      return nil
    }

    func webView(
      _ webView: WKWebView,
      decidePolicyFor navigationAction: WKNavigationAction,
      decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
      guard let url = navigationAction.request.url else {
        decisionHandler(.allow)
        return
      }

      if ["tel", "mailto", "maps"].contains(url.scheme ?? "") {
        UIApplication.shared.open(url)
        decisionHandler(.cancel)
        return
      }

      // target="_blank" / window.open — must load in-place (`.allow` alone does nothing).
      if navigationAction.targetFrame == nil {
        if shouldNavigateInApp(url) {
          openInSameWebView(webView, url: url)
          decisionHandler(.cancel)
          return
        }
        if url.scheme == "http" || url.scheme == "https" {
          UIApplication.shared.open(url)
          decisionHandler(.cancel)
          return
        }
      }

      if shouldNavigateInApp(url) {
        decisionHandler(.allow)
        return
      }

      if url.scheme == "http" || url.scheme == "https" {
        UIApplication.shared.open(url)
        decisionHandler(.cancel)
        return
      }

      decisionHandler(.allow)
    }
  }
}
