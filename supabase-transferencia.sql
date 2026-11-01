-- ViWa · SQL para el pago por transferencia
-- Se puede correr más de una vez sin problemas.

-- Cómo pagó el cliente: Mercado Pago (link de pago) o transferencia manual
alter table pedidos add column if not exists metodo_pago text not null default 'mercadopago';

alter table pedidos drop constraint if exists pedidos_metodo_pago_check;
alter table pedidos
  add constraint pedidos_metodo_pago_check
  check (metodo_pago in ('mercadopago', 'transferencia'));

create index if not exists idx_pedidos_metodo_estado on pedidos (metodo_pago, estado);
