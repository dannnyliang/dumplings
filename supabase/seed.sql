-- 測試資料 seed。
--
-- 執行時機：本地 `db reset`、preview branch 建立時（branching executor）。
-- **不會**套用到 production——merge 只跑 migration，不跑 seed。
--
-- 用途：preview branch 的資料庫是全新的（無使用者、無紀錄），而 Google OAuth
-- 的 redirect URI 無法逐 branch 登記，因此 preview 以帳密登入測試帳號
-- （見 src/app/login/page.tsx 的 preview 表單）。密碼是公開資訊，
-- branch DB 裡只有這份假資料，沒有洩漏疑慮。

do $$
declare
  danny_id constant uuid := '11111111-1111-4111-8111-111111111111';
  peiyu_id constant uuid := '22222222-2222-4222-8222-222222222222';
  test_password constant text := 'dumplings-preview';
begin
  -- 測試使用者（profiles 由 on_auth_user_created trigger 自動建立）。
  -- token 欄位以空字串補齊：GoTrue 對 NULL token 的掃描會出錯，是已知地雷。
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    (
      '00000000-0000-0000-0000-000000000000', danny_id, 'authenticated', 'authenticated',
      'preview-danny@dumplings.test',
      extensions.crypt(test_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Danny（測試）"}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', peiyu_id, 'authenticated', 'authenticated',
      'preview-peiyu@dumplings.test',
      extensions.crypt(test_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"full_name":"PeiYu（測試）"}',
      now(), now(), '', '', '', ''
    )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values
    (
      gen_random_uuid(), danny_id, danny_id::text, 'email',
      jsonb_build_object('sub', danny_id::text, 'email', 'preview-danny@dumplings.test', 'email_verified', true),
      now(), now(), now()
    ),
    (
      gen_random_uuid(), peiyu_id, peiyu_id::text, 'email',
      jsonb_build_object('sub', peiyu_id::text, 'email', 'preview-peiyu@dumplings.test', 'email_verified', true),
      now(), now(), now()
    )
  on conflict (provider_id, provider) do nothing;

  -- 示範帳本：讓首頁四行拆解（現金／未出帳／待還墊付／可動用）與報表都有東西可看。
  -- 日期用相對值，seed 當下看起來永遠是「最近的帳」。

  insert into public.cash_movements (amount, date, kind, counterparty, note, created_by) values
    (50000, current_date - 30, 'topup', null, '本月共同帳戶入帳', danny_id),
    (3000, current_date - 12, 'card_bill', null, '上期共同卡帳單', danny_id),
    (10000, current_date - 1, 'settlement', danny_id, '部分結算給 Danny', peiyu_id);

  insert into public.transactions (amount, date, note, payment_method, category_id, created_by) values
    -- 共同帳戶：消費日即扣款
    (1200, current_date - 2, '晚餐', 'shared',
      (select id from public.categories where name = '餐飲' limit 1), danny_id),
    (800, current_date - 5, '衛生紙補貨', 'shared',
      (select id from public.categories where name = '日用品' limit 1), peiyu_id),
    -- 共同卡：累入未出帳
    (6500, current_date - 3, '電影加聚餐', 'joint_card',
      (select id from public.categories where name = '娛樂' limit 1), danny_id),
    (5500, current_date - 10, '超市採買', 'joint_card',
      (select id from public.categories where name = '購物' limit 1), peiyu_id),
    -- 墊付：Danny 已被部分結算（見上方 settlement），還剩 5,000 待還
    (15000, current_date - 7, '家電維修', danny_id::text,
      (select id from public.categories where name = '其他' limit 1), danny_id),
    (5000, current_date - 4, '看診', peiyu_id::text,
      (select id from public.categories where name = '醫療' limit 1), peiyu_id);
end $$;
