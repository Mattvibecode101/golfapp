-- ==========================================
-- SEED: GOLF COURSES
-- ==========================================
insert into public.golf_courses
  (id, name, description, address, city, country, holes, par,
   green_fee_min, green_fee_max, phone, website, image_url, rating)
values
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Steenberg Golf Club',
  'A stunning parkland course set against the Constantiaberg mountains in the winelands of Cape Town. The 18-hole course offers challenging fairways and breathtaking views.',
  'Steenberg Estate, Tokai Road',
  'Cape Town',
  'South Africa',
  18, 72,
  650.00, 950.00,
  '+27 21 713 2233',
  'https://www.steenberggolfclub.co.za',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&auto=format&fit=crop',
  4.7
),
(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Fancourt Golf Resort',
  'Home to three championship courses including the iconic Links course, host of the 2003 Presidents Cup. World-class facilities in the Garden Route.',
  'Montagu Street, Blanco',
  'George',
  'South Africa',
  18, 72,
  1200.00, 2200.00,
  '+27 44 804 0010',
  'https://www.fancourt.co.za',
  'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&auto=format&fit=crop',
  4.9
),
(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Royal Johannesburg & Kensington',
  'One of South Africa''s oldest clubs, comprising two 18-hole courses: the East and West Course. A historic parkland layout with mature trees.',
  'Fairway Avenue, Linksfield North',
  'Johannesburg',
  'South Africa',
  18, 72,
  500.00, 750.00,
  '+27 11 640 3021',
  'https://www.royaljk.co.za',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&auto=format&fit=crop',
  4.5
),
(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'Pearl Valley Golf Estates',
  'Ranked among Africa''s top 10 courses, this Jack Nicklaus Signature Design winds through Paarl''s wine country with spectacular mountain backdrops.',
  'R301, Val de Vie Estate',
  'Paarl',
  'South Africa',
  18, 72,
  850.00, 1350.00,
  '+27 21 867 8000',
  'https://www.pearlvalley.co.za',
  'https://images.unsplash.com/photo-1611095562057-9ec1e419b14f?w=800&auto=format&fit=crop',
  4.8
),
(
  'a1b2c3d4-0005-0005-0005-000000000005',
  'Leopard Creek Country Club',
  'Bordering Kruger National Park, wildlife roams freely alongside golfers on this exclusive course. Designed by Gary Player and rated one of the world''s best.',
  'Malelane Gate Road',
  'Malelane',
  'South Africa',
  18, 72,
  2500.00, 3500.00,
  '+27 13 791 0000',
  'https://www.leopardcreek.co.za',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&auto=format&fit=crop',
  4.9
);

-- ==========================================
-- SEED: TEE TIMES (next 14 days, per course)
-- ==========================================
do $$
declare
  v_course_id   uuid;
  v_date        date;
  v_time        time;
  v_price       numeric(10,2);
  course_ids    uuid[] := array[
    'a1b2c3d4-0001-0001-0001-000000000001'::uuid,
    'a1b2c3d4-0002-0002-0002-000000000002'::uuid,
    'a1b2c3d4-0003-0003-0003-000000000003'::uuid,
    'a1b2c3d4-0004-0004-0004-000000000004'::uuid,
    'a1b2c3d4-0005-0005-0005-000000000005'::uuid
  ];
  prices        numeric[] := array[750, 1500, 625, 1100, 3000];
begin
  for i in 1..array_length(course_ids, 1) loop
    v_course_id := course_ids[i];
    v_price     := prices[i];
    for day_offset in 1..14 loop
      v_date := current_date + day_offset;
      v_time := '07:00'::time;
      while v_time <= '16:00'::time loop
        insert into public.tee_times
          (course_id, date, time, max_players, available_slots, price_per_player, is_active)
        values
          (v_course_id, v_date, v_time, 4, 4, v_price, true)
        on conflict (course_id, date, time) do nothing;
        v_time := v_time + interval '10 minutes';
      end loop;
    end loop;
  end loop;
end;
$$;
