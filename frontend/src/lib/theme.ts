import { useState, useEffect } from "react"

type Theme = "dark" | "light" | "system"

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system"
  return (localStorage.getItem("theme") as Theme) || "system"
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return
  localStorage.setItem("theme", theme)
  applyTheme(theme)
}

export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return
  
  const root = window.document.documentElement
  
  root.classList.remove("light", "dark")
  
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    setThemeState(newTheme)
  }
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    updateTheme(newTheme)
  }
  
  const setSystemTheme = () => {
    updateTheme("system")
  }
  
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])
  
  return { 
    theme, 
    setTheme: updateTheme,
    toggleTheme, 
    setSystemTheme 
  }
}