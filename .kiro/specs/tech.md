# Stack Técnico - Migración a Nativa

## Plataformas
- Android: Kotlin + Jetpack Compose
- iOS: Swift + SwiftUI
- Backend: Supabase (compartido entre ambas plataformas)

## Reglas generales
- No modificar ningún archivo del proyecto web original
- La app nativa debe ser idéntica en funcionalidad y diseño a la web
- No usar WebView para simular nativo — todo debe ser componentes nativos reales
- Código 100% en Kotlin para Android, 100% en Swift para iOS

## Android - Arquitectura
- Patrón: MVVM + Clean Architecture
- UI: Jetpack Compose
- Navegación: Navigation Compose
- Estado: StateFlow + ViewModel
- DI: Hilt
- Red: Supabase Kotlin SDK + Ktor
- Imágenes: Coil

## iOS - Arquitectura
- Patrón: MVVM
- UI: SwiftUI
- Navegación: NavigationStack
- Estado: @StateObject + ObservableObject
- Red: Supabase Swift SDK

## Estructura Android
```
android-app/
  app/src/main/java/com/egchat/
    ui/
      screens/     # Pantallas Compose
      components/  # Componentes reutilizables
      theme/       # Colores, tipografía, formas
    viewmodel/     # ViewModels por feature
    data/
      repository/  # Repositorios
      remote/      # Supabase calls
      model/       # Data classes
    di/            # Módulos Hilt
    navigation/    # NavGraph
```

## Estructura iOS
```
ios-app/
  EGChat/
    Views/
      Screens/     # Vistas principales SwiftUI
      Components/  # Componentes reutilizables
    ViewModels/    # ObservableObjects
    Services/      # Supabase calls
    Models/        # Structs de datos
    Navigation/    # NavigationStack config
```
