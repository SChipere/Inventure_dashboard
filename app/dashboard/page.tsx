"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import {
  Moon,
  Sun,
  Plus,
  Calendar,
  Clock,
  Settings,
  Users,
  FileCheck,
  ListTodo,
  CreditCard,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ClockIcon,
  Trash2,
  Edit,
  LogOut,
  ArrowDownWideNarrow,
  Download,
  Briefcase, // Added for HR tab icon
  User, // Added for profile icon
  Loader2, // Ensure Loader2 is imported for the loading animation
  LayoutDashboard, // Icon for Employee Dash
  ClipboardList, // Icon for Ongoing Work
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
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Removed: import Parse from 'parse'; // Causes compilation error

// The following imports are now handled via CDN script tags in the useEffect hook.
// import jsPDF from "jspdf"
// import "jspdf-autotable"

// TaskCard Component (assuming it's defined elsewhere or will be provided)
const TaskCard = ({ task, calculateDaysDifference, getStatusColor, getPriorityBadge, onEdit, onDelete, onComplete }) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm flex flex-col"> {/* Added flex-col to Card for dynamic height */}
      <CardHeader className="p-4 pb-2 flex-shrink-0">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate mr-2">{task.title}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getPriorityBadge(task.priority)}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-sm text-muted-foreground flex-grow overflow-auto"> {/* Added flex-grow and overflow-auto */}
        <p className="line-clamp-3">{task.description}</p>
        <div className="flex flex-wrap items-center justify-between mt-3 text-xs gap-2"> {/* Added flex-wrap and gap-2 */}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{task.assignedTo || "Unassigned"}</span>
            {task.assignedToSecond && <span className="ml-1">({task.assignedToSecond})</span>}
          </div>
          {task.lastUpdated && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last Updated: {format(parseISO(task.lastUpdated), "MMM d, yy")}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap justify-between items-center text-sm gap-2 mt-auto"> {/* Added flex-wrap and gap-2, and mt-auto */}
        <div className="flex items-center gap-2 flex-wrap"> {/* Nested flex-wrap for date and badge */}
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {task.dueDate ? format(new Date(task.dueDate), "MMM d,yyyy") : "No due date"}
          </div>
          {task.completionDate && (
            <Badge variant="outline" className="text-xs flex-shrink-0"> {/* flex-shrink-0 to prevent badge from shrinking */}
              {calculateDaysDifference(task.dueDate, task.completionDate)}
            </Badge>
          )}
        </div>
        <div
          className={cn(
            "flex items-center px-2 py-1 rounded-full text-white text-xs flex-shrink-0", // flex-shrink-0 for status badge
            getStatusColor(task.status),
          )}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : task.status === "in-progress" ? (
            <ClockIcon className="h-3 w-3 mr-1" />
          ) : (
            <AlertCircle className="h-3 w-3 mr-1" />
          )}
          {task.status === "completed"
            ? "Completed"
            : task.status === "in-progress"
              ? "In Progress"
              : "Not Started"}
        </div>
        {task.status !== "completed" && (
          <Button variant="outline" size="sm" onClick={onComplete} className="flex-shrink-0"> {/* flex-shrink-0 for button */}
            Mark Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// TaskForm Component (assuming it's defined elsewhere or will be provided)
const TaskForm = ({ tabKey, addTask }) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState(null)
  const [priority, setPriority] = useState("medium")
  const [assignedTo, setAssignedTo] = useState("")
  const [assignedToSecond, setAssignedToSecond] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title || !dueDate) return

    addTask(tabKey, {
      title,
      description,
      dueDate: dueDate.toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      status: "not-started",
      priority,
      assignedTo,
      assignedToSecond,
      notes,
    })
    setTitle("")
    setDescription("")
    setDueDate(null)
    setPriority("medium")
    setAssignedTo("")
    setAssignedToSecond("")
    setNotes("")
  }

  return (
    <Card className="p-4" id={`new-task-form`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <Label htmlFor="assignedTo">Assigned To (Primary)</Label>
            <Input id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="assignedToSecond">Assigned To (Secondary)</Label>
            <Input id="assignedToSecond" value={assignedToSecond} onChange={(e) => setAssignedToSecond(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit" style={{ backgroundColor: '#01739d' }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </form>
    </Card>
  )
}

// EditTaskForm Component (assuming it's defined elsewhere or will be provided)
const EditTaskForm = ({ task, onSave, onCancel }) => {
  const [currentTask, setCurrentTask] = useState(task)

  useEffect(() => {
    setCurrentTask(task)
  }, [task])

  const handleChange = (e) => {
    const { id, value } = e.target
    setCurrentTask((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateChange = (date) => {
    setCurrentTask((prev) => ({ ...prev, dueDate: date }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(currentTask)
  }

  if (!currentTask) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={currentTask.title} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={currentTask.description} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !currentTask.dueDate && "text-muted-foreground",
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {currentTask.dueDate ? format(new Date(currentTask.dueDate), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={currentTask.dueDate ? new Date(currentTask.dueDate) : null}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={currentTask.priority}
          onChange={handleChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={currentTask.status}
          onChange={handleChange}
        >
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <Label htmlFor="assignedTo">Assigned To (Primary)</Label>
        <Input id="assignedTo" value={currentTask.assignedTo} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="assignedToSecond">Assigned To (Secondary)</Label>
        <Input id="assignedToSecond" value={currentTask.assignedToSecond} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={currentTask.notes} onChange={handleChange} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" style={{ backgroundColor: '#01739d' }}>Save Changes</Button>
      </DialogFooter>
    </form>
  )
}

// HRLeavesTable Component for displaying and managing leave requests
const HRLeavesTable = ({ leaves, updateLeaveStatus, getStatusColor, openStatusDialog, onDeleteLeave }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-background rounded-md overflow-hidden">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Leave Type</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Start Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">End Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Days</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Date Applied</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length > 0 ? (
            leaves.map((leave) => (
              <tr key={leave.id} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-3 text-sm">{leave.name} {leave.surname}</td>
                <td className="px-4 py-3 text-sm">{leave.leaveType}</td>
                <td className="px-4 py-3 text-sm">{leave.startDate ? format(parseISO(leave.startDate), "MMM d,yyyy") : "N/A"}</td>
                <td className="px-4 py-3 text-sm">{leave.endDate ? format(parseISO(leave.endDate), "MMM d,yyyy") : "N/A"}</td>
                <td className="px-4 py-3 text-sm">{leave.daysOfLeave}</td>
                <td className="px-4 py-3 text-sm">{leave.dateApplied ? format(parseISO(leave.dateApplied), "MMM d,yyyy") : "N/A"}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge className={cn("text-xs capitalize", getStatusColor(leave.status))}>
                    {leave.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 flex items-center gap-2"> {/* Added flex and gap */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openStatusDialog(leave, "approved")}>
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openStatusDialog(leave, "denied")}>
                        Deny
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openStatusDialog(leave, "pending")}>
                        Set to Pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteLeave(leave.id)}> {/* Delete button */}
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-8 text-muted-foreground">No leave requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// LeaveStatusDialog Component for confirming status change
const LeaveStatusDialog = ({ isOpen, onOpenChange, leave, newStatus, onConfirm }) => {
  if (!leave) return null;
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Leave Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change the status of {leave.name} {leave.surname}'s leave to "
            <span className="font-bold capitalize">{newStatus}</span>"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} style={{ backgroundColor: '#01739d' }}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export default function Dashboard() {
  const router = useRouter()
  const [theme, setTheme] = useState("light")
  const [activeTab, setActiveTab] = useState("accounts")
  const [adminOpen, setAdminOpen] = useState(true)
  const [appData, setAppData] = useState({
    admin: [],
    accounts: [],
    tasks: [],
    compliance: [],
    payments: [],
    results: [],
    hr: [], // Initialize HR data
  })
  const [editingTask, setEditingTask] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true); // New state for loading indicator

  // State for HR leave management
  const [isLeaveStatusDialogOpen, setIsLeaveStatusDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [newLeaveStatus, setNewLeaveStatus] = useState("");
  // State for HR leave deletion
  const [isLeaveDeleteDialogOpen, setIsLeaveDeleteDialogOpen] = useState(false);
  const [leaveToDeleteId, setLeaveToDeleteId] = useState(null);


  // Handle authentication check on dashboard load
  useEffect(() => {
    // Dynamically load Parse SDK, jsPDF, and jspdf-autotable
    const loadScripts = () => {
        const parseScript = document.createElement('script');
        parseScript.src = 'https://unpkg.com/parse/dist/parse.min.js';
        parseScript.onload = () => {
            // Initialize Parse (only if not already initialized globally)
            if (typeof window !== 'undefined' && window.Parse && !window.Parse.applicationId) {
                window.Parse.initialize("QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw", "jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS");
                window.Parse.serverURL = 'https://parseapi.back4app.com/';
            }
            checkAuth();
        };
        document.body.appendChild(parseScript);

        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.body.appendChild(jspdfScript);

        const jspdfAutotableScript = document.createElement('script');
        jspdfAutotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
        document.body.appendChild(jspdfAutotableScript);
    };

    const checkAuth = async () => {
      try {
        // Use window.Parse as it's now loaded globally
        if (typeof window !== 'undefined' && window.Parse) {
          const currentUser = window.Parse.User.current();
          if (!currentUser) {
            router.push("/login"); // Redirect to login page
          }
        } else {
            console.log("Parse SDK not yet loaded.");
        }
      } catch (error) {
        console.error("Error checking Parse session:", error);
        router.push("/login"); // Redirect to login page on error
      }
    };

    loadScripts(); // Start loading scripts

    // Theme and resize handling
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }

    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setAdminOpen(false)
      }
    }

    handleResize()
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", handleResize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", handleResize)
      }
    }

  }, []); // Empty dependency array, scripts load once


  // Handle logout
  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined' && window.Parse) {
        await window.Parse.User.logOut(); // Use global Parse SDK's logout function
        localStorage.removeItem("inventureLoggedIn"); // Remove local storage item
        router.push("/login"); // Redirect to login page
      }
    } catch (error) {
      console.error("Error during Parse logout:", error);
      // Optionally display an error message to the user if logout fails
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark")
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true); // Set loading to true when data fetching starts
      try {
        const response = await fetch("/api/proxy")

        // Check if the response is ok
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response from proxy:", errorText)
          return
        }

        const data = await response.json()

        // Normalize the data structure
        const normalizedData = Object.keys(data).reduce((acc, tabKey) => {
          if (!Array.isArray(data[tabKey])) {
            acc[tabKey] = []
            return acc
          }

          acc[tabKey] = data[tabKey].map((item) => {
            // Check if it's a leave request based on typical fields
            if (item.leaveType || item.dateApplied || item.daysOfLeave) {
              return {
                id: item.id || item.objectId || Date.now(), // Use objectId or generate new
                sourceTab: tabKey, // Store the original tab
                name: item.name || "",
                surname: item.surname || "",
                leaveType: item.leaveType || "",
                daysOfLeave: item.daysOfLeave || 0,
                startDate: item.startDate || null,
                endDate: item.endDate || null,
                dateApplied: item.dateApplied || null,
                status: item.status || "pending",
                creatorId: item.creatorId || "",
                ...item, // Include any other fields
              };
            } else {
              // Otherwise, assume it's a task
              return {
                id: item.id || item.objectId || Date.now(),
                sourceTab: tabKey, // Store the original tab
                title: item.title || "",
                description: item.description || "",
                dueDate: item.dueDate || null,
                lastUpdated: item.lastUpdated || "",
                completionDate: item.completionDate || null,
                status: item.status || "not-started",
                priority: item.priority || "medium",
                assignedTo: item["assigned to"] || item.assignedTo || "",
                assignedToSecond: item["Secondary Assignee"] || item.assignedToSecond || "",
                notes: item["Short term"] || item["Long term"] || item.notes || "",
                ...item,
              }
            }
          })

          return acc
        }, {})

        setAppData(normalizedData)
      } catch (error) {
        console.error("Error fetching data from proxy:", error)
      } finally {
        setIsLoading(false); // Set loading to false when data fetching completes
      }
    }

    fetchAllData()

  }, []); // Empty dependency array


  // Add a new task (used for admin tasks)
  const addTask = (tab, task) => {
    const newTask = { ...task, id: Date.now(), sourceTab: tab } // Generate client-side ID and set sourceTab
    const updatedAppData = { ...appData }
    updatedAppData[tab] = [...(appData[tab] || []), newTask]
    setAppData(updatedAppData)
    syncDataWithSheet(tab, newTask, "add")
  }

  // Edit task
  const editTask = (tab, updatedTask) => {
    const updatedAppData = { ...appData }
    updatedAppData[tab] = appData[tab].map((task) => (task.id === updatedTask.id ? updatedTask : task))
    setAppData(updatedAppData)
    syncDataWithSheet(tab, updatedTask, "update")
    setIsEditDialogOpen(false)
    setEditingTask(null)
  }

  // Delete task
  const deleteTask = (tab, taskId) => {
    const updatedAppData = { ...appData }
    updatedAppData[tab] = appData[tab].filter((task) => task.id !== taskId)
    setAppData(updatedAppData)
    syncDataWithSheet(tab, { id: taskId }, "delete")
    setIsDeleteDialogOpen(false)
    setDeleteTaskId(null)
  }

  // Mark task as complete
  const markTaskComplete = (tab, taskId) => {
    const updatedAppData = { ...appData }
    updatedAppData[tab] = appData[tab].map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: "completed",
          completionDate: new Date().toISOString().split("T")[0],
        }
      }
      return task
    })
    setAppData(updatedAppData)
    // Update the sheet for completion status
    const completedTask = updatedAppData[tab].find(task => task.id === taskId);
    if (completedTask) {
        syncDataWithSheet(tab, completedTask, "update");
    }
  }

  // Function to update leave status
  const updateLeaveStatus = (leaveId, status) => {
    const updatedAppData = { ...appData };
    const updatedLeaves = appData.hr.map((leave) => {
      if (leave.id === leaveId) {
        return { ...leave, status };
      }
      return leave;
    });
    updatedAppData.hr = updatedLeaves;
    setAppData(updatedAppData);

    // Find the updated leave object to send to the sheet
    const leaveToUpdate = updatedLeaves.find(leave => leave.id === leaveId);
    if (leaveToUpdate) {
      syncDataWithSheet("hr", leaveToUpdate, "update");
    }
  };

  // Open the leave status change dialog
  const openStatusDialog = (leave, status) => {
    setSelectedLeave(leave);
    setNewLeaveStatus(status);
    setIsLeaveStatusDialogOpen(true);
  };

  // Confirm and apply leave status change
  const handleConfirmLeaveStatusChange = () => {
    if (selectedLeave && newLeaveStatus) {
      updateLeaveStatus(selectedLeave.id, newLeaveStatus);
    }
    setIsLeaveStatusDialogOpen(false);
    setSelectedLeave(null);
    setNewLeaveStatus("");
  };

  // Function to delete a leave request
  const deleteLeave = (leaveId) => {
    const updatedAppData = { ...appData };
    updatedAppData.hr = appData.hr.filter((leave) => leave.id !== leaveId);
    setAppData(updatedAppData);
    syncDataWithSheet("hr", { id: leaveId }, "delete");
    setIsLeaveDeleteDialogOpen(false); // Close the dialog after deletion
    setLeaveToDeleteId(null); // Clear the ID
  };

  // Open delete leave confirmation dialog
  const openDeleteLeaveDialog = (leaveId) => {
    setLeaveToDeleteId(leaveId);
    setIsLeaveDeleteDialogOpen(true);
  };


  // Calculate days difference
  const calculateDaysDifference = (dueDate, completionDate) => {
    if (!dueDate || !completionDate) return "N/A"
    const diff = differenceInDays(new Date(completionDate), new Date(dueDate))
    if (diff > 0) return `${diff} days overdue`
    if (diff < 0) return `${Math.abs(diff)} days early`
    return "On time"
  }

  // Get status color (for tasks and leaves)
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) { // Normalize to lowercase for comparison
      case "completed":
      case "approved":
        return "bg-green-500"
      case "in-progress":
      case "pending":
        return "bg-blue-500"
      case "not-started":
      case "denied":
        return "bg-red-500" // Use red for denied leaves
      default:
        return "bg-gray-500"
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority) => {
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

  // Calculate completion percentage for a tab (or combined data)
  const calculateCompletion = (data) => {
    if (!data || data.length === 0) return 0
    // For HR tab, consider 'approved' as completed equivalent
    const completed = data.filter((item) => item.status === "completed" || item.status === "approved").length
    return Math.round((completed / data.length) * 100)
  }

  // Get icon for tab
  const getTabIcon = (tab) => {
    switch (tab) {
      case "admin": // This icon is still used for the sidebar's overall admin section
        return <Settings className="h-5 w-5" />
      case "accounts":
        return <Users className="h-5 w-5" />
      case "tasks":
        return <ListTodo className="h-5 w-5" />
      case "compliance":
        return <FileCheck className="h-5 w-5" />
      case "payments":
        return <CreditCard className="h-5 w-5" />
      case "results":
        return <BarChart3 className="h-5 w-5" />
      case "hr": // New HR tab icon
        return <Briefcase className="h-5 w-5" />
      default:
        return null
    }
  }

  // Calculate task statistics for analytics (combining admin and results)
  const calculateTaskStats = () => {
    let totalTasks = 0
    let completedTasks = 0
    let overdueTasks = 0
    let upcomingTasks = 0

    // Include tasks from all relevant tabs for analytics
    const taskTabs = ["accounts", "tasks", "compliance", "payments"];
    const combinedAdminResults = [...(appData.results || []), ...(appData.admin || [])];

    taskTabs.forEach((tab) => {
      if (appData[tab]) {
        appData[tab].forEach((task) => {
          totalTasks++
          if (task.status === "completed") {
            completedTasks++
          } else {
            const dueDate = new Date(task.dueDate)
            const today = new Date()
            if (dueDate && dueDate < today) { // Check for dueDate existence
              overdueTasks++
            } else {
              upcomingTasks++
            }
          }
        })
      }
    })

    // Add combined admin and results tasks
    combinedAdminResults.forEach((task) => {
        totalTasks++;
        if (task.status === "completed") {
            completedTasks++;
        } else {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            if (dueDate && dueDate < today) {
                overdueTasks++;
            } else {
                upcomingTasks++;
            }
        }
    });

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      upcomingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    }
  }

  //sheet amending code AI generated
  const syncDataWithSheet = async (tab, dataItem, action) => {
    try {
      let apiPayload = {};

      if (tab === "hr") {
        // Map HR specific fields
        apiPayload = {
          id: dataItem.id, // Ensure ID is passed for updates/deletes
          name: dataItem.name,
          surname: dataItem.surname,
          leaveType: dataItem.leaveType,
          daysOfLeave: dataItem.daysOfLeave,
          startDate: dataItem.startDate,
          endDate: dataItem.endDate,
          dateApplied: dataItem.dateApplied,
          status: dataItem.status,
          creatorId: dataItem.creatorId,
          // Add any other HR specific fields that need to be synced
        };
      } else {
        // Map Task specific fields
        apiPayload = {
          id: dataItem.id, // Ensure ID is passed for updates/deletes
          title: dataItem.title || "",
          description: dataItem.description || "",
          dueDate: dataItem.dueDate || null,
          lastUpdated: dataItem.lastUpdated || "",
          completionDate: dataItem.completionDate || null,
          status: dataItem.status || "medium", // Default to 'medium' if not set
          priority: dataItem.priority || "not-started", // Default to 'not-started' if not set
          "assigned to": dataItem.assignedTo || "", // Use original sheet column name
          "Secondary Assignee": dataItem.assignedToSecond || "", // Use original sheet column name
          "Short term": dataItem.notes || "", // Use original sheet column name
          // If you have other task-specific fields that might not be directly in the payload
          // but exist in the sheet, map them here.
        };
        // Remove client-side only fields that shouldn't be sent to sheet
        delete apiPayload.assignedTo;
        delete apiPayload.assignedToSecond;
        delete apiPayload.notes;
      }


      const response = await fetch(`/api/proxy?tab=${tab}&action=${action}`, {
        method: "POST",
        body: JSON.stringify(apiPayload),
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.text()
      console.log(`${action.toUpperCase()} SUCCESS for tab ${tab}:`, result)
    } catch (error) {
      console.error(`${action.toUpperCase()} ERROR for tab ${tab}:`, error)
    }
  }

  // Get task counts by department for analytics (combining admin and results)
  const getTasksByDepartment = () => {
    const departments = {}

    // Combine results and admin tasks under one "Administrative tasks" key
    const combinedAdminAndResultsCount = (appData.results?.length || 0) + (appData.admin?.length || 0);
    if (combinedAdminAndResultsCount > 0) {
        departments["Administrative Tasks"] = combinedAdminAndResultsCount;
    }

    // Include other tabs as before
    const otherTabs = ["accounts", "tasks", "compliance", "payments"];
    otherTabs.forEach((tab) => {
      if (appData[tab] && appData[tab].length > 0) {
        const tabName = tab.charAt(0).toUpperCase() + tab.slice(1);
        departments[tabName] = appData[tab].length;
      }
    });

    return departments
  }

  // Sort tasks
  const sortTasks = (tabKey) => {
    setAppData((prevAppData) => {
      let tasksToSort;
      if (tabKey === "results") { // If it's the combined tab
        tasksToSort = [...(prevAppData.results || []), ...(prevAppData.admin || [])];
      } else {
        tasksToSort = [...(prevAppData[tabKey] || [])];
      }

      const sortedTasks = tasksToSort.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000); // Max Date if no due date
        const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000); // Max Date if no due date
        return dateA.getTime() - dateB.getTime();
      });

      // When sorting a combined tab, we don't modify individual source arrays directly
      // This sort function is primarily for the displayed order.
      // If we need to persist sort, it would require re-evaluating the data structure.
      // For now, this just affects the UI order.
      // However, to make this state change effective for React re-render,
      // we need a mechanism to store the sorted state,
      // or ensure `combinedTasks` is always sorted before rendering.
      // For simplicity, let's just make sure `combinedTasks` is always sorted for display.
      // The actual `appData` doesn't need to change for display sort.
      return prevAppData; // Returning prevAppData as the sort affects display, not underlying state structure
                          // The `currentTabTasks` variable will be re-computed and sorted on render.
    });
  };

  // Download tasks as PDF
  const downloadPdfReport = (tabKey, tabName) => {
    // Check if jsPDF is available globally
    if (typeof window !== 'undefined' && window.jsPDF && window.jsPDF.A4) {
      const doc = new window.jsPDF(); // Use global jsPDF
      doc.text(`${tabName} Report`, 14, 15);

      let tableColumn = [];
      let tableRows = [];
      let dataToReport = [];

      if (tabKey === "results") { // For the combined Administrative tasks tab
        dataToReport = [...(appData.results || []), ...(appData.admin || [])];
      } else {
        dataToReport = appData[tabKey];
      }


      if (tabKey === "hr") {
        tableColumn = ["Name", "Leave Type", "Start Date", "End Date", "Days", "Date Applied", "Status"];
        tableRows = dataToReport.map(item => ([
          `${item.name} ${item.surname}`,
          item.leaveType,
          item.startDate ? format(parseISO(item.startDate), "MMM d,yyyy") : "N/A",
          item.endDate ? format(parseISO(item.endDate), "MMM d,yyyy") : "N/A",
          item.daysOfLeave,
          item.dateApplied ? format(parseISO(item.dateApplied), "MMM d,yyyy") : "N/A",
          item.status,
        ]));
      } else {
        tableColumn = ["Title", "Due Date", "Status", "Priority", "Assigned To"];
        tableRows = dataToReport.map(item => ([
          item.title,
          item.dueDate ? format(new Date(item.dueDate), "MMM d,yyyy") : "N/A",
          item.status,
          item.priority,
          item.assignedTo || "Unassigned",
        ]));
      }

      // autoTable is a plugin, ensure it's loaded with jspdf.plugin.autotable.min.js
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
          margin: { top: 10 },
        });

        doc.save(`${tabName}_Report.pdf`);
      } else {
        console.error("jsPDF AutoTable plugin not loaded.");
      }
    } else {
      console.error("jsPDF not loaded or not properly initialized.");
    }
  };

  // Download tasks as CSV
  const downloadCsvReport = (tabKey, tabName) => {
    let headers = [];
    let rows = [];
    let dataToReport = [];

    if (tabKey === "results") { // For the combined Administrative tasks tab
      dataToReport = [...(appData.results || []), ...(appData.admin || [])];
    } else {
      dataToReport = appData[tabKey];
    }

    if (tabKey === "hr") {
      headers = ["Name", "Surname", "Leave Type", "Days Of Leave", "Start Date", "End Date", "Date Applied", "Status", "Creator ID"];
      rows = dataToReport.map(item => ([
        item.name,
        item.surname,
        item.leaveType,
        item.daysOfLeave,
        item.startDate ? format(parseISO(item.startDate), "yyyy-MM-dd") : "N/A",
        item.endDate ? format(parseISO(item.endDate), "yyyy-MM-dd") : "N/A",
        item.dateApplied ? format(parseISO(item.dateApplied), "yyyy-MM-dd") : "N/A",
        item.status,
        item.creatorId,
      ]));
    } else {
      headers = ["Title", "Description", "Due Date", "Last Updated", "Completion Date", "Status", "Priority", "Assigned To", "Secondary Assignee", "Notes"];
      rows = dataToReport.map(item => ([
        item.title,
        item.description,
        item.dueDate ? format(new Date(item.dueDate), "yyyy-MM-dd") : "N/A",
        item.lastUpdated ? format(parseISO(item.lastUpdated), "yyyy-MM-dd") : "N/A",
        item.completionDate ? format(parseISO(item.completionDate), "yyyy-MM-dd") : "N/A",
        item.status,
        item.priority,
        item.assignedTo || "Unassigned",
        item.assignedToSecond || "",
        item.notes || "",
      ]));
    }

    let csvContent = headers.map(e => `"${e}"`).join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(e => `"${e}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${tabName}_Report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b p-3 md:p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setAdminOpen(!adminOpen)}>
            <Settings className="h-5 w-5" />
          </Button>
          <img src="/Inventurelogo1.png" alt="Inventure Logo" className="h-8 w-auto" />
          
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="flex items-center justify-center"> {/* Added flex classes */}
                  <User className="h-5 w-5" /> {/* Profile icon */}
                  {/* CEO */} {/* Removed text to avoid overflow with icon */}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/admin/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Admin Side Panel */}
        <aside
          className={cn(
            "min-h-screen h-full bg-muted/30 backdrop-blur-sm border-r transition-all duration-300 overflow-y-auto sticky top-0 left-0 z-10", // Added z-10
            adminOpen ? "w-96" : "w-20",
          )}
        >
          <div className="sticky top-0 z-10 p-3 md:p-4 flex items-center justify-between bg-muted/50 backdrop-blur-sm">
            <h2 className={cn("font-semibold transition-opacity", adminOpen ? "opacity-100" : "opacity-0")}>
              Progress bar Tracker
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setAdminOpen(!adminOpen)} className="rounded-full">
              <ChevronRight className={cn("h-5 w-5 transition-transform", adminOpen ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>

          <div className="px-3 py-2 pb-20">
            {adminOpen ? (
              <div className="space-y-6">
                {/* Overview Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium px-2">Overview</h3>
                  <div className="space-y-1">
                    <div className="px-2 py-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Accounting</span>
                        <span>{calculateCompletion(appData.accounts)}%</span>
                      </div>
                      <Progress value={calculateCompletion(appData.accounts)} className="h-1.5 mt-1" />
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Office Management</span>
                        <span>{calculateCompletion(appData.tasks)}%</span>
                      </div>
                      <Progress value={calculateCompletion(appData.tasks)} className="h-1.5 mt-1" />
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Compliance</span>
                        <span>{calculateCompletion(appData.compliance)}%</span>
                      </div>
                      <Progress value={calculateCompletion(appData.compliance)} className="h-1.5 mt-1" />
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="flex justify-between text-sm">
                        <span>InventurePay</span>
                        <span>{calculateCompletion(appData.payments)}%</span>
                      </div>
                      <Progress value={calculateCompletion(appData.payments)} className="h-1.5 mt-1" />
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Administrative tasks</span>
                        <span>{calculateCompletion([...(appData.results || []), ...(appData.admin || [])])}%</span>
                      </div>
                      <Progress value={calculateCompletion([...(appData.results || []), ...(appData.admin || [])])} className="h-1.5 mt-1" />
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="flex justify-between text-sm">
                        <span>HR (Leaves)</span>
                        <span>{calculateCompletion(appData.hr)}%</span>
                      </div>
                      <Progress value={calculateCompletion(appData.hr)} className="h-1.5 mt-1" />
                    </div>
                  </div>
                </div>

                {/* New Buttons/Tiles */}
                <div className="grid grid-cols-2 gap-4 px-2"> {/* Changed to grid for square tiles */}
                  <Card className="border border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push("/employee-dashboard")}>
                    <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                      <LayoutDashboard className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium text-center">Employee Dash</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                      <ClipboardList className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium text-center">Ongoing Work</span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6 mt-4">
                {["accounts", "tasks", "compliance", "payments", "results", "hr"].map((tab) => {
                  const icon = getTabIcon(tab)
                  const completion = tab === "results" ? calculateCompletion([...(appData.results || []), ...(appData.admin || [])]) : calculateCompletion(appData[tab])

                  return (
                    <div key={tab} className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-10 w-10"
                        onClick={() => setActiveTab(tab)}
                      >
                        {icon}
                      </Button>
                      <svg className="absolute -top-1 -right-1 w-12 h-12">
                        <circle
                          cx="20"
                          cy="20"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeDasharray={`${completion * 0.5} 100`}
                          className="text-primary"
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                    </div>
                  )
                })}
                 {/* New Buttons/Tiles for collapsed state */}
                 <div className="flex flex-col items-center space-y-6 mt-4">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10"
                            onClick={() => router.push("/employee-dashboard")}>
                      <LayoutDashboard className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                      <ClipboardList className="h-5 w-5" />
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full min-h-screen">
          <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/20 backdrop-blur-sm">
              <TabsList className="mx-2 md:mx-4 my-1 overflow-x-auto flex flex-nowrap">
                {[
                  { key: "accounts", name: "Accounting" },
                  { key: "tasks", name: "Office Management" },
                  { key: "compliance", name: "Compliance" },
                  { key: "payments", name: "InventurePay" },
                  { key: "results", name: "Administrative tasks" }, // This tab will now include 'admin' tasks
                  { key: "hr", name: "HR" },
                ].map((tabInfo) => (
                  <TabsTrigger
                    key={tabInfo.key}
                    value={tabInfo.key}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      {getTabIcon(tabInfo.key)}
                      {tabInfo.name}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Render TabsContent for all tabs */}
            {[
              { key: "accounts", name: "Accounting" },
              { key: "tasks", name: "Office Management" },
              { key: "compliance", name: "Compliance" },
              { key: "payments", name: "InventurePay" },
              { key: "results", name: "Administrative tasks" }, // This tab will now include 'admin' tasks
              { key: "hr", name: "HR" },
            ].map((tabInfo) => {
              const tabKey = tabInfo.key;
              const tabDisplayName = tabInfo.name;

              // Combine admin and results tasks for the 'results' tab
              const currentTabTasks = tabKey === "results"
                ? [...(appData.results || []), ...(appData.admin || [])]
                : appData[tabKey];

              return (
                <TabsContent key={tabKey} value={tabKey} className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{tabDisplayName}</h2>
                      <p className="text-muted-foreground">
                        {currentTabTasks?.length || 0} {tabKey === "hr" ? "leaves" : "tasks"} • {calculateCompletion(currentTabTasks)}% complete
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {tabKey !== "hr" && ( // Only show sort for task tabs
                        <Button variant="outline" size="sm" onClick={() => sortTasks(tabKey)}>
                          <ArrowDownWideNarrow className="h-4 w-4 mr-2" />
                          Sort by Due Date
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => downloadPdfReport(tabKey, tabDisplayName)}>
                            Download as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadCsvReport(tabKey, tabDisplayName)}>
                            Download as CSV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {tabKey !== "hr" && ( // Only show "New Task" for task tabs
                        <Button onClick={() => document.getElementById("new-task-form")?.scrollIntoView()} style={{ backgroundColor: '#01739d' }}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Task
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Conditional rendering for HR vs. other tabs, and loading state */}
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground text-lg">Loading {tabDisplayName} data...</p>
                      <p className="text-muted-foreground text-sm mt-1">Please wait while we fetch your information.</p>
                    </div>
                  ) : tabKey === "hr" ? (
                    <HRLeavesTable
                      leaves={currentTabTasks} // Use currentTabTasks which is appData.hr
                      updateLeaveStatus={updateLeaveStatus}
                      getStatusColor={getStatusColor}
                      openStatusDialog={openStatusDialog}
                      onDeleteLeave={openDeleteLeaveDialog} // Pass the new delete handler
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {currentTabTasks && currentTabTasks.length > 0 ? (
                          currentTabTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              calculateDaysDifference={calculateDaysDifference}
                              getStatusColor={getStatusColor}
                              getPriorityBadge={getPriorityBadge}
                              onEdit={() => {
                                setEditingTask({ ...task, tab: task.sourceTab }) // Use task.sourceTab
                                setIsEditDialogOpen(true)
                              }}
                              onDelete={() => {
                                setDeleteTaskId({ id: task.id, tab: task.sourceTab }) // Use task.sourceTab
                                setIsDeleteDialogOpen(true)
                              }}
                              onComplete={() => markTaskComplete(task.sourceTab, task.id)} // Use task.sourceTab
                            />
                          ))
                        ) : (
                          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="rounded-full bg-muted p-6 mb-4">
                              {getTabIcon(tabKey)} {/* Use appropriate icon for empty state */}
                            </div>
                            <h3 className="text-xl font-medium mb-2">No {tabDisplayName} tasks found</h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                              There are currently no tasks in the {tabDisplayName} section. Get started by creating a new task.
                            </p>
                            <Button onClick={() => document.getElementById("new-task-form")?.scrollIntoView()} style={{ backgroundColor: '#01739d' }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-8" id="new-task-form">
                        <h3 className="text-lg font-medium mb-4">Add New Task</h3>
                        <TaskForm tabKey={"results"} addTask={addTask} /> {/* New tasks added here go to 'results' */}
                      </div>
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </main>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Make changes to your task here. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <EditTaskForm
              task={editingTask}
              onSave={(updatedTask) => editTask(editingTask.tab, updatedTask)}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your task and remove your data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTask(deleteTaskId.tab, deleteTaskId.id)} style={{ backgroundColor: '#01739d' }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task Analytics</DialogTitle>
            <DialogDescription>Overview of your task completion and progress.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateTaskStats().totalTasks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateTaskStats().completedTasks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateTaskStats().overdueTasks}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateTaskStats().upcomingTasks}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={calculateTaskStats().completionRate} className="h-2.5" />
                <div className="text-right text-sm text-muted-foreground mt-2">
                  {calculateTaskStats().completionRate}% Complete
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(getTasksByDepartment()).map(([department, count]) => (
                    <div key={department} className="flex justify-between items-center text-sm">
                      <span>{department}</span>
                      <Badge variant="secondary">{count} tasks}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Status Confirmation Dialog */}
      <LeaveStatusDialog
        isOpen={isLeaveStatusDialogOpen}
        onOpenChange={setIsLeaveStatusDialogOpen}
        leave={selectedLeave}
        newStatus={newLeaveStatus}
        onConfirm={handleConfirmLeaveStatusChange}
      />

      {/* Delete Leave Confirmation Dialog */}
      <AlertDialog open={isLeaveDeleteDialogOpen} onOpenChange={setIsLeaveDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this leave request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLeave(leaveToDeleteId)} style={{ backgroundColor: '#01739d' }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
