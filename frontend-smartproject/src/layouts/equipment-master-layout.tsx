import { useLocation, Link } from "wouter";
import MasterLayout from "@/layouts/master-layout";

interface EquipmentMasterLayoutProps {
  children: React.ReactNode;
}

export default function EquipmentMasterLayout({ children }: EquipmentMasterLayoutProps) {
  const [location] = useLocation();

  const tabs = [
    { label: "Equipment Master", href: "/equipment-master" },
    { label: "Rental Equipment", href: "/equipment-master/rental" },
    { label: "Manufacturer / OEM", href: "/equipment-master/manufacturers" },
    { label: "Equipment Type", href: "/equipment-master/equipment-types" },
  ];

  return (
    <MasterLayout>
      <div className="flex flex-col h-full min-h-0 min-w-0 text-zinc-900 w-full">
        <div className="bg-white border-b border-zinc-200 px-6 sm:px-8 shadow-sm flex-shrink-0">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <Link key={tab.href} href={tab.href}>
                <a
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                    location === tab.href
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
        <div className="flex-1 overflow-auto min-h-0 min-w-0">{children}</div>
      </div>
    </MasterLayout>
  );
}
