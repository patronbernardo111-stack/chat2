---
inclusion: always
---

# Steering: Stack Nativo

Estamos migrando EGCHAT de web (React/Vite) a nativa con React Native + Expo.

- Mobile: React Native + Expo + TypeScript
- Backend: Supabase + Render API (https://chat2-0x2c.onrender.com)
- Navegación: Expo Router
- Estado: Zustand
- Estilos: NativeWind (Tailwind para RN)

**NUNCA modificar archivos del proyecto web original.**
Todo código nativo va en la carpeta `egchat-mobile/`.
