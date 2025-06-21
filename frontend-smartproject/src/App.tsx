import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import WbsStructure from "@/pages/wbs-structure";
import Schedule from "@/pages/schedule";
import CostControl from "@/pages/cost-control";
import Reports from "@/pages/reports";
import UnderConstruction from "@/pages/under-construction";
import ActivityMaster from "@/pages/activity-master";
import TaskMaster from "@/pages/task-master";
import ProjectLayout from "@/layouts/project-layout";
import ResourceMaster from "@/pages/resource-master";

// Implementing a flatter routing approach without nesting
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Project Dashboard */}
      <Route path="/projects/:projectId">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <Dashboard />
          </ProjectLayout>
        )}
      </Route>
      
      {/* WBS Structure */}
      <Route path="/projects/:projectId/wbs">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <WbsStructure />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Schedule */}
      <Route path="/projects/:projectId/schedule">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <Schedule />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Cost Control */}
      <Route path="/projects/:projectId/costs">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <CostControl />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Reports */}
      <Route path="/projects/:projectId/reports">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <Reports />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Activity Master */}
      <Route path="/activity-master" component={ActivityMaster} />
      
      {/* Task Master */}
      <Route path="/task-master" component={TaskMaster} />
      
      {/* Resource Master */}
      <Route path="/resource-master" component={ResourceMaster} />
      
      {/* Under Construction Pages */}
      <Route path="/under-construction/:pageName">
        {params => (
          <UnderConstruction />
        )}
      </Route>
      
      {/* 404 for anything else */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
