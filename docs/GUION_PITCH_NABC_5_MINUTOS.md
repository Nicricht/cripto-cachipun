# Guion de presentación NABC: Cripto Cachipún

**Duración total:** 5 minutos · **BCY0010**

GUION DE PRESENTACIÓN NABC · 5 MINUTOS
CRIPTO CACHIPÚN · BCY0010

## Diapositiva 1 · PRESENTACIÓN (0:10)
Hola. Nuestro proyecto se llama Cripto Cachipún. Es una aplicación descentralizada para jugar Piedra, Papel o Tijera entre dos personas, con apuestas de Ether de prueba en la red Sepolia.

## Diapositiva 2 · NEED (0:30)
El problema que queremos resolver es la confianza. Si dos personas apuestan, una podría intentar cambiar su jugada después de conocer la del rival, o podría existir una discusión sobre quién debe recibir el dinero. Necesitamos reglas iguales para ambos y una forma de comprobar que cada uno mantuvo su elección.

## Diapositiva 3 · APPROACH: ARQUITECTURA (0:35)
La solución tiene varias partes. MetaMask conecta las billeteras y firma las operaciones. La interfaz está hecha con Vite y JavaScript. Usamos ethers para comunicarnos con el contrato. Finalmente, el contrato está escrito en Solidity y desplegado en Sepolia. La interfaz muestra información, pero las reglas y el resultado los determina el contrato.

## Diapositiva 4 · APPROACH: TRANSACCIONES (1:10)
Primero, el jugador A elige Piedra, Papel o Tijera. La aplicación genera un secreto aleatorio de 32 bytes y calcula un hash que representa la jugada. A envía ese hash y su apuesta de 0,001 ETH. Después, el jugador B se conecta con otra cuenta y envía su propio hash junto con la misma cantidad.

Cuando los dos compromisos están registrados, comienza la fase Reveal. Cada jugador envía la jugada y el secreto que utilizó. El contrato vuelve a calcular el hash. Si coincide con el que se guardó al principio, acepta la revelación. Cuando llega la segunda revelación válida, el contrato compara las jugadas y resuelve la partida. Si hay ganador, le envía el pozo de 0,002 ETH de prueba. Ese pago se realiza dentro de la transacción de la segunda revelación.

## Diapositiva 5 · CONTRATO Y SEGURIDAD (1:00)
La función comprometer recibe el hash y el Ether. msg.value representa la cantidad enviada y msg.sender identifica la cuenta. La función calcularCompromiso usa keccak256 con la jugada, el secreto y la dirección. La función revelar comprueba que el secreto sea correcto y que la cuenta sea uno de los jugadores. Después, _resolver compara Piedra, Papel y Tijera y _transferir envía el dinero.

También consideramos riesgos. El secreto se guarda en localStorage, así que si se borran los datos del navegador se puede perder la jugada. El contrato no tiene auditoría externa ni un límite máximo de apuesta. Por eso solo debe utilizarse en Sepolia con Ether de prueba.

## Diapositiva 6 · DEMOSTRACIÓN (0:55)
En la demostración conectamos dos cuentas distintas. A eligió Piedra y comprometió 0,001 ETH. B eligió Tijera y comprometió la misma cantidad. Después ambos revelaron sus jugadas. La interfaz mostró que la partida terminó y que ganó A. Las capturas muestran la solicitud de MetaMask, la fase Reveal y el resultado.

Hay un límite de trazabilidad: no guardamos los hashes individuales de las cuatro transacciones de la partida. Por eso no los inventamos. Sí tenemos el hash de despliegue del contrato y la verificación Exact Match en Etherscan.

## Diapositiva 7 · BENEFIT Y CIERRE (0:40)
El beneficio es que las reglas quedan públicas y el contrato calcula el resultado y realiza el pago sin depender de un árbitro. Una aplicación centralizada puede ser más sencilla, pero depende del operador. Una DApp permite revisar el código y los eventos, aunque requiere billetera y gas.

Como mejoras proponemos guardar automáticamente los hashes de cada partida, proteger mejor el secreto, permitir varias partidas y hacer una auditoría independiente. En conclusión, logramos demostrar el funcionamiento de un contrato inteligente con Commit-Reveal en Sepolia. Es un prototipo académico y no debe usarse con dinero real. Gracias.