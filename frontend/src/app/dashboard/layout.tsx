import { redirect } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 w-full flex flex-col items-center">
      {/* We could add a dashboard-specific sidebar or subnav here in the future */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
