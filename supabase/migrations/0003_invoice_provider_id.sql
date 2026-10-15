-- ============================================================================
-- 0003 — id de la factura en Facturapi.
--
-- El UUID es el folio fiscal del SAT; el id de Facturapi es el que se usa
-- para cancelar, reenviar y pedir URLs firmadas de PDF/XML. Sin llave de
-- Facturapi la tabla guarda el estado 'requested' sin inventar folios.
-- ============================================================================

alter table public.invoices add column provider_invoice_id text unique;
