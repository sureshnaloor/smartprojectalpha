import { useLocation, Link } from "wouter";
import MasterLayout from "@/layouts/master-layout";

interface EmployeeMasterLayoutProps {
    children: React.ReactNode;
}

export default function EmployeeMasterLayout({ children }: EmployeeMasterLayoutProps) {
    const [location] = useLocation();

    const tabs = [
        { label: "Employee Master", href: "/employee-master" },
        { label: "Rental Manpower", href: "/employee-master/rental" },
        { label: "Nationality", href: "/employee-master/nationality" },
        { label: "Title", href: "/employee-master/title" },
        { label: "Position", href: "/employee-master/position" },
        { label: "Grade", href: "/employee-master/grade" },
        { label: "Trade", href: "/employee-master/trade" },
    ];

    return (
        <MasterLayout>
            <div className="flex flex-col h-full text-zinc-900">
                {/* Navigation Tabs */}
                <div className="bg-white border-b border-zinc-200 px-6 sm:px-8 shadow-sm">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <Link key={tab.href} href={tab.href}>
                                <a
                                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${location === tab.href
                                        ? "border-zinc-900 text-zinc-900"
                                        : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                                        }`}
                                >
                                    {tab.label}
                                </a>
                            </Link>
                        ))}
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
