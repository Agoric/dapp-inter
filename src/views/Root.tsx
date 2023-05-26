import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import ConnectWalletButton from '../components/ConnectWalletButton';
import React, { Suspense } from 'react';

const NetworkDropdown = React.lazy(
  () => import('../components/NetworkDropdown'),
);

type NavItemProps = {
  label: string;
  href: string;
};

const NavItem = ({ label, href }: NavItemProps) => {
  return (
    <li>
      <NavLink
        className="h-full justify-between flex flex-col font-serif"
        to={href}
      >
        {({ isActive }) => (
          <>
            <div className="h-1.5"></div>
            <span className="m-2 font-bold">{label}</span>
            <div
              className={
                isActive
                  ? 'h-1.5 bg-primary w-full rounded-t-[3px] shadow-[0_-1px_8px_0px_#484848]'
                  : 'h-1.5'
              }
            ></div>
          </>
        )}
      </NavLink>
    </li>
  );
};

const Root = () => {
  const { pathname } = useLocation();
  const shouldRedirectToVaults = pathname === '/';

  const networkDropdown = import.meta.env.VITE_NETWORK_CONFIG_URL ? (
    <></>
  ) : (
    <Suspense>
      <NetworkDropdown />
    </Suspense>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex max-w-7xl justify-between flex-wrap-reverse gap-x-2">
        <div className="flex flex-row space-x-10">
          <img
            src="./inter-protocol-logo.svg"
            alt="Inter Protocol Logo"
            height="48"
            width="174"
          />
          <nav>
            <ul className="h-24 flex flex-row space-x-12">
              <NavItem label="Vaults" href="/vaults" />
            </ul>
          </nav>
        </div>
        <div className="flex flex-row space-x-2 items-center mr-6 m-2">
          {networkDropdown}
          <ConnectWalletButton />
        </div>
      </div>
      {shouldRedirectToVaults && (
        <Navigate replace={true} to="/vaults"></Navigate>
      )}
      <Outlet />
    </div>
  );
};

export default Root;
