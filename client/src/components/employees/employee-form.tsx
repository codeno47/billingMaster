import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertEmployeeSchema, updateEmployeeSchema, type Employee } from "@shared/schema";
import { z } from "zod";

interface EmployeeFormProps {
  employee?: Employee;
  onSuccess: () => void;
}

// Enhanced form schema with required field validation and date validation
const formSchema = insertEmployeeSchema.extend({
  name: z.string().min(1, "Name is required"),
  costCentre: z.string().min(1, "Cost Centre is required").refine(val => val !== 'none', {
    message: "Please select a Cost Centre"
  }),
  startDate: z.string().min(1, "Start Date is required").refine((date) => {
    if (!date) return false;
    // Check if date is in DD-MM-YYYY format
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = date.match(dateRegex);
    if (!match) return false;
    
    const [, day, month, year] = match;
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Check if the date is valid and matches the input
    return parsedDate.getDate() === parseInt(day) &&
           parsedDate.getMonth() === parseInt(month) - 1 &&
           parsedDate.getFullYear() === parseInt(year);
  }, {
    message: "Please enter a valid date in DD-MM-YYYY format"
  }),
  endDate: z.string().optional().refine((date) => {
    if (!date || date.trim() === "") return true; // End date is optional
    
    // Check if date is in DD-MM-YYYY format
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = date.match(dateRegex);
    if (!match) return false;
    
    const [, day, month, year] = match;
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Check if the date is valid and matches the input
    return parsedDate.getDate() === parseInt(day) &&
           parsedDate.getMonth() === parseInt(month) - 1 &&
           parsedDate.getFullYear() === parseInt(year);
  }, {
    message: "Please enter a valid date in DD-MM-YYYY format"
  }),
  shift: z.string().min(1, "Shift is required"),
  status: z.string().min(1, "Status is required"),
  team: z.string().min(1, "Team is required"),
  comments: z.string().max(256, "Comments must not exceed 256 characters").optional(),
}).refine((data) => {
  if (!data.startDate || !data.endDate || data.endDate.trim() === "") return true;
  
  // Parse both dates for comparison
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };
  
  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);
  
  return startDate < endDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export default function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const isEditing = !!employee;

  // Fetch configuration data for dropdowns
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/config/teams"],
  });

  const { data: costCentres = [] } = useQuery({
    queryKey: ["/api/config/cost-centres"],
  });

  const { data: bands = [] } = useQuery({
    queryKey: ["/api/config/bands"],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/config/shifts"],
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["/api/config/roles"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name || "",
      role: employee?.role || "",
      team: employee?.team || "",
      rate: employee?.rate || "0.00",
      costCentre: employee?.costCentre || "",
      cId: employee?.cId || "",
      startDate: employee?.startDate || "",
      endDate: employee?.endDate || "",
      status: employee?.status || "",
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
        rate: data.rate ? data.rate.toString() : "0.00",
        appxBilling: data.appxBilling ? data.appxBilling.toString() : "0.00",
        costCentre: data.costCentre || '',
      };
      
      const response = await apiRequest(method, url, formattedData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all employee-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      // Invalidate ALL report queries regardless of parameters to ensure real-time updates
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/reports/changes" || 
          query.queryKey[0] === "/api/reports/cost-centre-billing" ||
          query.queryKey[0] === "/api/reports/cost-centre-performance"
      });
      
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
            name="costCentre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Centre *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost centre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {costCentres.map((centre: any) => (
                      <SelectItem key={centre.id} value={centre.code}>
                        {centre.code} - {centre.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>C-ID</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ""}
                    placeholder="e.g. C74337, C51149"
                  />
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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((role: any) => (
                      <SelectItem key={role.id} value={role.title}>
                        {role.title}
                      </SelectItem>
                    ))}
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
                <FormLabel>Team *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
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
                  <Input type="number" step="0.01" {...field} value={field.value || ""} />
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
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select band" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bands.map((band: any) => (
                      <SelectItem key={band.id} value={band.level}>
                        {band.level} - {band.name}
                      </SelectItem>
                    ))}
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
                  <Input {...field} value={field.value || ""} />
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
                  <Input type="number" step="0.01" {...field} value={field.value || ""} />
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
                <FormLabel>Shift *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shifts.map((shift: any) => (
                      <SelectItem key={shift.id} value={shift.name}>
                        {shift.name}
                      </SelectItem>
                    ))}
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
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select start date"
                  />
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
                  <DatePicker
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select end date (optional)"
                  />
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
              <FormLabel>Comments (max 256 characters)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ""} 
                  maxLength={256}
                  placeholder="Enter any additional comments or notes about the employee..."
                  className="resize-none"
                />
              </FormControl>
              <div className="text-sm text-gray-500">
                {(field.value || "").length}/256 characters
              </div>
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
