import React, { createContext, useContext, useState } from "react";

type Mall = {
  id: number;
  name: string;
};

type MallContextType = {
  selectedMall: Mall | null;
  setSelectedMall: (mall: Mall | null) => void;
};

const MallContext = createContext<MallContextType>(
  {} as MallContextType
);

export const MallProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedMall, setSelectedMall] = useState<Mall | null>(null);

  return (
    <MallContext.Provider
      value={{ selectedMall, setSelectedMall }}
    >
      {children}
    </MallContext.Provider>
  );
};

export const useMall = () => useContext(MallContext);
