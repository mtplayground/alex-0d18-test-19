import { GalleryBoard } from "./pages/GalleryBoard";

export function App() {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-6 lg:py-12">
        <GalleryBoard />
      </section>
    </main>
  );
}
