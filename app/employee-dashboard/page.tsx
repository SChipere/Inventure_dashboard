"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Moon,
  Sun,
  Calendar,
  Clock,
  Users,
  FileCheck,
  ListTodo,
  CreditCard,
  BarChart3,
  Filter,
  X,
  CheckCircle2,
  LogOut,
  Loader2,
  Send,
  CalendarDays,
  Building,
  Edit, // Added for edit button on leave card
  Trash2, // Added for delete button on leave card
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, differenceInDays, parseISO } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import Parse from 'parse'; // Import Parse SDK

// Initialize Parse (essential for Parse.User.current() and Parse.User.logOut())
// It's highly recommended to initialize Parse in a central location like _app.tsx
// to ensure it's done only once for the entire application.
if (!Parse.applicationId) { // Prevent re-initialization if hot-reloading
  Parse.initialize("QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw", "jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS");
  Parse.serverURL = 'https://parseapi.back4app.com/';
}


// Types
export type TaskType = {
  id: string | number // Using 'id' for client-side uniqueness, 'objectId' for backend if available
  title: string
  description: string
  notes?: string
  assignees?: string[]
  dueDate?: string | null
  lastUpdated?: string | null
  completionDate?: string | null
  status?: string
  priority?: string
  assignedTo?: string // Maps to "assigned to" in sheet
  "assigned to"?: string // Original field from sheet
  "Secondary Assignee"?: string // Original field from sheet
  objectId?: string // Back4App objectId if fetched from there, or from sheets
  // Add other fields that might come from the sheet
  "Short term"?: string;
  "Long term"?: string;
  "Package fees"?: string;
  "Adhoc"?: string;
  // This type needs to be flexible for dynamic sheet data
  [key: string]: any;
}

export type LeaveApplication = {
  id: string // Client-side unique ID
  objectId?: string // Backend/Sheet unique ID if available
  name: string
  surname: string
  daysOfLeave: string // Changed to string to accommodate "1 month", "0.5" etc.
  leaveType: string // Changed from 'reason' to 'leaveType'
  dateApplied: string
  status: "pending" | "approved" | "rejected"
  startDate?: string | null
  endDate?: string | null
  creatorId: string // The Parse user ID who created this leave request
}

// Leave Application Form Component
function LeaveApplicationForm({ onSubmit, initialData = null, onCancel = null, isEdit = false }) {
  const [name, setName] = useState(initialData?.name || "")
  const [surname, setSurname] = useState(initialData?.surname || "")
  const [daysOfLeave, setDaysOfLeave] = useState(initialData?.daysOfLeave || "0.5")
  const [leaveType, setLeaveType] = useState(initialData?.leaveType || "")
  const [startDate, setStartDate] = useState<Date | null>(initialData?.startDate ? parseISO(initialData.startDate) : null)
  const [endDate, setEndDate] = useState<Date | null>(initialData?.endDate ? parseISO(initialData.endDate) : null)

  // Options for Number of Days Dropdown
  const daysOptions = [
    "0.5", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26",
    "1 month", "2 months", "3 months", "6 months", "1 year"
  ];

  // Options for Leave Type Dropdown
  const leaveTypeOptions = [
    "Annual Leave",
    "Sick Leave",
    "Public Holidays",
    "Maternity Leave",
    "Paternity Leave",
    "Bereavement Leave",
    "Marriage Leave",
    "Family Responsibility Leave",
    "Compensatory Leave",
    "Unpaid Leave",
    "Study Leave",
    "Sabbatical Leave",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !surname || !daysOfLeave || !leaveType || !startDate) {
      console.error("Please fill in all required fields");
      return
    }

    const leaveApplication: Omit<LeaveApplication, 'id' | 'creatorId' | 'status' | 'dateApplied'> = {
      name,
      surname,
      daysOfLeave,
      leaveType,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate?.toISOString().split("T")[0] || null,
    }

    onSubmit(leaveApplication); // Pass partial data, ID and creatorId handled by parent
    if (onCancel) onCancel(); // Close form/dialog on successful submission
  }

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">First Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="surname">Last Name*</Label>
              <Input
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Enter your last name"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="daysOfLeave">Number of Days*</Label>
              <Select value={daysOfLeave} onValueChange={setDaysOfLeave}>
                <SelectTrigger id="daysOfLeave" className="w-full mt-1">
                  <SelectValue placeholder="Select number of days" />
                </SelectTrigger>
                <SelectContent>
                  {daysOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick end date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="leaveType">Type of Leave*</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger id="leaveType" className="w-full mt-1">
                <SelectValue placeholder="Select type of leave" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            {isEdit && (
              <Button variant="outline" onClick={onCancel} className="mr-2">
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              {isEdit ? "Save Changes" : "Submit Leave Application"}
            </Button>
          </DialogFooter>
        </form>
      </CardContent>
    </Card>
  )
}

// Leave Card Component
function LeaveCard({ leave, currentUserUid, onEdit, onDelete }) {
  const isCreator = leave.creatorId === currentUserUid;

  // Modified getStatusClass to always return the default grey shade for consistency
  const getStatusClass = (status: LeaveApplication['status']) => {
    return "bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30";
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM d,yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Card className={`overflow-hidden backdrop-blur-sm border ${getStatusClass(leave.status)}`}>
      <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg flex items-center">
            {leave.name} {leave.surname}
          </CardTitle>
          {/* Status badge will still reflect the status color if desired */}
          <Badge className="mt-1" variant="outline">{leave.leaveType}</Badge>
        </div>
        {isCreator && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(leave)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(leave.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2 text-sm text-muted-foreground">
        <p className="mb-2">Days of Leave: <span className="font-medium text-foreground">{leave.daysOfLeave}</span></p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> Start Date:</span>
            <span>{formatDate(leave.startDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> End Date:</span>
            <span>{formatDate(leave.endDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center"><Clock className="mr-1 h-4 w-4" /> Applied On:</span>
            <span>{formatDate(leave.dateApplied)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Badge
          className={`px-2 py-1 rounded-full text-white text-xs ${
            leave.status === "pending" ? "bg-yellow-500" :
            leave.status === "approved" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
        </Badge>
      </CardFooter>
    </Card>
  );
}


// Task Card Component for Employee View
// Now accepts onComplete prop to allow employees to mark tasks as complete
function EmployeeTaskCard({ task, tabKey, onComplete }) {
  const statusClass = () => {
    if (task.status === "completed" || task.status === "Completed")
      return "bg-green-500/10 border-green-500/20 dark:bg-green-950/20 dark:border-green-900/30"
    if (task.status === "in-progress" || task.status === "In Progress")
      return "bg-blue-500/10 border-blue-500/20 dark:bg-blue-950/20 dark:border-blue-900/30"
    return "bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "Completed":
        return "bg-green-500"
      case "in-progress":
      case "In Progress":
        return "bg-blue-500"
      case "not-started":
      case "Not Started":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="destructive" className="ml-2">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="default" className="ml-2">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="ml-2">
            Low
          </Badge>
        )
      default:
        return null
    }
  }

  const daysRemaining = () => {
    if (!task.dueDate) return null
    const today = new Date()
    let due
    try {
      due = parseISO(task.dueDate)
      if (isNaN(due.getTime())) {
        due = new Date(task.dueDate)
      }
    } catch (e) {
      return <Badge variant="outline">Invalid date</Badge>
    }

    if (isNaN(due.getTime())) {
      return <Badge variant="outline">Invalid date</Badge>
    }

    const diff = differenceInDays(due, today)

    if (diff < 0) return <Badge variant="destructive">Overdue by {Math.abs(diff)} days</Badge>
    if (diff === 0) return <Badge variant="default">Due today</Badge>
    if (diff <= 3)
      return (
        <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
          Due soon
        </Badge>
      )
    return <Badge variant="outline">{diff} days remaining}</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"
      return format(date, "MMM d,yyyy")
    } catch (e) {
      return "Invalid date"
    }
  }

  return (
    <Card className={`overflow-hidden backdrop-blur-sm border ${statusClass()}`}>
      <CardHeader className="p-4 pb-2">
        <div>
          <CardTitle className="text-lg flex items-center">
            {task.title}
            {getPriorityBadge(task.priority)}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${getStatusColor(task.status)}`}></div>
            <span className="text-xs text-muted-foreground">
              {task.status === "completed" || task.status === "Completed"
                ? "Completed"
                : task.status === "in-progress" || task.status === "In Progress"
                  ? "In Progress"
                  : "Not Started"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center">
              <Calendar className="mr-1 h-4 w-4" /> Due Date:
            </span>
            <span className="font-medium">{formatDate(task.dueDate)}</span>
          </div>

          {task.lastUpdated && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center">
                <Clock className="mr-1 h-4 w-4" /> Last Updated:
              </span>
              <span>{formatDate(task.lastUpdated)}</span>
            </div>
          )}

          {(task.completionDate || task["completion date"]) && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center">
                <CheckCircle2 className="mr-1 h-4 w-4" /> Completed:
              </span>
              <span>{formatDate(task.completionDate || task["completion date"])}</span>
            </div>
          )}
        </div>

        {/* Display assigned people */}
        {(task.assignedTo || task["assigned to"] || task["Secondary Assignee"]) && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-muted-foreground flex items-center mb-1">
              <Users className="mr-1 h-4 w-4" /> Assigned to:
            </span>
            <div className="flex flex-wrap gap-2">
              {(task.assignedTo || task["assigned to"]) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {(task.assignedTo || task["assigned to"])
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignedTo || task["assigned to"]}</span>
                </Badge>
              )}
              {task["Secondary Assignee"] && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {task["Secondary Assignee"]
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task["Secondary Assignee"]}</span>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Display notes */}
        {(task.notes || task["Short term"] || task["Long term"] || task["Package fees"] || task["Adhoc"]) && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-muted-foreground flex items-center mb-1">
              <FileCheck className="mr-1 h-4 w-4" /> Notes:
            </span>
            {task.notes && <p className="text-sm">{task.notes}</p>}
            {task["Short term"] && (
              <p className="text-sm mt-1">
                <span className="font-medium">Short term:</span> {task["Short term"]}
              </p>
            )}
            {task["Long term"] && (
              <p className="text-sm mt-1">
                <span className="font-medium">Long term:</span> {task["Long term"]}
              </p>
            )}
            {task["Package fees"] && (
              <p className="text-sm mt-1">
                <span className="font-medium">Package fees:</span> {task["Package fees"]}
              </p>
            )}
            {task["Adhoc"] && (
              <p className="text-sm mt-1">
                <span className="font-medium">Adhoc:</span> {task["Adhoc"]}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {daysRemaining()}
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
        </Badge>
        {task.status !== "completed" && task.status !== "Completed" && (
            <Button variant="outline" size="sm" onClick={() => onComplete(task.id)}>
                Mark Complete
            </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function EmployeeDashboard() {
  const router = useRouter()
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("accounting")
  const [tasks, setTasks] = useState<Record<string, TaskType[]>>({
    accounts: [],
    tasks: [],
    compliance: [],
    payments: [],
    results: [], // Maps to Administrative tasks
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState("Employee") // Default, updated by Parse
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null); // Parse user's objectId
  const [filterByUser, setFilterByUser] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])

  const [editingLeave, setEditingLeave] = useState<LeaveApplication | null>(null);
  const [isEditLeaveDialogOpen, setIsEditLeaveDialogOpen] = useState(false);
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);
  const [isDeleteLeaveDialogOpen, setIsDeleteLeaveDialogOpen] = useState(false);


  // Handle authentication check on dashboard load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = Parse.User.current();
        // If no current Parse user, redirect to login
        if (!currentUser) {
          router.push("/login");
        } else {
          // Set current user's display name from Parse
          setCurrentUser(currentUser.get('username') || currentUser.get('email') || "Employee");
          setCurrentUserUid(currentUser.id); // Set the Parse User's objectId
        }
      } catch (error) {
        console.error("Error checking Parse session:", error);
        router.push("/login"); // Redirect on error as well
      }
    };

    checkAuth(); // Call the async function

    // Theme preference check
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    const mediaQuery = typeof window !== 'undefined' ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const handleChange = (event) => {
        if (event.matches) {
            setTheme("dark");
            document.documentElement.classList.add("dark");
        } else {
            setTheme("light");
            document.documentElement.classList.remove("dark");
        }
    };

    if (mediaQuery) {
        mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
        if (mediaQuery) {
            mediaQuery.removeEventListener('change', handleChange);
        }
    };
  }, [router]); // Added router to dependency array


  // Handle logout
  const handleLogout = async () => {
    try {
      await Parse.User.logOut(); // Use Parse SDK's logout function
      localStorage.removeItem("inventureLoggedIn"); // Remove local storage item for consistency
      router.push("/login");
    } catch (error) {
      console.error("Error during Parse logout:", error);
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark")
  }

  // Function to sync task changes with the Google Sheet via proxy
  const syncTaskWithSheet = async (tab: string, task: TaskType, action: "update") => {
    try {
      // Prepare the task object to match the expected API structure
      // Note: The proxy API seems to handle mapping specific sheet columns
      // For "update" action, we typically send the full row data including its identifier.
      const apiTask = {
        ...task,
        "assigned to": task.assignedTo || task["assigned to"] || "",
        "Secondary Assignee": task.assignedToSecond || task["Secondary Assignee"] || "",
        // The notes field might be mapped to "Short term" or "Long term" on the backend,
        // so we preserve those if they exist or use the generic notes.
        "Short term": task["Short term"] || task.notes || "",
        "Long term": task["Long term"] || "",
        "Package fees": task["Package fees"] || "",
        "Adhoc": task["Adhoc"] || "",
        // Ensure that the 'id' which identifies the row in the sheet is present.
        // Assuming 'id' field directly maps to a column in the Google Sheet for updates.
        // If your backend expects a different identifier (e.g., 'rowNumber'),
        // this needs to be adjusted in the proxy and here.
      };

      // Remove client-side only fields if they conflict with the sheet's expected fields
      delete apiTask.assignedTo;
      delete apiTask.notes; // Only delete if 'Short term' or 'Long term' are guaranteed to capture all notes

      // Convert tab to lowercase for consistency with Apps Script TAB_MAP keys
      const response = await fetch(`/api/proxy?tab=${tab.toLowerCase()}&action=${action}`, {
        method: "POST", // Or PUT, depending on your proxy API design for updates
        body: JSON.stringify(apiTask),
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.text();
      console.log(`${action.toUpperCase()} SUCCESS:`, result);
    } catch (error) {
      console.error(`${action.toUpperCase()} ERROR:`, error);
    }
  };

  // Function to sync leave application changes with the Google Sheet via proxy
  const syncLeaveApplicationWithSheet = async (application: Partial<LeaveApplication>, action: "add" | "update" | "delete") => {
    try {
      const apiApplication = {
        ...application,
        // Assuming your backend proxy maps these fields to Google Sheet columns
        // Adjust these keys if your proxy expects different column names
        name: application.name || "",
        surname: application.surname || "",
        daysOfLeave: application.daysOfLeave || "",
        leaveType: application.leaveType || "",
        startDate: application.startDate || "",
        endDate: application.endDate || "",
        dateApplied: application.dateApplied || "",
        status: application.status || "pending",
        creatorId: application.creatorId || currentUserUid || "", // Ensure creatorId is sent
      };

      // Remove client-side 'id' if it's not the backend identifier for updates/deletes
      // The proxy should use objectId or a specific row identifier for updates/deletes
      if (action !== "add") {
          delete apiApplication.id; // The 'id' might be client-side only
      }

      // Send 'hr' in lowercase to match TAB_MAP key in Apps Script
      const response = await fetch(`/api/proxy?tab=hr&action=${action}`, {
        method: "POST", // Or PUT/DELETE based on your proxy's implementation for updates/deletes
        body: JSON.stringify(apiApplication),
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.text();
      console.log(`Leave ${action.toUpperCase()} SUCCESS:`, result);
      // Re-fetch leave applications after a successful sync to update the UI
      await fetchLeaveApplications();
    } catch (error) {
      console.error(`Leave ${action.toUpperCase()} ERROR:`, error);
    }
  };

  // Load tasks and leave applications from Google Sheets via the proxy API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await Promise.all([
        fetchTasks(),
        fetchLeaveApplications()
      ]);
      setIsLoading(false);
    }

    loadData();
  }, [currentUserUid]); // Depend on currentUserUid to ensure user is logged in before fetching data

  const fetchTasks = async () => {
    try {
      // Fetch from your proxy API without a specific tab parameter to get all tasks
      const response = await fetch("/api/proxy");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from proxy (tasks):", errorText);
        setTasks({
          accounts: [], tasks: [], compliance: [], payments: [], results: [],
        });
        return;
      }
      const data = await response.json();
      const normalizedData = Object.keys(data).reduce((acc, tabKey) => {
        if (!Array.isArray(data[tabKey])) {
          acc[tabKey] = [];
          return acc;
        }
        acc[tabKey] = data[tabKey].map((task) => ({
          id: task.id || task.objectId || Date.now() + Math.random(),
          title: task.title || "", description: task.description || "", dueDate: task.dueDate || null,
          lastUpdated: task.lastUpdated || "", completionDate: task.completionDate || null,
          status: task.status || "not-started", priority: task.priority || "medium",
          assignedTo: task["assigned to"] || task.assignedTo || "",
          assignedToSecond: task["Secondary Assignee"] || task.assignedToSecond || "",
          notes: task["Short term"] || task["Long term"] || task.notes || "",
          "Package fees": task["Package fees"] || "", "Adhoc": task["Adhoc"] || "",
          ...task,
        })) as TaskType[];
        return acc;
      }, {}) as Record<string, TaskType[]>;
      setTasks(normalizedData);
    } catch (error) {
      console.error("Error loading tasks from proxy:", error);
      setTasks({
        accounts: [], tasks: [], compliance: [], payments: [], results: [],
      });
    }
  };

  const fetchLeaveApplications = async () => {
    if (!currentUserUid) return; // Only fetch if user ID is available
    try {
        // Fetch 'hr' tab data in lowercase
        const response = await fetch("/api/proxy?tab=hr");
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from proxy (leave applications):", errorText);
            setLeaveApplications([]);
            return;
        }
        const data = await response.json();
        // Access data.hr (lowercase)
        if (data.hr && Array.isArray(data.hr)) {
            const normalizedLeaveData: LeaveApplication[] = data.hr.map((leave: any) => ({
                id: leave.id || leave.objectId || Date.now() + Math.random(),
                objectId: leave.objectId || leave.id, // Ensure objectId or sheet ID is kept
                name: leave.name || "",
                surname: leave.surname || "",
                daysOfLeave: leave.daysOfLeave || "",
                leaveType: leave.leaveType || "",
                dateApplied: leave.dateApplied || "",
                status: (leave.status?.toLowerCase() || "pending") as LeaveApplication['status'],
                startDate: leave.startDate || null,
                endDate: leave.endDate || null,
                creatorId: leave.creatorId || "", // Ensure creatorId is fetched
            }));
            setLeaveApplications(normalizedLeaveData);
        } else {
            setLeaveApplications([]);
        }
    } catch (error) {
        console.error("Error fetching leave applications from proxy:", error);
        setLeaveApplications([]);
    }
  };


  // Mark task as complete (updates local state and syncs with sheet)
  const markTaskComplete = async (tab: string, taskId: string | number) => {
    const updatedTasks = { ...tasks };
    let taskToUpdate: TaskType | undefined;

    // Find the task and update its status and completion date
    updatedTasks[tab] = updatedTasks[tab].map((task) => {
      if (task.id === taskId) {
        taskToUpdate = {
          ...task,
          status: "completed",
          completionDate: new Date().toISOString().split("T")[0],
        };
        return taskToUpdate;
      }
      return task;
    });

    setTasks(updatedTasks);

    // Sync the updated task with the Google Sheet via proxy
    if (taskToUpdate) {
      // The proxy needs to know the original ID to find and update the row
      // We'll pass the task object with the updated status and completionDate
      await syncTaskWithSheet(tab, taskToUpdate, "update");
    }
  };


  // Filter tasks based on current filters
  const filterTasks = (tabTasks: TaskType[]) => {
    if (!tabTasks) return []
    const today = new Date();

    return tabTasks.filter((task) => {
      // Filter by user assignment
      if (filterByUser) {
        // Normalize the assigned names to lowercase for comparison
        const assignedToPrimary = (task.assignedTo || task["assigned to"] || "").toLowerCase();
        const assignedToSecondary = (task["Secondary Assignee"] || "").toLowerCase();
        const currentUserName = currentUser.toLowerCase();

        // Check if the current user is assigned in either primary or secondary
        const isAssignedToCurrentUser =
          assignedToPrimary.includes(currentUserName) ||
          assignedToSecondary.includes(currentUserName);

        if (!isAssignedToCurrentUser) return false;
      }

      // Filter by status
      if (statusFilter !== "all") {
        const taskStatus = (task.status?.toLowerCase() || "not-started").trim(); // Trim whitespace

        if (statusFilter === "completed" && !["completed", "done"].includes(taskStatus)) return false;
        if (statusFilter === "in-progress" && !["in-progress", "in progress"].includes(taskStatus)) return false;
        if (statusFilter === "not-started" && !["not-started", "not started", "pending"].includes(taskStatus)) return false;
        
        // New: Filter by overdue status
        if (statusFilter === "overdue") {
            const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
            const isOverdue = dueDate && !isNaN(dueDate.getTime()) && dueDate < today && taskStatus !== "completed";
            if (!isOverdue) return false;
        }
      }

      // Filter by priority
      if (priorityFilter !== "all") {
        const taskPriority = task.priority?.toLowerCase() || "medium"
        if (taskPriority !== priorityFilter) return false
      }

      return true
    })
  }

  // Get icon for tab
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "accounting":
        return <Users className="h-5 w-5" />
      case "office-management":
        return <ListTodo className="h-5 w-5" />
      case "compliance":
        return <FileCheck className="h-5 w-5" />
      case "inventure-pay":
        return <CreditCard className="h-5 w-5" />
      case "administrative-tasks":
        return <BarChart3 className="h-5 w-5" />
      case "hr":
        return <Building className="h-5 w-5" />
      default:
        return null
    }
  }

  // Handle new leave application submission
  const handleNewLeaveApplication = async (applicationData: Omit<LeaveApplication, 'id' | 'creatorId' | 'status' | 'dateApplied'>) => {
    if (!currentUserUid) {
      console.error("User not logged in. Cannot submit leave application.");
      return;
    }
    const newApplication: LeaveApplication = {
      ...applicationData,
      id: Date.now().toString(), // Client-side unique ID
      dateApplied: new Date().toISOString().split("T")[0],
      status: "pending",
      creatorId: currentUserUid, // Assign the current user as creator
    };
    // Update local state immediately for responsiveness
    setLeaveApplications((prev) => [...prev, newApplication]);
    await syncLeaveApplicationWithSheet(newApplication, "add"); // Sync with backend
  }

  // Handle editing a leave application
  const handleEditLeave = (leave: LeaveApplication) => {
    setEditingLeave(leave);
    setIsEditLeaveDialogOpen(true);
  };

  const handleSaveLeaveChanges = async (updatedData: Omit<LeaveApplication, 'id' | 'creatorId' | 'status' | 'dateApplied'>) => {
    if (editingLeave && currentUserUid) {
      const updatedLeave: LeaveApplication = {
        ...editingLeave,
        ...updatedData,
        dateApplied: new Date().toISOString().split("T")[0], // Update last modified date
        // Ensure status and creatorId are not changed via employee edit
        status: editingLeave.status,
        creatorId: editingLeave.creatorId,
      };
      setLeaveApplications((prev) =>
        prev.map((l) => (l.id === updatedLeave.id ? updatedLeave : l))
      );
      await syncLeaveApplicationWithSheet(updatedLeave, "update");
      setIsEditLeaveDialogOpen(false);
      setEditingLeave(null);
    }
  };

  // Handle deleting a leave application
  const handleDeleteLeaveClick = (leaveId: string) => {
    setDeleteLeaveId(leaveId);
    setIsDeleteLeaveDialogOpen(true);
  };

  const confirmDeleteLeave = async () => {
    if (deleteLeaveId && currentUserUid) {
      const leaveToDelete = leaveApplications.find(l => l.id === deleteLeaveId);
      if (leaveToDelete && leaveToDelete.creatorId === currentUserUid) {
        // Update local state immediately
        setLeaveApplications((prev) => prev.filter((l) => l.id !== deleteLeaveId));
        await syncLeaveApplicationWithSheet({ id: deleteLeaveId, objectId: leaveToDelete.objectId }, "delete");
      } else {
        console.error("Attempted to delete leave not owned by current user or invalid ID.");
      }
    }
    setIsDeleteLeaveDialogOpen(false);
    setDeleteLeaveId(null);
  };


  // Calculate task statistics
  const calculateStats = () => {
    let totalTasks = 0
    let myTasks = 0
    let completedTasks = 0
    let overdueTasks = 0
    const today = new Date();

    Object.keys(tasks).forEach((tab) => {
      if (tasks[tab]) {
        tasks[tab].forEach((task) => {
          totalTasks++

          // Check if task is assigned to current user (more robust check)
          const assignedToPrimary = (task.assignedTo || task["assigned to"] || "").toLowerCase();
          const assignedToSecondary = (task["Secondary Assignee"] || "").toLowerCase();
          const currentUserName = currentUser.toLowerCase();

          const isMyTask =
            assignedToPrimary.includes(currentUserName) ||
            assignedToSecondary.includes(currentUserName);

          if (isMyTask) {
            myTasks++

            const taskStatus = (task.status?.toLowerCase() || "not-started").trim(); // Trim whitespace
            if (taskStatus === "completed") {
              completedTasks++
            } else if (task.dueDate) {
              const dueDate = parseISO(task.dueDate);
              if (!isNaN(dueDate.getTime()) && dueDate < today) {
                overdueTasks++;
              }
            }
          }
        })
      }
    })

    return { totalTasks, myTasks, completedTasks, overdueTasks }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium">Loading employee dashboard...</h2>
          <p className="text-muted-foreground mt-2">Fetching organizational tasks</p>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b p-3 md:p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Inventure Dashboard
          </h1>
          <Badge variant="outline" className="ml-4 bg-primary/10 text-primary">
            Welcome, {currentUser}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>
                  {currentUser
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="p-4 border-b bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.myTasks}</div>
              <div className="text-sm text-muted-foreground">My Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.overdueTasks}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex flex-wrap items-center gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="myTasks"
              checked={filterByUser}
              onChange={(e) => setFilterByUser(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="myTasks" className="text-sm">
              Show only my tasks
            </Label>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem> {/* Added Overdue option */}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {(filterByUser || statusFilter !== "all" || priorityFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterByUser(false)
                setStatusFilter("all")
                setPriorityFilter("all")
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4">
        <Tabs
          defaultValue="accounting"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-7xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="accounting" className="flex items-center gap-2">
              {getTabIcon("accounting")}
              <span className="hidden sm:inline">Accounting</span>
            </TabsTrigger>
            <TabsTrigger value="office-management" className="flex items-center gap-2">
              {getTabIcon("office-management")}
              <span className="hidden sm:inline">Office Mgmt</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              {getTabIcon("compliance")}
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="inventure-pay" className="flex items-center gap-2">
              {getTabIcon("inventure-pay")}
              <span className="hidden sm:inline">Inventure Pay</span>
            </TabsTrigger>
            <TabsTrigger value="administrative-tasks" className="flex items-center gap-2">
              {getTabIcon("administrative-tasks")}
              <span className="hidden sm:inline">Admin Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="hr" className="flex items-center gap-2">
              {getTabIcon("hr")}
              <span className="hidden sm:inline">HR</span>
            </TabsTrigger>
          </TabsList>

          {/* Accounting Tab */}
          <TabsContent value="accounting" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Accounting Tasks</h2>
              <p className="text-muted-foreground">
                {filterTasks(tasks.accounts).length} tasks
                {filterByUser && ` assigned to you`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks(tasks.accounts).length > 0 ? (
                filterTasks(tasks.accounts).map((task) => (
                  <EmployeeTaskCard key={task.id} task={task} tabKey="accounts" onComplete={(taskId) => markTaskComplete("accounts", taskId)} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No accounting tasks found</h3>
                  <p className="text-muted-foreground">
                    {filterByUser ? "No tasks assigned to you in this category" : "No tasks available in this category"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Office Management Tab */}
          <TabsContent value="office-management" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Office Management Tasks</h2>
              <p className="text-muted-foreground">
                {filterTasks(tasks.tasks).length} tasks
                {filterByUser && ` assigned to you`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks(tasks.tasks).length > 0 ? (
                filterTasks(tasks.tasks).map((task) => <EmployeeTaskCard key={task.id} task={task} tabKey="tasks" onComplete={(taskId) => markTaskComplete("tasks", taskId)} />)
              ) : (
                <div className="col-span-full text-center py-12">
                  <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No office management tasks found</h3>
                  <p className="text-muted-foreground">
                    {filterByUser ? "No tasks assigned to you in this category" : "No tasks available in this category"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Compliance Tasks</h2>
              <p className="text-muted-foreground">
                {filterTasks(tasks.compliance).length} tasks
                {filterByUser && ` assigned to you`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks(tasks.compliance).length > 0 ? (
                filterTasks(tasks.compliance).map((task) => (
                  <EmployeeTaskCard key={task.id} task={task} tabKey="compliance" onComplete={(taskId) => markTaskComplete("compliance", taskId)} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No compliance tasks found</h3>
                  <p className="text-muted-foreground">
                    {filterByUser ? "No tasks assigned to you in this category" : "No tasks available in this category"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Inventure Pay Tab */}
          <TabsContent value="inventure-pay" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Inventure Pay Tasks</h2>
              <p className="text-muted-foreground">
                {filterTasks(tasks.payments).length} tasks
                {filterByUser && ` assigned to you`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks(tasks.payments).length > 0 ? (
                filterTasks(tasks.payments).map((task) => (
                  <EmployeeTaskCard key={task.id} task={task} tabKey="payments" onComplete={(taskId) => markTaskComplete("payments", taskId)} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Inventure Pay tasks found</h3>
                  <p className="text-muted-foreground">
                    {filterByUser ? "No tasks assigned to you in this category" : "No tasks available in this category"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Administrative Tasks Tab */}
          <TabsContent value="administrative-tasks" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Administrative Tasks</h2>
              <p className="text-muted-foreground">
                {filterTasks(tasks.results).length} tasks
                {filterByUser && ` assigned to you`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks(tasks.results).length > 0 ? (
                filterTasks(tasks.results).map((task) => (
                  <EmployeeTaskCard key={task.id} task={task} tabKey="results" onComplete={(taskId) => markTaskComplete("results", taskId)} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No administrative tasks found</h3>
                  <p className="text-muted-foreground">
                    {filterByUser ? "No tasks assigned to you in this category" : "No tasks available in this category"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* HR Tab */}
          <TabsContent value="hr" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">HR Management</h2>
              <p className="text-muted-foreground">Submit your leave applications here.</p>
            </div>
            <LeaveApplicationForm onSubmit={handleNewLeaveApplication} />

            {/* Display submitted leave applications */}
            {leaveApplications.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Your Leave Applications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaveApplications.map((app) => (
                    <LeaveCard
                      key={app.id}
                      leave={app}
                      currentUserUid={currentUserUid}
                      onEdit={handleEditLeave}
                      onDelete={handleDeleteLeaveClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Leave Application Dialog */}
      {editingLeave && (
        <Dialog open={isEditLeaveDialogOpen} onOpenChange={setIsEditLeaveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Leave Application</DialogTitle>
              <DialogDescription>Make changes to your leave request here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <LeaveApplicationForm
              initialData={editingLeave}
              onSubmit={handleSaveLeaveChanges}
              onCancel={() => {
                setIsEditLeaveDialogOpen(false);
                setEditingLeave(null);
              }}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Leave Application Confirmation Dialog */}
      <AlertDialog open={isDeleteLeaveDialogOpen} onOpenChange={setIsDeleteLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your leave application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteLeaveDialogOpen(false);
              setDeleteLeaveId(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLeave} className="bg-destructive hover:bg-destructive-dark">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

