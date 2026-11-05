# Cripto Cachipún

DApp académica de Piedra, Papel o Tijera para dos jugadores, con apuestas de Ether de prueba y mecanismo **Commit-Reveal**.

**Asignatura:** BCY0010 · Fundamentos de Blockchain · Evaluación Parcial 2 (DuocUC)  
**Red:** Ethereum Sepolia · chain ID `11155111`  
**Uso:** exclusivamente académico y con Ether de prueba. No utilizar con fondos reales.

## Contrato desplegado

- Dirección: `0xfb96470312fAA99Cf63186328a5a7e796458c04A`.
- [Código fuente verificado en Etherscan (Exact Match)](https://sepolia.etherscan.io/address/0xfb96470312faa99cf63186328a5a7e796458c04a#code).
- [Transacción de despliegue](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c).
- Bloque de despliegue: `12068668`.
- Compilador: Solidity `0.8.24+commit.e11b9ed9`, EVM Shanghai, optimizador habilitado con 200 runs.
- [Registro técnico del despliegue](docs/SEPOLIA_DEPLOYMENT.md).

## Cómo funciona

1. El jugador A conecta MetaMask en Sepolia, elige una jugada y envía un hash junto con la apuesta.
2. El jugador B conecta otra dirección y envía el mismo monto.
3. Ambos revelan la jugada y el secreto que utilizaron para generar el hash.
4. El contrato comprueba los compromisos, determina el ganador y envía el pozo o devuelve las apuestas.

Cada instancia del contrato corresponde a una sola partida. Para iniciar otra se necesita otra instancia.

## Resultado de la demostración

El 5 de noviembre de 2026 se ejecutó una partida demostrativa en Sepolia:

- Jugador A: Piedra.
- Jugador B: Tijera.
- Apuesta de cada jugador: `0.001 ETH` de prueba.
- Pozo: `0.002 ETH` de prueba.
- Resultado: ganó el jugador A.

Las capturas de la partida están incluidas en el informe técnico. Los cuatro hashes individuales de las transacciones de la partida no se conservaron; no se inventan. El hash de despliegue sí está registrado en Etherscan.

## Interfaz web

La interfaz Vite + JavaScript utiliza MetaMask y ethers v6 para interactuar con el contrato. El desarrollo del frontend está en la rama `feat/sepolia-web-dapp` y en el [Pull Request #1](https://github.com/Nicricht/cripto-cachipun/pull/1), que permanece **DRAFT** y todavía no está integrado a `main` ni publicado como sitio público.

Para ejecutar localmente desde la rama del frontend:

```bash
npm install
npm run dev:web
```

Abre la URL local indicada por Vite, normalmente `http://localhost:5173`.

**Importante:** el secreto Commit-Reveal se guarda en el almacenamiento local del navegador. No borres los datos del sitio ni cambies de navegador/perfil antes de revelar. La DApp no recibe la frase semilla ni la llave privada; MetaMask firma las transacciones.

## Pruebas y CI

En el commit `3a687e8c567048c7a6b1f2260dff740eaec65977`, GitHub Actions ejecutó correctamente:

- Compilación del contrato.
- 9 pruebas automatizadas Solidity.
- 10 pruebas de helpers del frontend.
- Build de producción del frontend.

[Ver ejecución CI exitosa](https://github.com/Nicricht/cripto-cachipun/actions/runs/42016123615).

Las pruebas automatizadas no reemplazan una auditoría independiente. El contrato debe mantenerse en Sepolia y no utilizarse con fondos reales.

## Informe y evidencias

- [Informe técnico definitivo en Markdown](docs/INFORME_TECNICO_FINAL_CRIPTO_CACHIPUN.md).
- [Contrato Solidity](contracts/CriptoCachipun.sol).
- [Registro de despliegue](docs/SEPOLIA_DEPLOYMENT.md).

El informe contiene los diez criterios de la pauta, fragmentos explicados, matriz de cobertura y el código Solidity completo como anexo. También deja explícito que no se conservaron los hashes individuales de la partida. Las versiones PDF y DOCX se entregan junto con este repositorio como archivos de la entrega.


## Entrega final EP2 · BCY0010

- [Informe técnico final, versión condensada alineada con los 10 indicadores](docs/INFORME_TECNICO_FINAL_10_PAGINAS.md).
- [Guion de presentación NABC de 5 minutos](docs/GUION_PITCH_NABC_5_MINUTOS.md).
- [Contrato desplegado y verificado en Sepolia](https://sepolia.etherscan.io/address/0xfb96470312fAA99Cf63186328a5a7e796458c04A#code).
- [Transacción de despliegue](https://sepolia.etherscan.io/tx/0x2837d5719bf123692ef719fcf7cc387f44dc8ba759413fd2805a3c57d460070c).

El informe PDF de 10 páginas, el editable DOCX y el PowerPoint con evidencias visuales se entregan como archivos de apoyo. No se registraron los hashes individuales de las cuatro transacciones de la partida, por lo que no se inventan.
