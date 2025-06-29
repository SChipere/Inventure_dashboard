"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("inventureLoggedIn")

    if (!isLoggedIn) {
      // Redirect to login page if not logged in
      router.push("/login")
    } else {
      // Redirect to dashboard if already logged in
      router.push("/dashboard")
    }
  }, [router])

  return null
}
