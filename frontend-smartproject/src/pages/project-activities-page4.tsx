import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { get, post, del } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Link as LinkIcon, Plus } from "lucide-react";

interface ProjectActivity {
  id: number;
  name: string;
  description: string | null;
}

interface ProjectActivityDependency {
  id: number;
  projectId: number;
  predecessorId: number;
  successorId: number;
  type: string;
  lag: number;
}

export default function ProjectActivitiesPage4() {
  const { projectId: projectIdStr } = useParams();
  const projectId = parseInt(projectIdStr || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [predecessorId, setPredecessorId] = useState<string>("");
  const [successorId, setSuccessorId] = useState<string>("");
  const [type, setType] = useState<string>("FS");
  const [lag, setLag] = useState<string>("0");

  // Fetch activities for the project
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<ProjectActivity[]>({
    queryKey: ["project-activities", projectId],
    queryFn: () => get(`/projects/${projectId}/activities`),
  });

  // Fetch existing dependencies
  const { data: dependencies = [], isLoading: isLoadingDependencies } = useQuery<ProjectActivityDependency[]>({
    queryKey: ["project-activity-dependencies", projectId],
    queryFn: () => get(`/projects/${projectId}/activity-dependencies`),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => post("/activity-dependencies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-activity-dependencies", projectId] });
      toast({
        title: "Success",
        description: "Dependency created successfully",
      });
      setPredecessorId("");
      setSuccessorId("");
      setLag("0");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create dependency",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/activity-dependencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-activity-dependencies", projectId] });
      toast({
        title: "Success",
        description: "Dependency deleted successfully",
      });
    },
  });

  const handleAddDependency = () => {
    if (!predecessorId || !successorId) {
      toast({
        title: "Error",
        description: "Please select both predecessor and successor",
        variant: "destructive",
      });
      return;
    }

    if (predecessorId === successorId) {
      toast({
        title: "Error",
        description: "An activity cannot be its own predecessor",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      projectId,
      predecessorId: parseInt(predecessorId),
      successorId: parseInt(successorId),
      type,
      lag: parseInt(lag) || 0,
    });
  };

  const getActivityName = (id: number) => {
    return activities.find((a) => a.id === id)?.name || `ID: ${id}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Activity Dependencies</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Dependency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="predecessor">Predecessor</Label>
              <Select value={predecessorId} onValueChange={setPredecessorId}>
                <SelectTrigger id="predecessor">
                  <SelectValue placeholder="Select Predecessor" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id.toString()}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successor">Successor</Label>
              <Select value={successorId} onValueChange={setSuccessorId}>
                <SelectTrigger id="successor">
                  <SelectValue placeholder="Select Successor" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id.toString()}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FS">Finish-to-Start (FS)</SelectItem>
                  <SelectItem value="SS">Start-to-Start (SS)</SelectItem>
                  <SelectItem value="FF">Finish-to-Finish (FF)</SelectItem>
                  <SelectItem value="SF">Start-to-Finish (SF)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lag">Lag/Lead (Days)</Label>
              <div className="flex gap-2">
                <Input
                  id="lag"
                  type="number"
                  value={lag}
                  onChange={(e) => setLag(e.target.value)}
                  placeholder="0"
                />
                <Button
                  onClick={handleAddDependency}
                  disabled={createMutation.isPending}
                  className="flex gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Link
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Dependencies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDependencies || isLoadingActivities ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : dependencies.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No dependencies defined yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Predecessor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Successor</TableHead>
                  <TableHead>Lag/Lead</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.map((dep) => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{getActivityName(dep.predecessorId)}</TableCell>
                    <TableCell>{dep.type}</TableCell>
                    <TableCell>{getActivityName(dep.successorId)}</TableCell>
                    <TableCell>
                      {dep.lag > 0 ? `+${dep.lag} days lag` : dep.lag < 0 ? `${dep.lag} days lead` : "None"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(dep.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

