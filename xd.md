 am waiting for the project to build and export the static pages. I will get notified immediately when the task is complete.

Npm run build finished
El proceso de compilación estática (output: 'export') ha fallado con el siguiente error:

Error: Page "/api/admin/tickets/[id]/invite" is missing "generateStaticParams()" so it cannot be used with "output: export" config.

Por qué pasa esto: Next.js no permite exportar de manera estática (SSG) proyectos que contengan rutas de API (/api/...) o lógica de servidor, ya que los navegadores no pueden ejecutar código de Node.js, conexiones a bases de datos (Prisma) o envío de correos (Nodemailer). Para usar Firebase estático, tendríamos que eliminar por completo todo el backend, el sistema de login, la base de datos y los pagos, lo cual rompería la aplicación Mercav por completo.

Volvamos a la Opción A (Vercel): Es la mejor solución y es gratis
Dado que en Vercel no necesitas tarjeta de crédito y la plataforma soporta el backend de Next.js de forma nativa en su capa gratuita (Hobby):

Sube el proyecto a GitHub (esto ya lo hicimos con éxito en tu repositorio: https://github.com/invertilo/mercav).
Abre Vercel e inicia sesión usando tu cuenta de GitHub.
Haz clic en "Add New" -> "Project" y selecciona tu repositorio mercav.
En la configuración de variables de entorno de Vercel, copia y pega las variables de tu archivo .env (como la base de datos y las claves de Stripe/NextAuth).
Haz clic en "Deploy" y ¡listo! Tu web estará funcionando completamente con backend y frontend.
Antes de que hagas eso, voy a revertir la configuración estática local para que el proyecto vuelva a estar 100% listo para producción en Vercel o en cualquier servidor normal (eliminando output: 'export' de next.config.mjs y dejando firebase.json limpio). ¿Te parece bien?