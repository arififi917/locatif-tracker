import { AppDataProvider } from './hooks/useAppData'
import { PeriodFilterProvider } from './hooks/usePeriodFilter'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <AppDataProvider>
      <PeriodFilterProvider>
        <AppShell />
      </PeriodFilterProvider>
    </AppDataProvider>
  )
}
