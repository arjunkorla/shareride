export function PermissionDenied({ permission }: { permission?: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      <p className="font-semibold">You don&apos;t have permission to view this page.</p>
      {permission && <p className="mt-1 text-xs text-amber-700">Requires: {permission}</p>}
    </div>
  )
}
