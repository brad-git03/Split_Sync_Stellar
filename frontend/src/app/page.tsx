import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-start bg-obsidian min-h-screen">
      <main className="flex-1 w-full max-w-6xl py-12">
        <Dashboard />
      </main>
    </div>
  );
}
