import type { PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{ header?: ReactNode; subheader?: ReactNode }>;

const MainContentCard = ({ children, header, subheader }: Props) => {
  return (
    <div className="w-full bg-gradient-to-br from-[#fffcf2] to-[#ffffff] rounded-t-3xl rounded-b-xl shadow-[0px_34px_50px_0px_#ff7a1a]">
      <div className="bg-interYellow h-12 rounded-t-3xl">{header}</div>
      <div className="w-full h-[1px] bg-[#f4cd0c]" />
      <div className="w-full h-[1px] bg-[#ffe252]" />
      <div className="bg-interYellow h-12">{subheader}</div>
      <div className="p-8">{children}</div>
    </div>
  );
};

export default MainContentCard;
