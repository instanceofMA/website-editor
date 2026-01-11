"use client";

import React from "react";
import { useTicket } from "./ticket-context";
import { Ticket } from "lucide-react";

export function TicketFAB() {
    const { isOpen, isMinimized, openTicket } = useTicket();

    // Show FAB if closed OR minimized
    if (isOpen && !isMinimized) return null;

    // Classic Windows Button Style
    const classicButtonStyle =
        "fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#c0c0c0] text-black px-3 py-2 border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white active:bg-[#c0c0c0] active:pt-[10px] active:pl-[14px] active:pb-[6px] active:pr-[10px] hover:scale-105 transition-transform font-sans font-bold shadow-md";

    return (
        <button
            onClick={openTicket}
            className={classicButtonStyle}
            aria-label="Submit a Ticket"
        >
            <Ticket className="w-5 h-5" />
            <span>Submit a Ticket</span>
        </button>
    );
}
