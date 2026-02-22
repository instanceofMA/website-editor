import {
    AlertTriangle,
    Info,
    Bookmark,
    Download,
    ExternalLink,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";

export function UnclaimedProjectWarning() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-0.5 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 rounded-sm cursor-help transition-all group">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                        Unclaimed
                    </span>
                    <Info className="w-2.5 h-2.5 text-amber-500/50 group-hover:text-amber-600 transition-colors" />
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-[320px] p-0 overflow-hidden bg-white border-zinc-200 shadow-xl z-50 rounded-lg mr-4"
                side="bottom"
                align="end"
                sideOffset={12}
            >
                {/* Header Section */}
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-zinc-900 leading-none">
                            Temporary Project
                        </h4>
                        <p className="text-[10px] text-amber-700 font-medium mt-1">
                            Progress is tied to this URL only
                        </p>
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-4 space-y-4">
                    <div className="space-y-3">
                        <p className="text-xs text-zinc-600 leading-relaxed px-1">
                            This project is currently{" "}
                            <span className="text-zinc-900 font-semibold italic">
                                orphaned
                            </span>
                            . While we auto-save your edits, they are not yet
                            synced to a permanent account.
                        </p>

                        <div className="relative p-3 bg-zinc-50 border border-zinc-100 rounded-md group overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ExternalLink className="w-8 h-8 rotate-12" />
                            </div>
                            <p className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-zinc-400" />
                                Critical Info
                            </p>
                            <p className="text-zinc-500 text-[11px] relative z-10">
                                If you lose this link or clear your browser
                                data, your work will be{" "}
                                <strong>lost forever</strong>.
                            </p>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            <p className="font-bold text-zinc-900 uppercase text-[9px] tracking-widest pl-1">
                                Secure Your Progress
                            </p>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors p-1.5 hover:bg-zinc-50 rounded group">
                                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white border border-zinc-200 shadow-sm group-hover:border-zinc-300">
                                        <Bookmark className="w-3 h-3 text-zinc-500" />
                                    </div>
                                    <span className="font-medium">
                                        Bookmark this URL now
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors p-1.5 hover:bg-zinc-50 rounded group">
                                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white border border-zinc-200 shadow-sm group-hover:border-zinc-300">
                                        <Download className="w-3 h-3 text-zinc-500" />
                                    </div>
                                    <span className="font-medium">
                                        Export project backup (.zip)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="px-4 py-3 bg-zinc-50/50 border-t border-zinc-100">
                    <div className="flex items-center justify-center gap-2 grayscale opacity-60">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            Claim Project Coming Soon
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
