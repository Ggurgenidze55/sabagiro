import Photos
import UIKit
import WebKit

/// JS → Photos: `webkit.messageHandlers.sabagiroSaveImage.postMessage({ base64, filename })`
final class TicketImageSaver: NSObject, WKScriptMessageHandler {
  static let handlerName = "sabagiroSaveImage"

  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    guard
      let body = message.body as? [String: Any],
      let raw = body["base64"] as? String
    else { return }

    let base64 = raw.replacingOccurrences(of: "^data:image/\\w+;base64,", with: "", options: .regularExpression)
    guard let data = Data(base64Encoded: base64), let image = UIImage(data: data) else { return }

    PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
      guard status == .authorized || status == .limited else {
        DispatchQueue.main.async {
          Self.presentAlert(
            title: "Photos access needed",
            message: "Allow Sabagiro to add ticket images in Settings → Sabagiro → Photos.",
          )
        }
        return
      }

      PHPhotoLibrary.shared().performChanges {
        PHAssetChangeRequest.creationRequestForAsset(from: image)
      } completionHandler: { ok, error in
        DispatchQueue.main.async {
          if ok {
            Self.presentAlert(title: "Saved", message: "Ticket saved to Photos.")
          } else {
            Self.presentAlert(
              title: "Could not save",
              message: error?.localizedDescription ?? "Try again.",
            )
          }
        }
      }
    }
  }

  private static func presentAlert(title: String, message: String) {
    guard
      let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
      let root = scene.keyWindow?.rootViewController ?? scene.windows.first?.rootViewController
    else { return }

    var top = root
    while let presented = top.presentedViewController {
      top = presented
    }

    let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    top.present(alert, animated: true)
  }
}

private extension UIWindowScene {
  var keyWindow: UIWindow? {
    windows.first(where: \.isKeyWindow) ?? windows.first
  }
}
