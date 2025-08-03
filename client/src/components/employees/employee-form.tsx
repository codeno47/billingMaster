import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertEmployeeSchema, updateEmployeeSchema, type Employee } from "@shared/schema";
import { z } from "zod";

interface EmployeeFormProps {
  employee?: Employee;
  onSuccess: () => void;
}

const formSchema = insertEmployeeSchema;

export default function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const isEditing = !!employee;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name || "",
      role: employee?.role || "",
      team: employee?.team || "",
      rate: employee?.rate || "0.00",
      cId: employee?.cId || "",
      startDate: employee?.startDate || "",
      endDate: employee?.endDate || "",
      status: employee?.status || "inactive",
      band: employee?.band || "",
      sowId: employee?.sowId || "",
      appxBilling: employee?.appxBilling || "0.00",
      shift: employee?.shift || "",
      comments: employee?.comments || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const url = isEditing ? `/api/employees/${employee.id}` : '/api/employees';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Ensure rate and appxBilling are strings and properly formatted
      const formattedData = {
        ...data,
        rate: typeof data.rate === 'number' ? data.rate.toString() : (data.rate || "0.00"),
        appxBilling: typeof data.appxBilling === 'number' ? data.appxBilling.toString() : (data.appxBilling || "0.00"),
      };
      
      const response = await apiRequest(method, url, formattedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: isEditing ? "Employee updated" : "Employee created",
        description: `Employee has been successfully ${isEditing ? 'updated' : 'created'}`,
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: isEditing ? "Update failed" : "Create failed",
        description: `Failed to ${isEditing ? 'update' : 'create'} employee`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dev">Developer</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="OPS">Operations</SelectItem>
                    <SelectItem value="EXR">EXR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="team"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Matrix">Matrix</SelectItem>
                    <SelectItem value="Trinity">Trinity</SelectItem>
                    <SelectItem value="Cyher">Cyher</SelectItem>
                    <SelectItem value="Neo">Neo</SelectItem>
                    <SelectItem value="Prisam">Prisam</SelectItem>
                    <SelectItem value="Morepheus">Morepheus</SelectItem>
                    <SelectItem value="DevOPS">DevOPS</SelectItem>
                    <SelectItem value="Regression">Regression</SelectItem>
                    <SelectItem value="Automation">Automation</SelectItem>
                    <SelectItem value="NA">NA</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="band"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Band</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select band" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sowId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SOW ID</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appxBilling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approximate Billing ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shift"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="9 AM - 6 PM">9 AM - 6 PM</SelectItem>
                    <SelectItem value="1 PM - 11 PM">1 PM - 11 PM</SelectItem>
                    <SelectItem value="6 PM - 3 AM">6 PM - 3 AM</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DD-MM-YYYY" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DD-MM-YYYY" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Employee" : "Create Employee")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
