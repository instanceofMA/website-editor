"use client";

import React, { useState, useEffect } from "react";
import {
    Upload,
    Minus,
    Square,
    X as CloseIcon,
    ChevronDown,
} from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import clsx from "clsx";
import { useTicket } from "./ticket-context";
import { ClassicSelect } from "./classic-select";
import { Controller } from "react-hook-form";

// --- Schema Definition ---
const ticketSchema = z
    .object({
        name: z.string().optional(),
        email: z.string().email({ message: "Invalid email address" }),
        company: z.string().optional(),
        title: z.string().min(1, "Title is required"),
        category: z.enum(["Bug", "Feature Request", "Question", "Other"]),
        area: z.string().min(1, "Area is required"),
        areaOther: z.string().optional(),
        description: z
            .string()
            .min(10, "Description must be at least 10 characters"),
    })
    .refine(
        (data) => {
            if (data.area === "Other" && !data.areaOther) {
                return false;
            }
            return true;
        },
        {
            message: "Please specify the area",
            path: ["areaOther"],
        }
    );

type TicketFormInputs = z.infer<typeof ticketSchema>;

export function TicketWindow() {
    const { isOpen, isMinimized, closeTicket, minimizeTicket } = useTicket();
    const [isMaximized, setIsMaximized] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [submitStatus, setSubmitStatus] = useState<
        "idle" | "success" | "error"
    >("idle");

    const [submittedCategory, setSubmittedCategory] = useState<string | null>(
        null
    );

    const {
        register,
        handleSubmit,
        watch,
        reset,

        control,
        formState: { errors, isSubmitting },
    } = useForm<TicketFormInputs>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            category: "Bug",
            area: "Editor Interface", // Default
        },
    });

    // Reset validation/state when window opens/closes if needed
    // For now we rely on unmounting to reset, but if we change to hidden we might need this.

    // Effect to prevent body scroll when open and maximized on mobile?
    // Keeping it simple for now.

    // Options
    const categoryOptions = [
        { label: "Bug Report", value: "Bug" },
        { label: "Feature Request", value: "Feature Request" },
        { label: "Question", value: "Question" },
        { label: "Other", value: "Other" },
    ];

    const areaOptions = [
        { label: "Editor Interface", value: "Editor Interface" },
        {
            label: "Infinite Canvas & Drag-n-Drop",
            value: "Canvas & Drag-n-Drop",
        },
        { label: "Template Library", value: "Template Library" },
        { label: "Import / Export", value: "Import / Export" },
        { label: "Preview Mode", value: "Preview Mode" },
        { label: "Device Viewports", value: "Device Viewports" },
        {
            label: "Website Loading & Rendering",
            value: "Website Loading/Rendering",
        },
        { label: "Other", value: "Other" },
    ];

    const selectedArea = watch("area");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit: SubmitHandler<TicketFormInputs> = async (data) => {
        setSubmitStatus("idle");

        const formData = new FormData();
        // Append all text fields
        Object.entries(data).forEach(([key, value]) => {
            if (value) formData.append(key, value);
        });

        // Append files
        files.forEach((file) => {
            formData.append("attachments", file);
        });

        try {
            const response = await fetch("/api/tickets", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to submit ticket");
            }

            setSubmittedCategory(
                data.category === "Bug" ? "Bug Report" : data.category
            );
            setSubmitStatus("success");
            reset();
            setFiles([]);
        } catch (error) {
            console.error(error);
            setSubmitStatus("error");
        }
    };

    // --- Styles ---
    const windowStyle =
        "bg-[#c0c0c0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black shadow-xl";
    const titleBarStyle =
        "bg-gradient-to-r from-[#000080] to-[#1084d0] px-1 py-1 flex items-center justify-between select-none";
    const insetStyle =
        "bg-white border-t-2 border-l-2 border-t-[#808080] border-l-[#808080] border-b-2 border-r-2 border-b-white border-r-white";
    const buttonStyle =
        "bg-[#c0c0c0] px-4 py-1 border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white active:bg-[#c0c0c0] focus:outline-dotted focus:outline-1 focus:outline-black active:pt-[6px] active:pl-[6px] pt-[4px] pl-[4px] disabled:text-gray-500 disabled:active:border-t-white disabled:active:border-l-white disabled:active:border-b-black disabled:active:border-r-black disabled:active:pt-1 disabled:active:pl-4";

    const errorStyle = "text-red-600 text-xs mt-1 block";

    if (!isOpen || isMinimized) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={(e) => {
                // Optional: Close on backdrop click? Maybe safer NOT to for a form.
            }}
        >
            {/* 
                Wrapper to handle positioning. 
                If maximized: inset-0, absolute.
                If normal: relative, max-w-2xl.
             */}
            <div
                className={clsx(
                    windowStyle,
                    "flex flex-col overflow-hidden transform transition-all duration-300",
                    isMaximized
                        ? "fixed inset-0 w-full h-full rounded-none"
                        : "w-full max-w-2xl h-[80vh] max-h-[800px] rounded-sm"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title Bar */}
                <div
                    className={titleBarStyle}
                    onDoubleClick={() => setIsMaximized(!isMaximized)}
                >
                    <div className="flex items-center gap-2 pl-1">
                        <img
                            src="https://win98icons.alexmeub.com/icons/png/computer_explorer-0.png"
                            alt="icon"
                            className="w-4 h-4"
                        />
                        <span className="text-white font-bold text-sm tracking-wide">
                            Ticketing System
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                minimizeTicket();
                            }}
                            className={`${buttonStyle} !p-0 w-5 h-5 flex items-center justify-center min-w-[20px]`}
                            aria-label="Minimize"
                        >
                            <Minus className="w-3 h-3 text-black mb-1" />
                        </button>
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className={`${buttonStyle} !p-0 w-5 h-5 flex items-center justify-center min-w-[20px]`}
                            aria-label="Maximize"
                        >
                            <Square className="w-3 h-3 text-black stroke-3" />
                        </button>
                        <button
                            onClick={closeTicket}
                            className={`${buttonStyle} !p-0 w-5 h-5 flex items-center justify-center min-w-[20px]`}
                            aria-label="Close"
                        >
                            <CloseIcon className="w-4 h-4 text-black" />
                        </button>
                    </div>
                </div>

                {/* Menu Bar */}
                <div className="flex gap-4 px-3 py-1 text-sm select-none border-b border-[#808080] mb-px">
                    <div>
                        <span className="underline decoration-1 underline-offset-2">
                            F
                        </span>
                        ile
                    </div>
                    <div>
                        <span className="underline decoration-1 underline-offset-2">
                            E
                        </span>
                        dit
                    </div>
                    <div>
                        <span className="underline decoration-1 underline-offset-2">
                            V
                        </span>
                        iew
                    </div>
                    <div>
                        <span className="underline decoration-1 underline-offset-2">
                            H
                        </span>
                        elp
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col overflow-y-auto bg-[#c0c0c0]">
                    {submitStatus === "success" ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                            <img
                                src="https://win98icons.alexmeub.com/icons/png/msg_information-0.png"
                                alt="Success"
                                className="w-12 h-12 mb-4"
                            />
                            <h3 className="text-lg font-bold mb-2">
                                Ticket Submitted!
                            </h3>
                            <p className="mb-6 max-w-md">
                                Your {submittedCategory} has been successfully
                                submitted to Backlog. We will reach out to you
                                for any additional information (if required).
                            </p>
                            <button
                                onClick={() => {
                                    setSubmitStatus("idle");
                                    closeTicket();
                                }}
                                className={`${buttonStyle} min-w-[120px] font-bold`}
                            >
                                OK
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Feedback Notice */}
                            <div className="border border-[#808080] p-4 bg-[#ffffe1] flex gap-3 text-sm mb-4 shadow-inner shrink-0">
                                <img
                                    src="https://win98icons.alexmeub.com/icons/png/msg_warning-0.png"
                                    alt="Info"
                                    className="w-8 h-8 shrink-0"
                                />
                                <div>
                                    <h3 className="font-bold mb-1">
                                        Your Feedback Matters!
                                    </h3>
                                    <p>
                                        This is a user-centric product. I base
                                        most features and bug fixes directly on
                                        your feedback. Please let me know what
                                        you think! You can also{" "}
                                        <a
                                            href="https://trello.com/b/JQcFW8EN"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-blue-800 hover:text-blue-600"
                                        >
                                            view existing requests here
                                        </a>
                                        .
                                    </p>
                                </div>
                            </div>

                            <div
                                className={clsx(
                                    "flex-1 gap-4 transition-all duration-700 ease-in-out",
                                    isMaximized
                                        ? "grid grid-cols-2"
                                        : "flex flex-col space-y-4"
                                )}
                            >
                                {/* --- LEFT COLUMN (Inputs) --- */}
                                <div className="space-y-4">
                                    {/* User Info Group */}
                                    <fieldset className="border border-white border-l-[#808080] border-t-[#808080] p-4 text-sm relative">
                                        <legend className="px-1 text-black">
                                            User Information
                                        </legend>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block mb-1">
                                                    Name:
                                                </label>
                                                <input
                                                    type="text"
                                                    {...register("name")}
                                                    className={`w-full p-1 outline-none ${insetStyle}`}
                                                />
                                                {errors.name && (
                                                    <span
                                                        className={errorStyle}
                                                    >
                                                        {errors.name.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block mb-1">
                                                    Email:
                                                </label>
                                                <input
                                                    type="email"
                                                    {...register("email")}
                                                    className={`w-full p-1 outline-none ${insetStyle}`}
                                                />
                                                {errors.email && (
                                                    <span
                                                        className={errorStyle}
                                                    >
                                                        {errors.email.message}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block mb-1">
                                                    Company:
                                                </label>
                                                <input
                                                    type="text"
                                                    {...register("company")}
                                                    className={`w-full p-1 outline-none ${insetStyle}`}
                                                />
                                                {errors.company && (
                                                    <span
                                                        className={errorStyle}
                                                    >
                                                        {errors.company.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </fieldset>

                                    {/* Meta Data Group */}
                                    <fieldset className="border border-white border-l-[#808080] border-t-[#808080] p-4 text-sm relative">
                                        <legend className="px-1 text-black">
                                            Details
                                        </legend>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block mb-1">
                                                    Title:
                                                </label>
                                                <input
                                                    type="text"
                                                    {...register("title")}
                                                    className={`w-full p-1 outline-none ${insetStyle}`}
                                                />
                                                {errors.title && (
                                                    <span
                                                        className={errorStyle}
                                                    >
                                                        {errors.title.message}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block mb-1">
                                                        Category:
                                                    </label>
                                                    <Controller
                                                        name="category"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <ClassicSelect
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                                options={
                                                                    categoryOptions
                                                                }
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1">
                                                        Area:
                                                    </label>
                                                    <Controller
                                                        name="area"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <ClassicSelect
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                                options={
                                                                    areaOptions
                                                                }
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            {selectedArea === "Other" && (
                                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <label className="block mb-1">
                                                        Specify Area:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...register(
                                                            "areaOther"
                                                        )}
                                                        className={`w-full p-1 outline-none ${insetStyle}`}
                                                        placeholder="Please specify..."
                                                    />
                                                    {errors.areaOther && (
                                                        <span
                                                            className={
                                                                errorStyle
                                                            }
                                                        >
                                                            {
                                                                errors.areaOther
                                                                    .message
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </fieldset>
                                </div>

                                {/* --- RIGHT COLUMN (Description + Attachments) --- */}
                                <div className="flex flex-col h-full space-y-4">
                                    <fieldset className="border border-white border-l-[#808080] border-t-[#808080] p-4 text-sm relative flex-1 flex flex-col">
                                        <legend className="px-1 text-black">
                                            Content
                                        </legend>

                                        <div className="flex flex-col flex-1 space-y-3">
                                            <div className="flex-1 flex flex-col">
                                                <label className="block mb-1">
                                                    Description:
                                                </label>
                                                <textarea
                                                    {...register("description")}
                                                    className={clsx(
                                                        `w-full p-1 outline-none resize-none ${insetStyle}`,
                                                        isMaximized
                                                            ? "flex-1"
                                                            : "h-32"
                                                    )}
                                                />
                                                {errors.description && (
                                                    <span
                                                        className={errorStyle}
                                                    >
                                                        {
                                                            errors.description
                                                                .message
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <div className="shrink-0">
                                                <label className="block mb-1">
                                                    Attachments:
                                                </label>
                                                <div
                                                    className={`w-full p-4 ${insetStyle} flex flex-col items-center justify-center gap-2 bg-white cursor-pointer hover:bg-gray-50 active:bg-gray-200 transition-colors relative group`}
                                                >
                                                    <input
                                                        type="file"
                                                        onChange={
                                                            handleFileChange
                                                        }
                                                        multiple
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        title="Upload files"
                                                    />
                                                    <div className="flex flex-col items-center text-center">
                                                        <Upload className="w-6 h-6 text-[#808080] mb-2 group-hover:text-black" />
                                                        <span className="font-bold underline decoration-dotted text-blue-800">
                                                            Click here to upload
                                                            files
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            (Documents, Text,
                                                            Images, etc. - Max.
                                                            10MB)
                                                        </span>
                                                    </div>
                                                </div>

                                                {files.length > 0 && (
                                                    <div className="mt-2 text-xs border border-dotted border-black p-2 bg-white max-h-32 overflow-y-auto">
                                                        <ul className="list-disc pl-4">
                                                            {files.map(
                                                                (file, i) => (
                                                                    <li
                                                                        key={i}
                                                                        className="flex justify-between w-full"
                                                                    >
                                                                        <span className="truncate pr-2">
                                                                            {
                                                                                file.name
                                                                            }
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeFile(
                                                                                    i
                                                                                )
                                                                            }
                                                                            className="text-red-600 hover:text-red-800 font-bold px-1"
                                                                        >
                                                                            [DEL]
                                                                        </button>
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>

                            {/* Form Actions */}
                            {submitStatus === "error" && (
                                <div className="text-red-600 flex gap-2 items-center text-sm font-bold mt-2">
                                    <img
                                        src="https://win98icons.alexmeub.com/icons/png/msg_error-0.png"
                                        alt="error"
                                        className="w-4 h-4"
                                    />
                                    <span>
                                        Error: Failed to transmit data. Please
                                        retry.
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 shrink-0 border-t border-[#808080]/50 mt-4">
                                <button
                                    type="button"
                                    onClick={closeTicket}
                                    className={`${buttonStyle} min-w-[80px]`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`${buttonStyle} min-w-[80px] font-bold`}
                                >
                                    {isSubmitting ? "Sending..." : "Submit"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Status Bar */}
                <div className="border-t border-[#808080] border-b p-1 text-xs text-gray-600 flex gap-4 mt-1 bg-[#c0c0c0] shrink-0">
                    <span className="border border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 w-32 truncate">
                        Status:{" "}
                        {submitStatus === "idle"
                            ? "Ready"
                            : isSubmitting
                            ? "Transmitting..."
                            : submitStatus}
                    </span>
                    <span className="border border-b-white border-r-white border-t-[#808080] border-l-[#808080] px-2 flex-1"></span>
                </div>
            </div>
        </div>
    );
}
