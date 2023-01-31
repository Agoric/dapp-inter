import type { PropsWithChildren, ReactNode } from 'react';

type TickerItemProps = {
  label: string;
  value: string;
};

const TickerItem = ({ label, value }: TickerItemProps) => (
  <div className="ml-16 h-12 leading-[48px]">
    <span className="font-medium font-serif text-[#736D6D] mr-2">{label}</span>
    <span className="font-bold font-serif text-mineShaft">{value}</span>
  </div>
);

type Props = PropsWithChildren<{ header?: ReactNode }>;

const MainContentWrapper = ({ children, header }: Props) => {
  const subheader = (
    <div className="h-full flex flex-row items-center flex-wrap">
      <TickerItem label="IST Outstanding (Vaults)" value="--" />
      <TickerItem label="Total Value Locked" value="$ --" />
      <TickerItem label="Total # of Vaults Created" value="--" />
    </div>
  );

  return (
    <div className="mt-[2px] flex-grow bg-gradient-to-br from-[#fffcf2] to-[#ffffff] rounded-t-[48px] shadow-[0px_34px_50px_0px_#ff7a1a] relative">
      <div className="bg-interYellow h-[46px] rounded-t-full before:h-[46px] before:-z-50 before:rounded-t-full before:w-full before:bg-[#FFE04B] before:absolute before:-top-[2px]">
        {header}
      </div>
      <div className="w-full h-[1px] bg-[#f4cd0c]" />
      <div className="w-full h-[1px] bg-[#ffe252]" />
      <div className="bg-interYellow">{subheader}</div>
      <div className="p-10 pt-4">{children}</div>
    </div>
  );
};

export default MainContentWrapper;
