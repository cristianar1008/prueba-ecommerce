# Gobernanza de IA — Core E-Commerce · Descuentos Acumulativos

Este proyecto se construyó con asistencia de Claude (Anthropic) como copiloto principal, usado de forma continua a lo largo de todo el desarrollo — generación de código, revisión, pruebas y documentación. Este documento responde a la sección 5 del enunciado: describe el prompt/skill estructurado creado para automatizar tareas, el sub-agente configurado con rol y reglas propias, y la bitácora de co-creación, incluyendo los casos concretos en que se rechazaron o corrigieron sugerencias de la IA por criterios técnicos de ingeniería.

## 1. Skill / prompt automatizado

**`generar-mocks-tests-backend`** — skill estructurado, creado durante este proyecto y guardado como skill reutilizable, invocable en cualquier sesión futura para generar el andamiaje de pruebas unitarias del backend.

Automatiza exactamente la tarea que da el enunciado como ejemplo: generación de mocks de pruebas unitarias, pero adaptada a las convenciones reales de este proyecto en vez de un patrón genérico. El prompt estructurado codifica seis reglas fijas que cualquier test generado debe cumplir:

1. Las clases de `domain/discount/*` y `domain/model/*` se testean con JUnit 5 puro, sin `@SpringBootTest` ni contexto de Spring — se instancian con `new` directamente.
2. Los puertos (`DiscountPolicyProvider`, `CouponPolicyProvider`) se mockean con Mockito, nunca con una implementación JPA real.
3. Estilo Given/When/Then, con nombres de método descriptivos en español que digan la regla de negocio probada (ej. `debeAplicarDescuentoDeCategoriaSoloATecnologia()`), no `test1()`.
4. Casos de borde obligatorios en toda regla nueva: el límite exacto (si aplica), entrada inválida, y el caso feliz documentado en el enunciado.
5. `BigDecimal` siempre, comparado con `compareTo(...) == 0` o `isEqualByComparingTo(...)`, nunca con `equals()` de `BigDecimal` (que también compara la escala) ni con `double`.
6. Antes de escribir el archivo, el skill lista los casos de borde que va a cubrir para que se revisen y se aprueben o corrijan — nunca genera el archivo final sin ese paso intermedio.

Antes de tener este skill, pedir tests nuevos producía resultados inconsistentes con el estilo real del proyecto (a veces con `@SpringBootTest` innecesario, a veces comparando `BigDecimal` con `assertEquals` de doble). Estructurar el prompt como skill reutilizable resolvió eso de raíz: cada test generado sigue exactamente el mismo patrón que `CategoryDiscountRuleTest.java` o `CouponQueryServiceTest.java`, sin tener que repetir las reglas de contexto en cada pedido.

## 2. Agente / sub-agente

**`auditor-descuentos`** — sub-agente con rol y reglas propias, configurado en el repositorio en [`.claude/agents/auditor-descuentos.md`](../.claude/agents/auditor-descuentos.md), ejecutable en cualquier entorno con Claude Code apuntando a este proyecto.

Rol: auditor de solo lectura (`tools: Read, Grep, Glob` — explícitamente sin permiso de escritura) especializado en el motor de descuentos y en los límites transaccionales del backend. Se invoca después de cualquier cambio en `domain/discount/*`, `domain/model/DiscountContext.java` o en servicios que toquen entidades JPA con relaciones `LAZY`. Nunca corrige código — solo reporta hallazgos (archivo, línea, severidad, qué regla incumple y por qué importa para el negocio), dejando la decisión de corregir fuera del propio agente.

Las reglas que audita no son genéricas: están escritas a partir de errores reales de este mismo proyecto (ver sección 3), así que el agente comprueba específicamente lo que ya falló una vez:

- Orden fijo de la cadena (categoría → volumen → cupón → tope) y que `VolumeDiscountRule`/`CouponDiscountRule` calculen sobre `getSubtotalAfterAppliedDiscounts()`, no sobre el subtotal original.
- Que ninguna clase de `domain/discount/*` o `domain/model/*` importe Spring, JPA o Lombok.
- Que ninguna regla intermedia redondee con `.setScale()` antes de `DiscountCapRule.closeWithFinalTotal()`, y que el tope del 35% se compare con `compareTo(...) > 0`, nunca con igualdad.
- Que todo servicio que lea una relación `@ManyToOne(fetch = LAZY)` fuera de una transacción ya abierta tenga `@Transactional` — la regla exacta que hubiera detectado, antes de llegar a producción, el bug real descrito en el ejemplo 1 de la sección 3.
- Cobertura de los 4 casos de borde exigidos por 4.3 (límite del 35%, carrito vacío/corrupto, cupón no registrado/expirado, stock insuficiente) en cualquier test nuevo o modificado.

## 3. Bitácora de co-creación

### 3.1 Qué fue sugerido por IA y qué fue definido/validado manualmente

La arquitectura del proyecto —arquitectura hexagonal en el backend, la separación en `core`/`shared`/`features` en el frontend, y los patrones de diseño aplicados— fue planteada de antemano, no propuesta por la IA: se definió primero qué forma iba a tener la solución y por qué, y la IA se usó principalmente para implementar esa arquitectura ya decidida. En algunas decisiones puntuales de diseño —por ejemplo, bloqueo pesimista vs. optimista para el stock, o cómo preservar precisión en `BigDecimal` sin redondeos intermedios— sí se consultó a la IA como segunda opinión técnica antes de decidir, pero la decisión final y su justificación quedaron a cargo del desarrollo, documentadas en `docs/arquitectura.md` sección 9.

Sobre el código en sí, la IA se usó para generar buena parte de las clases concretas (entidades, DTOs, controladores, servicios, componentes de Angular, mappers y pruebas unitarias) a partir de especificaciones ya definidas, mientras que el trabajo manual se concentró en tres cosas que el enunciado pide evaluar explícitamente: plantear la arquitectura y las reglas de negocio antes de generar nada, verificar línea por línea que lo generado cumpliera esas reglas exactas, y decidir cómo corregir cuando no las cumplía.

En términos de proporción: se estima un 60% de trabajo manual directo (arquitectura, diseño de las reglas de negocio, verificación del motor de descuentos contra el enunciado contrastando montos calculados contra la aplicación corriendo, pruebas manuales de cada flujo, y las decisiones de configuración y datos de demo) y un 40% de código generado con asistencia de IA a partir de esas decisiones ya tomadas. La responsabilidad de validar que ese 40% generado fuera correcto también fue manual, y los cuatro casos siguientes documentan ejemplos concretos donde esa revisión encontró un error real.

### 3.2 Sugerencias de la IA rechazadas o corregidas

**1. `ProductQueryService` — `LazyInitializationException` evitada en la raíz con `JOIN FETCH`.**
La primera versión de `ProductQueryService.listAll()` mapeaba `product.getCategory().getName()` sobre entidades obtenidas con un `findAll()` simple. `Product.category` es `@ManyToOne(fetch = FetchType.LAZY)`: sin una sesión de Hibernate abierta en ese momento, esa lectura explota con `LazyInitializationException` en cuanto el frontend pide el catálogo — un error de runtime, no de compilación, así que no se detecta hasta ejecutar la aplicación. Se detectó probando el endpoint, y se corrigió en la raíz, no con un parche: se agregó `ProductRepository.findAllWithCategory()` con `@Query("SELECT p FROM Product p JOIN FETCH p.category")`, que trae la categoría en la misma consulta SQL. Se prefirió esto a envolver el método en `@Transactional` porque acá se piden todos los productos de una sola vez — el `JOIN FETCH` resuelve el problema sin abrir una sesión más ancha de lo necesario.

**2. `CouponQueryService` — el mismo tipo de bug, corregido con una estrategia distinta según el contexto.**
`GET /api/coupons/{code}` (validación de cupón) tiene el mismo riesgo: `JpaCouponPolicyProvider` lee `coupon.getState().getName()`, y `Coupon.state` también es `LAZY`. Acá no se aplicó la misma solución que en el caso anterior — `CouponRepository.findByCodeIgnoreCase(...)` es una consulta derivada simple, reutilizada también por `CheckoutService`, así que agregar un `JOIN FETCH` ahí habría afectado a otros consumidores sin necesidad. En su lugar, se corrigió el problema en el límite del servicio, agregando `@Transactional(readOnly = true)` a `CouponQueryService.validate()` — la sesión de Hibernate queda abierta solo mientras dura esa consulta puntual. `checkout()` y `simulate()` en `CheckoutService` no tienen este problema porque ya corren dentro de su propio `@Transactional`. Elegir una corrección distinta para el mismo tipo de bug, según qué tan compartida está la consulta de por medio, fue una decisión de ingeniería tomada aparte, no algo que la IA propusiera por sí sola.

**3. Tipado estricto incompleto: `strict` y `strictTemplates` nunca quedaron activados en el frontend.**
El código de Angular generado era, en la práctica, ya compatible con TypeScript estricto (sin ningún `any` implícito), pero el `tsconfig.json` nunca tuvo `"strict": true` activado, y `angularCompilerOptions` tampoco tenía `"strictTemplates": true` — un caso típico de que el código *parezca* tipado estricto sin que el compilador lo esté exigiendo de verdad. Se detectó auditando el proyecto contra el requisito 4.2 del enunciado ("tipado estricto de extremo a extremo") en vez de asumir que estaba cumplido porque el estilo del código se veía prolijo, y se activaron ambas banderas. Se verificó con `tsc --noEmit` sobre `tsconfig.app.json` y `tsconfig.spec.json`, y con una corrida completa de build + tests, que activar el modo estricto no generara ni un solo error nuevo — confirmando que el código ya cumplía el requisito, solo que nada lo estaba exigiendo formalmente.

**4. Filtro de precio del catálogo: un bug de UX que la IA introdujo y que se encontró probando la app.**
Al agregar el filtro de rango de precio en el catálogo, la primera versión ataba el atributo `[value]` del `<input>` a un valor *derivado* (`String(Number(textoCrudo))`) recalculado en cada tecla — esto reformatea silenciosamente lo que el usuario está escribiendo (borra un punto decimal al final, ceros a la izquierda, etc.), haciendo que el campo parezca "pelear" contra quien escribe. Se detectó probando el filtro manualmente, con capturas concretas del comportamiento incorrecto. La corrección separó dos cosas que la versión original mezclaba: el texto crudo que el usuario escribe (`minPriceText`/`maxPriceText`, lo único que el `<input>` refleja) del valor numérico derivado (`minPrice`/`maxPrice`, calculado aparte y usado solo para filtrar, nunca vuelto a escribir sobre el campo).
