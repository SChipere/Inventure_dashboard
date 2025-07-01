"use client"

import type React from "react"
import { useState, useEffect } from "react"
// Removed: import { useRouter } from "next/navigation" as it caused compilation error in this environment
// For navigation, we will use window.history or window.location directly.

import {
  User,
  Lock,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
  Shield,
  Calendar,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
// The following imports from "@/lib/back4app" are assumed to interact with the globally loaded Parse SDK.
// Their implementation is not provided, so we assume they work correctly with window.Parse.
// import {
//   getCurrentUser,
//   updateUserProfile,
//   changePassword,
//   checkUsernameAvailability,
//   checkEmailAvailability,
//   type User as UserType,
// } from "@/lib/back4app"

// Define a placeholder UserType as the original import is from an external lib not available
// This UserType is based on the provided Back4app schema for _User
type UserType = {
  objectId: string;
  createdAt: string;
  updatedAt: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  Acess_level?: string;
  // Add other fields from your Parse User schema if needed in the frontend
};

// Placeholder for Parse interactions. In a real application, these would be in "@/lib/back4app.ts"
// and would use the 'Parse' object provided by the SDK.
// We're making them global-aware here for demonstration in this environment.
declare global {
  interface Window {
    Parse: any;
  }
}

// These functions should ideally come from "@/lib/back4app"
// For this environment, we are defining them here to ensure functionality with dynamically loaded Parse.
const getCurrentUser = async (): Promise<UserType | null> => {
  if (typeof window === 'undefined' || !window.Parse) {
    console.error("Parse SDK not available to getCurrentUser.");
    return null;
  }
  try {
    const currentUser = window.Parse.User.current();
    if (currentUser) {
      // Fetch the latest data for the current user
      await currentUser.fetch();
      // Map Parse user object to our UserType
      return {
        objectId: currentUser.id,
        createdAt: currentUser.createdAt.toISOString(),
        updatedAt: currentUser.updatedAt.toISOString(),
        username: currentUser.get('username'),
        email: currentUser.get('email'),
        emailVerified: currentUser.get('emailVerified'),
        Acess_level: currentUser.get('Acess_level'),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting current Parse user:", error);
    return null;
  }
};

const updateUserProfile = async (objectId: string, updateData: Partial<UserType>): Promise<UserType> => {
  if (typeof window === 'undefined' || !window.Parse) {
    throw new Error("Parse SDK not available to updateUserProfile.");
  }
  try {
    const user = new window.Parse.User();
    user.set('objectId', objectId);

    for (const key in updateData) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        user.set(key, updateData[key]);
      }
    }
    await user.save();
    await user.fetch(); // Fetch updated user to get latest data
    return {
      objectId: user.id,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      username: user.get('username'),
      email: user.get('email'),
      emailVerified: user.get('emailVerified'),
      Acess_level: user.get('Acess_level'),
    };
  } catch (error: any) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

const changePassword = async (objectId: string, currentPassword: string, newPassword: string): Promise<void> => {
  if (typeof window === 'undefined' || !window.Parse) {
    throw new Error("Parse SDK not available to changePassword.");
  }
  try {
    const user = window.Parse.User.current();
    if (!user || user.id !== objectId) {
      throw new Error("Not authorized to change this user's password.");
    }

    // First, verify the current password by attempting to log in with it.
    // Use the username from the current user object for re-authentication.
    // This will throw an error if the current password is wrong,
    // which will be caught by the try/catch block.
    await window.Parse.User.logIn(user.get('username'), currentPassword);

    // If logIn is successful, it means the currentPassword is correct.
    // Now, set the new password on the *current* user object and save it.
    user.set("password", newPassword);
    await user.save(); // This saves the changes to the user object on Parse Server.

  } catch (error: any) {
    // Catch specific Parse error code for invalid login (incorrect password)
    if (error.code === 101) {
      throw new Error("Incorrect current password provided.");
    }
    throw new Error(`Failed to change password: ${error.message}`);
  }
};

const checkUsernameAvailability = async (username: string, currentUserId: string): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.Parse) {
    console.error("Parse SDK not available to checkUsernameAvailability.");
    return false;
  }
  try {
    const query = new window.Parse.Query(window.Parse.User);
    query.equalTo('username', username);
    const users = await query.find();
    // Username is available if no users are found, or if the only user found is the current user
    return users.length === 0 || (users.length === 1 && users[0].id === currentUserId);
  } catch (error: any) {
    console.error("Error checking username availability:", error);
    return false;
  }
};

const checkEmailAvailability = async (email: string, currentUserId: string): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.Parse) {
    console.error("Parse SDK not available to checkEmailAvailability.");
    return false;
  }
  try {
    const query = new window.Parse.Query(window.Parse.User);
    query.equalTo('email', email);
    const users = await query.find();
    // Email is available if no users are found, or if the only user found is the current user
    return users.length === 0 || (users.length === 1 && users[0].id === currentUserId);
  } catch (error: any) {
    console.error("Error checking email availability:", error);
    return false;
  }
};


export default function ProfilePage() {
  // Removed useRouter as it's not compatible with this environment
  // const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeSection, setActiveSection] = useState<"profile" | "password">("profile")

  // Validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // Message states
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")


  // Dynamically load Parse SDK
  useEffect(() => {
    const loadParseSDK = () => {
      if (typeof window !== 'undefined' && !window.Parse) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/parse/dist/parse.min.js';
        script.onload = () => {
          if (!window.Parse.applicationId) { // Initialize only once
            window.Parse.initialize("QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw", "jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS");
            window.Parse.serverURL = 'https://parseapi.back4app.com/';
            console.log("Parse SDK initialized.");
          }
          fetchUserData(); // Fetch user data after Parse is ready
        };
        script.onerror = (e) => {
          console.error("Failed to load Parse SDK:", e);
          setIsLoading(false);
          setErrorMessage("Failed to load necessary components. Please refresh.");
        };
        document.body.appendChild(script);
      } else if (typeof window !== 'undefined' && window.Parse) {
        // Parse is already loaded, proceed to fetch data
        fetchUserData();
      } else {
        setIsLoading(false);
        setErrorMessage("Environment not supported for Parse SDK loading.");
      }
    };

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser(); // Using our helper function
        if (!currentUser) {
          // If no current user, we might want to redirect or show a login prompt.
          // For this environment, we'll log and show error.
          console.log("No current user, redirecting to login (simulated)...");
          // In a Next.js app, you'd use router.push("/login");
          window.location.href = "/login"; // Simulate redirect
          return;
        }
        setUser(currentUser);
        setUsername(currentUser.username);
        setEmail(currentUser.email);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setErrorMessage("Failed to load user profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadParseSDK();

    // Cleanup function for useEffect (optional for scripts appended to body)
    return () => {
      if (typeof window !== 'undefined') {
        const script = document.querySelector('script[src="https://unpkg.com/parse/dist/parse.min.js"]');
        if (script) {
          // script.remove(); // Uncomment if you want to remove the script on component unmount
        }
      }
    };
  }, []);


  // Check username availability with debounce
  useEffect(() => {
    if (!user || username === user.username) { // Only check if username changed from initial or is empty
      setUsernameAvailable(null) // Reset availability if no change or empty
      return
    }

    if (username.length < 3) {
      setUsernameAvailable(false); // Consider too short as unavailable for validation
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true)
      try {
        // Ensure Parse is loaded before attempting checkUsernameAvailability
        if (typeof window !== 'undefined' && window.Parse) {
          const available = await checkUsernameAvailability(username, user.objectId) // Using our helper function
          setUsernameAvailable(available)
        } else {
          setUsernameAvailable(null); // Parse not ready
          console.warn("Parse SDK not ready for username availability check.");
        }
      } catch (error) {
        console.error("Error checking username:", error)
        setUsernameAvailable(null)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username, user])

  // Check email availability with debounce
  useEffect(() => {
    if (!user || email === user.email) { // Only check if email changed from initial or is empty
      setEmailAvailable(null) // Reset availability if no change or empty
      return
    }

    if (!email.includes("@") || !email.includes(".")) { // Basic email format check
        setEmailAvailable(false); // Consider invalid format as unavailable
        return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingEmail(true)
      try {
        // Ensure Parse is loaded before attempting checkEmailAvailability
        if (typeof window !== 'undefined' && window.Parse) {
          const available = await checkEmailAvailability(email, user.objectId) // Using our helper function
          setEmailAvailable(available)
        } else {
          setEmailAvailable(null); // Parse not ready
          console.warn("Parse SDK not ready for email availability check.");
        }
      } catch (error) {
        console.error("Error checking email:", error)
        setEmailAvailable(null)
      } finally {
        setIsCheckingEmail(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [email, user])

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

  // Validate password
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    }
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
        setErrorMessage("User not loaded.");
        return;
    }

    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const updateData: Partial<UserType> = {}

      let hasChanges = false;

      if (username !== user.username) {
        if (usernameAvailable !== true) { // Explicitly check for true, not just null/false
          throw new Error("Username is not available or still being checked.");
        }
        updateData.username = username;
        hasChanges = true;
      }

      if (email !== user.email) {
        if (emailAvailable !== true) { // Explicitly check for true, not just null/false
          throw new Error("Email is not available or still being checked.");
        }
        updateData.email = email;
        hasChanges = true;
      }

      if (!hasChanges) {
        setErrorMessage("No changes to save");
        return;
      }

      const updatedUser = await updateUserProfile(user.objectId, updateData) // Using our helper function
      setUser(updatedUser) // Update local state with the returned updated user
      setSuccessMessage("Profile updated successfully!");
      // Re-fetch user data to ensure all fields are fresh, including updatedDates
      const reFetchedUser = await getCurrentUser();
      if(reFetchedUser) setUser(reFetchedUser);

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
        setErrorMessage("User not loaded.");
        return;
    }

    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      if (!currentPassword) {
        throw new Error("Current password is required")
      }

      if (!newPassword) {
        throw new Error("New password is required")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match")
      }

      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        throw new Error("New password does not meet security requirements")
      }

      await changePassword(user.objectId, currentPassword, newPassword) // Using our helper function

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setSuccessMessage("Password changed successfully!")
       // Re-fetch user data to ensure all fields are fresh, including updatedDates
       const reFetchedUser = await getCurrentUser();
       if(reFetchedUser) setUser(reFetchedUser);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium">Loading profile...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Should not happen if redirect works, but as a fallback
  }

  const passwordValidation = validatePassword(newPassword)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}> {/* Changed router.back() */}
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
          </div>
          <Avatar className="h-12 w-12">
            <AvatarImage src="/placeholder.svg?height=48&width=48" />
            <AvatarFallback className="text-lg">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" />
                  <AvatarFallback className="text-2xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl truncate">{user.username}</CardTitle> {/* Added truncate */}
                <p className="text-muted-foreground truncate">{user.email}</p> {/* Added truncate */}
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                  {user.Acess_level && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      {user.Acess_level}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(user.createdAt), "MMM d,yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span>Last updated {format(new Date(user.updatedAt), "MMM d,yyyy")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="mt-4">
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Button
                    variant={activeSection === "profile" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection("profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile Information
                  </Button>
                  <Button
                    variant={activeSection === "password" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection("password")}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <p className="text-muted-foreground">Update your account details and personal information</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Username Field */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username"
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {!isCheckingUsername && usernameAvailable === true && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {!isCheckingUsername && usernameAvailable === false && <X className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      {username !== user.username && (
                        <p className="text-sm text-muted-foreground">
                          {usernameAvailable === false && "Username is already taken"}
                          {usernameAvailable === true && "Username is available"}
                          {usernameAvailable === null && username.length >= 3 && "Checking availability..."}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isCheckingEmail && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {!isCheckingEmail && emailAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                          {!isCheckingEmail && emailAvailable === false && <X className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      {email !== user.email && (
                        <p className="text-sm text-muted-foreground">
                          {emailAvailable === false && "Email is already in use"}
                          {emailAvailable === true && "Email is available"}
                          {emailAvailable === null && email.includes("@") && "Checking availability..."}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <Button
                      type="submit"
                      disabled={
                        isSaving ||
                        (username === user.username && email === user.email) ||
                        (username !== user.username && usernameAvailable !== true) ||
                        (email !== user.email && emailAvailable !== true)
                      }
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "password" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <p className="text-muted-foreground">Update your password to keep your account secure</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Password Requirements */}
                      {newPassword && (
                        <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium">Password Requirements:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                            <div
                              className={`flex items-center gap-1 ${passwordValidation.minLength ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {passwordValidation.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              At least 8 characters
                            </div>
                            <div
                              className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {passwordValidation.hasUpperCase ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Uppercase letter
                            </div>
                            <div
                              className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {passwordValidation.hasLowerCase ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Lowercase letter
                            </div>
                            <div
                              className={`flex items-center gap-1 ${passwordValidation.hasNumbers ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {passwordValidation.hasNumbers ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Number
                            </div>
                            <div
                              className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {passwordValidation.hasSpecialChar ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Special character
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-sm text-red-500">Passwords do not match</p>
                      )}
                    </div>

                    <Separator />

                    <Button
                      type="submit"
                      disabled={
                        isSaving ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword ||
                        !passwordValidation.isValid
                      }
                      className="w-full"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

