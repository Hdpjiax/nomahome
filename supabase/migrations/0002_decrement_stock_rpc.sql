-- ============================================================================
-- 0002 — RPC atómico de descuento de stock.
--
-- Lo llama SOLO el service role desde lib/payments/confirm.ts, dentro del
-- flujo idempotente de pago aprobado. EXECUTE se revoca a anon y
-- authenticated: un cliente jamás puede descontar stock por su cuenta.
-- ============================================================================

create or replace function public.decrement_variant_stock(
  p_variant_id uuid,
  p_qty integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'p_qty debe ser entero positivo';
  end if;

  update public.product_variants
  set stock = greatest(stock - p_qty, 0)
  where id = p_variant_id;
end;
$$;

revoke execute on function public.decrement_variant_stock(uuid, integer)
  from anon, authenticated;
