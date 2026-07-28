import PassKit
import UIKit
import WebKit

private enum WalletPassError: LocalizedError {
  case invalidResponse
  case passUnavailable
  case server(String)

  var errorDescription: String? {
    switch self {
    case .invalidResponse:
      return "Invalid response from server."
    case .passUnavailable:
      return "Apple Wallet is not available on this device."
    case .server(let message):
      return message
    }
  }
}

enum WalletPassPresenter {
  static func isWalletPassUrl(_ url: URL) -> Bool {
    url.path.contains("/api/tickets/") && url.path.hasSuffix("/wallet")
  }

  @MainActor
  static func presentPass(from webView: WKWebView, url: URL) async {
    do {
      let data = try await fetchPassData(from: webView, url: url)
      try presentPassData(data)
    } catch {
      showError(error.localizedDescription)
    }
  }

  @MainActor
  static func showError(_ message: String) {
    showAlert(title: "Apple Wallet", message: message)
  }

  @MainActor
  private static func presentPassData(_ data: Data) throws {
    let pass = try PKPass(data: data)
    guard PKAddPassesViewController.canAddPasses() else {
      throw WalletPassError.passUnavailable
    }
    guard let controller = PKAddPassesViewController(pass: pass) else {
      throw WalletPassError.passUnavailable
    }
    guard let presenter = topViewController() else {
      throw WalletPassError.passUnavailable
    }
    presenter.present(controller, animated: true)
  }

  @MainActor
  private static func fetchPassData(from webView: WKWebView, url: URL) async throws -> Data {
    let allCookies = await webViewCookies(webView)
    let userAgent = await webViewUserAgent(webView)

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.cachePolicy = .reloadIgnoringLocalCacheData

    if let userAgent, !userAgent.isEmpty {
      request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
    }

    let headerFields = HTTPCookie.requestHeaderFields(with: matchingCookies(for: url, from: allCookies))
    for (field, value) in headerFields {
      request.setValue(value, forHTTPHeaderField: field)
    }

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw WalletPassError.invalidResponse
    }

    let contentType = http.value(forHTTPHeaderField: "Content-Type")?.lowercased() ?? ""
    if contentType.contains("application/json") || http.statusCode >= 400 {
      if
        let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let message = json["error"] as? String,
        !message.isEmpty
      {
        throw WalletPassError.server(message)
      }
      throw WalletPassError.server("Could not load pass (HTTP \(http.statusCode)).")
    }

    guard contentType.contains("application/vnd.apple.pkpass") || !data.isEmpty else {
      throw WalletPassError.invalidResponse
    }

    return data
  }

  @MainActor
  private static func webViewCookies(_ webView: WKWebView) async -> [HTTPCookie] {
    await withCheckedContinuation { continuation in
      webView.configuration.websiteDataStore.httpCookieStore.getAllCookies { cookies in
        continuation.resume(returning: cookies)
      }
    }
  }

  @MainActor
  private static func webViewUserAgent(_ webView: WKWebView) async -> String? {
    await withCheckedContinuation { continuation in
      webView.evaluateJavaScript("navigator.userAgent") { result, _ in
        continuation.resume(returning: result as? String)
      }
    }
  }

  private static func matchingCookies(for url: URL, from all: [HTTPCookie]) -> [HTTPCookie] {
    guard let host = url.host?.lowercased() else { return all }
    return all.filter { cookie in
      let domain = cookie.domain.lowercased()
      if domain.hasPrefix(".") {
        let bare = String(domain.dropFirst())
        return host == bare || host.hasSuffix(domain)
      }
      return host == domain
    }
  }

  @MainActor
  private static func showAlert(title: String, message: String) {
    guard let presenter = topViewController() else { return }
    let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    presenter.present(alert, animated: true)
  }

  @MainActor
  private static func topViewController() -> UIViewController? {
    let root = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first { $0.isKeyWindow }?
      .rootViewController
    guard var presenter = root else { return nil }
    while let presented = presenter.presentedViewController {
      presenter = presented
    }
    return presenter
  }
}
