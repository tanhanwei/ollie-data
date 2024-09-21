import React from 'react';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';

const WorldIDAuth = ({ onSuccess }) => {
  const handleVerify = async (proof) => {
    console.log("Proof received:", proof);
    onSuccess(proof);
  };

  return (
    <IDKitWidget
      app_id={process.env.REACT_APP_WORLD_ID_APP_ID}
      action={process.env.REACT_APP_WORLD_ID_ACTION_NAME}
      onSuccess={onSuccess}
      handleVerify={handleVerify}
      verification_level={VerificationLevel.Orb}
    >
      {({ open }) => <button onClick={open}>Verify with World ID</button>}
    </IDKitWidget>
  );
};

export default WorldIDAuth;