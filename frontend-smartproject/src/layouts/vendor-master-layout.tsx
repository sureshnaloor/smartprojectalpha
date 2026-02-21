import { useLocation } from "wouter";
import { Link } from "wouter";
import MasterLayout from "./master-layout";

interface VendorMasterLayoutProps {
    children: React.ReactNode;
}

export default function VendorMasterLayout({ children }: VendorMasterLayoutProps) {
    const [location] = useLocation();

    return (
        <MasterLayout>
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <Link href="/vendor-master">
                            <a
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${location === "/vendor-master" || location === "/vendor-master/"
                                    ? "border-teal-500 text-teal-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Vendors
                            </a>
                        </Link>
                        <Link href="/vendor-master/country">
                            <a
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${location.startsWith("/vendor-master/country")
                                    ? "border-teal-500 text-teal-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Country
                            </a>
                        </Link>
                        <Link href="/vendor-master/city">
                            <a
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${location.startsWith("/vendor-master/city")
                                    ? "border-teal-500 text-teal-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                City
                            </a>
                        </Link>
                    </nav>
                </div>
            </div>
            <div>
                {children}
            </div>
        </MasterLayout>
    );
}
