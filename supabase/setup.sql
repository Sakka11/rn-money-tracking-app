-- ============================================================
-- Money Tracking App - Supabase Setup (เวอร์ชันมีระบบ Auth ผูกผู้ใช้)
-- รันใน Supabase Dashboard > SQL Editor (รันซ้ำได้ปลอดภัย)
--
-- ** สำคัญ: ไปที่ Authentication > Sign In / Providers > Email
--    แล้ว "ปิด Confirm email" เพื่อให้สมัครแล้วเข้าใช้งานได้ทันที
-- ============================================================

-- 1) ตารางรายการเงินเข้า/ออก ----------------------------------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  detail      text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  type        text not null check (type in ('income', 'expense')),
  tx_date     date not null,
  image_url   text,
  user_id     uuid references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- เผื่อกรณีตารางมีอยู่ก่อนแล้ว (เวอร์ชันเดิมยังไม่มี user_id)
alter table public.transactions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- ให้ user_id เซ็ตเป็นผู้ใช้ที่ล็อกอินอัตโนมัติเมื่อ insert
alter table public.transactions
  alter column user_id set default auth.uid();

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, tx_date desc, created_at desc);

-- 2) RLS: แต่ละคนเห็น/แก้ได้เฉพาะรายการของตัวเอง ----------------
alter table public.transactions enable row level security;

drop policy if exists "allow all on transactions" on public.transactions;
drop policy if exists "tx owner all" on public.transactions;

create policy "tx owner all"
  on public.transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) เปิด Realtime ให้ตาราง transactions (กันรันซ้ำ error 42710) ----
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end $$;

-- ============================================================
-- 4) ตารางโปรไฟล์ ผูกกับผู้ใช้ (1 แถวต่อ 1 user)
-- ============================================================
-- ลบตารางโปรไฟล์เวอร์ชันเดิม (แถวเดียว id = 1) ทิ้ง
drop table if exists public.profile;

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "allow all on profile" on public.profiles;
drop policy if exists "profiles owner all" on public.profiles;

create policy "profiles owner all"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- 5) สร้างแถวโปรไฟล์อัตโนมัติเมื่อมีผู้ใช้สมัครใหม่ ----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Storage bucket: สลิป + รูปโปรไฟล์ -------------------------
insert into storage.buckets (id, name, public)
values ('tx_slips', 'tx_slips', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- อ่านได้สาธารณะ (bucket เป็น public) แต่เขียน/ลบต้องล็อกอิน
drop policy if exists "tx_slips read"   on storage.objects;
drop policy if exists "tx_slips insert" on storage.objects;
drop policy if exists "tx_slips delete" on storage.objects;
drop policy if exists "avatars read"    on storage.objects;
drop policy if exists "avatars insert"  on storage.objects;
drop policy if exists "avatars delete"  on storage.objects;

create policy "tx_slips read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'tx_slips');

create policy "tx_slips insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'tx_slips');

create policy "tx_slips delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tx_slips');

create policy "avatars read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "avatars delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');

-- 7) รีโหลด schema cache (กัน error PGRST205) -----------------
notify pgrst, 'reload schema';
