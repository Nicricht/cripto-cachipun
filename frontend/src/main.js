import {
  BrowserProvider,
  Contract,
  formatEther,
  ZeroAddress,
} from "ethers";
import {
  clearSecret,
  createCommitment,
  createSecret,
  loadSecret,
  saveSecret,
  secretStorageKey,
} from "./commitment.mjs";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  EXPLORER_ADDRESS,
  SEPOLIA_CHAIN_HEX,
} from "./contract.js";
import {
  canClaimByTimeout,
  getCommitValue,
  getPlayerRole,
  isSepoliaChain,
} from "./game-rules.mjs";
import "./style.css";

const $ = (selector) => document.querySelector(selector);
const MOVE_NAMES = { 1: "Piedra", 2: "Papel", 3: "Tijera" };
const RESULT_NAMES = {
  1: "Gana el jugador A",
  2: "Gana el jugador B",
  3: "Empate",
  4: "Gana A por abandono",
  5: "Gana B por abandono",
  6: "Partida anulada",
};

let provider = null;
let signer = null;
let account = null;
let game = null;
let toastTimer = null;
let isSepolia = false;
let gameState = null;

function showToast(message, type = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast show ${type === "error" ? "error" : ""}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.className = "toast";
  }, 5200);
}

function readableError(error) {
  const message =
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "Ocurrió un error inesperado.";

  if (/user rejected|user denied|rejected the request/i.test(message)) {
    return "Cancelaste la solicitud en MetaMask. No se envió la transacción.";
  }
  if (/insufficient funds/i.test(message)) {
    return "No tienes suficiente ETH de prueba para la apuesta y el gas.";
  }
  if (/La apuesta debe coincidir/i.test(message)) {
    return "La apuesta debe ser exactamente igual a la del jugador A.";
  }
  if (/Debe ser otro jugador/i.test(message)) {
    return "Necesitas una segunda dirección de MetaMask distinta a la del jugador A.";
  }
  if (/Hash no coincide/i.test(message)) {
    return "El secreto local no coincide con el compromiso guardado. No repitas el reveal.";
  }

  return message.length > 220 ? `${message.slice(0, 217)}…` : message;
}

function shortAddress(address) {
  if (!address || address === ZeroAddress) return "Sin jugador";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatEth(value) {
  const amount = Number(formatEther(value ?? 0n));
  return `${amount.toLocaleString("es-CL", { maximumFractionDigits: 6 })} ETH`;
}

function isEmptyAddress(address) {
  return !address || address.toLowerCase() === ZeroAddress.toLowerCase();
}

function formatRemaining(deadline, now) {
  if (!deadline || deadline === 0 || now === null || now === undefined) return "--";
  const seconds = Math.max(0, deadline - now);
  if (seconds === 0) return "Vencido";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function updateWalletHeader(balance = null) {
  $("#wallet-address").textContent = account ? shortAddress(account) : "No conectada";
  $("#wallet-balance").textContent = balance === null ? "-- ETH" : formatEth(balance);
  $("#connect-button").textContent = account
    ? isSepolia
      ? `Conectada · ${shortAddress(account)}`
      : "Volver a Sepolia"
    : "Conectar MetaMask";

  const networkPill = $("#network-pill");
  networkPill.innerHTML = isSepolia
    ? '<span class="network-dot"></span> Sepolia Testnet'
    : '<span class="network-dot" style="background:#ffbd8a;box-shadow:none"></span> Red incorrecta';
  networkPill.style.color = isSepolia ? "var(--mint)" : "var(--orange)";
  networkPill.style.borderColor = isSepolia
    ? "rgba(129, 231, 195, 0.22)"
    : "rgba(255, 189, 138, 0.25)";
}

async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEPOLIA_CHAIN_HEX,
          chainName: "Ethereum Sepolia",
          nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        },
      ],
    });
  }
}

async function assertSepoliaNetwork() {
  if (!provider || !window.ethereum) {
    throw new Error("Conecta MetaMask antes de firmar una transacción.");
  }

  const [chainId, network] = await Promise.all([
    window.ethereum.request({ method: "eth_chainId" }),
    provider.getNetwork(),
  ]);

  if (chainId.toLowerCase() !== SEPOLIA_CHAIN_HEX || !isSepoliaChain(network.chainId)) {
    isSepolia = false;
    game = null;
    updateWalletHeader();
    renderAction();
    throw new Error("MetaMask no está en Sepolia. No se envió ninguna transacción.");
  }
}

async function connectWallet(requestAccess = true) {
  if (!window.ethereum) {
    showToast("No detecté MetaMask. Instálalo desde metamask.io y vuelve a intentarlo.", "error");
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: requestAccess ? "eth_requestAccounts" : "eth_accounts",
    });

    if (!accounts?.length) {
      account = null;
      signer = null;
      provider = null;
      game = null;
      gameState = null;
      isSepolia = false;
      $("#phase-chip").textContent = "Esperando conexión";
      updateWalletHeader();
      renderAction();
      return;
    }

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (requestAccess && chainId.toLowerCase() !== SEPOLIA_CHAIN_HEX) {
      await switchToSepolia();
    }

    provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    isSepolia = isSepoliaChain(network.chainId);

    if (!isSepolia) {
      account = accounts[0];
      signer = null;
      game = null;
      gameState = null;
      updateWalletHeader();
      $("#phase-chip").textContent = "Cambia a Sepolia";
      renderAction();
      showToast("Cambia la red de MetaMask a Ethereum Sepolia para continuar.", "error");
      return;
    }

    signer = await provider.getSigner();
    account = await signer.getAddress();
    game = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await refreshGame();
    showToast("Billetera conectada a Ethereum Sepolia.");
  } catch (error) {
    showToast(readableError(error), "error");
  }
}

async function refreshGame() {
  if (!provider) return;

  const network = await provider.getNetwork();
  isSepolia = isSepoliaChain(network.chainId);
  if (!isSepolia) {
    gameState = null;
    updateWalletHeader();
    $("#phase-chip").textContent = "Cambia a Sepolia";
    renderAction();
    return;
  }

  const readContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const [
    playerAData,
    playerBData,
    stake,
    phase,
    result,
    winner,
    joinDeadline,
    revealDeadline,
    contractBalance,
    latestBlock,
  ] = await Promise.all([
    readContract.jugadorA(),
    readContract.jugadorB(),
    readContract.apuesta(),
    readContract.fase(),
    readContract.resultado(),
    readContract.ganador(),
    readContract.limiteSegundoJugador(),
    readContract.limiteRevelacion(),
    provider.getBalance(CONTRACT_ADDRESS),
    provider.getBlock("latest"),
  ]);

  const playerA = {
    address: playerAData[0],
    commitment: playerAData[1],
    move: Number(playerAData[2]),
    revealed: playerAData[3],
  };
  const playerB = {
    address: playerBData[0],
    commitment: playerBData[1],
    move: Number(playerBData[2]),
    revealed: playerBData[3],
  };
  const blockTime = latestBlock ? Number(latestBlock.timestamp) : null;
  const deadline = Number(phase) === 0 ? Number(joinDeadline) : Number(revealDeadline);
  const role = getPlayerRole(account, playerA.address, playerB.address);

  let localReveal = null;
  let localRevealValid = false;
  if (role) {
    const key = secretStorageKey(CONTRACT_ADDRESS, account);
    localReveal = loadSecret(window.localStorage, key);
    if (localReveal && Number(phase) === 1) {
      try {
        const expected = await readContract.calcularCompromiso(
          localReveal.move,
          localReveal.secret,
          account,
        );
        const storedCommitment = role === "A" ? playerA.commitment : playerB.commitment;
        localRevealValid = expected.toLowerCase() === storedCommitment.toLowerCase();
      } catch {
        localRevealValid = false;
      }
    }
  }

  gameState = {
    playerA,
    playerB,
    stake,
    phase: Number(phase),
    result: Number(result),
    winner,
    joinDeadline: Number(joinDeadline),
    revealDeadline: Number(revealDeadline),
    contractBalance,
    blockTime,
    deadline,
    role,
    localReveal,
    localRevealValid,
    canClaim: canClaimByTimeout(phase, blockTime, joinDeadline, revealDeadline),
  };

  let balance = null;
  if (account) {
    try {
      balance = await provider.getBalance(account);
    } catch {
      balance = null;
    }
  }

  updateWalletHeader(balance);
  renderGameState();
}

function renderGameState() {
  if (!gameState) return;

  const { playerA, playerB, stake, phase, result, winner, contractBalance } = gameState;
  $("#player-a").textContent = shortAddress(playerA.address);
  $("#player-b").textContent = shortAddress(playerB.address);
  $("#player-a-state").textContent = isEmptyAddress(playerA.address)
    ? "Aún no se compromete"
    : playerA.revealed
      ? "Jugada revelada ✓"
      : "Compromiso guardado";
  $("#player-b-state").textContent = isEmptyAddress(playerB.address)
    ? "Aún no se compromete"
    : playerB.revealed
      ? "Jugada revelada ✓"
      : "Compromiso guardado";
  $("#stake-value").textContent = formatEth(stake);
  $("#pot-value").textContent = formatEth(contractBalance);
  $("#time-remaining").textContent = phase === 2
    ? "Finalizada"
    : formatRemaining(gameState.deadline, gameState.blockTime);

  const phaseLabels = [
    isEmptyAddress(playerA.address) ? "Partida disponible" : "Esperando jugador B",
    "Revelación en curso",
    "Partida finalizada",
  ];
  $("#phase-chip").textContent = phaseLabels[phase] ?? "Estado desconocido";

  const resultBanner = $("#result-banner");
  resultBanner.hidden = phase !== 2;
  if (phase === 2) {
    $("#result-value").textContent = RESULT_NAMES[result] ?? "Resultado registrado";
    $("#winner-value").textContent = isEmptyAddress(winner)
      ? "Las apuestas fueron devueltas."
      : `Ganador: ${shortAddress(winner)}`;
  }

  renderAction();
}

function renderAction() {
  const root = $("#action-content");

  if (!account) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◈</div>
        <h3>Conecta tu billetera</h3>
        <p>Conecta MetaMask en Sepolia para consultar la partida y participar.</p>
        <button class="button button-primary" id="connect-inline" type="button">Conectar billetera</button>
      </div>`;
    $("#connect-inline")?.addEventListener("click", () => connectWallet(true));
    return;
  }

  if (!isSepolia) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⌁</div>
        <h3>Red incorrecta</h3>
        <p>Esta aplicación solo firma transacciones en Ethereum Sepolia.</p>
        <button class="button button-primary" id="switch-inline" type="button">Cambiar a Sepolia</button>
      </div>`;
    $("#switch-inline")?.addEventListener("click", () => connectWallet(true));
    return;
  }

  if (!gameState) {
    root.innerHTML = '<div class="empty-state"><h3>Cargando partida…</h3><p>Consultando el contrato de Sepolia.</p></div>';
    return;
  }

  if (gameState.phase === 2) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>Partida terminada</h3>
        <p>${RESULT_NAMES[gameState.result] ?? "El resultado quedó registrado"}.</p>
        <a class="text-link" href="${EXPLORER_ADDRESS}#readContract" target="_blank" rel="noreferrer">Consultar contrato en Etherscan ↗</a>
        <p class="form-hint">Esta instancia admite una sola partida. Para jugar otra se necesita otra instancia del contrato.</p>
      </div>`;
    return;
  }

  if (gameState.canClaim) {
    root.innerHTML = `
      <div class="action-form">
        <div class="empty-icon">⌛</div>
        <h3>El plazo ha vencido</h3>
        <p>El contrato permite resolver la partida y ejecutar los reembolsos o el pago correspondiente.</p>
        <div class="action-notice warning">La resolución se registra en blockchain y requiere una transacción firmada.</div>
        <button class="button button-danger button-wide" id="claim-button" type="button">Resolver por tiempo</button>
      </div>`;
    $("#claim-button").addEventListener("click", claimByTimeout);
    return;
  }

  if (gameState.phase === 0) {
    if (isEmptyAddress(gameState.playerA.address)) {
      root.innerHTML = `
        <div class="action-form">
          <div>
            <h3>Abre la partida</h3>
            <p>Elige tu jugada y define la apuesta en ETH de prueba. Tu jugada quedará oculta.</p>
          </div>
          <label class="form-label" for="move-select">TU JUGADA
            <select class="form-control" id="move-select">
              <option value="1">✊ Piedra</option>
              <option value="2">✋ Papel</option>
              <option value="3">✌️ Tijera</option>
            </select>
          </label>
          <label class="form-label" for="stake-input">APUESTA EN ETH DE PRUEBA
            <input class="form-control" id="stake-input" type="number" min="0.0001" max="0.01" step="0.0001" value="0.001" inputmode="decimal" />
          </label>
          <span class="form-hint">El jugador B deberá igualar exactamente este monto. Recomendación para la primera prueba: 0.001 ETH.</span>
          <button class="button button-primary button-wide" id="commit-button" type="button">Comprometer jugada</button>
        </div>`;
      $("#commit-button").addEventListener("click", () => commitMove("create"));
      return;
    }

    if (gameState.role === "A") {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">◷</div>
          <h3>Tu compromiso está guardado</h3>
          <p>Comparte la dirección del contrato con el jugador B. Debe conectarse con otra billetera y aportar ${formatEth(gameState.stake)}.</p>
          <div class="action-notice">Tu jugada sigue oculta. El plazo para que B se una es de cinco minutos.</div>
        </div>`;
      return;
    }

    if (gameState.role === "B") {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h3>Ya te uniste</h3>
          <p>Tu compromiso está registrado. Espera a que el contrato pase a la fase Reveal.</p>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="action-form">
        <div>
          <h3>Únete a la partida</h3>
          <p>El jugador A ya comprometió su jugada. Elige la tuya y envía exactamente la misma apuesta.</p>
        </div>
        <div class="action-notice">Apuesta requerida: <strong>${formatEth(gameState.stake)}</strong></div>
        <label class="form-label" for="move-select">TU JUGADA
          <select class="form-control" id="move-select">
            <option value="1">✊ Piedra</option>
            <option value="2">✋ Papel</option>
            <option value="3">✌️ Tijera</option>
          </select>
        </label>
        <button class="button button-primary button-wide" id="join-button" type="button">Unirme con ${formatEth(gameState.stake)}</button>
        <span class="form-hint">Necesitas una dirección distinta a la del jugador A.</span>
      </div>`;
    $("#join-button").addEventListener("click", () => commitMove("join"));
    return;
  }

  if (gameState.phase === 1) {
    if (!gameState.role) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⌑</div>
          <h3>La partida está en Reveal</h3>
          <p>Las dos direcciones participantes deben revelar su jugada. Esta billetera no forma parte de la partida.</p>
        </div>`;
      return;
    }

    const player = gameState.role === "A" ? gameState.playerA : gameState.playerB;
    if (player.revealed) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h3>Ya revelaste</h3>
          <p>Tu jugada fue registrada. Espera a que el otro jugador revele antes de que venza el plazo.</p>
        </div>`;
      return;
    }

    if (!gameState.localReveal) {
      root.innerHTML = `
        <div class="action-form">
          <h3>No se encontró tu secreto</h3>
          <p>Este navegador no tiene guardado el secreto que generó tu compromiso.</p>
          <div class="action-notice warning">No podemos reconstruirlo ni inventar uno nuevo. Usa el mismo navegador, perfil y billetera donde creaste el compromiso.</div>
        </div>`;
      return;
    }

    if (!gameState.localRevealValid) {
      root.innerHTML = `
        <div class="action-form">
          <h3>El secreto no coincide</h3>
          <p>El secreto guardado no genera el compromiso de esta dirección en el contrato.</p>
          <div class="action-notice warning">No envíes un reveal. Comprueba que estás usando la misma billetera y el mismo navegador.</div>
        </div>`;
      return;
    }

    const move = MOVE_NAMES[gameState.localReveal.move];
    root.innerHTML = `
      <div class="action-form">
        <div>
          <h3>Revela tu jugada</h3>
          <p>Ambos compromisos están registrados. El contrato comprobará tu secreto y resolverá automáticamente cuando los dos hayan revelado.</p>
        </div>
        <div class="action-notice">Tu jugada guardada: <strong>${move}</strong>. El secreto permanece oculto hasta firmar.</div>
        <button class="button button-primary button-wide" id="reveal-button" type="button">Revelar ${move}</button>
        <span class="form-hint">El plazo de revelación es de cinco minutos desde que se unió el jugador B.</span>
      </div>`;
    $("#reveal-button").addEventListener("click", revealMove);
  }
}

async function commitMove(mode) {
  if (!game || !isSepolia || !account) {
    showToast("Conecta MetaMask en Sepolia antes de continuar.", "error");
    return;
  }

  const move = Number($("#move-select")?.value);
  let key = null;
  let transaction = null;

  try {
    await assertSepoliaNetwork();
    let enteredAmount = null;
    if (mode === "create") {
      enteredAmount = $("#stake-input")?.value?.trim();
      if (!enteredAmount || !/^(?:\d+)(?:\.\d{1,18})?$/.test(enteredAmount)) {
        throw new Error("Introduce una apuesta válida en ETH de prueba.");
      }
    }

    const value = getCommitValue(mode, enteredAmount, gameState.stake);
    if (mode === "create" && (value <= 0n || value > getCommitValue("create", "0.01", 0n))) {
      throw new Error("Para esta primera prueba usa una apuesta mayor que cero y no superior a 0.01 ETH.");
    }

    const secret = createSecret();
    const commitment = createCommitment(move, secret, account);
    key = secretStorageKey(CONTRACT_ADDRESS, account);
    saveSecret(window.localStorage, key, {
      move,
      secret,
      createdAt: Date.now(),
    });

    showToast("Revisa MetaMask y confirma la apuesta de prueba.");
    transaction = await game.comprometer(commitment, { value });
    showToast("Transacción enviada. Esperando confirmación en Sepolia…");
    const receipt = await transaction.wait();
    if (receipt?.status !== 1) {
      clearSecret(window.localStorage, key);
      throw new Error("La transacción no fue confirmada.");
    }
  } catch (error) {
    if (!transaction && key) clearSecret(window.localStorage, key);
    showToast(readableError(error), "error");
    return;
  }

  showToast("Compromiso confirmado. Tu secreto quedó guardado en este navegador.");
  try {
    await refreshGame();
  } catch {
    showToast("El compromiso está confirmado en Sepolia. La pantalla se actualizará al recuperar la conexión.", "error");
  }
}

async function revealMove() {
  if (!game || !gameState?.localReveal || !gameState.localRevealValid) return;

  const key = secretStorageKey(CONTRACT_ADDRESS, account);
  try {
    await assertSepoliaNetwork();
    showToast("Confirma el reveal en MetaMask.");
    const transaction = await game.revelar(
      gameState.localReveal.move,
      gameState.localReveal.secret,
    );
    const receipt = await transaction.wait();
    if (receipt?.status !== 1) throw new Error("El reveal no fue confirmado.");
    clearSecret(window.localStorage, key);
  } catch (error) {
    showToast(readableError(error), "error");
    return;
  }

  showToast("Jugada revelada. El contrato actualizará el resultado cuando ambos hayan revelado.");
  try {
    await refreshGame();
  } catch {
    showToast("El reveal está confirmado en Sepolia. La pantalla se actualizará al recuperar la conexión.", "error");
  }
}

async function claimByTimeout() {
  if (!game || !gameState?.canClaim) return;

  try {
    await assertSepoliaNetwork();
    showToast("Confirma la resolución por tiempo en MetaMask.");
    const transaction = await game.reclamarPorTiempo();
    const receipt = await transaction.wait();
    if (receipt?.status !== 1) throw new Error("La resolución no fue confirmada.");
  } catch (error) {
    showToast(readableError(error), "error");
    return;
  }

  showToast("La partida fue resuelta por el contrato.");
  try {
    await refreshGame();
  } catch {
    showToast("La resolución está confirmada en Sepolia. La pantalla se actualizará al recuperar la conexión.", "error");
  }
}

$("#connect-button").addEventListener("click", () => connectWallet(true));
$("#connect-inline").addEventListener("click", () => connectWallet(true));
$("#contract-link").href = `${EXPLORER_ADDRESS}#code`;

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (!accounts?.length) {
      account = null;
      signer = null;
      provider = null;
      game = null;
      gameState = null;
      isSepolia = false;
      updateWalletHeader();
      $("#phase-chip").textContent = "Esperando conexión";
      renderAction();
      return;
    }
    await connectWallet(false);
  });

  window.ethereum.on("chainChanged", async () => {
    await connectWallet(false);
  });
}

window.setInterval(async () => {
  if (!provider || !account) return;
  try {
    await refreshGame();
  } catch {
    // A temporary public RPC or wallet interruption should not erase the saved reveal secret.
  }
}, 7000);

updateWalletHeader();
connectWallet(false);
