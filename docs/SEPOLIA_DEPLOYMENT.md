# Evidencia de despliegue en Sepolia

Fecha de comprobación: 2026-11-05.

## Despliegue existente confirmado en Etherscan

- Red: Ethereum Sepolia (chain ID 11155111).
- Contrato: `0xfb96470312fAA99Cf63186328a5a7e796458c04A`.
- Transacción: `0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c`.
- Estado: Success.
- Bloque: 12068668.
- Fecha de bloque: 2026-11-05 09:45:12 UTC (06:45:12 America/Santiago).
- Creador: `0x053911b53dA16Ddd46cda6CB28b6E3969fE7de55`.
- Valor enviado: 0 ETH.
- Comisión: 0.01182036016548504 ETH de prueba.
- Confirmaciones observadas: 89.

[Transacción](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c)

[Contrato](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#code)

## Compilación preparada en Remix

- Fuente importada: contracts/CriptoCachipun.sol del commit 9b4e93eec8bd14178174d5ff3740dfbb7b062fc0.
- Compilador: 0.8.24+commit.e11b9ed9.
- EVM: Shanghai.
- Optimizador: habilitado, 200 runs.
- Licencia: MIT.
- Constructor: sin argumentos, valor 0.
- No se repitieron las nueve pruebas automatizadas reportadas como aprobadas por el usuario.

## Estado de verificación de fuente

PENDIENTE. Etherscan muestra bytecode y el enlace Verify and Publish; aún no muestra el código fuente verificado. El formulario inicial está preparado con Solidity Single file, versión 0.8.24 y licencia MIT. La aceptación de términos de Etherscan requiere intervención o autorización del usuario. No se declara verificación de fuente exitosa.

## Incidencia de Remix

Remix no conservó el despliegue previo en el historial de la sesión. Un intento de abrir una nueva solicitud de despliegue devolvió un error de integración (_context7.t3.error.indexOf is not a function), sin hash nuevo observado. Se consultó Etherscan y se recuperó el despliegue existente; no hace falta duplicarlo.

No se utilizaron fondos reales ni se solicitaron frases semilla o claves privadas.
