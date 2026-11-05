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

## 4. Plazo

El plazo de revelación es de cinco minutos desde el segundo compromiso. Se utiliza `block.timestamp` como referencia temporal de la blockchain.

## 5. Empate

La pauta no define qué ocurre con el pozo cuando ambos jugadores revelan la misma jugada. Se adopta la regla de devolver a cada jugador su apuesta original. Así ninguno obtiene una ventaja injustificada.

## 6. Casos de no revelación

- Si ambos jugadores no revelan antes del vencimiento, el juego se anula y cada uno recupera su apuesta.
- Si solo A revela, A recibe el pozo completo.
- Si solo B revela, B recibe el pozo completo.
- La función `reclamarPorTiempo` puede ser ejecutada por cualquier dirección una vez vencido el plazo. El resultado depende de las revelaciones almacenadas, no de quién ejecuta la función.

## 7. Pagos y estado

El contrato cambia la fase a `Terminado` antes de efectuar transferencias. Los pagos se realizan mediante `call` y se comprueba que la transferencia haya sido exitosa. Si falla un pago, la transacción completa se revierte.

## 8. Limitaciones conocidas

- Cada instancia del contrato administra una sola partida.
- Si el primer jugador compromete Ether y nunca llega un segundo jugador, esta versión no incluye una cancelación automática de esa espera.
- Un destinatario que rechace Ether puede impedir la liquidación hasta que la transferencia sea posible.
- Los plazos dependen del timestamp de los bloques y no son un reloj de precisión absoluta.

Estas limitaciones deben considerarse en el análisis de seguridad del informe.
