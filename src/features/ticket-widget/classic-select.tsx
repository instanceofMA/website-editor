import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface Option {
    label: string;
    value: string;
}

interface ClassicSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function ClassicSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    className,
}: ClassicSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    // Styles
    const insetStyle =
        "bg-white border-t-2 border-l-2 border-t-[#808080] border-l-[#808080] border-b-2 border-r-2 border-b-white border-r-white";
    const buttonStyle =
        "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white";
    const dropdownStyle =
        "bg-white border-2 border-black absolute left-0 right-0 z-50 max-h-40 overflow-y-auto shadow-xl";

    return (
        <div
            ref={containerRef}
            className={clsx("relative text-sm select-none", className)}
        >
            <div
                className={clsx(
                    "flex items-stretch h-full cursor-default",
                    insetStyle
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 px-1 py-0.5 flex items-center overflow-hidden whitespace-nowrap">
                    {selectedOption ? selectedOption.label : placeholder}
                </div>
                <button
                    type="button"
                    className={clsx(
                        "w-5 flex items-center justify-center shrink-0",
                        buttonStyle,
                        isOpen &&
                            "pt-0.5 pl-0.5 border-t-black border-l-black border-b-white border-r-white"
                    )}
                >
                    <ChevronDown className="w-3 h-3 text-black" />
                </button>
            </div>

            {isOpen && (
                <div className={dropdownStyle} style={{ top: "100%" }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={clsx(
                                "px-1 py-0.5 cursor-pointer flex items-center gap-2",
                                option.value === value
                                    ? "bg-[#000080] text-white"
                                    : "hover:bg-[#000080] hover:text-white text-black"
                            )}
                            onClick={() => handleSelect(option.value)}
                        >
                            {/* Windows checkmark logic could be added here if desired, but standard combo box usually just highlights */}
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
