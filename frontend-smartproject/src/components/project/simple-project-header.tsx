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
  const [, setLocation] = useLocation();

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
    </div>
  );
} 