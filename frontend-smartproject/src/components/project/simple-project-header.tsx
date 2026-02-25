import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleProjectHeaderProps {
  projectId: number;
  pageTitle: string;
  pageIcon?: React.ReactNode;
  onClose?: () => void;
}

export function SimpleProjectHeader({ projectId, pageTitle, pageIcon, onClose }: SimpleProjectHeaderProps) {
  const [location, setLocation] = useLocation();

  // Fetch project data
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  if (isLoadingProject) {
    return (
      <div className="bg-white border-b border-gray-200 animate-pulse">
        <div className="px-4 py-4 sm:px-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4 sm:px-6">
          <div className="text-red-500">Project not found</div>
        </div>
      </div>
    );
  }

  const documentTabs = [
    { key: "drawings", line1: "Project", line2: "Drawings", match: "/under-construction/ProjectDrawings", href: `/projects/${projectId}/under-construction/ProjectDrawings` },
    { key: "boq", line1: "Project", line2: "BOQ", match: "/under-construction/ProjectBOQ", href: `/projects/${projectId}/under-construction/ProjectBOQ` },
    { key: "scope", line1: "Scope Doc", line2: "(PTS)", match: "/under-construction/ProjectScope", href: `/projects/${projectId}/under-construction/ProjectScope` },
    { key: "equipment", line1: "Equipment", line2: "Catalogue", match: "/under-construction/EquipmentCatalogue", href: `/projects/${projectId}/under-construction/EquipmentCatalogue` },
    { key: "client", line1: "Client", line2: "Correspondence", match: "/under-construction/ClientCorrespondence", href: `/projects/${projectId}/under-construction/ClientCorrespondence` },
    { key: "supplier", line1: "Supplier", line2: "Correspondence", match: "/under-construction/SupplierCorrespondence", href: `/projects/${projectId}/under-construction/SupplierCorrespondence` },
    { key: "subcontract", line1: "Subcontract", line2: "Correspondence", match: "/under-construction/SubcontractCorrespondence", href: `/projects/${projectId}/under-construction/SubcontractCorrespondence` },
    { key: "rfi", line1: "Request for", line2: "Inspection", match: "/under-construction/RequestForInspection", href: `/projects/${projectId}/under-construction/RequestForInspection` },
    { key: "itp", line1: "ITP &", line2: "Reports", match: "/under-construction/ITPAndReports", href: `/projects/${projectId}/under-construction/ITPAndReports` },
    { key: "others", line1: "Other", line2: "Documents", match: "/under-construction/OtherDocuments", href: `/projects/${projectId}/under-construction/OtherDocuments` },
  ];

  const isDocumentsRoute = documentTabs.some((tab) =>
    typeof location === "string" ? location.includes(tab.match) : false
  );

  const wikiTabs = [
    { key: "daily", line1: "Project Daily", line2: "Progress", match: "/project-daily-progress", href: `/projects/${projectId}/project-daily-progress` },
    { key: "resource", line1: "Resource", line2: "Plan", match: "/resource-plan", href: `/projects/${projectId}/resource-plan` },
    { key: "risk", line1: "Risk", line2: "Register", match: "/risk-register", href: `/projects/${projectId}/risk-register` },
    { key: "lesson", line1: "Lesson Learnt", line2: "Register", match: "/lesson-learnt-register", href: `/projects/${projectId}/lesson-learnt-register` },
    { key: "direct", line1: "Direct", line2: "Manpower List", match: "/direct-manpower-list", href: `/projects/${projectId}/direct-manpower-list` },
    { key: "indirect", line1: "Indirect", line2: "Manpower List", match: "/indirect-manpower-list", href: `/projects/${projectId}/indirect-manpower-list` },
    { key: "planned", line1: "Daily Activity /", line2: "Tasks Planned", match: "/planned-activity-tasks", href: `/projects/${projectId}/planned-activity-tasks` },
    { key: "others", line1: "Other", line2: "Wiki", match: "/under-construction/OtherWiki", href: `/projects/${projectId}/under-construction/OtherWiki` },
  ];

  const isWikiRoute = wikiTabs.some((tab) =>
    typeof location === "string" ? location.includes(tab.match) : false
  );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="sr-only md:not-sr-only md:inline-block">Back</span>
              </Button>
            )}
            <div>
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {project.name}
                </h2>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-600">
                {pageIcon && <span className="mr-2">{pageIcon}</span>}
                <span className="font-medium">{pageTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isDocumentsRoute && (
        <div className="px-4 sm:px-6 border-t border-slate-700 bg-slate-800 shadow-inner">
          <nav className="-mb-px flex flex-wrap gap-1 sm:gap-2 py-2 overflow-x-auto">
            {documentTabs.map((tab) => {
              const active =
                typeof location === "string" && location.includes(tab.match);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLocation(tab.href)}
                  className={`min-w-[4.5rem] sm:min-w-[5rem] rounded-t-md border-b-2 px-2 sm:px-3 py-2 text-center transition-all ${
                    active
                      ? "border-amber-400 bg-slate-700/80 text-amber-200 font-semibold"
                      : "border-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500"
                  }`}
                >
                  <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider leading-tight text-inherit opacity-90">
                    {tab.line1}
                  </span>
                  <span className="block text-[11px] sm:text-xs font-semibold leading-tight mt-0.5">
                    {tab.line2}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
      {isWikiRoute && (
        <div className="px-4 sm:px-6 border-t border-slate-700 bg-slate-800 shadow-inner">
          <nav className="-mb-px flex flex-wrap gap-1 sm:gap-2 py-2 overflow-x-auto">
            {wikiTabs.map((tab) => {
              const active =
                typeof location === "string" && location.includes(tab.match);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLocation(tab.href)}
                  className={`min-w-[4.5rem] sm:min-w-[5rem] rounded-t-md border-b-2 px-2 sm:px-3 py-2 text-center transition-all ${
                    active
                      ? "border-amber-400 bg-slate-700/80 text-amber-200 font-semibold"
                      : "border-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500"
                  }`}
                >
                  <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider leading-tight text-inherit opacity-90">
                    {tab.line1}
                  </span>
                  <span className="block text-[11px] sm:text-xs font-semibold leading-tight mt-0.5">
                    {tab.line2}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
} 