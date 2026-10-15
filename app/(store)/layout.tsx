import { StoreFooter, StoreHeader } from '@/components/store/Chrome';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <StoreHeader />
      <main id="contenido" className="flex-1 pt-16">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
}
