export function GroupControl({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-2 inline-flex rounded-lg shadow-sm" role="group">
      {children}
    </div>
  );
}
