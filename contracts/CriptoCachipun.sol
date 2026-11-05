// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CriptoCachipun
/// @notice Juego de Piedra, Papel o Tijera para dos jugadores con apuestas en Ether.
contract CriptoCachipun {
    enum Jugada {
        Ninguna,
        Piedra,
        Papel,
        Tijera
    }

    enum Fase {
        Commit,
        Reveal,
        Terminado
    }

    enum Resultado {
        Pendiente,
        GanaA,
        GanaB,
        Empate,
        GanaAPorAbandono,
        GanaBPorAbandono,
        Anulado
    }

    struct Jugador {
        address cuenta;
        bytes32 compromiso;
        Jugada jugada;
        bool revelo;
    }

    uint256 public constant PLAZO_REVELACION = 5 minutes;

    Jugador public jugadorA;
    Jugador public jugadorB;

    uint256 public apuesta;
    uint256 public limiteRevelacion;

    Fase public fase;
    Resultado public resultado;
    address public ganador;

    event CompromisoGuardado(
        address indexed jugador,
        bytes32 compromiso,
        uint256 apuesta
    );

    event FaseRevealIniciada(uint256 limiteRevelacion);

    event JugadaRevelada(
        address indexed jugador,
        Jugada jugada
    );

    event PagoRealizado(
        address indexed destinatario,
        uint256 monto
    );

    event JuegoResuelto(
        address indexed ganador,
        Resultado resultado,
        uint256 montoTotal
    );

    /// @notice Registra el compromiso y la apuesta de cada jugador.
    /// @dev El segundo jugador debe enviar exactamente la misma cantidad de Ether.
    function comprometer(bytes32 _compromiso) external payable {
        require(fase == Fase.Commit, "La fase Commit no esta activa");
        require(_compromiso != bytes32(0), "Hash vacio");
        require(msg.value > 0, "La apuesta debe ser mayor que cero");

        if (jugadorA.cuenta == address(0)) {
            jugadorA = Jugador({
                cuenta: msg.sender,
                compromiso: _compromiso,
                jugada: Jugada.Ninguna,
                revelo: false
            });

            apuesta = msg.value;
        } else {
            require(jugadorB.cuenta == address(0), "Ya existen dos jugadores");
            require(msg.sender != jugadorA.cuenta, "Debe ser otro jugador");
            require(msg.value == apuesta, "La apuesta debe coincidir");

            jugadorB = Jugador({
                cuenta: msg.sender,
                compromiso: _compromiso,
                jugada: Jugada.Ninguna,
                revelo: false
            });

            fase = Fase.Reveal;
            limiteRevelacion = block.timestamp + PLAZO_REVELACION;

            emit FaseRevealIniciada(limiteRevelacion);
        }

        emit CompromisoGuardado(msg.sender, _compromiso, msg.value);
    }

    /// @notice Calcula el hash que debe coincidir con el compromiso.
    /// @dev El orden y los tipos deben ser idénticos en Solidity y JavaScript.
    function calcularCompromiso(
        Jugada _jugada,
        bytes32 _secreto,
        address _jugador
    ) public pure returns (bytes32) {
        require(_jugada != Jugada.Ninguna, "Jugada invalida");

        return keccak256(
            abi.encodePacked(uint8(_jugada), _secreto, _jugador)
        );
    }

    /// @notice Revela una jugada y verifica su hash.
    function revelar(
        Jugada _jugada,
        bytes32 _secreto
    ) external {
        require(fase == Fase.Reveal, "La fase Reveal no esta activa");
        require(block.timestamp <= limiteRevelacion, "Plazo de reveal vencido");
        require(_jugada != Jugada.Ninguna, "Jugada invalida");

        Jugador storage jugador;

        if (msg.sender == jugadorA.cuenta) {
            jugador = jugadorA;
        } else if (msg.sender == jugadorB.cuenta) {
            jugador = jugadorB;
        } else {
            revert("No eres jugador");
        }

        require(!jugador.revelo, "Ya revelaste");

        bytes32 hashCalculado = calcularCompromiso(
            _jugada,
            _secreto,
            msg.sender
        );

        require(
            hashCalculado == jugador.compromiso,
            "Hash no coincide"
        );

        jugador.jugada = _jugada;
        jugador.revelo = true;

        emit JugadaRevelada(msg.sender, _jugada);

        if (jugadorA.revelo && jugadorB.revelo) {
            _resolver();
        }
    }

    /// @notice Resuelve el juego cuando vence el plazo de revelación.
    /// @dev Cualquier dirección puede ejecutar esta función una vez vencido el plazo.
    function reclamarPorTiempo() external {
        require(fase == Fase.Reveal, "No hay un juego esperando reveal");
        require(block.timestamp > limiteRevelacion, "El plazo no ha vencido");

        fase = Fase.Terminado;

        if (!jugadorA.revelo && !jugadorB.revelo) {
            resultado = Resultado.Anulado;

            _transferir(jugadorA.cuenta, apuesta);
            _transferir(jugadorB.cuenta, apuesta);

            emit JuegoResuelto(address(0), resultado, apuesta * 2);
        } else if (jugadorA.revelo) {
            ganador = jugadorA.cuenta;
            resultado = Resultado.GanaAPorAbandono;

            _transferir(ganador, apuesta * 2);

            emit JuegoResuelto(ganador, resultado, apuesta * 2);
        } else {
            ganador = jugadorB.cuenta;
            resultado = Resultado.GanaBPorAbandono;

            _transferir(ganador, apuesta * 2);

            emit JuegoResuelto(ganador, resultado, apuesta * 2);
        }
    }

    /// @dev Compara las jugadas y distribuye el pozo.
    function _resolver() private {
        fase = Fase.Terminado;

        Jugada jugadaA = jugadorA.jugada;
        Jugada jugadaB = jugadorB.jugada;

        if (jugadaA == jugadaB) {
            resultado = Resultado.Empate;

            // Decisión de diseño: en empate cada jugador recupera su apuesta.
            _transferir(jugadorA.cuenta, apuesta);
            _transferir(jugadorB.cuenta, apuesta);

            emit JuegoResuelto(address(0), resultado, apuesta * 2);
        } else if (
            (jugadaA == Jugada.Piedra && jugadaB == Jugada.Tijera) ||
            (jugadaA == Jugada.Papel && jugadaB == Jugada.Piedra) ||
            (jugadaA == Jugada.Tijera && jugadaB == Jugada.Papel)
        ) {
            ganador = jugadorA.cuenta;
            resultado = Resultado.GanaA;

            _transferir(ganador, apuesta * 2);

            emit JuegoResuelto(ganador, resultado, apuesta * 2);
        } else {
            ganador = jugadorB.cuenta;
            resultado = Resultado.GanaB;

            _transferir(ganador, apuesta * 2);

            emit JuegoResuelto(ganador, resultado, apuesta * 2);
        }
    }

    /// @dev Efectúa el pago. El estado se marca como Terminado antes de transferir.
    function _transferir(address _destinatario, uint256 _monto) private {
        (bool enviado, ) = _destinatario.call{value: _monto}("");
        require(enviado, "La transferencia de Ether fallo");

        emit PagoRealizado(_destinatario, _monto);
    }
}
