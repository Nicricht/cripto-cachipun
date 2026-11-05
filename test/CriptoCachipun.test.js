const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("CriptoCachipun", function () {
  let juego;
  let jugadorA;
  let jugadorB;
  let tercero;
  let apuesta;

  const secretoA = ethers.id("secreto privado del jugador A");
  const secretoB = ethers.id("secreto privado del jugador B");

  function crearCompromiso(jugada, secreto, direccion) {
    return ethers.solidityPackedKeccak256(
      ["uint8", "bytes32", "address"],
      [jugada, secreto, direccion]
    );
  }

  async function iniciarPartida() {
    const hashA = crearCompromiso(1, secretoA, jugadorA.address);
    const hashB = crearCompromiso(3, secretoB, jugadorB.address);

    await juego.connect(jugadorA).comprometer(hashA, { value: apuesta });
    await juego.connect(jugadorB).comprometer(hashB, { value: apuesta });
  }

  beforeEach(async function () {
    [tercero, jugadorA, jugadorB] = await ethers.getSigners();

    const Fabrica = await ethers.getContractFactory("CriptoCachipun");
    juego = await Fabrica.deploy();
    await juego.waitForDeployment();

    apuesta = ethers.parseEther("0.01");
  });

  it("registra dos compromisos y cambia a Reveal", async function () {
    await iniciarPartida();

    expect(await juego.fase()).to.equal(1n);
    expect(await ethers.provider.getBalance(await juego.getAddress()))
      .to.equal(apuesta * 2n);
    expect(await juego.limiteRevelacion()).to.be.greaterThan(0n);
  });

  it("rechaza una segunda apuesta de monto diferente", async function () {
    const hashA = crearCompromiso(1, secretoA, jugadorA.address);
    const hashB = crearCompromiso(3, secretoB, jugadorB.address);

    await juego.connect(jugadorA).comprometer(hashA, { value: apuesta });

    await expect(
      juego.connect(jugadorB).comprometer(hashB, { value: apuesta + 1n })
    ).to.be.revertedWith("La apuesta debe coincidir");
  });

  it("rechaza una jugada cuyo secreto no coincide con el hash", async function () {
    await iniciarPartida();

    await expect(
      juego.connect(jugadorA).revelar(1, ethers.id("secreto incorrecto"))
    ).to.be.revertedWith("Hash no coincide");
  });

  it("paga el pozo al jugador A cuando Piedra vence a Tijera", async function () {
    await iniciarPartida();

    await juego.connect(jugadorA).revelar(1, secretoA);

    await expect(
      juego.connect(jugadorB).revelar(3, secretoB)
    ).to.changeEtherBalance(jugadorA, apuesta * 2n);

    expect(await juego.ganador()).to.equal(jugadorA.address);
    expect(await juego.fase()).to.equal(2n);
    expect(await ethers.provider.getBalance(await juego.getAddress())).to.equal(0n);
  });

  it("devuelve ambas apuestas cuando hay empate", async function () {
    const hashA = crearCompromiso(2, secretoA, jugadorA.address);
    const hashB = crearCompromiso(2, secretoB, jugadorB.address);

    await juego.connect(jugadorA).comprometer(hashA, { value: apuesta });
    await juego.connect(jugadorB).comprometer(hashB, { value: apuesta });
    await juego.connect(jugadorA).revelar(2, secretoA);

    await expect(
      juego.connect(jugadorB).revelar(2, secretoB)
    ).to.changeEtherBalance(jugadorA, apuesta);

    expect(await juego.resultado()).to.equal(3n);
    expect(await juego.ganador()).to.equal(ethers.ZeroAddress);
    expect(await ethers.provider.getBalance(await juego.getAddress())).to.equal(0n);
  });

  it("devuelve ambas apuestas si ninguno revela", async function () {
    await iniciarPartida();

    await network.provider.send("evm_increaseTime", [301]);
    await network.provider.send("evm_mine");

    await expect(
      juego.connect(tercero).reclamarPorTiempo()
    ).to.changeEtherBalance(jugadorA, apuesta);

    expect(await juego.resultado()).to.equal(6n);
    expect(await ethers.provider.getBalance(await juego.getAddress())).to.equal(0n);
  });

  it("paga al único jugador que reveló dentro del plazo", async function () {
    await iniciarPartida();
    await juego.connect(jugadorA).revelar(1, secretoA);

    await network.provider.send("evm_increaseTime", [301]);
    await network.provider.send("evm_mine");

    await expect(
      juego.connect(tercero).reclamarPorTiempo()
    ).to.changeEtherBalance(jugadorA, apuesta * 2n);

    expect(await juego.ganador()).to.equal(jugadorA.address);
    expect(await juego.resultado()).to.equal(4n);
    expect(await ethers.provider.getBalance(await juego.getAddress())).to.equal(0n);
  });

  it("impide que una tercera dirección revele una jugada", async function () {
    await iniciarPartida();

    await expect(
      juego.connect(tercero).revelar(1, secretoA)
    ).to.be.revertedWith("No eres jugador");
  });
});
