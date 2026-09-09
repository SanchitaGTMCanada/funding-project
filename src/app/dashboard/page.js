export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Funding Dashboard
            </h1>

            <p className="text-sm text-gray-500">
              Funding services management
            </p>
          </div>

          <a
            href="/login"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Employee Login
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Funding Services
          </h2>

          <p className="text-gray-500">
            Funding service information will appear here.
          </p>
        </div>
      </section>
    </main>
  );
}