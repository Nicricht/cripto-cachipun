# Decisiones de diseño

## 1. Mecanismo Commit-Reveal

Cada jugador genera fuera de la cadena una jugada y un secreto aleatorio de 32 bytes. Antes de revelar, envía únicamente el hash:

```text
keccak256(abi.encodePacked(uint8(jugada), secreto, direccionDelJugador))
```

El contrato almacena el compromiso junto con la dirección que lo envió. Durante Reveal vuelve a calcular el hash y lo compara con el guardado.

La dirección forma parte del hash para impedir que otro jugador copie el compromiso y lo presente como propio.

## 2. Orden y tipos del hash

| Dato | Tipo Solidity | Tipo JavaScript |
|---|---|---|
| Jugada | uint8 | uint8 |
| Secreto | bytes32 | bytes32 |
| Dirección | address | address |

El orden debe mantenerse idéntico. Un cambio de orden o de tipo produce un hash distinto.

## 3. Apuestas

El primer jugador establece el monto. El segundo debe enviar exactamente la misma cantidad. Si no coincide, la transacción se revierte y no se acepta el compromiso.

## 4. Plazos

- El jugador B dispone de cinco minutos desde el primer compromiso para unirse.
- Si B no se une dentro de ese plazo, cualquier dirección puede ejecutar `reclamarPorTiempo`. El contrato devuelve la apuesta a A y termina la partida.
- Cuando B se une, comienza un plazo de cinco minutos para que ambos revelen.
- Se utiliza `block.timestamp` como referencia temporal de la blockchain.

## 5. Empate

La pauta no define qué ocurre con el pozo cuando ambos jugadores revelan la misma jugada. Se adopta la regla de devolver a cada jugador su apuesta original. Así ninguno obtiene una ventaja injustificada.

## 6. Casos de no revelación

- Si ambos jugadores no revelan antes del vencimiento, el juego se anula y cada uno recupera su apuesta.
- Si solo A revela, A recibe el pozo completo cuando se ejecuta `reclamarPorTiempo`.
- Si solo B revela, B recibe el pozo completo cuando se ejecuta `reclamarPorTiempo`.
- La función `reclamarPorTiempo` puede ser ejecutada por cualquier dirección una vez vencido el plazo. El resultado depende de las revelaciones almacenadas, no de quién ejecuta la función.
- En una blockchain, el vencimiento del tiempo no ejecuta código por sí solo: se necesita una transacción para llamar a la función de resolución.

## 7. Pagos y estado

El contrato cambia la fase a `Terminado` antes de efectuar transferencias. Los pagos se realizan mediante `call` y se comprueba que la transferencia haya sido exitosa. Si falla un pago, la transacción completa se revierte.

## 8. Limitaciones y riesgos conocidos

- Cada instancia del contrato administra una sola partida.
- Un destinatario que rechace Ether puede impedir la liquidación hasta que la transferencia sea posible.
- Los plazos dependen del timestamp de los bloques y no son un reloj de precisión absoluta.
- Los secretos deben ser aleatorios y mantenerse privados hasta revelar. Si un jugador pierde su secreto, no podrá demostrar la jugada comprometida y puede perder por no revelar.

Estas limitaciones deben considerarse en el análisis de seguridad del informe.
