export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">{subtitle}</p>
      {children}
    </div>
  );
}