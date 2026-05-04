# EGCHAT UI Components Migration Guide
> Traducción de componentes web (React/JSX) a React Native

---

## 1. Pantalla de Bienvenida (Welcome Screen)

### Estructura web
```
Column (minHeight: 100vh, maxWidth: 420px, centered)
  ├── Logo animado (160x160, borderRadius: 20px, spin 20s)
  ├── Banderas de países (row, flexWrap)
  ├── Feature cards (glassmorphism card)
  │   ├── FeatureItem (icon + title + subtitle) x3
  └── Buttons column
      ├── PrimaryButton "Crear Cuenta"
      └── SecondaryButton "Ya tengo cuenta"
```

### React Native
```tsx
<SafeAreaView style={styles.container}>
  <ScrollView contentContainerStyle={styles.scroll}>
    {/* Logo */}
    <Animated.Image
      source={require('./assets/logo.png')}
      style={[styles.logo, { transform: [{ rotate: spin }] }]}
    />

    {/* Banderas */}
    <View style={styles.flagsRow}>
      {countries.map(code => <Text style={styles.flag}>{flag(code)}</Text>)}
    </View>

    {/* Feature card */}
    <View style={styles.featureCard}>
      {features.map(f => <FeatureItem key={f.title} {...f} />)}
    </View>

    {/* Botones */}
    <EGButton title="Crear Cuenta" onPress={() => nav.navigate('Register')} />
    <EGButton title="Ya tengo cuenta" variant="outline" onPress={() => nav.navigate('Login')} />
  </ScrollView>
</SafeAreaView>
```

### Estilos clave
```js
container: { flex: 1, backgroundColor: '#F7F8FA' }
logo: { width: 160, height: 160, borderRadius: 20 }
featureCard: {
  backgroundColor: 'rgba(255,255,255,0.8)',
  borderRadius: 20,
  padding: 20,
  // iOS shadow
  shadowColor: '#000', shadowOffset: {width:0,height:8},
  shadowOpacity: 0.1, shadowRadius: 32,
  // Android
  elevation: 4
}
```

---

## 2. Pantalla de Login

### Estructura web
```
Column (flex: 1, maxWidth: 420px)
  ├── Header (logo pequeño 80x80 + banderas)
  ├── Title "Iniciar sesión"
  ├── CountrySelector (dropdown con bandera)
  ├── PhoneInput (prefijo + número)
  ├── PasswordInput (con toggle show/hide)
  ├── ErrorMessage (condicional)
  ├── PrimaryButton "Entrar"
  ├── TextButton "¿Olvidaste tu contraseña?"
  └── SecondaryButton "Crear cuenta nueva"
```

### React Native
```tsx
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <ScrollView>
    <EGHeader logo small />

    <Text style={styles.title}>Iniciar sesión</Text>
    <Text style={styles.subtitle}>Introduce tu teléfono y contraseña</Text>

    <CountrySelector value={country} onChange={setCountry} />

    <PhoneInput
      prefix={country.phone}
      value={phone}
      onChangeText={setPhone}
    />

    <PasswordInput
      value={pass}
      onChangeText={setPass}
      onSubmitEditing={doLogin}
    />

    {error && <ErrorMessage text={error} />}

    <EGButton
      title={loading ? 'Entrando...' : 'Entrar'}
      onPress={doLogin}
      loading={loading}
      icon="log-in"
    />

    <TouchableOpacity onPress={() => nav.navigate('ForgotPassword')}>
      <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
    </TouchableOpacity>

    <EGButton
      title="Crear cuenta nueva"
      variant="outline"
      onPress={() => nav.navigate('Register')}
    />
  </ScrollView>
</KeyboardAvoidingView>
```

### Componente CountrySelector
```tsx
// Web: <select> con overlay invisible
// RN: Modal con FlatList o ActionSheet
const CountrySelector = ({ value, onChange }) => (
  <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selector}>
    <Text style={styles.flag}>{getFlag(value.code)}</Text>
    <Text style={styles.countryName}>{value.name}:</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
)
```

### Componente PhoneInput
```tsx
// Web: div con span + input
// RN: View con Text + TextInput
const PhoneInput = ({ prefix, value, onChangeText }) => (
  <View style={styles.phoneContainer}>
    <View style={styles.prefix}>
      <Text style={styles.prefixText}>{prefix}</Text>
    </View>
    <TextInput
      style={styles.phoneInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType="phone-pad"
      placeholder="222 XXX XXX"
    />
  </View>
)
```

---

## 3. Pantalla de Registro (3 pasos)

### Estructura web
```
Column
  ├── BackButton + Title "Crear Cuenta" + "Paso X de 3"
  ├── ProgressBar (3 segmentos coloreados)
  ├── Paso 1: Nombre + AvatarPicker (200px alto, dashed border)
  ├── Paso 2: CountrySelector + PhoneInput + validación
  └── Paso 3: PasswordInput + ConfirmPassword
```

### React Native
```tsx
// Paso 1
<View>
  <TextInput placeholder="Tu nombre" value={name} onChangeText={setName} />

  {/* Avatar picker — web usa div 200px, RN usa TouchableOpacity */}
  <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
    {avatar ? (
      <Image source={{ uri: avatar }} style={styles.avatarPreview} />
    ) : (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.cameraIcon}>📷</Text>
        <Text>Subir foto de perfil</Text>
      </View>
    )}
  </TouchableOpacity>
</View>
```

### ProgressBar
```tsx
// Web: 3 divs con flex:1, height:3px
// RN: igual con View
const ProgressBar = ({ step }: { step: number }) => (
  <View style={styles.progressContainer}>
    {[1, 2, 3].map(i => (
      <View
        key={i}
        style={[
          styles.progressSegment,
          { backgroundColor: i <= step ? '#07C160' : '#E5E7EB' }
        ]}
      />
    ))}
  </View>
)
// styles.progressSegment: { flex:1, height:3, borderRadius:2, marginHorizontal:2 }
```

---

## 4. Lista de Chats (Chat List)

### Estructura web
```
Column (height: 100dvh)
  ├── Header sticky
  │   ├── Title "Mensajes"
  │   └── SearchButton + NewChatButton
  ├── SearchBar (condicional, con resultados dropdown)
  └── FlatList de ChatItems
      └── ChatItem
          ├── Avatar (circular, 48px)
          ├── Column
          │   ├── Row: NombreChat + Timestamp
          │   └── Row: ÚltimoMensaje + UnreadBadge
          └── (border-bottom)
```

### React Native
```tsx
<View style={styles.container}>
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Mensajes</Text>
    <View style={styles.headerActions}>
      <TouchableOpacity onPress={() => setShowSearch(true)}>
        <Ionicons name="search" size={22} color="#111827" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nav.navigate('NewChat')}>
        <Ionicons name="create-outline" size={22} color="#111827" />
      </TouchableOpacity>
    </View>
  </View>

  {/* Search */}
  {showSearch && <SearchBar onSearch={searchUsers} results={results} />}

  {/* Lista */}
  <FlatList
    data={chats}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <ChatItem chat={item} onPress={() => openChat(item)} />}
    ItemSeparatorComponent={() => <View style={styles.separator} />}
  />
</View>
```

### ChatItem
```tsx
const ChatItem = ({ chat, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.chatItem}>
    <EGAvatar src={chat.avatar_url} name={chatName} size={48} />
    <View style={styles.chatInfo}>
      <View style={styles.chatRow}>
        <Text style={styles.chatName} numberOfLines={1}>{chatName}</Text>
        <Text style={styles.chatTime}>{formatTime(chat.updated_at)}</Text>
      </View>
      <View style={styles.chatRow}>
        <Text style={styles.lastMessage} numberOfLines={1}>{lastMsg}</Text>
        {chat.unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chat.unread_count}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
)
// chatItem: { flexDirection:'row', alignItems:'center', padding:12, paddingHorizontal:16 }
// chatName: { fontSize:16, fontWeight:'600', color:'#111827', flex:1 }
// lastMessage: { fontSize:14, color:'#6B7280', flex:1 }
// chatTime: { fontSize:12, color:'#9CA3AF' }
```

---

## 5. Pantalla de Chat (Conversación)

### Estructura web
```
Column (height: 100dvh)
  ├── Header sticky (back + avatar + nombre + estado + menú)
  ├── MessageList (flex:1, overflow-y:auto, padding:16)
  │   └── MessageBubble (alineado izq/der según sender)
  │       ├── Avatar (solo mensajes ajenos)
  │       ├── Bubble (bg verde propio / blanco ajeno)
  │       │   ├── Text / Image / File
  │       │   └── ReplyPreview (condicional)
  │       └── TimeStamp + StatusTicks
  └── InputBar (sticky bottom)
      ├── AttachButton
      ├── CameraButton
      ├── TextInput (flex:1, borderRadius:full)
      └── SendButton
```

### React Native
```tsx
<View style={styles.container}>
  {/* Header */}
  <View style={styles.header}>
    <TouchableOpacity onPress={() => nav.goBack()}>
      <Ionicons name="arrow-back" size={24} />
    </TouchableOpacity>
    <EGAvatar src={chat.avatar_url} name={chatName} size={40} />
    <View style={styles.headerInfo}>
      <Text style={styles.chatName}>{chatName}</Text>
      <Text style={styles.onlineStatus}>En línea</Text>
    </View>
    <TouchableOpacity>
      <Ionicons name="ellipsis-vertical" size={22} />
    </TouchableOpacity>
  </View>

  {/* Mensajes */}
  <FlatList
    ref={flatListRef}
    data={messages}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <MessageBubble message={item} currentUserId={userId} />}
    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
    contentContainerStyle={{ padding: 16 }}
  />

  {/* Input */}
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={styles.inputBar}>
      <TouchableOpacity onPress={pickFile}>
        <Ionicons name="attach" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity onPress={openCamera}>
        <Ionicons name="camera" size={24} color="#6B7280" />
      </TouchableOpacity>
      <TextInput
        style={styles.messageInput}
        value={text}
        onChangeText={setText}
        placeholder="Escribe un mensaje..."
        multiline
      />
      <TouchableOpacity onPress={sendMessage} disabled={!text.trim()}>
        <Ionicons name="send" size={24} color={text.trim() ? '#07C160' : '#9CA3AF'} />
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
</View>
```

### MessageBubble
```tsx
const MessageBubble = ({ message, currentUserId }) => {
  const isOwn = message.sender_id === currentUserId

  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.theirWrapper]}>
      {!isOwn && <EGAvatar src={message.sender?.avatar_url} size={32} />}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.theirBubble]}>
        <Text style={styles.bubbleText}>{message.text}</Text>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>{formatTime(message.created_at)}</Text>
          {isOwn && <StatusTicks status={message.status} />}
        </View>
      </View>
    </View>
  )
}

// ownBubble:   { backgroundColor:'#95EC69', borderRadius: [18,18,4,18] }
// theirBubble: { backgroundColor:'#FFFFFF', borderRadius: [18,18,18,4] }
// En RN: borderRadius no acepta array, usar:
// borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius
```

---

## 6. Perfil / Ajustes

### Estructura web
```
Column (minHeight: 100vh, padding: 20px)
  ├── Header: "Ajustes" + CloseButton
  ├── ProfileCard
  │   ├── Avatar circular 100px (con cámara badge)
  │   ├── Nombre + Teléfono
  │   └── Buttons: "Editar Perfil" + "Compartir QR"
  ├── EditProfileForm (condicional)
  ├── QRModal (condicional)
  └── MoreOptions
      ├── ListItem "Privacidad"
      ├── ListItem "Notificaciones"
      ├── ListItem "Acerca de"
      └── LogoutButton (rojo)
```

### React Native
```tsx
<ScrollView style={styles.container}>
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.title}>Ajustes</Text>
    {onClose && <TouchableOpacity onPress={onClose}><X size={24} /></TouchableOpacity>}
  </View>

  {/* Profile Card */}
  <View style={styles.card}>
    <TouchableOpacity onPress={pickPhoto} style={styles.avatarContainer}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatar} />
      ) : (
        <Text style={styles.initials}>{initials}</Text>
      )}
      <View style={styles.cameraBadge}>
        <Ionicons name="camera" size={16} color="#fff" />
      </View>
    </TouchableOpacity>

    <Text style={styles.userName}>{user.name}</Text>
    <Text style={styles.userPhone}>{user.phone}</Text>

    <EGButton title="Editar Perfil" onPress={() => setEditing(true)} icon="edit-2" />
    <EGButton title="Compartir QR" variant="secondary" onPress={generateQR} icon="share-2" />
  </View>

  {/* Options List */}
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>MÁS OPCIONES</Text>
    <SettingsItem icon="shield" title="Privacidad y Seguridad" />
    <SettingsItem icon="bell" title="Notificaciones" />
    <SettingsItem icon="info" title="Acerca de EGCHAT" />
    <View style={styles.divider} />
    <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
      <Ionicons name="log-out" size={16} color="#DC2626" />
      <Text style={styles.logoutText}>Cerrar Sesión</Text>
    </TouchableOpacity>
  </View>
</ScrollView>
```

---

## Componentes Reutilizables

### EGButton
```tsx
// Web: <button style={{background:'#07C160', borderRadius:'12px', padding:'12px 20px'...}}>
// RN:
const EGButton = ({ title, onPress, variant = 'primary', loading, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading}
    style={[styles.btn, variant === 'outline' && styles.btnOutline]}
    activeOpacity={0.85}
  >
    {loading ? (
      <ActivityIndicator color={variant === 'primary' ? '#fff' : '#07C160'} />
    ) : (
      <Text style={[styles.btnText, variant === 'outline' && styles.btnTextOutline]}>
        {title}
      </Text>
    )}
  </TouchableOpacity>
)
// btn: { backgroundColor:'#07C160', borderRadius:12, padding:14, alignItems:'center' }
// btnOutline: { backgroundColor:'#fff', borderWidth:1.5, borderColor:'#E5E7EB' }
```

### EGAvatar
```tsx
// Web: <div style={{borderRadius:'50%'}}> con img o iniciales
// RN:
const EGAvatar = ({ src, name, size = 48 }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  return src ? (
    <Image source={{ uri: src }} style={{ width:size, height:size, borderRadius:size/2 }} />
  ) : (
    <View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:'#07C160', alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color:'#fff', fontWeight:'700', fontSize:size*0.35 }}>{initials}</Text>
    </View>
  )
}
```

### ErrorMessage
```tsx
// Web: <div style={{background:'#FEF2F2', border:'1px solid #FECACA'...}}>
// RN:
const ErrorMessage = ({ text }) => (
  <View style={{ backgroundColor:'#FEF2F2', borderWidth:1, borderColor:'#FECACA', borderRadius:8, padding:10, marginBottom:12 }}>
    <Text style={{ color:'#DC2626', fontSize:13 }}>⚠️ {text}</Text>
  </View>
)
```

---

## Tabla de Equivalencias Layout

| CSS Web | React Native |
|---------|-------------|
| `display: flex; flex-direction: column` | `<View>` (default column) |
| `display: flex; flex-direction: row` | `<View style={{flexDirection:'row'}}>` |
| `flex: 1` | `style={{flex:1}}` |
| `align-items: center` | `alignItems:'center'` |
| `justify-content: space-between` | `justifyContent:'space-between'` |
| `gap: 12px` | `gap:12` (RN 0.71+) o `marginRight` |
| `overflow-y: auto` | `<ScrollView>` |
| `position: sticky; top: 0` | `position:'absolute'` o header fuera del scroll |
| `min-height: 100vh` | `flex:1` en SafeAreaView |
| `max-width: 420px; margin: 0 auto` | No necesario en móvil (ocupa todo el ancho) |
| `border-bottom: 1px solid #F3F4F6` | `borderBottomWidth:1, borderBottomColor:'#F3F4F6'` |
| `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` | `elevation:3` (Android) + `shadowColor/Offset/Opacity/Radius` (iOS) |
| `backdrop-filter: blur(16px)` | `<BlurView intensity={16}>` (expo-blur) |
| `border-radius: 18px 18px 4px 18px` | `borderTopLeftRadius:18, borderTopRightRadius:18, borderBottomLeftRadius:4, borderBottomRightRadius:18` |
| `animation: spin 20s linear infinite` | `Animated.loop(Animated.timing(...))` |
| `transition: opacity 0.2s` | `Animated.timing` o `LayoutAnimation` |
| `env(safe-area-inset-bottom)` | `useSafeAreaInsets().bottom` |
| `KeyboardAvoidingView` | `<KeyboardAvoidingView behavior="padding">` |
