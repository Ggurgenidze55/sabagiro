import SwiftUI

struct ContentView: View {
  @StateObject private var model = WebViewModel()
  @State private var showSplash = true

  var body: some View {
    ZStack {
      SabagiroTheme.background.ignoresSafeArea()

      SabagiroWebView(model: model)
        .ignoresSafeArea(edges: .bottom)
        .opacity(showSplash ? 0 : 1)

      if showSplash {
        splashOverlay
          .transition(.opacity)
      }
    }
    .overlay(alignment: .top) {
      if model.estimatedProgress > 0 && model.estimatedProgress < 1 {
        GeometryReader { geo in
          Rectangle()
            .fill(SabagiroTheme.acid)
            .frame(width: geo.size.width * model.estimatedProgress, height: 2)
        }
        .frame(height: 2)
      }
    }
    .onChange(of: model.isLoading) { loading in
      guard !loading else { return }
      withAnimation(.easeOut(duration: 0.35)) {
        showSplash = false
      }
    }
  }

  private var splashOverlay: some View {
    ZStack {
      SabagiroTheme.background.ignoresSafeArea()

      VStack(spacing: 28) {
        Image("LaunchLogo")
          .resizable()
          .scaledToFit()
          .frame(maxWidth: 260, maxHeight: 140)
          .accessibilityLabel("Sabagiro")

        ProgressView()
          .progressViewStyle(.circular)
          .tint(SabagiroTheme.acid)
          .scaleEffect(1.2)
      }
    }
  }
}

#Preview {
  ContentView()
}
