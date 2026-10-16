-- ViWa · SQL del panel de administración nuevo
-- Se puede correr más de una vez sin problemas.

-- 1. Estado "entregado" (reemplaza la regla anterior de estados)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.pedidos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%estado%'
  loop
    execute format('alter table public.pedidos drop constraint %I', c.conname);
  end loop;
end $$;

alter table pedidos
  add constraint pedidos_estado_check
  check (estado in ('pendiente', 'pagado', 'entregado', 'cancelado'));

-- 2. Número de pedido legible (#0001, #0002...)
alter table pedidos add column if not exists numero bigint generated always as identity;
create unique index if not exists idx_pedidos_numero on pedidos (numero);

-- 3. Nota interna de cada pedido
alter table pedidos add column if not exists nota text;

-- 4. Cuentas del panel
create table if not exists admin_usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null,
  rol text not null default 'operador' check (rol in ('admin', 'operador')),
  password_hash text not null,
  activo boolean not null default true,
  intentos_fallidos integer not null default 0,
  bloqueado_hasta timestamptz,
  ultimo_acceso timestamptz,
  creado_en timestamptz not null default now()
);
alter table admin_usuarios enable row level security;

-- 5. Historial de acciones manuales sobre cada pedido
create table if not exists pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  evento text not null,
  usuario text,
  creado_en timestamptz not null default now()
);
alter table pedido_eventos enable row level security;
create index if not exists idx_pedido_eventos_pedido on pedido_eventos (pedido_id, creado_en);
