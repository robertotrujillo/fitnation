# Guía de Despliegue: FitNation (React + Vite + Supabase)

Esta guía detalla paso a paso cómo desplegar tu aplicación React en una VPS compartida usando Nginx.

**Datos del proyecto:**
- **Subdominio:** `fitnation.drogon.online`
- **Ruta de despliegue:** `/var/www/fitnation.drogon.online/`
- **Tipo:** SPA (Single Page Application)
- **Servidor Web:** Nginx

---

## 1. Preparación y Construcción (Local)

### Variables de Entorno
En Vite, las variables de entorno (`VITE_...`) se **integran en el código** durante el proceso de construcción (`build`).
*   **Localmente:** Asegúrate de tener tu archivo `.env.local` con tus credenciales de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
*   **En Producción:** **NO** subes el archivo `.env` al servidor. Como la app es estática (solo HTML/JS/CSS), las credenciales ya estarán "quemadas" dentro de los archivos JS en la carpeta `dist/`.
    *   *Nota:* Si necesitas cambiar una variable en producción, debes cambiarla en tu `.env.local`, ejecutar `npm run build` de nuevo y volver a subir la carpeta `dist/`.

### Construir los archivos estáticos
Ejecuta el siguiente comando en tu terminal (en la carpeta del proyecto):

```bash
npm run build
```

Esto generará una carpeta `dist/` con todo lo necesario.

---

## 2. Subir archivos al servidor (VPS)

No subiremos `node_modules` ni `src`. Solo el contenido de `dist/`.

Usa `scp` (protocolo SSH de copia) para subir los archivos. Ejecuta esto desde tu terminal local (PowerShell o Git Bash):

```bash
# Reemplaza 'usuario' con tu usuario de la VPS
scp -r dist/* usuario@fitnation.drogon.online:/var/www/fitnation.drogon.online/
```

*Si el servidor usa un puerto SSH distinto al 22 (ej. 2222), añade `-P 2222`.*

**Alternativa Manual (FileZilla):**
Si prefieres interfaz gráfica, conecta por SFTP a la IP de la VPS, navega a `/var/www/fitnation.drogon.online/` y arrastra todo el contenido de tu carpeta `dist/` local allí.

---

## 3. Configuración de Nginx (En la VPS)

Conéctate por SSH a tu VPS:
```bash
ssh usuario@fitnation.drogon.online
```

### Crear el Bloque de Servidor
Crea el archivo de configuración para tu sitio:

```bash
sudo nano /etc/nginx/sites-available/fitnation.drogon.online.conf

*Nota: Si tu instalación de Nginx no tiene `sites-available`, revisa si existe `/etc/nginx/conf.d/`. En ese caso, crea el archivo directamente ahí y sáltate el paso del "symlink".*

```

**Copia y pega la siguiente configuración:**

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name fitnation.drogon.online;

    root /var/www/fitnation.drogon.online;
    index index.html;

    # Logs específicos para tu sitio (opcional, ayuda a debugear)
    access_log /var/log/nginx/fitnation_access.log;
    error_log /var/log/nginx/fitnation_error.log;

    location / {
        # Configuración crítica para React Router:
        # Si no encuentra el archivo ($uri) ni la carpeta ($uri/), 
        # sirve index.html para que React maneje la ruta.
        try_files $uri $uri/ /index.html;
    }

    # Opcional: Cacheo agresivo para assets estáticos (js/css/imágenes)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

Guarda el archivo (`Ctrl+O`, `Enter`) y sal (`Ctrl+X`).

### Habilitar el sitio
Crea un enlace simbólico (symlink) a la carpeta `sites-enabled`:

```bash
sudo ln -s /etc/nginx/sites-available/fitnation.drogon.online.conf /etc/nginx/sites-enabled/
```

### Verificar y Recargar
Antes de aplicar cambios, verifica que la sintaxis sea correcta:

```bash
sudo nginx -t
```
*Debe decir: `syntax is ok`, `test is successful`.*

Si todo está bien, recarga Nginx (sin detener el servicio):

```bash
sudo systemctl reload nginx
```

---

## 4. HTTPS (SSL con Certbot)

Si tienes `certbot` instalado y configurado en la VPS, ejecuta:

```bash
sudo certbot --nginx -d fitnation.drogon.online
```
Sigue las instrucciones. Elige "Redirect" (2) si te pregunta si quieres redirigir todo el tráfico HTTP a HTTPS. 
Certbot modificará automáticamente tu archivo `.conf` anterior.

---

## 5. Checklist de Verificación y Reversión

### Verificación
1.  Visita `http://fitnation.drogon.online`. Deberías ver tu app.
2.  Navega a una ruta (ej. `/app/dashboard`).
3.  **Refresca la página (`F5`).** Si Nginx está bien configurado, la página **no** debería dar un error 404, sino recargar la app correctamente.

### Reversión (Si algo sale mal)
Si tu configuración rompió Nginx o tu sitio no carga:

1.  **Eliminar enlace simbólico** (Deshabilita el sitio sin borrar la config):
    ```bash
    sudo rm /etc/nginx/sites-enabled/fitnation.drogon.online.conf
    sudo systemctl reload nginx
    ```
2.  **Backup de configuración:**
    Antes de editar mucho, haz una copia:
    ```bash
    sudo cp /etc/nginx/sites-available/fitnation.drogon.online.conf /etc/nginx/sites-available/fitnation.drogon.online.conf.bak
    ```

---

## Solución de Errores Típicos

| Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| **404 Not Found al refrescar** | Falta `try_files` en Nginx | Asegúrate de que la línea `try_files $uri $uri/ /index.html;` esté en el bloque `location /`. Recarga Nginx. |
| **403 Forbidden** | Permisos incorrectos | Verifica que Nginx pueda leer la carpeta. Ejecuta: `sudo chmod -R 755 /var/www/fitnation.drogon.online`. |
| **Página en blanco** | Error de JS o base path | Abre la consola del navegador (`F12`). Si ves errores de carga de archivos (`/assets/... 404`), verifica que no tengas un `base: '/algo'` incorrecto en `vite.config.js`. Debe ser `/` (por defecto). |
| **La app no conecta a Supabase** | Variables de entorno faltantes | Recuerda que las variables `VITE_` se queman al hacer `build`. Si las cambiaste, debes hacer `npm run build` de nuevo y resubir la carpeta `dist`. |
