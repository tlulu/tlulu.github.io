export default function FunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-lg mx-auto w-full px-6 py-12 sm:px-8 md:py-16">
      {children}
    </main>
  );
}
