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

## Estructura

- `contracts/CriptoCachipun.sol`: contrato inteligente.
- `scripts/deploy.js`: despliegue.
- `test/CriptoCachipun.test.js`: pruebas automatizadas.
- `docs/DECISIONES.md`: decisiones de diseño y casos borde.

## Requisitos

- Node.js LTS
- npm
- MetaMask
- Ether de prueba en Sepolia
- Una URL RPC de Sepolia

## Instalación y pruebas

```bash
npm install
npm run compile
npm test
```

## Despliegue en Sepolia

1. Copia `.env.example` a un archivo llamado `.env`.
2. Configura `SEPOLIA_RPC_URL` y `PRIVATE_KEY` con una cuenta exclusiva de pruebas.
3. Nunca publiques el archivo `.env` ni compartas una llave privada.
4. Ejecuta:

```bash
npm run deploy:sepolia
```

Guarda la dirección del contrato y el hash de la transacción para el informe técnico y la evidencia en Etherscan.

## Estado del proyecto

- [x] Repositorio creado.
- [x] Estructura inicial y reglas documentadas.
- [x] Contrato Commit-Reveal inicial.
- [x] Pruebas automatizadas iniciales escritas.
- [ ] Compilación y pruebas locales verificadas.
- [ ] Despliegue en Sepolia.
- [ ] Evidencias de ejecución en Etherscan.
- [ ] Informe técnico PDF.
- [ ] Pitch NABC de 5 minutos.

**Importante:** no se deben utilizar fondos reales. Todas las pruebas y apuestas se realizan con Ether de testnet.
