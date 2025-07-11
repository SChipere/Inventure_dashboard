// app/admin/settings/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  UserPlus,
  Bell,
  Shield,
  Mail,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Send,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  MoreHorizontal,
  Copy,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { format } from "date-fns"
import {
  fetchAllUsers,
  createUser,
  deleteUser,
  sendBroadcastNotification,
  generateTemporaryPassword,
  getUserStatistics,
  updateUser,
  type AdminUser, // This type now refers to Employee type from back4app-admin
  type CreateUserData,
  type NotificationData,
  type UpdateUserData,
} from "@/lib/back4app-admin"

// Add User Form Component
function AddUserForm({ onSubmit, onCancel, isLoading }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accessLevel, setAccessLevel] = useState("user")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      console.error("Please fill in all required fields for adding a user.")
      return
    }

    const userData: CreateUserData = {
      username,
      email,
      password,
      Acess_level: accessLevel,
    }

    onSubmit(userData)
  }

  const generatePassword = () => {
    const newPassword = generateTemporaryPassword()
    setPassword(newPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Username*</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email*</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">Temporary Password*</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter temporary password"
              className="pr-20"
              required
            />
            <div className="absolute right-1 top-0 h-full flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={generatePassword}
                title="Generate password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">User can change this password after first login</p>
        </div>
        <div>
          <Label htmlFor="accessLevel">Access Level</Label>
          <Select value={accessLevel} onValueChange={setAccessLevel}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select access level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating User...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Edit User Form Component
function EditUserForm({ onSubmit, onCancel, isLoading, user }) {
  const [username, setUsername] = useState(user.User || "") // Use 'User' field
  const [email, setEmail] = useState(user.Email || "") // Use 'Email' field
  const [accessLevel, setAccessLevel] = useState(user.Access_level || "user") // Use 'Access_level' field
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailVerified, setEmailVerified] = useState(true) // Always true as per new requirement

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userData: UpdateUserData = {
      objectId: user.objectId, // This objectId is from the Employees class.
      username,
      email,
      Acess_level: accessLevel,
      emailVerified, // This will always be true
    }

    if (password) {
      userData.password = password
    }

    onSubmit(userData)
  }

  const generateNewPassword = () => {
    const newPassword = generateTemporaryPassword()
    setPassword(newPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-username">Username</Label>
          <Input
            id="edit-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-password">New Password (optional)</Label>
          <div className="relative mt-1">
            <Input
              id="edit-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="pr-20"
            />
            <div className="absolute right-1 top-0 h-full flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={generateNewPassword}
                title="Generate new password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Leave blank to keep the current password.</p>
        </div>
        <div>
          <Label htmlFor="edit-accessLevel">Access Level</Label>
          <Select value={accessLevel} onValueChange={setAccessLevel}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select access level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="emailVerified"
          checked={emailVerified} // This checkbox will always be checked
          onChange={(e) => setEmailVerified(e.target.checked)} // Still allow changing if logic changes later
          className="h-4 w-4 text-primary rounded"
          disabled // Disable to reflect it's always verified
        />
        <Label htmlFor="emailVerified">Email Verified</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating User...
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Update User
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Broadcast Notification Form Component
function BroadcastNotificationForm({ onSubmit, onCancel, isLoading }) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"info" | "warning" | "success" | "error">("info")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) {
      console.error("Please fill in all required fields for the broadcast notification.")
      return
    }

    const notificationData: NotificationData = {
      title,
      message,
      type,
    }

    onSubmit(notificationData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Notification Title*</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter notification title"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Notification Type</Label>
        <Select value={type} onValueChange={(value: any) => setType(value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select notification type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message*</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message to all users"
          className="mt-1"
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">This message will be sent to all users in the system</p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Broadcast
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [accessLevelFilter, setAccessLevelFilter] = useState("all")

  // Dialog states
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null)

  // Message states
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    recentUsers: 0,
  })

  // Load users and statistics on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Filter users based on search and access level whenever users, searchTerm, or accessLevelFilter changes
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.User.toLowerCase().includes(searchTerm.toLowerCase()) || // Use user.User for username
          user.Email.toLowerCase().includes(searchTerm.toLowerCase()), // Use user.Email for email
      )
    }

    if (accessLevelFilter !== "all") {
      filtered = filtered.filter((user) => user.Access_level?.toLowerCase() === accessLevelFilter) // Use user.Access_level
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, accessLevelFilter])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timeoutId = setTimeout(() => {
        setSuccessMessage("")
        setErrorMessage("")
      }, 5000)
      return () => clearTimeout(timeoutId)
    }
  }, [successMessage, errorMessage])

  // Function to load all data (users and statistics)
  const loadData = async () => {
    setIsLoading(true)
    try {
      // fetchAllUsers now fetches from 'Employees'
      // getUserStatistics now fetches from 'Employees' and counts based on @inventure.mu
      const [usersData, statsData] = await Promise.all([fetchAllUsers(), getUserStatistics()])

      setUsers(usersData)
      setStats(statsData)
      setSearchTerm("");
      setAccessLevelFilter("all");
      setFilteredUsers(usersData);

      console.log("Fetched Users Data (from Employees):", usersData);
      console.log("Fetched User Statistics (from Employees):", statsData);

    } catch (error) {
      setErrorMessage("Failed to load data")
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handler for adding a new user (will create in both _User and Employees)
  const handleAddUser = async (userData: CreateUserData) => {
    setIsSaving(true)
    try {
      const newEmployee = await createUser(userData) // createUser now handles both
      setUsers((prev) => [...prev, newEmployee])
      setIsAddUserDialogOpen(false)
      setSuccessMessage(`User "${userData.username}" created successfully!`)
      loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsSaving(false)
    }
  }

  // Handler for updating an existing user (will update in both _User and Employees)
  const handleUpdateUser = async (userData: UpdateUserData) => {
    setIsSaving(true)
    try {
      const updatedEmployee = await updateUser(userData) // updateUser now handles both
      setUsers((prev) =>
        prev.map((user) => (user.objectId === updatedEmployee.objectId ? updatedEmployee : user)),
      )
      setIsEditDialogOpen(false)
      setUserToEdit(null)
      setSuccessMessage(`User "${updatedEmployee.User}" updated successfully!`) // Use updatedEmployee.User
      loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsSaving(false)
    }
  }

  // Handler for deleting a user (will delete from both _User and Employees)
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsSaving(true)
    try {
      // Pass the objectId from the Employee record, back4app-admin will find the _User by email
      await deleteUser(userToDelete.objectId)
      setUsers((prev) => prev.filter((user) => user.objectId !== userToDelete.objectId))
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      setSuccessMessage(`User "${userToDelete.User}" deleted successfully!`) // Use userToDelete.User
      loadData();
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsSaving(false)
    }
  }

  // Handler for sending a broadcast notification
  const handleBroadcastNotification = async (notificationData: NotificationData) => {
    setIsSaving(true)
    try {
      await sendBroadcastNotification(notificationData)
      setIsBroadcastDialogOpen(false)
      setSuccessMessage("Broadcast notification sent successfully!")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send notification")
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    document.execCommand('copy');
    setSuccessMessage("Copied to clipboard!")
  }

  // Helper function to get the appropriate badge for access level
  const getAccessLevelBadge = (accessLevel?: string) => {
    switch (accessLevel?.toLowerCase()) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>
      case "manager":
        return <Badge variant="default">Manager</Badge>
      case "employee":
        return <Badge variant="secondary">Employee</Badge>
      default:
        return <Badge variant="outline">User</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium">Loading admin settings...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Admin Settings
              </h1>
              <p className="text-muted-foreground">Manage users and system settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsBroadcastDialogOpen(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Broadcast
            </Button>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              {/* Assuming 'verified' concept maps to all @inventure.mu emails for now */}
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
              <p className="text-xs text-muted-foreground">Email verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminUsers}</div>
              <p className="text-xs text-muted-foreground">Admin access</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentUsers}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Management
                </CardTitle>
                <p className="text-muted-foreground">Manage all employees in the system</p>
              </div>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Levels</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm || accessLevelFilter !== "all"
                              ? "No employees match your filters"
                              : "No employees found"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => ( // 'user' here is actually an 'Employee' object
                      <TableRow key={user.objectId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg?height=32&width=32" />
                              <AvatarFallback className="text-xs">
                                {/* Generate first and last name initials from the 'User' field */}
                                {(() => {
                                  const nameParts = user.User.split(' ');
                                  if (nameParts.length > 1) {
                                    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                                  }
                                  return user.User.charAt(0).toUpperCase();
                                })()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.User}</div>
                              <div className="text-xs text-muted-foreground">ID: {user.objectId.slice(-8)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{user.Email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(user.Email)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getAccessLevelBadge(user.Access_level)}</TableCell>
                        <TableCell>
                          {/* emailVerified is not directly available from Employees class without explicit lookup to _User */}
                          <Badge variant={"secondary"}>Unverified</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{format(new Date(user.createdAt), "MMM d,yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(user.createdAt), "HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => copyToClipboard(user.objectId)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy ID
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(user.Email)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Copy Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToEdit(user)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Employee
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setUserToDelete(user)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Employee
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Employee
            </DialogTitle>
            <DialogDescription>
              Create a new employee account with a temporary password.
            </DialogDescription>
          </DialogHeader>
          <AddUserForm onSubmit={handleAddUser} onCancel={() => setIsAddUserDialogOpen(false)} isLoading={isSaving} />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {userToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Employee: {userToEdit.User}
              </DialogTitle>
              <DialogDescription>
                Modify employee details, access level, and optionally set a new password.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setUserToEdit(null)
              }}
              isLoading={isSaving}
              user={userToEdit}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Broadcast Notification Dialog */}
      <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Send Broadcast Notification
            </DialogTitle>
            <DialogDescription>
              Send a notification to all users in the system. This will create an in-app notification for each user.
            </DialogDescription>
          </DialogHeader>
          <BroadcastNotificationForm
            onSubmit={handleBroadcastNotification}
            onCancel={() => setIsBroadcastDialogOpen(false)}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee account for{" "}
              <strong>{userToDelete?.User}</strong> and remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

