import { UploadDropzone } from "./components/UploadDropzone";

export function App() {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 sm:px-6 lg:py-12">
        <UploadDropzone />
      </section>
    </main>
  );
}
