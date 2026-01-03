import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Calendar, Users, Wrench, Truck, CheckCircle2, PlayCircle, AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectActivity {
  id: number;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  unitRate: string;
  quantity: string;
  plannedFromDate: string | null;
  plannedToDate: string | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  actualStartDate: string | null;
  actualToDate: string | null;
  remarks: string | null;
}

interface ProjectResource {
  id: number;
  name: string;
  description: string | null;
  type: string;
  unitOfMeasure: string;
  unitRate: string;
  quantity: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  remarks: string | null;
}

interface ActivityResourceData {
  activity: ProjectActivity;
  plannedResources: ProjectResource[];
  actualResources: Array<{
    resourceName: string;
    dates: string[];
    totalDays: number;
  }>;
}

const getResourceTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "manpower":
    case "rental_manpower":
      return <Users className="h-4 w-4" />;
    case "equipment":
    case "rental_equipment":
      return <Truck className="h-4 w-4" />;
    case "tools":
      return <Wrench className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getResourceTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "manpower":
    case "rental_manpower":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "equipment":
    case "rental_equipment":
      return "bg-green-100 text-green-700 border-green-300";
    case "tools":
      return "bg-purple-100 text-purple-700 border-purple-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export default function ProjectActivitiesPage3() {
  const { projectId } = useParams();

  const { data, isLoading, error } = useQuery<ActivityResourceData[]>({
    queryKey: ["project-activities-resources", projectId],
    queryFn: () => get(`/projects/${projectId}/activities/resources`),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading activity resources: {error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activityResources = data || [];

  if (activityResources.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Activity Resources</h1>
          <p className="text-gray-600 mt-1">Planned and actual resource utilization for activities</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Activity Resources Available</p>
              <p className="text-sm">
                Resources will appear here once activities are completed or in progress.
              </p>
              <p className="text-sm mt-2">
                Activities need to have actual start dates to show resource utilization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Resources</h1>
        <p className="text-gray-600 mt-1">
          Planned and actual resource utilization for completed and in-progress activities
        </p>
      </div>

      <div className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {activityResources.map((item) => {
            const activity = item.activity;
            const plannedResources = item.plannedResources;
            const actualResources = item.actualResources;
            const isCompleted = activity.actualToDate !== null;
            const isInProgress = activity.actualStartDate !== null && !activity.actualToDate;

            // Create a map of actual resources for easy lookup
            const actualResourceMap = new Map(
              actualResources.map((r) => [r.resourceName.toLowerCase(), r])
            );

            // Combine planned and actual resources
            const allResourceNames = new Set<string>();
            plannedResources.forEach((r) => allResourceNames.add(r.name.toLowerCase()));
            actualResources.forEach((r) => allResourceNames.add(r.resourceName.toLowerCase()));

            return (
              <AccordionItem key={activity.id} value={`activity-${activity.id}`} className="border rounded-lg mb-4">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : isInProgress ? (
                        <PlayCircle className="h-5 w-5 text-blue-500" />
                      ) : null}
                      <div className="text-left">
                        <div className="font-semibold text-lg">{activity.name}</div>
                        <div className="text-sm text-gray-500">
                          {activity.description || "No description"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500" : ""}>
                        {isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {plannedResources.length} planned • {actualResources.length} utilized
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 mt-4">
                    {/* Activity Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Planned Dates</div>
                        <div className="text-sm">
                          {activity.plannedFromDate && activity.plannedToDate ? (
                            <>
                              {format(new Date(activity.plannedFromDate), "MMM d, yyyy")} -{" "}
                              {format(new Date(activity.plannedToDate), "MMM d, yyyy")}
                            </>
                          ) : (
                            <span className="text-gray-400">Not set</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Actual Dates</div>
                        <div className="text-sm">
                          {activity.actualStartDate && activity.actualToDate ? (
                            <>
                              {format(new Date(activity.actualStartDate), "MMM d, yyyy")} -{" "}
                              {format(new Date(activity.actualToDate), "MMM d, yyyy")}
                            </>
                          ) : activity.actualStartDate ? (
                            <>
                              Started: {format(new Date(activity.actualStartDate), "MMM d, yyyy")}
                            </>
                          ) : (
                            <span className="text-gray-400">Not started</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Quantity</div>
                        <div className="text-sm font-medium">
                          {activity.quantity} {activity.unitOfMeasure}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Unit Rate</div>
                        <div className="text-sm font-medium">
                          {parseFloat(activity.unitRate).toLocaleString()} per {activity.unitOfMeasure}
                        </div>
                      </div>
                    </div>

                    {/* Resources Table */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
                      {plannedResources.length === 0 && actualResources.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No resources planned or utilized for this activity.</p>
                        </div>
                      ) : (
                        <ScrollArea className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Resource Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Planned Quantity</TableHead>
                                <TableHead>Planned Dates</TableHead>
                                <TableHead>Actual Utilization</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {plannedResources.map((resource) => {
                                const actual = actualResourceMap.get(resource.name.toLowerCase());
                                const isUtilized = actual !== undefined;
                                const utilizationDays = actual?.totalDays || 0;
                                
                                // Calculate planned days if dates are available
                                let plannedDays = 0;
                                if (resource.plannedStartDate && resource.plannedEndDate) {
                                  const start = new Date(resource.plannedStartDate);
                                  const end = new Date(resource.plannedEndDate);
                                  plannedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                }

                                return (
                                  <TableRow key={resource.id}>
                                    <TableCell className="font-medium">{resource.name}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getResourceTypeColor(resource.type)}
                                      >
                                        <span className="flex items-center gap-1">
                                          {getResourceTypeIcon(resource.type)}
                                          {resource.type.replace(/_/g, " ")}
                                        </span>
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {resource.quantity} {resource.unitOfMeasure}
                                    </TableCell>
                                    <TableCell>
                                      {resource.plannedStartDate && resource.plannedEndDate ? (
                                        <div className="text-sm">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(resource.plannedStartDate), "MMM d")} -{" "}
                                            {format(new Date(resource.plannedEndDate), "MMM d, yyyy")}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {plannedDays} days
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-sm">Not scheduled</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isUtilized ? (
                                        <div className="space-y-1">
                                          <div className="text-sm font-medium text-green-600">
                                            {utilizationDays} day{utilizationDays !== 1 ? "s" : ""} utilized
                                          </div>
                                          {actual.dates.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                              {format(new Date(actual.dates[0]), "MMM d")} -{" "}
                                              {format(new Date(actual.dates[actual.dates.length - 1]), "MMM d")}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-sm">Not utilized</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isUtilized ? (
                                        <Badge variant="default" className="bg-green-500">
                                          Utilized
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">Not Utilized</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              
                              {/* Show actual resources that weren't planned */}
                              {actualResources
                                .filter(
                                  (actual) =>
                                    !plannedResources.some(
                                      (planned) => planned.name.toLowerCase() === actual.resourceName.toLowerCase()
                                    )
                                )
                                .map((actual, index) => (
                                  <TableRow key={`actual-${index}`} className="bg-yellow-50">
                                    <TableCell className="font-medium">{actual.resourceName}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                        Unplanned
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-gray-400 text-sm">-</span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-gray-400 text-sm">-</span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium text-yellow-600">
                                          {actual.totalDays} day{actual.totalDays !== 1 ? "s" : ""} utilized
                                        </div>
                                        {actual.dates.length > 0 && (
                                          <div className="text-xs text-gray-500">
                                            {format(new Date(actual.dates[0]), "MMM d")} -{" "}
                                            {format(new Date(actual.dates[actual.dates.length - 1]), "MMM d")}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                        Unplanned
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
