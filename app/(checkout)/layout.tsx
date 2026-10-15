import { StoreFooter, StoreHeader } from '@/components/store/Chrome';

/**
 * Layout de compra (carrito, checkout, pedido): mismos header y footer de
 * la tienda — el comprador no sale del sitio (§8).
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
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
