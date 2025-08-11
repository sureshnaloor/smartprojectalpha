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
import MasterLayout from "@/layouts/master-layout";
import ResourceMaster from "@/pages/resource-master";
import RiskRegister from "@/pages/risk-register";
import ProjectDailyProgress from "@/pages/project-daily-progress";
import ResourcePlan from "@/pages/resource-plan";
import LessonLearntRegister from "@/pages/lesson-learnt-register";
import DirectManpowerList from "@/pages/direct-manpower-list";
import IndirectManpowerList from "@/pages/indirect-manpower-list";
import PlannedActivityTasks from "@/pages/planned-activity-tasks";
import CollabPage from "@/pages/collab";
import ThreadDetailPage from "@/pages/thread-detail";

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
      
      {/* Project-specific Under Construction Pages */}
      <Route path="/projects/:projectId/under-construction/:pageName">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <UnderConstruction />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Risk Register */}
      <Route path="/projects/:projectId/risk-register">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <RiskRegister />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Project Daily Progress */}
      <Route path="/projects/:projectId/project-daily-progress">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectDailyProgress />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Resource Plan */}
      <Route path="/projects/:projectId/resource-plan">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ResourcePlan />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Lesson Learnt Register */}
      <Route path="/projects/:projectId/lesson-learnt-register">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <LessonLearntRegister />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Direct Manpower List */}
      <Route path="/projects/:projectId/direct-manpower-list">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <DirectManpowerList />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Indirect Manpower List */}
      <Route path="/projects/:projectId/indirect-manpower-list">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <IndirectManpowerList />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Planned Activity/Tasks */}
      <Route path="/projects/:projectId/planned-activity-tasks">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <PlannedActivityTasks />
          </ProjectLayout>
        )}
      </Route>

      {/* Activity Master */}
      <Route path="/activity-master" component={ActivityMaster} />
      
      {/* Task Master */}
      <Route path="/task-master" component={TaskMaster} />
      
      {/* Resource Master */}
      <Route path="/resource-master" component={ResourceMaster} />
      
      {/* Collaboration Hub */}
      <Route path="/collab">
        <MasterLayout>
          <CollabPage />
        </MasterLayout>
      </Route>
      <Route path="/collab/thread/:threadId">
        <MasterLayout>
          <ThreadDetailPage />
        </MasterLayout>
      </Route>
      <Route path="/projects/:projectId/collab">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <CollabPage />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/collab/thread/:threadId">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ThreadDetailPage />
          </ProjectLayout>
        )}
      </Route>
      
      {/* Global Under Construction Pages */}
      <Route path="/under-construction/:pageName">
        {params => (
          <MasterLayout>
            <UnderConstruction />
          </MasterLayout>
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
