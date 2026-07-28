import UIKit

enum WalletPassPresenter {
  static func isWalletPassUrl(_ url: URL) -> Bool {
    url.path.contains("/api/tickets/") && url.path.hasSuffix("/wallet")
  }

  @MainActor
  static func showError(_ message: String) {
    showAlert(title: "Apple Wallet", message: message)
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
