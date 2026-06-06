# GanaConJuvenil 🎟️

## Descripción del Proyecto

Plataforma transaccional B2C diseñada para la gestión y venta de rifas digitales. El sistema permite a los usuarios participar en sorteos en tiempo real, garantizando una experiencia de compra fluida y segura, respaldada por un panel administrativo (Backoffice) que permite el control total del inventario y la verificación de pagos.

---

## 🛠️ Stack Tecnológico

El proyecto fue construido bajo un enfoque de **Arquitectura Serverless** para garantizar escalabilidad bajo alta demanda.

* **Frontend:** React, Vite, Tailwind CSS.
* **Backend & Cloud:** Firebase (Firestore, Authentication, Cloud Functions).
* **Gestión de Estado:** React Context API / Hooks.
* **Despliegue:** Firebase Hosting.

---

## 🚀 Desafíos Técnicos (Engineering Insights)

### Gestión de Alta Concurrencia

El mayor reto técnico fue evitar la colisión de boletos durante picos de tráfico. Para mitigar esto, se implementó:

- **Arquitectura Basada en Eventos:** Validación transaccional aislada mediante Cloud Functions para asegurar que dos usuarios no puedan adquirir el mismo número simultáneamente.
- **Sincronización en Tiempo Real:** Uso de *Firebase Firestore* para reflejar el estado del inventario en vivo, minimizando el lag entre la compra del usuario y la actualización del sistema.

### Panel Administrativo (Backoffice)

- Implementación de **Firebase Admin SDK** para la validación de pagos y auditoría de transacciones, asegurando la integridad de la data financiera del proyecto.

---

## 🏗️ Estructura del Proyecto

```bash
/src
  /assets         # Recursos visuales
  /components     # Componentes UI reutilizables
  /context        # Lógica de estado global
  /hooks          # Custom hooks para lógica transaccional
  /services       # Integración con Firebase SDK
  /pages          # Vistas principales (Home, Cart, Backoffice)
```

## 📝 Roadmap & Status
[x] Implementación de pasarela de validación.

[x] Panel administrativo seguro.

[x] Optimización de consultas para baja latencia.

[x] Integración de notificaciones automáticas vía WhatsApp.

## 👨‍💻 Autor
Jorge Diaz
Full-Stack Software Engineer
Especializado en Arquitectura de Software y Product Engineering.
