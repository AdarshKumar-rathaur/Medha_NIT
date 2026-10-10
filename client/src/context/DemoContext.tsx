import React, { createContext, useContext, useState } from 'react'
import { ApiClient } from '@/api/client'

interface DemoContextType {
  isDemoMode: boolean
  toggleDemoMode: () => void
  locality: string
  setLocality: (loc: string) => void
  currentScenario: {
    time: string
    day: string
    temperature: string
    weather: string
    minutesAvailable: number
  }
  updateScenarioTime: (timeStr: string) => void
  resetDemoData: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('dos_demo_mode') === 'true'
  })
  const [locality, setLocality] = useState<string>('Koramangala')
  const [scenario, setScenario] = useState({
    time: '1:15 PM',
    day: 'Tuesday',
    temperature: '33°C',
    weather: 'Sunny',
    minutesAvailable: 20,
  })

  // Synchronize ApiClient mode
  React.useEffect(() => {
    ApiClient.setDemoMode(isDemoMode)
    localStorage.setItem('dos_demo_mode', String(isDemoMode))
  }, [isDemoMode])

  // Fetch live Bangalore telemetry on mount
  React.useEffect(() => {
    async function syncLiveContext() {
      try {
        const tel = await ApiClient.getLiveTelemetry()
        if (tel) {
          setScenario({
            time: tel.time_formatted || '1:15 PM',
            day: tel.day_of_week || 'Tuesday',
            temperature: `${tel.temp_c || 33}°C`,
            weather: tel.condition ? (tel.condition.charAt(0).toUpperCase() + tel.condition.slice(1)) : 'Sunny',
            minutesAvailable: 25,
          })
        }
      } catch {}
    }
    syncLiveContext()
  }, [])

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev)
  }

  const updateScenarioTime = (timeStr: string) => {
    setScenario((prev) => ({ ...prev, time: timeStr }))
  }

  const resetDemoData = () => {
    localStorage.removeItem('dos_customers')
    localStorage.removeItem('dos_merchants')
    localStorage.removeItem('dos_catalog')
    localStorage.removeItem('dos_offers')
    localStorage.removeItem('dos_recommendations')
    localStorage.removeItem('dos_redemptions')
    localStorage.removeItem('dos_notifications')
    window.location.reload()
  }

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        toggleDemoMode,
        locality,
        setLocality,
        currentScenario: scenario,
        updateScenarioTime,
        resetDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export const useDemo = () => {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}
