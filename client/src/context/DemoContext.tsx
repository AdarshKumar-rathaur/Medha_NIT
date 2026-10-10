import React, { createContext, useContext, useState } from 'react'

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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true)
  const [locality, setLocality] = useState<string>('Koramangala')
  const [scenario, setScenario] = useState({
    time: '1:15 PM',
    day: 'Tuesday',
    temperature: '33°C',
    weather: 'Sunny',
    minutesAvailable: 20,
  })

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
