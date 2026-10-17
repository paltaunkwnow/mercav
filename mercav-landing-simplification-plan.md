# Plan para hacer más intuitiva la landing principal de Mercav

Fecha: 17 de octubre de 2026.
Estado: primera entrega implementada localmente el 17 de octubre de 2026. Pendiente de revisión visual final y publicación.

## Diagnóstico

La identidad visual actual funciona: tipografía cartel, bandas de color, demostraciones de producto, pixel art de Mervi y contrastes por área hacen que Mercav sea reconocible. El problema no es el diseño, sino que la página intenta explicar todos los módulos con la misma importancia.

Después del hero aparecen una cinta de módulos, una introducción a tres apps, un bloque Business con ocho capacidades y siete herramientas, Pwn, Kosher, países, una galería de seis Mervis, equipo, siete preguntas y otro CTA. En una inspección de accesibilidad local, la página supera 440 nodos interactivos o informativos antes del pie. Para una persona nueva, esto dificulta responder la primera pregunta: «¿Qué puedo hacer aquí hoy?».

La portada debe llevar a una decisión simple y conservar el resto como evidencia para quien quiera profundizar.

## Objetivo de experiencia

En los primeros segundos, una persona debe poder elegir uno de estos caminos:

1. **Quiero vender o gestionar mi negocio.**
2. **Quiero proteger mi negocio.**
3. **Quiero encontrar servicios Kosher.**

Cada camino debe ofrecer un CTA claro, una demostración y una frase de valor. Los demás módulos siguen siendo visibles, pero dejan de competir con esa decisión.

## Estructura propuesta

| Orden | Bloque | Cambio | Se conserva |
| --- | --- | --- | --- |
| 1 | Hero | Mantener titular, Mervi y teléfono. Cambiar el texto auxiliar por una promesa más concreta y sumar un selector de tres caminos debajo del CTA. | Estilo cartel, teléfono interactivo, CTA de cuenta y acceso. |
| 2 | Selector de caminos | Reemplazar la cinta como primer contenido de decisión por tres tarjetas compactas: Vender, Proteger, Kosher. Cada una baja a su sección y cambia el foco visual. | Colores amarillo, verde y azul ya asociados a cada área. |
| 3 | Business | Mostrar solo tres acciones iniciales: crear negocio, cargar qué vendés y compartir la página/menú. Caja, planillas, fidelización, publicidad, empleos y herramientas pasan a «Todo lo que podés sumar después». | Demo de caja, tarjeta de fidelización y el panel visual de Business. |
| 4 | Pwn | Conservar una única demo de consulta y el CTA. Ocultar de entrada la lista extensa de fuentes y CVE detrás de un enlace «Ver qué monitorea Pwn». | Fondo oscuro, verde y evidencia de monitoreo real. |
| 5 | Kosher | Mantener el atlas y próximo Shabat, con un solo selector de ciudad. El texto de comunidad y funciones adicionales se resume. | Teléfono/atlas, azul y presencia de Mervi. |
| 6 | Cobertura y confianza | Convertir el selector de 20 países en bloque secundario compacto; conservar el mapa y abrir el detalle al elegir un país. Integrar la presentación de Mervi dentro de confianza, en lugar de una galería completa independiente. | Mapa, datos locales, fundadores y FAQ. |
| 7 | Cierre | Mantener un solo CTA final, adaptado al camino elegido arriba cuando exista interacción. | Banda amarilla y Mervi celebrando. |

## Cambios concretos de contenido

### Hero

- Mantener «Tu negocio entero, en una sola cuenta».
- Sustituir la lista de cinco áreas en el subtítulo por: «Elegí cómo querés empezar: vender, proteger tu negocio o encontrar tu comunidad.»
- CTA principal: **Crear mi cuenta gratis**.
- CTA secundario visible: **Ver cómo funciona**; desplaza al selector de caminos.
- En escritorio, reducir los cuatro stickers flotantes a dos. El teléfono y Mervi deben seguir siendo el centro visual.

### Business como recorrido, no catálogo

El bloque actual debe explicar una secuencia, no mostrar ocho productos al mismo tiempo:

1. **Abrí tu negocio** — nombre y país.
2. **Cargá lo que vendés** — producto, precio y catálogo.
3. **Vendé o compartí tu página** — caja o enlace público.

Una tira o enlace «También tenés equipo, planillas, fidelización y herramientas» abre las capacidades secundarias. Así la promesa de la landing coincide con el onboarding que ya implementamos.

### Pwn y Kosher

- Pwn: una demostración, una prueba de confianza y un CTA. Las fuentes, CVE y detalles técnicos quedan en una capa opcional.
- Kosher: el atlas y el selector de Shabat son suficientes como demostración. Chat, modo Shabat y datos adicionales pasan a una línea corta o a la página del atlas.

### Mervi

Mervi debe acompañar decisiones relevantes, no requerir una sección de presentación separada. Se conserva en hero, Business, Kosher y CTA final. La historia breve de la mascota puede vivir en «Hay personas detrás» o en una página de marca.

## Reglas de diseño que no cambian

- No reemplazar el sistema cartel, la paleta actual ni la tipografía.
- Mantener bloques de color por producto: amarillo Business, verde Pwn, azul Kosher.
- Mantener demos reales o claramente rotuladas como ejemplo.
- Respetar movimiento reducido; la cinta o stickers restantes no deben ser necesarios para comprender la página.
- Mantener CTAs de al menos 44 px, orden de encabezados correcto y las mismas rutas actuales.
- No ocultar información legal, precios o seguridad: se mueve a la capa donde la persona la busca.

## Implementación por etapas

1. **Inventario y medición.** Documentar enlaces/CTAs actuales y definir eventos first-party mínimos y consentidos: CTA principal, camino elegido, llegada a registro y scroll a cada pilar.
2. **Hero y orientación.** Añadir selector de tres caminos, CTA secundario y navegación por anclas. No retirar contenido aún.
3. **Divulgación progresiva.** Reordenar Business alrededor del flujo inicial; convertir detalles de Pwn y Kosher en expansiones accesibles.
4. **Poda visual.** Reducir cinta, stickers y galería de Mervi sin tocar la identidad visual. Compactar región, confianza y FAQ.
5. **Validación.** Comparar escritorio y móvil de 390 px, navegación de teclado, lector de pantalla, movimiento reducido y rutas de cada CTA. Medir si más personas llegan a registro y a los tres destinos principales.

## Criterios de aceptación

- Una persona nueva identifica su camino y un CTA adecuado sin desplazarse más de una pantalla y media.
- Business no exige entender planillas, equipo, publicidad y herramientas antes de conocer caja/catálogo/página pública.
- La página conserva la apariencia Mercav y sus tres productos principales se sienten distintos.
- El contenido detallado sigue accesible, indexable cuando corresponda y sin duplicar rutas.
- En móvil, los primeros bloques no forman una pared de tarjetas ni obligan a recorrer demos antes de actuar.
- No empeoran contraste, carga inicial, foco, navegación con teclado ni preferencia de movimiento reducido.

## Primera entrega aplicada

Se aplicaron las etapas 2 y 3: hero con selector de caminos, eliminación de la cinta que competía por atención, Business reducido al recorrido «crear → cargar → vender/compartir» y capacidades avanzadas plegables. Pwn conserva su demo y deja los CVE en una expansión; la galería independiente de Mervi se eliminó porque Mervi ya acompaña los momentos principales de la página.
