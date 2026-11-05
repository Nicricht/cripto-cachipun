# Informe técnico final: Cripto Cachipún

**Asignatura:** BCY0010 · Fundamentos de Blockchain  
**Evaluación:** Parcial 2  
**Estudiante:** Nicolás Iván Vega Linero  
**Fecha:** 5 de noviembre de 2026  

Proyecto académico. Solo Ethereum Sepolia y Ether de prueba. No utilizar con fondos reales.

## Datos del despliegue

| Dato | Valor |
|---|---|
| Red | Ethereum Sepolia, chain ID `11155111` |
| Contrato | `0xfb96470312fAA99Cf63186328a5a7e796458c04A` |
| Verificación | Etherscan, Source Code Verified, Exact Match |
| Transacción de despliegue | `0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c` |
| Bloque | `12068668` |
| Compilador | Solidity 0.8.24, EVM Shanghai, optimizador 200 runs |
| CI | 9 pruebas Solidity, 10 pruebas de helpers frontend y build web, SUCCESS. Commit `3a687e8c567048c7a6b1f2260dff740eaec65977` |


## 1. Resumen del proyecto y despliegue

En este proyecto desarrollamos **Cripto Cachipún**, una aplicación descentralizada para jugar Piedra, Papel o Tijera entre dos participantes. Cada jugador deja una apuesta en Ether de prueba y el contrato inteligente aplica las reglas. El objetivo es evitar que alguien cambie su elección después de conocer la del rival y que el resultado dependa de una persona que administre la partida.

Para lograrlo utilizamos el mecanismo **Commit-Reveal**. Primero cada jugador envía un hash que representa su jugada y un secreto aleatorio. Cuando los dos compromisos quedan registrados, ambos revelan la jugada y el secreto. El contrato vuelve a calcular los hashes, comprueba que coincidan y determina el resultado.

La demostración se realizó en **Ethereum Sepolia**, una red de pruebas. No se utilizaron fondos reales. En la partida documentada, A eligió Piedra y B eligió Tijera. Cada uno comprometió 0,001 ETH de prueba, el pozo llegó a 0,002 ETH y ganó A.

### Arquitectura utilizada

| Elemento | Función en el proyecto |
| --- | --- |
| MetaMask | Conecta las cuentas y solicita al jugador que firme cada transacción. |
| Interfaz Vite + JavaScript | Muestra el estado del juego y prepara las acciones de cada jugador. |
| ethers v6 | Permite que la interfaz consulte el contrato y envíe transacciones. |
| Contrato Solidity | Valida compromisos, aplica las reglas y distribuye o devuelve el Ether. |
| Ethereum Sepolia | Red de pruebas donde quedó desplegado el contrato. |

### Datos del despliegue

| Dato | Valor del registro del proyecto |
| --- | --- |
| Red / chain ID | Ethereum Sepolia / 11155111 |
| Contrato | 0xfb96470312fAA99Cf63186328a5a7e796458c04A |
| Verificación | Etherscan, Source Code Verified, Exact Match |
| Transacción de despliegue | 0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c |
| Bloque | 12068668 |
| Compilador | Solidity 0.8.24, EVM Shanghai, optimizador de 200 runs |
| CI | Solidity and Web CI: 9 pruebas Solidity, 10 pruebas de helpers frontend y build web, SUCCESS |

El frontend se ejecuta localmente con Vite, normalmente en http://localhost:5173. Eso no significa que la blockchain sea local: las operaciones de la demostración se enviaron a Sepolia. El frontend continúa en el PR #1 en estado DRAFT, por lo que todavía no está publicado como sitio web público.

## 2. Envío de transacciones y apuestas

Antes de jugar, cada participante conecta una cuenta distinta de MetaMask y comprueba que la red sea Sepolia. La aplicación consulta el contrato para saber si hay jugadores, cuánto se debe apostar y en qué fase está la partida.

**Jugador A:** elige su jugada y define el monto. La aplicación genera un secreto aleatorio de 32 bytes, calcula el hash del compromiso y guarda la jugada y el secreto en el almacenamiento local del navegador. Después prepara la función `comprometer(bytes32)` y envía la apuesta en el campo `value`. MetaMask muestra la solicitud para que A la revise y firme.

**Jugador B:** se conecta desde otra dirección, elige su jugada y compromete exactamente el mismo monto. El contrato comprueba que B no sea la misma dirección de A, que el plazo para unirse no haya vencido y que `msg.value` sea igual a la apuesta inicial. Al aceptar el segundo compromiso, la fase cambia a Reveal y comienza el plazo de cinco minutos.

En la etapa **Reveal**, cada jugador envía su jugada y su secreto mediante una transacción. El contrato calcula nuevamente el hash y lo compara con el compromiso guardado. Cuando se confirma la segunda revelación válida, el contrato resuelve la partida y realiza el pago en esa misma transacción. No hace falta una quinta transacción separada para pagar al ganador.

### Flujo completo

| Paso | Acción del jugador | Qué hace la DApp o el contrato |
| --- | --- | --- |
| 1. Conectar | A y B conectan MetaMask en Sepolia. | Comprueba chain ID 11155111 y consulta el estado. |
| 2. Commit A | A elige jugada y apuesta 0,001 ETH. | Genera secreto y hash; registra cuenta, compromiso, apuesta y plazo. |
| 3. Commit B | B usa otra dirección y aporta 0,001 ETH. | Valida identidad, plazo y monto; cambia a Reveal. |
| 4. Reveal | Ambos envían jugada y secreto. | Recalcula los hashes y valida que coincidan. |
| 5. Resolver | No se necesita un árbitro. | La segunda revelación válida activa la comparación y el pago. |

Una transacción de escritura incluye la cuenta de origen (from), el contrato de destino (to), la función y sus parámetros (data), el Ether enviado (value), el nonce, el límite de gas y la firma. En comprometer, value es la apuesta. En Reveal normalmente es cero. El gas se paga aparte y no forma parte del pozo (Ethereum.org, s. f.-b).

## 3. Llaves públicas, privadas y funcionamiento como DApp

### Llaves y firmas

Una cuenta normal de Ethereum, llamada EOA, utiliza un par de llaves criptográficas. La **llave privada** permite firmar transacciones y debe permanecer bajo el control de su dueño. La **llave pública** se deriva de la privada y, a partir de ella, se obtiene la dirección que se comparte para identificar la cuenta. La dirección no es la llave privada y no permite firmar por sí sola (Ethereum.org, s. f.-a).

En Cripto Cachipún, MetaMask administra la llave privada y firma cada transacción cuando el usuario la confirma. La aplicación recibe la dirección pública y solicita operaciones a la billetera, pero no necesita leer ni guardar la llave privada. La red verifica la firma y el contrato identifica al remitente mediante `msg.sender`.

El secreto de Commit-Reveal es otro dato. Es un valor aleatorio de 32 bytes que se combina con la jugada y la dirección para generar el hash. No controla la billetera ni firma transacciones. Cuando el jugador revela, ese secreto queda visible en los datos de la transacción. Por eso debe mantenerse oculto hasta Reveal y no debe confundirse con la frase semilla o la llave privada.

El hash tampoco cifra la jugada para después descifrarla. Funciona como una huella criptográfica: el contrato vuelve a calcularla durante Reveal y comprueba que corresponda al compromiso original.

### ¿Por qué se considera una DApp?

Cripto Cachipún combina una interfaz web con un contrato que ejecuta las reglas en la blockchain. La interfaz no decide quién gana ni administra el pozo. Su función es mostrar el estado, recoger la selección y preparar las operaciones para que MetaMask las firme.

Hay una diferencia entre leer y escribir. Consultar jugadores, apuesta, fase, plazo o ganador no modifica el estado y no requiere una transacción firmada. En cambio, comprometer, revelar y reclamarPorTiempo sí cambian el estado, por lo que necesitan una transacción y gas (Ethereum.org, s. f.-c).

En el frontend, contract.js contiene la dirección, el chain ID y el ABI. main.js coordina la conexión y las acciones; commitment.mjs genera el secreto y el hash; y game-rules.mjs contiene validaciones de red, roles y plazos.

La instancia desplegada administra una sola partida. Cuando termina, no se reinicia. Para jugar otra vez se necesita una nueva instancia del contrato. Esta es una limitación del prototipo.

## 4. Estructura del contrato y manejo de Ether

El contrato CriptoCachipun está escrito en Solidity 0.8.24. Utiliza tres enumeraciones y una estructura para ordenar los datos del juego.

| Estructura | Qué representa |
| --- | --- |
| Jugada | Ninguna, Piedra, Papel o Tijera. |
| Fase | Commit, Reveal o Terminado. |
| Resultado | Pendiente, victoria de A o B, empate, abandono o anulación. |
| Jugador | Dirección, hash comprometido, jugada revelada e indicador de revelación. |
| Variables de estado | Apuesta, límites de tiempo, fase, resultado y ganador. |

### Funciones principales

| Función | Responsabilidad |
| --- | --- |
| comprometer(bytes32) | Es payable. Recibe el hash y Ether; valida fase, hash, monto, dirección y plazo. |
| calcularCompromiso(...) | Calcula keccak256 con jugada, secreto y dirección. |
| revelar(...) | Comprueba fase, plazo, jugador, no repetición y coincidencia del hash. |
| reclamarPorTiempo() | Resuelve vencimientos y devoluciones. Puede llamarla cualquier dirección. |
| _resolver() | Compara las jugadas y decide ganador o empate. |
| _transferir(...) | Envía Ether con call y comprueba que la transferencia resulte exitosa. |

### Fragmentos de código utilizados

```solidity
return keccak256(
    abi.encodePacked(uint8(_jugada), _secreto, _jugador)
);
```

Este cálculo combina la jugada, el secreto y la dirección del jugador. El orden y los tipos deben coincidir en Solidity y JavaScript.

```solidity
require(msg.value > 0, "La apuesta debe ser mayor que cero");
require(msg.value == apuesta, "La apuesta debe coincidir");
```

La primera condición evita apuestas de cero. La segunda exige que B aporte el mismo monto que A. Si una condición no se cumple, la transacción se revierte.

```solidity
(bool enviado, ) = _destinatario.call{value: _monto}("");
require(enviado, "La transferencia de Ether fallo");
```

La función de pago revisa el resultado de call. Antes de hacer la llamada externa, el contrato cambia la fase a Terminado. Así reduce el riesgo de reentrada siguiendo Checks-Effects-Interactions.

## 5. Lógica del juego, resultados y plazos

Las jugadas se representan con valores numéricos: 0 es Ninguna, 1 es Piedra, 2 es Papel y 3 es Tijera. Piedra vence a Tijera, Tijera vence a Papel y Papel vence a Piedra.

En la fase Commit, A registra primero el hash y una apuesta mayor que cero. B debe ser otra dirección, unirse antes del límite y enviar exactamente el mismo monto. Cuando B se une, comienza la fase Reveal y se fija un plazo de cinco minutos.

En Reveal, cada jugador envía su jugada y secreto. El contrato vuelve a calcular el hash con los mismos tipos y el mismo orden. Si el resultado no coincide, la transacción se revierte. También comprueba que el remitente sea A o B, que no haya revelado antes y que el plazo siga vigente.

Cuando ambos han revelado, _resolver() compara las jugadas. Si son iguales, devuelve a cada jugador lo que aportó. Si hay ganador, le transfiere el pozo completo, equivalente a dos apuestas.

### Qué pasa en cada caso

| Situación | Resultado que aplica el contrato |
| --- | --- |
| Hay ganador | El ganador recibe el pozo completo, es decir, 0,002 ETH si cada uno apostó 0,001 ETH. |
| Empate | Cada jugador recupera su apuesta. |
| B no se une a tiempo | La partida se anula y A puede recuperar su apuesta. |
| Solo uno revela | Después del plazo, quien reveló puede recibir el pozo por abandono del otro. |
| Ninguno revela | Después del plazo, se devuelve la apuesta a ambos. |

El vencimiento no ejecuta código por sí solo. Una cuenta debe enviar una transacción a reclamarPorTiempo() para activar la devolución o el resultado por abandono. Cualquier dirección puede llamar esa función cuando ya venció el plazo. La decisión se toma con los datos guardados en el contrato.

### Resultado de la demostración

| Dato | Resultado observado |
| --- | --- |
| Jugador A | Piedra |
| Jugador B | Tijera |
| Apuesta por jugador | 0,001 ETH de prueba |
| Pozo total | 0,002 ETH de prueba |
| Resultado | Ganó el jugador A y la partida quedó finalizada. |

## 6. Análisis de seguridad: riesgos y mitigaciones

La seguridad depende tanto del contrato como de la forma en que se utiliza la aplicación. Se agregaron validaciones para reducir errores, pero las pruebas no equivalen a una auditoría profesional ni permiten afirmar que el sistema esté libre de vulnerabilidades. La documentación de Solidity recomienda revisar especialmente las llamadas externas, los datos expuestos y los posibles reingresos (Solidity, s. f.).

| Riesgo | Control aplicado | Límite que permanece |
| --- | --- | --- |
| Filtración de jugada | Commit-Reveal usa un secreto aleatorio y un hash. | Si el secreto se filtra antes de revelar, se pierde la protección. |
| Pérdida del secreto | Se guarda por contrato y dirección en localStorage. | No está cifrado por la DApp; si se borra, no se recupera. |
| Compromiso copiado | El hash incluye la dirección y se valida msg.sender. | La cuenta debe mantenerse durante toda la partida. |
| Apuesta incorrecta | require exige apuesta positiva e igual para B. | No existe un tope máximo de apuesta en el contrato. |
| Reentrada | La fase cambia a Terminado antes de transferir. | No hay auditoría externa ni modificador nonReentrant. |
| Fallo de pago | call y require comprueban el envío. | Si el destinatario rechaza Ether, la liquidación puede revertirse. |
| Manipulación de tiempo | Se comparan los plazos con block.timestamp. | El tiempo del bloque no es un reloj exacto. |
| Red equivocada | La interfaz comprueba Sepolia antes de escribir. | El usuario debe revisar también la red y los datos en MetaMask. |

La mejora más importante antes de usar fondos reales sería agregar límites de apuesta, mejorar la protección y recuperación del secreto, probar los casos de fallo de pago y solicitar una auditoría independiente. El contrato actual debe mantenerse en Sepolia y utilizarse solo con Ether de prueba.

**Pruebas realizadas:** el registro de CI indica nueve pruebas automatizadas de Solidity y diez pruebas de helpers del frontend, además de compilación y build web. Estas pruebas revisan casos previstos, pero no sustituyen una auditoría ni garantizan ausencia de errores.

## 7. Auditoría, trazabilidad y enfoque NABC

### Cómo se puede revisar lo que ocurrió

La trazabilidad se apoya en el código verificado, el hash de cada transacción y los eventos emitidos por el contrato. Una transacción permite revisar el remitente, el contrato destinatario, el valor, el bloque, el estado y el gas. Los eventos dejan constancia de las acciones importantes.

| Evento | Información que registra |
| --- | --- |
| CompromisoGuardado | Dirección del jugador, hash comprometido y monto. |
| FaseRevealIniciada | Límite de tiempo para revelar. |
| JugadaRevelada | Dirección del jugador y jugada revelada. |
| PagoRealizado | Destinatario y cantidad de Ether transferida. |
| JuegoResuelto | Ganador, tipo de resultado y monto total resuelto. |

El contrato está en Sepolia en la dirección 0xfb96470312fAA99Cf63186328a5a7e796458c04A. La transacción de despliegue es 0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c, incluida en el bloque 12068668. Etherscan muestra el código fuente como verificado con coincidencia Exact Match. El registro de CI del commit frontend 3a687e8c567048c7a6b1f2260dff740eaec65977 terminó con resultado SUCCESS.

**Límite de evidencia:** los cuatro hashes individuales de la partida (commit A, commit B, reveal A y reveal B) no se guardaron. Las capturas permiten observar el flujo y el resultado, pero no reemplazan los enlaces directos a cada transacción. Por eso no se inventan identificadores ni se presentan como recuperados.

### Pitch NABC

**Need:** evitar que un jugador cambie su elección después de conocer la del rival y asegurar reglas iguales para ambos.

**Approach:** ambos envían un hash y la misma apuesta; luego revelan. El contrato valida, compara y distribuye el Ether.

**Benefit:** reglas públicas, resultado automático y eventos que permiten revisar las acciones.

**Competition:** lo presencial es simple y lo centralizado puede ser cómodo. La DApp agrega verificación, pero requiere billetera y gas.

### Conclusión

Con Cripto Cachipún logramos desplegar y verificar un contrato en Sepolia, conectar dos cuentas de MetaMask y completar una partida con apuestas de prueba. El mecanismo Commit-Reveal permite ocultar la elección hasta que ambos jugadores estén comprometidos. El contrato compara las jugadas y ejecuta el pago según las reglas.

El proyecto aún tiene límites: una partida por contrato, el secreto queda en el navegador, no conservamos los hashes de la partida y falta una auditoría externa. Por eso es un prototipo académico y no debe usarse con fondos reales.

## 8. Evidencias visuales

El PDF de entrega incorpora tres figuras: confirmación del despliegue en Remix/MetaMask, compromiso del jugador A y fase Reveal con el resultado final. Las capturas muestran la ejecución en Sepolia.

**Contrato verificado:** https://sepolia.etherscan.io/address/0xfb96470312fAA99Cf63186328a5a7e796458c04A#code  
**Transacción de despliegue:** https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c

**Límite de trazabilidad:** no se conservaron los hashes individuales de commit A, commit B, reveal A y reveal B. No se inventan identificadores. El hash del despliegue sí está disponible.

## Relación con la pauta

| Criterio | Sección | Evidencia |
|---|---|---|
| IE1. Transacciones y apuestas | Sección 2 y figuras | Flujo A y B, MetaMask, apuestas, gas y reveal. |
| IE2. Llaves públicas y privadas | Sección 3 | Diferencia entre llaves, dirección, firma y secreto. |
| IE4. Contrato como DApp | Sección 3 | Arquitectura, lecturas, escrituras y frontend. |
| IE5. Análisis de seguridad | Sección 6 | Riesgos reales, controles y limitaciones. |
| IE8. Lógica del juego | Secciones 4 y 5 | Hash, apuesta, reveal, ganador, empate y abandono. |
| IE9. Estructura y Ether | Sección 4 | Enums, struct, funciones, payable, msg.value y pagos. |
| IE3. Approach del pitch | Sección 7 y PPT | Flujo completo entre jugadores y contrato. |
| IE6. Beneficios | Sección 7 y PPT | Automatización, transparencia y comparación. |
| IE7. Auditoría y trazabilidad | Sección 7 y PPT | Eventos, contrato Exact Match, CI y límites de evidencia. |
| IE10. Procedimiento completo | Secciones 2, 5 y 7 | Conexión, compromisos, reveal, resolución y pago. |

## Referencias (APA 7)

- Ethereum.org. (s. f.-a). Cuentas de Ethereum. https://ethereum.org/es/developers/docs/accounts/
- Ethereum.org. (s. f.-b). Transacciones. https://ethereum.org/developers/docs/transactions/
- Ethereum.org. (s. f.-c). Interactuar con contratos inteligentes. https://ethereum.org/es/developers/docs/smart-contracts/interacting/
- Solidity. (s. f.). Security considerations. https://docs.soliditylang.org/en/latest/security-considerations.html
- Nicricht. (2026). Cripto Cachipún: código fuente y documentación del proyecto. GitHub. https://github.com/Nicricht/cripto-cachipun
- Etherscan. (2026). CriptoCachipun, contrato en Ethereum Sepolia. https://sepolia.etherscan.io/address/0xfb96470312fAA99Cf63186328a5a7e796458c04A#code

**Alcance:** el proyecto es un prototipo académico de una partida por instancia. No tiene auditoría externa ni debe utilizar fondos reales.