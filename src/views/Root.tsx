import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import NetworkDropdown from '../components/NetworkDropdown';
import ConnectWalletButton from '../components/ConnectWalletButton';

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
                  ? 'h-1.5 bg-mineShaft w-full rounded-t-[3px] shadow-[0_-1px_8px_0px_#484848]'
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

  return (
    <>
      <div className="flex w-full justify-between h-24">
        <div className="flex flex-row space-x-10">
          <img
            src="./inter-protocol-logo.svg"
            alt="Inter Protocol Logo"
            height="48"
            width="174"
          />
          <nav>
            <ul className="h-full flex flex-row space-x-12">
              <NavItem label="Vaults" href="/vaults" />
              <NavItem label="Liquidations" href="/liquidations" />
            </ul>
          </nav>
        </div>
        <div className="flex flex-row space-x-2 items-center mr-6">
          <NetworkDropdown />
          <ConnectWalletButton />
        </div>
      </div>
      {shouldRedirectToVaults && (
        <Navigate replace={true} to="/vaults"></Navigate>
      )}
      <Outlet />
    </>
  );
};

export default Root;
