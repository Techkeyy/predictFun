const hre = require("hardhat");

const OFFICIAL_CALLS = [
  {
    claim: "Brazil will win the 2026 FIFA World Cup",
    deadline: new Date("2026-07-19T20:00:00Z"),
  },
  {
    claim: "Kylian Mbappe will win the Golden Boot at World Cup 2026",
    deadline: new Date("2026-07-19T20:00:00Z"),
  },
  {
    claim: "The 2026 World Cup final will be between Brazil and France",
    deadline: new Date("2026-07-18T20:00:00Z"),
  },
  {
    claim: "At least one African team will reach the semi-finals",
    deadline: new Date("2026-07-14T20:00:00Z"),
  },
  {
    claim: "England will be eliminated before the quarter-finals",
    deadline: new Date("2026-07-05T20:00:00Z"),
  },
  {
    claim: "The tournament top scorer will score more than 8 goals",
    deadline: new Date("2026-07-19T20:00:00Z"),
  },
];

const STAKE_PER_CALL = hre.ethers.parseEther("0.01");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Seeding official markets with account:", deployer.address);

  const theCallAddress = process.env.NEXT_PUBLIC_THECALL_ADDRESS;
  if (!theCallAddress) {
    throw new Error("NEXT_PUBLIC_THECALL_ADDRESS not set in .env");
  }

  const TheCall = await hre.ethers.getContractAt("TheCall", theCallAddress);

  console.log("\nCreating official PredictFun calls...\n");

  for (const call of OFFICIAL_CALLS) {
    const deadline = BigInt(Math.floor(call.deadline.getTime() / 1000));
    const tx = await TheCall.makeCall(call.claim, deadline, { value: STAKE_PER_CALL });
    await tx.wait();
    console.log(`Created: "${call.claim}"`);
    console.log(`Tx: ${tx.hash}\n`);
  }

  console.log("All official markets seeded successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
