"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, AlertCircle } from "lucide-react"
import Parse from 'parse' // Import the Parse SDK

// Initialize Parse with your Back4App credentials
// It's generally better to do this in a higher-level component like _app.tsx
// or a dedicated utility file to avoid re-initialization.
if (!Parse.applicationId) { // Prevent re-initialization if hot-reloading
  Parse.initialize("QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw", "jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS");
  Parse.serverURL = 'https://parseapi.back4app.com/'; // Standard Back4App server URL
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      // Authenticating with Back4App using Parse.User.logIn().
      // This method authenticates against the built-in '_User' class.
      // Your 'Employees' schema's 'Email' and 'Password' fields are assumed
      // to correspond to the email and password used for the '_User' class.
      // Ensure 'Email Login' is enabled for the '_User' class in your Back4App dashboard
      // if you intend to use email addresses for login.
      const user = await Parse.User.logIn(email, password);
      console.log('User logged in successfully:', user);

      // Keep this localStorage item for backward compatibility with your dashboard's initial check,
      // although Parse SDK handles session management internally using current user.
      localStorage.setItem("inventureLoggedIn", "true");

      // Redirect to dashboard on successful login
      router.push("/dashboard")
    } catch (parseError) {
      // Handle Parse errors (e.g., wrong credentials, network issues).
      // parseError.message will contain the specific error from Back4App.
      console.error('Error during Back4App login:', parseError);
      setError(parseError.message || "An unexpected error occurred during login. Please try again.");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
        </div>

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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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
  )
}

