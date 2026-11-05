# INFORME TÉCNICO DEFINITIVO
# CRIPTO CACHIPÚN

**Desarrollo de una DApp de Piedra, Papel o Tijera con apuestas de prueba en Ethereum Sepolia**  
**Asignatura:** BCY0010 · Fundamentos de Blockchain · Evaluación Parcial 2  
**Estudiante:** Nicolás Iván Vega Linero  
**Docente:** ____________________  
**Fecha:** 5 de noviembre de 2026

Proyecto académico. Solo red de pruebas. No se utilizaron fondos reales.

## Datos técnicos y enlaces

- Red: Ethereum Sepolia, chain ID `11155111`.
- Contrato: `0xfb96470312fAA99Cf63186328a5a7e796458c04A`.
- Verificación: Etherscan, **Source Code Verified — Exact Match**.
- Transacción de despliegue: `0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c`.
- Bloque: `12068668`.
- Compilador: Solidity `0.8.24+commit.e11b9ed9`, EVM Shanghai, optimizador 200 runs.
- Commit del contrato desplegado: `9b4e93eec8bd14178174d5ff3740dfbb7b062fc0`.
- Commit del frontend y CI: `3a687e8c567048c7a6b1f2260dff740eaec65977`.
- [Contrato verificado](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#code) · [Eventos](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#events) · [Despliegue](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c).

## 1. Resumen del proyecto y objetivo

En este proyecto desarrollamos Cripto Cachipún, una aplicación descentralizada para jugar Piedra, Papel o Tijera entre dos participantes. Cada jugador deja una apuesta en Ether de prueba y el contrato inteligente aplica las reglas del juego. La idea principal es que ninguno pueda cambiar su elección después de conocer la del otro y que el resultado no dependa de una persona que administre la partida.

Para resolver ese problema usamos Commit-Reveal. Primero cada jugador publica un hash que representa su jugada y un secreto aleatorio. Cuando los dos compromisos están guardados, ambos revelan su jugada y el secreto. El contrato vuelve a calcular los hashes, comprueba que coincidan y determina el resultado.

La partida demostrativa terminó con victoria del jugador A: A eligió Piedra, B eligió Tijera y cada uno comprometió 0,001 ETH de prueba. El pozo fue de 0,002 ETH y el contrato lo entregó al jugador A.

## 2. Arquitectura y despliegue

La solución se compone de cuatro elementos: MetaMask conecta las cuentas y solicita la firma; Vite y JavaScript muestran la interfaz; ethers v6 permite que la página lea el estado y prepare transacciones; y el contrato Solidity aplica las reglas en Sepolia.

La interfaz se ejecutó localmente con Vite en `http://localhost:5173`. Las transacciones se enviaron a Sepolia, no a una blockchain local. El frontend está en la rama `feat/sepolia-web-dapp` y el [Pull Request #1](https://github.com/Nicricht/cripto-cachipun/pull/1) continúa en DRAFT. Por eso todavía no está integrado a `main` ni publicado como sitio web público.

El contrato desplegado tiene una dirección fija y su código fuente fue verificado en Etherscan con el resultado Exact Match. Esto permite comparar el código publicado con el bytecode del contrato que está en la red.

## 3. Proceso de envío de transacciones y apuestas

A conecta MetaMask, elige una jugada y define el monto. La aplicación genera un secreto aleatorio de 32 bytes, calcula el compromiso y guarda la jugada y el secreto en el almacenamiento local del navegador. Luego prepara `comprometer(bytes32)` y envía la apuesta en el campo `value`. MetaMask muestra la solicitud para que A la revise y firme.

B se conecta desde otra dirección y compromete exactamente el mismo monto. El contrato comprueba que B no sea la misma dirección de A, que el plazo para unirse no haya vencido y que `msg.value` sea igual a la apuesta inicial. Al aceptar el segundo compromiso, la fase cambia a Reveal y comienza el plazo de cinco minutos.

En Reveal, cada jugador envía su jugada y su secreto mediante una transacción. El contrato calcula nuevamente el hash y lo compara con el compromiso guardado. Cuando se confirma la segunda revelación válida, el contrato resuelve la partida y realiza el pago en esa misma transacción. No existe una quinta transacción separada para pagar al ganador.

Una transacción de escritura incluye la cuenta de origen (`from`), el contrato de destino (`to`), la función y sus parámetros (`data`), el Ether enviado (`value`), el nonce, el límite de gas y la firma. En `comprometer`, `value` corresponde a la apuesta. La comisión de gas se paga aparte y no forma parte del pozo.

| Paso | Acción de los jugadores | Acción del contrato / DApp |
|---|---|---|
| Conectar | A y B conectan MetaMask en Sepolia. | Comprueba chain ID 11155111 y consulta el estado. |
| Commit A | A elige jugada y apuesta 0,001 ETH. | Genera secreto y hash; registra cuenta, hash, apuesta y plazo. |
| Commit B | B usa otra dirección y aporta 0,001 ETH. | Valida dirección, plazo y monto; cambia a Reveal. |
| Reveal | Cada uno revela jugada y secreto. | Recalcula y compara cada hash. |
| Resolver | No se necesita un árbitro. | La segunda revelación válida dispara `_resolver()` y el pago. |

**Resultado observado:** A = Piedra; B = Tijera; apuesta por jugador = 0,001 ETH; pozo = 0,002 ETH; resultado = gana A.

## 4. Uso de llaves públicas y privadas

Una cuenta normal de Ethereum (EOA) se controla mediante un par de llaves criptográficas. La llave privada permite firmar transacciones y debe permanecer bajo el control de su dueño. La llave pública se deriva de la privada y, a partir de ella, se obtiene la dirección que se comparte para identificar la cuenta. La dirección no es la llave privada y no permite firmar por sí sola.

En Cripto Cachipún, MetaMask administra la llave privada y firma cada transacción cuando el usuario la confirma. La aplicación recibe la dirección pública y solicita operaciones a la billetera, pero no necesita leer ni almacenar la llave privada. La red valida la firma y el contrato identifica al remitente mediante `msg.sender`.

El secreto de Commit-Reveal es distinto. Es un valor aleatorio de 32 bytes que se combina con la jugada y la dirección para generar el hash. No sirve para controlar la billetera ni para firmar transacciones. Cuando el jugador revela, el secreto queda visible en los datos de la transacción; por eso debe mantenerse oculto hasta ese momento y no debe confundirse con la frase semilla o la llave privada.

El hash no cifra la jugada para luego descifrarla. Funciona como una huella criptográfica: el contrato vuelve a calcularla durante Reveal y verifica que corresponda al compromiso original.

## 5. Funcionamiento del contrato como DApp

Cripto Cachipún es una DApp porque la interfaz web permite interactuar con un contrato que ejecuta las reglas en la blockchain. La interfaz no decide quién gana ni administra el pozo. Su trabajo es mostrar el estado, recoger la selección del jugador y preparar las operaciones para que MetaMask las firme.

Las lecturas del contrato, como consultar jugadores, apuesta, fase, plazo o ganador, no modifican el estado y no requieren una transacción firmada. En cambio, `comprometer`, `revelar` y `reclamarPorTiempo` cambian el estado, por lo que necesitan una transacción y el pago de gas.

En el frontend, `contract.js` contiene la dirección, el chain ID y el ABI. `main.js` coordina la conexión de MetaMask, las consultas y las acciones. `commitment.mjs` genera el secreto, calcula el hash y guarda la información necesaria para revelar. `game-rules.mjs` contiene validaciones de red, roles y plazos.

El contrato desplegado administra una sola partida. Cuando termina, esa instancia no se reinicia. Para jugar otra vez se necesita una nueva instancia del contrato.

## 6. Estructura del contrato, condiciones y manejo de Ether

El contrato está escrito en Solidity 0.8.24. Usa tres enumeraciones: `Jugada` (Ninguna, Piedra, Papel y Tijera), `Fase` (Commit, Reveal y Terminado) y `Resultado` (ganador A, ganador B, empate, abandono o anulación).

La estructura `Jugador` almacena la dirección, el hash comprometido, la jugada revelada y un indicador booleano que señala si ya reveló. El contrato mantiene también la apuesta, los límites de tiempo, la fase, el resultado y la dirección del ganador.

La función `comprometer` es `payable`, por lo que puede recibir Ether. El primer jugador define la apuesta con `msg.value`. El segundo debe enviar exactamente la misma cantidad. Los `require` impiden que se registre un hash vacío, una apuesta de cero, una segunda dirección igual a la de A o una apuesta distinta.

### Código 1. Cálculo del compromiso

```solidity
return keccak256(
    abi.encodePacked(uint8(_jugada), _secreto, _jugador)
);
```

Se combinan la jugada, el secreto y la dirección. El orden y los tipos deben ser iguales en Solidity y JavaScript.

### Código 2. Validación de la apuesta

```solidity
require(msg.value > 0, "La apuesta debe ser mayor que cero");
require(msg.value == apuesta, "La apuesta debe coincidir");
```

El primer jugador establece el monto y el segundo debe igualarlo. Si no coincide, la transacción se revierte.

### Código 3. Validación del reveal

```solidity
require(fase == Fase.Reveal, "La fase Reveal no esta activa");
require(block.timestamp <= limiteRevelacion, "Plazo de reveal vencido");
require(
    calcularCompromiso(_jugada, _secreto, msg.sender) == jugadorA.compromiso,
    "Hash no coincide"
);
```

El contrato comprueba la fase, el plazo y que el hash recalculado coincida con el compromiso guardado.

### Código 4. Transferencia de Ether

```solidity
function _transferir(address _destinatario, uint256 _monto) private {
    (bool enviado, ) = _destinatario.call{value: _monto}("");
    require(enviado, "La transferencia de Ether fallo");
    emit PagoRealizado(_destinatario, _monto);
}
```

El contrato envía el monto al ganador o devuelve las apuestas. El resultado de `call` se comprueba con `require`. El estado se marca como Terminado antes de hacer la llamada externa.

### Funciones principales

| Función | Responsabilidad |
|---|---|
| `comprometer(bytes32)` | Recibe Ether, registra el hash y valida al segundo jugador. |
| `calcularCompromiso(...)` | Calcula el hash keccak256. |
| `revelar(...)` | Comprueba el secreto y registra la jugada. |
| `reclamarPorTiempo()` | Resuelve vencimientos y devoluciones. |
| `_resolver()` | Determina ganador o empate y distribuye el pozo. |
| `_transferir(...)` | Envía Ether y comprueba que la transferencia resulte exitosa. |

## 7. Lógica del juego, plazos y resultados

Los valores de la jugada son 1 para Piedra, 2 para Papel y 3 para Tijera. El valor 0 representa Ninguna. Piedra vence a Tijera, Tijera vence a Papel y Papel vence a Piedra.

En Commit, A registra primero su compromiso y define la apuesta. B debe unirse dentro de cinco minutos y aportar el mismo monto. Cuando B se une, comienza Reveal, que también tiene un plazo de cinco minutos.

Si los dos revelan, el contrato compara las jugadas. Si hay empate, cada uno recupera lo que aportó. Si A o B no se une a tiempo, la partida se anula y A recupera su apuesta. Si ambos dejan vencer el plazo de revelación, cada uno recupera su aporte. Si solo uno revela, ese jugador recibe el pozo completo por abandono del otro.

El vencimiento del plazo no ejecuta código automáticamente. Una cuenta debe enviar una transacción a `reclamarPorTiempo()` para activar la devolución o el resultado por abandono.

## 8. Análisis de seguridad: riesgos y mitigaciones

El mecanismo Commit-Reveal reduce la posibilidad de que un jugador espere a conocer la elección del otro antes de comprometerse. La dirección se incluye en el hash para vincular el compromiso a la cuenta que lo envió. El contrato valida la fase, el monto, el remitente y los plazos.

En los pagos, el contrato cambia primero la fase a Terminado y después realiza las transferencias. Este orden sigue el principio Checks-Effects-Interactions y reduce el riesgo de reentrada. Sin embargo, la transferencia con `call` puede fallar si el destinatario rechaza Ether o si la llamada no puede completarse. En ese caso, `require` revierte toda la transacción.

El secreto se guarda en `localStorage` sin una capa de cifrado propia. Si se borran los datos, se cambia de navegador o el equipo está comprometido, el jugador puede perder el secreto y no podrá revelar la jugada. No se deben borrar los datos antes de terminar.

Los plazos dependen de `block.timestamp`, que es el tiempo asociado al bloque y no un reloj de precisión absoluta. Además, el contrato no establece un límite máximo de apuesta: solo exige que sea mayor que cero. Para una versión con fondos reales habría que agregar límites y una revisión de seguridad más profunda.

El contrato no ha pasado por una auditoría externa. Las nueve pruebas Solidity y las diez pruebas de helpers frontend ayudan a revisar casos previstos, pero no demuestran que el sistema esté libre de vulnerabilidades. El proyecto debe mantenerse en Sepolia.

| Riesgo | Control aplicado | Límite que permanece |
|---|---|---|
| Filtración anticipada | Hash con secreto aleatorio y dirección. | Si se filtra el secreto antes del reveal, se pierde la protección. |
| Pérdida del secreto | Se guarda por contrato y dirección en localStorage. | No está cifrado por la DApp; si se borra, no se recupera. |
| Compromiso copiado | La dirección se incluye en el hash y se valida msg.sender. | La cuenta debe mantenerse durante la partida. |
| Apuesta incorrecta | require exige que B aporte el mismo monto. | Se necesita ETH para apuesta y gas. |
| Reentrada | La fase cambia a Terminado antes de transferir. | No hay auditoría externa ni modificador nonReentrant. |
| Fallo de pago | call y require comprueban la transferencia. | Un destinatario que rechace Ether puede revertir la liquidación. |
| Tiempo | block.timestamp se compara con los plazos. | No es un reloj de precisión absoluta. |
| Apuesta excesiva | La interfaz muestra el monto y el contrato exige un valor positivo. | No existe un tope máximo en Solidity. |

## 9. Auditoría y trazabilidad

La trazabilidad se apoya en el código verificado, el hash de cada transacción y los eventos emitidos por el contrato. Los eventos permiten identificar qué jugador comprometió, cuándo comenzó Reveal, quién reveló, qué pagos se realizaron y cuál fue el resultado.

El contrato está desplegado en Sepolia y su código fuente aparece como verificado con Exact Match. En el repositorio también se puede revisar el registro de despliegue y la ejecución de GitHub Actions.

Durante la partida demostrativa se registraron los dos compromisos, la fase Reveal, las dos revelaciones y el resultado final. Las capturas muestran las solicitudes de MetaMask y el estado de la DApp. **Los cuatro hashes individuales de las transacciones de la partida no se conservaron.** No se inventan ni se presentan como recuperados. El hash de despliegue sí está disponible.

El commit `3a687e8c567048c7a6b1f2260dff740eaec65977` tiene el workflow `Solidity and Web CI` completado con resultado success. Se ejecutaron la compilación, las nueve pruebas Solidity, las diez pruebas de helpers frontend y el build web. [Ver CI](https://github.com/Nicricht/cripto-cachipun/actions/runs/42016123615).

## 10. Approach del pitch y beneficios

**Need:** los participantes necesitan demostrar que no cambiaron su elección después de conocer la del rival y que el dinero se entregue según reglas claras.

**Approach:** cada jugador registra primero un hash y una apuesta. Después ambos revelan. El contrato verifica los compromisos, compara las jugadas y distribuye el Ether. MetaMask controla las firmas y la interfaz muestra el estado.

**Benefit:** las reglas quedan públicas, la ejecución se realiza en el contrato y el resultado no depende de que una persona calcule el ganador o entregue el pozo.

**Competition:** un juego presencial no necesita gas ni billetera, y una aplicación centralizada puede ser más sencilla. La DApp aporta reglas verificables y pagos en cadena, pero requiere MetaMask y Ether de prueba. Blockchain no es siempre la mejor alternativa; se eligió porque el objetivo académico es demostrar automatización y trazabilidad.

## 11. Procedimiento ejecutado y resultado

Primero se conectó la billetera del jugador A en Sepolia. A seleccionó Piedra y comprometió 0,001 ETH. MetaMask mostró una solicitud dirigida al contrato y la interfaz pasó a mostrar que A tenía su compromiso guardado.

Después se conectó una segunda cuenta, correspondiente al jugador B. B seleccionó Tijera y comprometió los mismos 0,001 ETH. Con los dos compromisos registrados, la interfaz cambió a la fase Reveal.

Cada jugador reveló su elección. El contrato comprobó que los hashes coincidieran y, después de la segunda revelación, ejecutó la comparación. Piedra vence a Tijera, por lo que el jugador A ganó. El pozo total era de 0,002 ETH de prueba y se transfirió al ganador.

Las capturas adjuntas al informe PDF muestran el compromiso de A, el estado Reveal con el segundo jugador y el resultado final. Los hashes individuales de la partida no se guardaron, por lo que la evidencia visual permite seguir el flujo, pero no sustituye el enlace directo a cada transacción.

## 12. Conclusión y mejoras pendientes

El proyecto permitió implementar un juego de Piedra, Papel o Tijera con apuestas de prueba y reglas ejecutadas por un contrato inteligente. Se utilizó Commit-Reveal para mantener oculta la elección inicial, MetaMask para firmar las operaciones y Sepolia para probar la interacción con la blockchain.

La demostración terminó con el jugador A como ganador. El contrato quedó desplegado y verificado. El código y las pruebas se encuentran en GitHub.

Como mejoras, conviene conservar automáticamente los hashes de cada transacción, cifrar o mejorar la recuperación del secreto, desarrollar una fábrica de partidas, publicar la interfaz y solicitar una auditoría independiente. Hasta completar esas mejoras, el proyecto debe considerarse un prototipo académico en testnet.

## Anexo A. Matriz de cobertura de la pauta

| Criterio | Secciones | Evidencia / límite |
|---|---|---|
| 1. Envío de transacciones y apuestas | 3 y 11 | Flujo A/B, MetaMask, apuesta, gas y resultado. Los hashes individuales de la partida no se conservaron. |
| 2. Llaves públicas y privadas | 4 | Diferencia entre llave privada, pública, dirección y secreto Commit-Reveal. |
| 3. Contrato como DApp | 5 | Arquitectura MetaMask + Vite + ethers v6 + Solidity + Sepolia. Frontend en PR #1 DRAFT. |
| 4. Análisis de seguridad | 8 | Riesgos reales, validaciones, CEI, almacenamiento local, llamadas externas y límites. Sin auditoría externa. |
| 5. Lógica del juego | 6, 7 y 11 | Hash, apuestas iguales, reveal, ganador, empate, abandono y plazos. Nueve pruebas Solidity. |
| 6. Estructura y manejo de Ether | 6 y Anexo C | Enumeraciones, struct, variables, funciones, payable, msg.value, wei y pagos. |
| 7. Approach del pitch | 10 | Need, Approach, Benefit y Competition relacionados con el flujo. |
| 8. Automatización y transparencia | 5 y 10 | El contrato calcula el resultado y ejecuta pagos; código y eventos consultables. |
| 9. Auditoría y trazabilidad | 9 y Anexo D | Contrato Exact Match, hash de despliegue, eventos y capturas. Faltan los hashes individuales del juego. |
| 10. Procedimiento completo | 11 | Conexión, compromisos, reveal, resultado y transferencia de la apuesta. |

## Anexo B. Código frontend Commit-Reveal

El helper genera un secreto con `randomBytes(32)`, calcula el hash con los tipos y el orden que espera Solidity y guarda el secreto por contrato y dirección. [Ver archivo completo en GitHub](https://github.com/Nicricht/cripto-cachipun/blob/feat/sepolia-web-dapp/frontend/src/commitment.mjs).

```javascript
export function createSecret() {
  return hexlify(randomBytes(32));
}

return solidityPackedKeccak256(
  ["uint8", "bytes32", "address"],
  [normalizedMove, secret, normalizedAccount],
);
```

## Anexo C. Código Solidity completo

El código fuente completo está en [contracts/CriptoCachipun.sol](https://github.com/Nicricht/cripto-cachipun/blob/main/contracts/CriptoCachipun.sol). Se incluye en el informe PDF y se puede revisar directamente en GitHub. Blob SHA del archivo en main: `a63cd3d6f36b528cc940ccedf3f5bfa56435af5d`.

## Anexo D. Evidencias y referencias

- [Contrato y eventos en Etherscan](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#events).
- [Transacción de despliegue](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c).
- [Registro de despliegue en GitHub](https://github.com/Nicricht/cripto-cachipun/blob/docs/sepolia-deployment-evidence-20261105/docs/SEPOLIA_DEPLOYMENT.md).
- Ethereum.org: [Ethereum accounts](https://ethereum.org/developers/docs/accounts/), [Transactions](https://ethereum.org/developers/docs/transactions/), [Interacting with smart contracts](https://ethereum.org/developers/docs/smart-contracts/interacting/), [Smart contract security](https://ethereum.org/developers/docs/smart-contracts/security/).
- Solidity: [Security considerations](https://docs.solidity.org/en/latest/security-considerations.html).

**Alcance de la evidencia:** el contrato está desplegado y verificado; la partida demostrativa se documenta mediante capturas. Los hashes individuales de la partida no fueron guardados. El proyecto es un prototipo académico en testnet y no debe utilizarse con fondos reales.
