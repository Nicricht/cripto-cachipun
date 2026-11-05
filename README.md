# Cripto Cachipún

Contrato inteligente para jugar Piedra, Papel o Tijera entre dos jugadores con apuestas en Ether, utilizando el mecanismo **Commit-Reveal**.

Proyecto académico de **BCY0010 · Fundamentos de Blockchain · Evaluación Parcial 2 (DuocUC)**.

## Objetivo

Permitir que dos jugadores:
1. Comprometan el hash de su jugada y secreto, enviando la misma apuesta en Ether.
2. Esperen a que ambos compromisos estén registrados.
3. Revelen su jugada y secreto dentro del plazo.
4. Dejen que el contrato verifique los hashes, determine el resultado y distribuya el Ether.

## Reglas implementadas

- El jugador A registra el primer compromiso y define el monto de la apuesta.
- El jugador B debe ser una dirección distinta y enviar exactamente el mismo monto.
- Si B no se une dentro de los **5 minutos** posteriores al primer compromiso, cualquier dirección puede ejecutar `reclamarPorTiempo` para devolver la apuesta a A.
- El plazo para revelar es de **5 minutos desde el segundo compromiso**.
- El hash se calcula con el mismo orden y tipos en Solidity y JavaScript: `keccak256(abi.encodePacked(uint8(jugada), secreto, jugador))`.
- Si ambos revelan, el contrato determina automáticamente el ganador.
- Si hay empate, cada jugador recupera su apuesta.
- Si solo un jugador revela dentro del plazo, ese jugador recibe el pozo completo cuando se ejecuta `reclamarPorTiempo`.
- Si ninguno revela, se devuelve la apuesta a ambos cuando se ejecuta `reclamarPorTiempo`.
- Cualquier dirección puede activar la resolución por vencimiento. Los pagos dependen del estado guardado en el contrato.
- El resultado y los pagos quedan registrados mediante eventos.
- Cada despliegue corresponde a una partida. Para otra partida se despliega una nueva instancia.

## Valores de la jugada

| Valor | Jugada |
|---:|---|
| 0 | Ninguna |
| 1 | Piedra |
| 2 | Papel |
| 3 | Tijera |

## Contrato desplegado en Sepolia

- Red: Ethereum Sepolia (chain ID `11155111`).
- Dirección: `0xfb96470312fAA99Cf63186328a5a7e796458c04A`.
- [Código verificado: Etherscan Exact Match](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#code).
- [Transacción de despliegue](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c).

## Interfaz web para Sepolia

La aplicación web usa MetaMask y se conecta directamente al contrato desplegado. Solo permite operaciones de escritura en Sepolia; no admite Ethereum Mainnet ni fondos reales.

### Ejecutar localmente

```bash
npm install
npm run dev:web
```

Abre la URL local que indique Vite (normalmente `http://localhost:5173`).

### Flujo de partida

1. El jugador A conecta MetaMask, elige Piedra, Papel o Tijera e indica la apuesta en ETH de prueba.
2. El jugador B conecta una dirección distinta y se une enviando exactamente la apuesta indicada por el contrato.
3. Cada jugador revela desde el mismo navegador/perfil de MetaMask donde generó su compromiso.
4. Si vence un plazo, cualquier cuenta conectada puede ejecutar la resolución por tiempo.

**Importante sobre Commit-Reveal:** el secreto se guarda en el almacenamiento local del navegador para poder revelar después de recargar la página. No borres los datos del sitio ni cambies de perfil/navegador antes de revelar. Si se pierde el secreto, el contrato no puede reconstruirlo.

**Una instancia, una partida:** el contrato actual administra una sola partida. Cuando termina, no se puede reiniciar esa misma instancia; otra partida requiere desplegar otra instancia.

Para jugar se necesitan dos direcciones distintas con ETH de prueba en Sepolia. Cada transacción requiere la aprobación explícita de su titular en MetaMask.

## Estructura

- `contracts/CriptoCachipun.sol`: contrato inteligente.
- `scripts/deploy.js`: despliegue.
- `test/CriptoCachipun.test.js`: pruebas automatizadas del contrato.
- `frontend/`: interfaz web Vite y conexión MetaMask.
- `docs/DECISIONES.md`: decisiones de diseño y casos borde.
- `docs/SEPOLIA_DEPLOYMENT.md`: evidencia del despliegue y verificación.

## Requisitos

- Node.js 20 o superior
- npm
- MetaMask
- Dos direcciones con Ether de prueba en Sepolia

## Compilación y pruebas

```bash
npm install
npm run compile
npm test
npm run test:web
npm run build:web
```

## Despliegue de una nueva instancia

El despliegue existente no debe repetirse para usar la interfaz web. Para crear otra instancia de contrato en el futuro:

1. Copia `.env.example` a un archivo llamado `.env`.
2. Configura `SEPOLIA_RPC_URL` y `PRIVATE_KEY` con una cuenta exclusiva de pruebas.
3. Nunca publiques el archivo `.env` ni compartas una llave privada.
4. Ejecuta `npm run deploy:sepolia`.

## Estado del proyecto

- [x] Repositorio creado y reglas documentadas.
- [x] Contrato Commit-Reveal implementado.
- [x] Nueve pruebas automatizadas del contrato aprobadas.
- [x] Contrato desplegado en Sepolia y verificado por Etherscan Exact Match.
- [x] Interfaz web implementada; 10 pruebas frontend y build de producción aprobados en CI.
- [ ] Partida completa de extremo a extremo con dos cuentas Sepolia.
- [ ] Informe técnico PDF.
- [ ] Pitch NABC de 5 minutos.

**Importante:** no se deben utilizar fondos reales. Todas las pruebas y apuestas se realizan con Ether de testnet.
