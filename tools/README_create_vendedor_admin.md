# Crear usuario vendedor usando Firebase Admin

Este script crea una cuenta en Firebase Authentication y escribe un documento en `users/{uid}` con `role: 'vendedor'`.

Requerimientos
- Node.js instalado
- Un JSON de cuenta de servicio (service account) de Firebase con permisos para Auth y Firestore

Instalación
```powershell
cd <ruta-del-repo>/tools
npm install firebase-admin
```

Uso
```powershell
node create_vendedor_admin.js --serviceAccount ./serviceAccount.json --email vendedor-prueba@example.com --password Prueba1234 --nombre "Vendedor Prueba"
```

Notas de seguridad
- No subas el JSON de la cuenta de servicio al repositorio público.
- Ejecuta este script solo desde tu máquina o entorno seguro.

Si necesitas que cree la cuenta yo directamente, deberás proporcionarme el JSON de la cuenta de servicio (no lo recomiendo por seguridad). En su lugar, ejecuta el comando anterior en tu máquina.
