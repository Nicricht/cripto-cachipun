export const CONTRACT_ADDRESS =
  "0xfb96470312fAA99Cf63186328a5a7e796458c04A";

export const SEPOLIA_CHAIN_ID = 11155111n;
export const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export const CONTRACT_ABI = [
  "function jugadorA() view returns (address cuenta, bytes32 compromiso, uint8 jugada, bool revelo)",
  "function jugadorB() view returns (address cuenta, bytes32 compromiso, uint8 jugada, bool revelo)",
  "function apuesta() view returns (uint256)",
  "function limiteSegundoJugador() view returns (uint256)",
  "function limiteRevelacion() view returns (uint256)",
  "function fase() view returns (uint8)",
  "function resultado() view returns (uint8)",
  "function ganador() view returns (address)",
  "function calcularCompromiso(uint8 _jugada, bytes32 _secreto, address _jugador) pure returns (bytes32)",
  "function comprometer(bytes32 _compromiso) payable",
  "function revelar(uint8 _jugada, bytes32 _secreto)",
  "function reclamarPorTiempo()",
];

export const EXPLORER_ADDRESS =
  `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;
