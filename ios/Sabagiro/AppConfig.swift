import Foundation

enum AppConfig {
  /// Production site — change for local dev if needed.
  static let siteURL = URL(string: "https://sabagiro.vercel.app")!

  #if DEBUG
  /// Simulator/local Next.js: set to http://127.0.0.1:3001 when testing on Mac.
  static let allowsLocalhost = true
  #else
  static let allowsLocalhost = false
  #endif
}
