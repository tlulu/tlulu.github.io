export default function WorkDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-3xl sm:max-w-4xl mx-auto w-full px-6 py-12 sm:px-8 md:px-12 md:py-16">
      {children}
    </main>
  );
}
