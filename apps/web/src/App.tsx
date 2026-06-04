import { APP_NAME } from "@myclawteam/shared";

const readinessItems = [
  "React frontend workspace",
  "Tailwind design pipeline",
  "Express API workspace",
  "Shared TypeScript contracts"
];

export function App() {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-meadow">
            Repository initialized
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">{APP_NAME}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            The monorepo is ready for the image workflow: frontend, backend, and shared TypeScript
            contracts are wired together for the next implementation issues.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {readinessItems.map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-2 w-12 rounded-full bg-coral" />
              <p className="mt-4 font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
