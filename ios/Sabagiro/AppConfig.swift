import Foundation

enum AppConfig {
  /// Production site loaded in the app shell.
  static let siteURL = URL(string: "https://www.sabagiro.ge")!

  private static let sabagiroHostSuffixes = ["sabagiro.ge", "vercel.app"]
  private static let paymentGatewayHostSuffixes = ["flitt.com"]

  #if DEBUG
  /// Simulator/local Next.js: use http://127.0.0.1:3001 or LAN IP on device.
  static let allowsLocalhost = true
  #else
  static let allowsLocalhost = false
  #endif

  static func isSabagiroHost(_ host: String) -> Bool {
    let h = host.lowercased()
    return sabagiroHostSuffixes.contains { h == $0 || h.hasSuffix(".\($0)") }
  }

  static func isLocalDevHost(_ host: String) -> Bool {
    #if DEBUG
    guard allowsLocalhost else { return false }
    let h = host.lowercased()
    return h == "localhost" || h == "127.0.0.1" || h.hasPrefix("192.168.")
    #else
    return false
    #endif
  }

  static func isPaymentGatewayHost(_ host: String) -> Bool {
    let h = host.lowercased()
    return paymentGatewayHostSuffixes.contains { h == $0 || h.hasSuffix(".\($0)") }
  }

  /// Keep navigation inside WKWebView (not Safari).
  static func shouldStayInApp(url: URL, paymentCheckoutActive: Bool) -> Bool {
    guard let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return false
    }
    let host = url.host?.lowercased() ?? ""
    if isSabagiroHost(host) || isLocalDevHost(host) { return true }
    if isPaymentGatewayHost(host) { return true }
    // 3-D Secure / bank pages during Flitt checkout
    if paymentCheckoutActive { return true }
    return false
  }

  /// `true` = payment flow started, `false` = returned to site after pay.
  static func paymentFlowStateChange(for url: URL) -> Bool? {
    let host = url.host?.lowercased() ?? ""
    let path = url.path.lowercased()

    if isPaymentGatewayHost(host) {
      return true
    }

    if isSabagiroHost(host) || isLocalDevHost(host) {
      if path.hasPrefix("/payment/") {
        return true
      }
      if path == "/account" || path.hasPrefix("/account/") {
        return false
      }
      if path == "/cart" || path == "/events" || path.hasPrefix("/events/") {
        return false
      }
    }

    return nil
  }
}
