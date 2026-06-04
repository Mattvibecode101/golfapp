-- ==========================================
-- EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- PROFILES (extends auth.users 1:1)
-- ==========================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  phone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ==========================================
-- GOLF COURSES
-- ==========================================
create table public.golf_courses (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  address         text,
  city            text not null,
  country         text not null default 'South Africa',
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  holes           smallint not null default 18 check (holes in (9, 18, 27, 36)),
  par             smallint not null,
  green_fee_min   numeric(10,2) not null,
  green_fee_max   numeric(10,2) not null,
  phone           text,
  website         text,
  image_url       text,
  rating          numeric(2,1) check (rating >= 0 and rating <= 5),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_golf_courses_city    on public.golf_courses(city);
create index idx_golf_courses_active  on public.golf_courses(is_active);
create index idx_golf_courses_search  on public.golf_courses
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(city,'') || ' ' || coalesce(description,'')));

create trigger golf_courses_updated_at
  before update on public.golf_courses
  for each row execute procedure public.set_updated_at();

-- ==========================================
-- TEE TIMES
-- ==========================================
create table public.tee_times (
  id               uuid primary key default uuid_generate_v4(),
  course_id        uuid not null references public.golf_courses(id) on delete cascade,
  date             date not null,
  time             time not null,
  max_players      smallint not null default 4 check (max_players between 1 and 4),
  available_slots  smallint not null,
  price_per_player numeric(10,2) not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (course_id, date, time)
);

create index idx_tee_times_course_date on public.tee_times(course_id, date);
create index idx_tee_times_date        on public.tee_times(date);
create index idx_tee_times_active      on public.tee_times(is_active);

create trigger tee_times_updated_at
  before update on public.tee_times
  for each row execute procedure public.set_updated_at();

-- ==========================================
-- BOOKINGS
-- ==========================================
create type public.booking_status as enum ('confirmed', 'cancelled');

create table public.bookings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tee_time_id  uuid not null references public.tee_times(id) on delete restrict,
  players      smallint not null check (players between 1 and 4),
  total_price  numeric(10,2) not null,
  status       public.booking_status not null default 'confirmed',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_bookings_user_id     on public.bookings(user_id);
create index idx_bookings_tee_time_id on public.bookings(tee_time_id);
create index idx_bookings_status      on public.bookings(status);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- ==========================================
-- DECREMENT AVAILABLE SLOTS ON BOOKING
-- ==========================================
create or replace function public.handle_booking_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    if (select available_slots from public.tee_times where id = new.tee_time_id) < new.players then
      raise exception 'Not enough available slots';
    end if;
    update public.tee_times
      set available_slots = available_slots - new.players
      where id = new.tee_time_id;

  elsif TG_OP = 'UPDATE' then
    if new.status = 'cancelled' and old.status = 'confirmed' then
      update public.tee_times
        set available_slots = available_slots + old.players
        where id = old.tee_time_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_booking_change
  after insert or update on public.bookings
  for each row execute procedure public.handle_booking_change();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.golf_courses enable row level security;

create policy "Anyone can view active courses"
  on public.golf_courses for select
  using (is_active = true);

alter table public.tee_times enable row level security;

create policy "Anyone can view active tee times"
  on public.tee_times for select
  using (is_active = true and date >= current_date);

alter table public.bookings enable row level security;

create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can create own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);
