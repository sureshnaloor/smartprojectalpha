import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Landing from '@/pages/landing';
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
import MaterialMaster from "@/pages/material-master";
import VendorMaster from "@/pages/vendor-master";
import EmployeeMaster from "@/pages/employee-master";
import EquipmentMaster from "@/pages/equipment-master";
import RiskRegister from "@/pages/risk-register";
import ProjectDailyProgress from "@/pages/project-daily-progress";
import ResourcePlan from "@/pages/resource-plan";
import LessonLearntRegister from "@/pages/lesson-learnt-register";
import DirectManpowerList from "@/pages/direct-manpower-list";
import IndirectManpowerList from "@/pages/indirect-manpower-list";
import PlannedActivityTasks from "@/pages/planned-activity-tasks";
import CollabPage from "@/pages/collab";
import ThreadDetailPage from "@/pages/thread-detail";
import ProjectActivities from "@/pages/project-activities";
import ProjectTasks from "@/pages/project-tasks";
import ProjectResources from "@/pages/project-resources";
import ProjectResourcesPage1 from "@/pages/project-resources-page1";
import ProjectResourcesPage2 from "@/pages/project-resources-page2";
import ProjectResourcesPage3 from "@/pages/project-resources-page3";
import ProjectResourcesPage4 from "@/pages/project-resources-page4";
import ProjectResourcesPage5 from "@/pages/project-resources-page5";
import ProjectActivitiesPage1 from "@/pages/project-activities-page1";
import ProjectActivitiesPage2 from "@/pages/project-activities-page2";
import ProjectActivitiesPage3 from "@/pages/project-activities-page3";
import ProjectActivitiesPage4 from "@/pages/project-activities-page4";
import ProjectActivitiesPage5 from "@/pages/project-activities-page5";
import ProjectTasksPage1 from "@/pages/project-tasks-page1";
import ProjectTasksPage2 from "@/pages/project-tasks-page2";
import ProjectTasksPage3 from "@/pages/project-tasks-page3";
import ProjectTasksPage4 from "@/pages/project-tasks-page4";
import ProjectTasksPage5 from "@/pages/project-tasks-page5";
import ProjectCollabPage2 from "@/pages/project-collab-page2";
import ProjectCollabPage3 from "@/pages/project-collab-page3";
import ProjectCollabPage4 from "@/pages/project-collab-page4";
import ProjectCollabPage5 from "@/pages/project-collab-page5";
import ProjectDrawings from "@/pages/project-drawings";
import ProjectBoq from "@/pages/project-boq";
import ProjectScope from "@/pages/project-scope";
import ProjectCorrespondence from "@/pages/project-correspondence";
import ProjectSupplierCorrespondence from "@/pages/project-supplier-correspondence";
import ProjectSubcontractCorrespondence from "@/pages/project-subcontract-correspondence";
import ProjectRequestForInspection from "@/pages/project-request-for-inspection";
import ProjectItpAndReports from "@/pages/project-itp-and-reports";
import ProjectOtherDocuments from "@/pages/project-other-documents";
import ProjectEquipmentCatalogue from "@/pages/project-equipment-catalogue";
import NewLanding from "@/pages/new-landing";
import NewProject from "@/pages/new-project";


// Implementing a flatter routing approach without nesting
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Landing} />
      <Route path="/playground" component={Home} />

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

      {/* Project Drawings - Specific Route */}
      <Route path="/projects/:projectId/under-construction/ProjectDrawings">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectDrawings />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/ProjectBOQ">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectBoq />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/ProjectScope">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectScope />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/ClientCorrespondence">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectCorrespondence />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/SupplierCorrespondence">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectSupplierCorrespondence />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/SubcontractCorrespondence">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectSubcontractCorrespondence />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/RequestForInspection">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectRequestForInspection />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/ITPAndReports">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectItpAndReports />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/OtherDocuments">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectOtherDocuments />
          </ProjectLayout>
        )}
      </Route>
      <Route path="/projects/:projectId/under-construction/EquipmentCatalogue">
        {(params) => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectEquipmentCatalogue />
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

      {/* Project Activities - Tab Pages */}
      <Route path="/projects/:projectId/activities/page1">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectActivitiesPage1 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/activities/page2">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectActivitiesPage2 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/activities/page3">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectActivitiesPage3 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/activities/page4">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectActivitiesPage4 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/activities/page5">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectActivitiesPage5 />
          </ProjectLayout>
        )}
      </Route>

      {/* Project Activities */}
      <Route path="/projects/:projectId/activities">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectActivities />
          </ProjectLayout>
        )}
      </Route>

      {/* Project Tasks - Tab Pages */}
      <Route path="/projects/:projectId/tasks/page1">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectTasksPage1 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/tasks/page2">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectTasksPage2 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/tasks/page3">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectTasksPage3 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/tasks/page4">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectTasksPage4 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/tasks/page5">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectTasksPage5 />
          </ProjectLayout>
        )}
      </Route>

      {/* Project Tasks */}
      <Route path="/projects/:projectId/tasks">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectTasks />
          </ProjectLayout>
        )}
      </Route>

      {/* Project Resources - Tab Pages */}
      <Route path="/projects/:projectId/resources/page1">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResourcesPage1 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/resources/page2">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResourcesPage2 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/resources/page3">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResourcesPage3 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/resources/page4">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResourcesPage4 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/resources/page5">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResourcesPage5 />
          </ProjectLayout>
        )}
      </Route>

      {/* Project Resources */}
      <Route path="/projects/:projectId/resources/:type">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResources />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/resources">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectResources />
          </ProjectLayout>
        )}
      </Route>

      {/* Activity Master */}
      <Route path="/activity-master" component={ActivityMaster} />

      {/* Task Master */}
      <Route path="/task-master" component={TaskMaster} />

      {/* Resource Master */}
      <Route path="/resource-master" component={ResourceMaster} />

      {/* Material Master */}
      <Route path="/material-master" component={MaterialMaster} />

      {/* Vendor Master */}
      <Route path="/vendor-master" component={VendorMaster} />

      {/* Employee Master */}
      <Route path="/employee-master" component={EmployeeMaster} />

      {/* Equipment Master */}
      <Route path="/equipment-master" component={EquipmentMaster} />

      {/* New Pages Ported from Vanilla JS */}
      <Route path="/newlanding" component={NewLanding} />
      <Route path="/newproject/:projectId">
        {params => <NewProject />}
      </Route>


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

      {/* Project Collaboration Hub - Tab Pages */}
      <Route path="/projects/:projectId/collab/page1">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <CollabPage />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/collab/page2">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectCollabPage2 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/collab/page3">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectCollabPage3 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/collab/page4">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectCollabPage4 />
          </ProjectLayout>
        )}
      </Route>

      <Route path="/projects/:projectId/collab/page5">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <ProjectCollabPage5 />
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

      <Route path="/projects/:projectId/collab">
        {params => (
          <ProjectLayout projectId={parseInt(params.projectId)}>
            <CollabPage />
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
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
