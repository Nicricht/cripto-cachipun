# Cripto Cachipún — despliegue y verificación en Sepolia

Comprobado el 2026-11-05.

## Resultado

Contrato desplegado en Ethereum Sepolia (chain ID 11155111) y código fuente publicado y verificado por Etherscan: **Source Code Verified — Exact Match**.

- Nombre: CriptoCachipun.
- Dirección: `0xfb96470312fAA99Cf63186328a5a7e796458c04A`.
- Hash de despliegue: `0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c`.
- Estado de transacción: Success.
- Bloque: 12068668.
- Fecha de bloque: 2026-11-05 09:45:12 UTC (06:45:12 America/Santiago).
- Creador: `0x053911b53dA16Ddd46cda6CB28b6E3969fE7de55`.
- Valor enviado al constructor: 0 ETH.
- Comisión de despliegue: 0.01182036016548504 ETH de prueba.
- Confirmaciones observadas durante la recuperación del despliegue: 89.

[Contrato y código verificado](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#code)

[Transacción de despliegue](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c)

## Configuración verificada en Etherscan

- Solidity v0.8.24+commit.e11b9ed9.
- EVM Shanghai.
- Optimizador habilitado, 200 runs.
- Licencia MIT.
- Constructor sin argumentos.
- Fuente publicada: contracts/CriptoCachipun.sol del commit `9b4e93eec8bd14178174d5ff3740dfbb7b062fc0`.
- Etherscan mostró primero Successfully generated matching Bytecode and ABI y después Source Code Verified / Exact Match en la página del contrato.
- Las pestañas Read Contract y Write Contract están disponibles.

## Alcance y controles

- Se reutilizó el despliegue existente confirmado en Sepolia.
- No se repitieron las nueve pruebas automatizadas que el usuario reportó aprobadas.
- No se realizaron nuevas partidas ni apuestas.
- No se utilizaron fondos reales ni se solicitaron frases semilla o claves privadas.
- La aceptación de términos para verificar/publicar fue autorizada explícitamente por el usuario.

## Incidencia de Remix

Remix no conservó el despliegue previo en el historial de la sesión. Un intento de abrir una nueva solicitud de despliegue devolvió un error de integración (_context7.t3.error.indexOf is not a function), sin hash nuevo observado. Se recuperó el despliegue existente mediante Etherscan y se completó su verificación sin volver a desplegar.
