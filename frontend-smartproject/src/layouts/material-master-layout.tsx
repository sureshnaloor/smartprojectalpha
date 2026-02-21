import { useLocation, Link } from "wouter";
import MasterLayout from "@/layouts/master-layout";

interface MaterialMasterLayoutProps {
    children: React.ReactNode;
}

export default function MaterialMasterLayout({ children }: MaterialMasterLayoutProps) {
    const [location] = useLocation();

    return (
        <MasterLayout>
            <div className="flex flex-col h-full">
                {/* Navigation Tabs */}
                <div className="bg-white border-b border-zinc-200 px-6 sm:px-8 shadow-sm">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        <Link href="/material-master">
                            <a
                                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${location === "/material-master"
                                        ? "border-zinc-900 text-zinc-900"
                                        : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                                    }`}
                            >
                                Material Master
                            </a>
                        </Link>
                        <Link href="/material-master/uom">
                            <a
                                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${location === "/material-master/uom"
                                        ? "border-zinc-900 text-zinc-900"
                                        : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                                    }`}
                            >
                                UOM
                            </a>
                        </Link>
                        <Link href="/material-master/material-type">
                            <a
                                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${location === "/material-master/material-type"
                                        ? "border-zinc-900 text-zinc-900"
                                        : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                                    }`}
                            >
                                Material Type
                            </a>
                        </Link>
                        <Link href="/material-master/material-group">
                            <a
                                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${location === "/material-master/material-group"
                                        ? "border-zinc-900 text-zinc-900"
                                        : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                                    }`}
                            >
                                Material Group
                            </a>
                        </Link>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        </MasterLayout>
    );
}
