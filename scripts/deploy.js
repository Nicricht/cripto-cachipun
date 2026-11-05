const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Cuenta desplegadora:", deployer.address);

  const CriptoCachipun = await ethers.getContractFactory("CriptoCachipun");
  const juego = await CriptoCachipun.deploy();

  await juego.waitForDeployment();

  console.log("Contrato desplegado en:", await juego.getAddress());
  console.log("Red:", (await ethers.provider.getNetwork()).name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
