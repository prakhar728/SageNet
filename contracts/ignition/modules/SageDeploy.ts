// deploy/sagenet.ignition.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SageNetDeployment = buildModule("SageNetDeployment", (m) => {
  const sageNetCore = m.contract("SageNetCore",);

  // console.log(sageNetCore);
  
  // const sageNetReview = m.contract("SageNetReview", [sageNetCore]);

  // m.call(
  //   sageNetCore,
  //   "setStatusUpdater",
  //   [sageNetReview, true],
  // );

  return {
    sageNetCore,
    // sageNetReview,
  };
});

export default SageNetDeployment;
