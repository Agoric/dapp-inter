import { prodSignerHref } from 'config';

export default (
  <p>
    No Agoric smart wallet found for this address. Create one at{' '}
    <a
      className="underline text-blue-500"
      href={prodSignerHref}
      target="_blank"
      rel="noreferrer"
    >
      {prodSignerHref}
    </a>
    then try again.{' '}
  </p>
);
