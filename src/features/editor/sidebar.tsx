import { useState, useEffect } from "react";
import { Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

const SidebarItem = ({
    icon: Icon,
    label,
    isMain,
    active,
    collapsed,
    onClick,
}: {
    icon: any;
    label: string;
    isMain?: boolean;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 p-2 rounded-md text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
            collapsed ? "justify-center w-9 h-9" : "w-full",
            active
                ? "bg-secondary text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
        )}
        title={collapsed ? label : undefined}
    >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && (
            <span className="truncate flex-1 text-left">{label}</span>
        )}
        {!collapsed && isMain && (
            <span className="ml-auto shrink-0 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 leading-none">
                main
            </span>
        )}
    </button>
);

interface EditorSidebarProps {
    projectId: string;
    activePage: string;
    onPageSelect: (page: string) => void;
}

export function EditorSidebar({
    projectId,
    activePage,
    onPageSelect,
}: EditorSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (window.innerWidth < 1024) {
            setCollapsed(true);
        }
    }, []);

    const { data } = api.project.getPages.useQuery(
        { projectId },
        { enabled: !!projectId },
    );
    const pages = data?.pages ?? [];
    const mainPage = data?.mainPage ?? "/";

    return (
        <aside
            className={cn(
                "border-r bg-sidebar flex flex-col shrink-0 transition-all duration-300 ease-in-out relative h-full",
                collapsed ? "w-14" : "w-64",
            )}
        >
            <div className="flex items-center justify-between p-4 h-14 border-b">
                {!collapsed && (
                    <span className="font-semibold text-sm">Site Manager</span>
                )}{" "}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-auto cursor-pointer"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="w-4 h-4" />
                    ) : (
                        <PanelLeftClose className="w-4 h-4" />
                    )}
                </Button>
            </div>

            <div className="p-4 border-b">
                {!collapsed && (
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Pages
                    </h2>
                )}
                <div
                    className={cn(
                        "space-y-1",
                        collapsed && "flex flex-col items-center",
                    )}
                >
                    {pages.length > 0 ? (
                        pages.map((page) => (
                            <SidebarItem
                                key={page}
                                icon={Layers}
                                label={page}
                                isMain={page === mainPage}
                                active={activePage === page}
                                collapsed={collapsed}
                                onClick={() => onPageSelect(page)}
                            />
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground px-2">
                            Loading...
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4">
                {!collapsed && (
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Elements
                    </h2>
                )}
                <div
                    className={cn(
                        "opacity-50 cursor-not-allowed",
                        collapsed && "hidden",
                    )}
                >
                    <p className="text-xs text-muted-foreground italic">
                        Drag & Drop coming soon
                    </p>
                </div>
            </div>
        </aside>
    );
}
