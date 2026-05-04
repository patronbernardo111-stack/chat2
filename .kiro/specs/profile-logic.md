# Profile Logic — Tech Design Spec

## Funcionalidades del perfil web (SettingsView.tsx)

### 1. Visualización de datos
- Avatar circular 100px con borde verde (#22c55e)
- Fallback a iniciales si no hay foto
- Nombre completo
- Número de teléfono
- Versión de la app

### 2. Cambio de nombre
- Input de texto con el nombre actual
- Botón "Guardar" → PUT /api/auth/profile { full_name }
- Botón "Cancelar" → descarta cambios

### 3. Cambio de foto
- Tap en el avatar abre el selector de imagen
- La imagen se convierte a base64 o File
- POST /api/user/avatar (FormData con campo 'avatar')
- La URL devuelta se guarda en el perfil
- Nota: el backend actual NO usa Supabase Storage directamente
  — las imágenes se suben via Render API que las almacena

### 4. QR personal
- Genera QR con datos: { type:'contact', app:'EGCHAT', user:{id,phone,name,avatar} }
- Se muestra en modal con opción de descargar

### 5. Opciones de configuración
- Privacidad y Seguridad (sin implementar en web)
- Notificaciones (sin implementar en web)
- Acerca de EGCHAT
- Cerrar Sesión → authAPI.logout() + clearToken() + redirect al login

---

## Implementación React Native

### Endpoints usados
```
PUT  /api/auth/profile    → { full_name, avatar_url }
POST /api/user/avatar     → FormData { avatar: File }
GET  /api/auth/me         → datos actuales del usuario
```

### Flujo cambio de foto
```
1. expo-image-picker → seleccionar imagen
2. Crear FormData con la imagen
3. POST /api/user/avatar
4. Recibir { avatar_url }
5. PUT /api/auth/profile { avatar_url }
6. Actualizar estado local
```

### Flujo cambio de nombre
```
1. TextInput con nombre actual
2. Validar mínimo 2 caracteres
3. PUT /api/auth/profile { full_name }
4. Actualizar estado local
```

### Flujo logout
```
1. Alert de confirmación
2. authAPI.logout() → POST /api/auth/logout + clearToken()
3. router.replace('/(auth)/login')
```

### Pantalla: app/(tabs)/ajustes.tsx
```
SafeAreaView
  ScrollView
    ├── ProfileCard
    │   ├── Avatar (100px, circular, con cámara badge)
    │   ├── Nombre + Teléfono
    │   └── Botones: Editar Perfil | Compartir QR
    ├── EditProfileForm (condicional)
    │   ├── EGInput (nombre)
    │   └── Botones: Guardar | Cancelar
    └── OptionsCard
        ├── SettingsItem "Privacidad"
        ├── SettingsItem "Notificaciones"
        ├── SettingsItem "Acerca de"
        └── LogoutButton (rojo)
```

### Estado
```typescript
const [user, setUser] = useState<User | null>(null)
const [editing, setEditing] = useState(false)
const [editedName, setEditedName] = useState('')
const [photo, setPhoto] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
const [showQR, setShowQR] = useState(false)
```
