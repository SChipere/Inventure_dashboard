"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Alert,
  IconButton,
  Box,
  Link,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import Parse from 'parse'

// Initialize Parse if not already initialized
if (!Parse.applicationId) {
  Parse.initialize("QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw", "jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS");
  Parse.serverURL = 'https://parseapi.back4app.com/';
}

// Create a custom Material UI theme
const theme = createTheme({
  shape: {
    borderRadius: 12, // Apply a global border radius for rounded corners
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // More pronounced rounding for the card
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Slightly less rounded for buttons than card
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8, // Rounded corners for text fields
          },
        },
      },
    },
  },
});

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Effect to check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const currentUser = Parse.User.current();
        if (currentUser) {
          await currentUser.fetch();
          const storedLoginTime = localStorage.getItem("inventureLoginTime");
          if (storedLoginTime) {
            const loginTimestamp = parseInt(storedLoginTime, 10);
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - loginTimestamp > oneHour) {
              await Parse.User.logOut();
              localStorage.removeItem("inventureLoginTime");
              console.log("Session expired. User logged out.");
              setIsLoading(false);
              return;
            }
          }

          console.log("User already logged in:", currentUser.get('username') || currentUser.get('email'));
          const accessLevel = currentUser.get("Acess_level");
          if (accessLevel === "Admin") {
            router.replace("/dashboard");
          } else {
            router.replace("/employee-dashboard");
          }
        }
      } catch (err) {
        console.error("Error checking session or session expired:", err);
        await Parse.User.logOut();
        localStorage.removeItem("inventureLoginTime");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // Effect to disable browser back button
  useEffect(() => {
    // Push a new state to the history stack to prevent going back to the previous page
    // This effectively makes the login page the "first" page in the history for this session
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', function(event) {
      // On popstate (when back button is pressed), push the current state again
      // to keep the user on the login page.
      window.history.pushState(null, document.title, window.location.href);
    });

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', () => {});
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

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
      const user = await Parse.User.logIn(email, password)
      console.log("User logged in successfully:", user)

      localStorage.setItem("inventureLoginTime", Date.now().toString());

      const currentUser = await Parse.User.currentAsync()
      const accessLevel = currentUser?.get("Acess_level")

      console.log("User access level:", accessLevel)

      if (accessLevel === "Admin") {
        router.push("/dashboard")
      } else {
        router.push("/employee-dashboard")
      }

    } catch (parseError) {
      console.error("Error during Back4App login:", parseError)
      setError(parseError.message || "An unexpected error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const currentYear = new Date().getFullYear();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#EEF6FF",
        }}
      >
        {/* Navbar with Logo */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "white",
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <img src="/Inventurelogo1.png" alt="Inventure Logo" style={{ height: 32, width: "auto" }} />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column", // Changed to column to stack elements vertically
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            gap: 2, // Added gap between cards
          }}
        >
          <Card
            sx={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: "white",
              boxShadow: 3,
            }}
          >
            <CardHeader
              title={<Typography variant="h5" component="div" align="center" sx={{ fontWeight: 'bold' }}>Inventure Dashboard Login</Typography>}
              sx={{ pt: 3 }}
            />

            <CardContent>
              {error && (
                <Alert severity="error" icon={<AlertCircle fontSize="inherit" />} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="name.lastname@inventure.mu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                />

                <TextField
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </IconButton>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link component="button" variant="body2" onClick={() => console.log("Forgot password clicked")}>
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading}
                  sx={{ mt: 2, backgroundColor: '#01739d', '&:hover': { backgroundColor: '#005f7c' } }}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>

            <CardActions sx={{ flexDirection: "column", pb: 3 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                <span>Don't have an account? </span>
                <Link component="button" variant="body2" onClick={() => console.log("Contact administrator clicked")}>
                  Contact your administrator
                </Link>
              </Typography>
            </CardActions>
          </Card>

          <Box sx={{ mt: 0, textAlign: "center", width: '100%', maxWidth: 400 }}>
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Inventure Inc. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

