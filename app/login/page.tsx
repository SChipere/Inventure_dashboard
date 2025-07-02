"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, AlertCircle, Eye, EyeOff } from "lucide-react"
import Parse from 'parse'

// Initialize Parse if not already initialized
if (!Parse.applicationId) {
  Parse.initialize("QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw", "jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS");
  Parse.serverURL = 'https://parseapi.back4app.com/';
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true) // Start loading

    try {
      // Attempt to log in with Parse
      const user = await Parse.User.logIn(email, password)
      console.log("User logged in successfully:", user)

      // Set a flag in local storage for persistent login state
      localStorage.setItem("inventureLoggedIn", "true")

      // Fetch the current user to get custom fields like 'Acess_level'
      const currentUser = await Parse.User.currentAsync()
      const accessLevel = currentUser?.get("Acess_level")

      console.log("User access level:", accessLevel)

      // Redirect based on access level
      if (accessLevel === "Admin") {
        router.push("/dashboard")
      } else {
        router.push("/employee-dashboard")
      }

    } catch (parseError) {
      // Handle Parse specific errors
      console.error("Error during Back4App login:", parseError)
      setError(parseError.message || "An unexpected error occurred during login. Please try again.")
    } finally {
      setIsLoading(false) // End loading
    }
  }

  // Toggle password visibility in the input field
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-background/95">
      {/* Navbar with Logo */}
      <nav className="w-full bg-background/80 backdrop-blur-sm border-b p-4 flex items-center justify-start">
        <img src="/Inventurelogo1.png" alt="Inventure Logo" className="h-8 w-auto" />
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Removed the old briefcase icon div to replace with the logo in navbar */}
          {/* <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-4">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
          </div> */}

          <Card className="backdrop-blur-sm bg-card/50 border-muted">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Inventure Dashboard</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="p-0 h-auto text-xs" type="button">
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 h-full px-3 flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  style={{ backgroundColor: '#01739d' }} // Apply custom background color
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                <span>Don't have an account? </span>
                <Button variant="link" className="p-0 h-auto" type="button">
                  Contact your administrator
                </Button>
              </div>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Inventure Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
