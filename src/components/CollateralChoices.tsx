import { useVaultStore } from 'store/vaults';
import CollateralChoice from './CollateralChoice';

const CollateralChoices = () => {
  const { vaultManagerIds } = useVaultStore();

  return (
    <>
      <h2>Open a new vault:</h2>
      {vaultManagerIds &&
        vaultManagerIds.map(id => <CollateralChoice key={id} id={id} />)}
    </>
  );
};

export default CollateralChoices;
