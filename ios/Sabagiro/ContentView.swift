import SwiftUI

struct ContentView: View {
  @StateObject private var model = WebViewModel()

  var body: some View {
    ZStack {
      Color(red: 0.04, green: 0.04, blue: 0.04).ignoresSafeArea()

      SabagiroWebView(model: model)
        .ignoresSafeArea(edges: .bottom)

      if model.isLoading && model.estimatedProgress < 0.15 {
        ProgressView()
          .tint(Color(red: 0.78, green: 1, blue: 0))
      }
    }
    .overlay(alignment: .top) {
      if model.estimatedProgress > 0 && model.estimatedProgress < 1 {
        GeometryReader { geo in
          Rectangle()
            .fill(Color(red: 0.78, green: 1, blue: 0))
            .frame(width: geo.size.width * model.estimatedProgress, height: 2)
        }
        .frame(height: 2)
      }
    }
  }
}

#Preview {
  ContentView()
}
