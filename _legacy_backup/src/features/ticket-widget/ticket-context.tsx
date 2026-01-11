"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface TicketContextType {
    isOpen: boolean;
    isMinimized: boolean;
    openTicket: () => void;
    closeTicket: () => void;
    minimizeTicket: () => void;
    maximizeTicket: () => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const openTicket = () => {
        setIsOpen(true);
        setIsMinimized(false);
    };

    const closeTicket = () => {
        setIsOpen(false);
        setIsMinimized(false);
    };

    const minimizeTicket = () => {
        setIsMinimized(true);
    };

    const maximizeTicket = () => {
        setIsMinimized(false);
    };

    return (
        <TicketContext.Provider
            value={{
                isOpen,
                isMinimized,
                openTicket,
                closeTicket,
                minimizeTicket,
                maximizeTicket,
            }}
        >
            {children}
        </TicketContext.Provider>
    );
}

export function useTicket() {
    const context = useContext(TicketContext);
    if (context === undefined) {
        throw new Error("useTicket must be used within a TicketProvider");
    }
    return context;
}
