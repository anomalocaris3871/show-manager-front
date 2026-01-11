# サブスクリプション API 仕様書

## 概要

Shop Manager の有料サブスクリプション機能のバックエンド実装ガイドです。

### 技術スタック（推奨）
- 決済: **Stripe**
- 通貨: **JPY（日本円）**
- Webhook: Stripe Webhook

---

## 1. 料金プラン

シンプルな2プラン構成:

| プランID | プラン名 | 月額(税込) | 年額(税込) | 主な機能 |
|----------|----------|-----------|-----------|----------|
| `free` | 一般 | 0円 | - | スタッフ管理、シフト、出退勤、QR |
| `premium` | Premium | 500円 | 5,000円 | 一般 + **給料計算**、CSVエクスポート |

### Premium 専用機能
- 給料計算（出退勤記録×時給）
- 月別給料レポート
- CSVエクスポート

### Stripe Price ID 設定例
```
# .env
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx
STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxx
```

---

## 2. データベーススキーマ

### subscriptions テーブル

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',  -- free, premium
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, trialing, past_due, canceled, incomplete, expired
  billing_cycle VARCHAR(10),  -- monthly, yearly (NULLはfree)
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

### 初期データ
既存ユーザーには自動的に `free` プランを付与:
```sql
INSERT INTO subscriptions (store_id, plan, status)
SELECT id, 'free', 'active' FROM stores
WHERE id NOT IN (SELECT store_id FROM subscriptions);
```

---

## 3. API エンドポイント

### 3.1 サブスクリプション情報取得

```
GET /api/stores/{storeId}/subscription
Authorization: Bearer {token}
```

**Response 200 (Premiumプラン)**
```json
{
  "success": true,
  "data": {
    "id": "sub_123e4567-e89b-12d3-a456-426614174000",
    "storeId": "store_123",
    "plan": "premium",
    "status": "active",
    "billingCycle": "monthly",
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": null,
    "stripeCustomerId": "cus_xxxxx",
    "stripeSubscriptionId": "sub_xxxxx",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response 200 (一般プラン = Free)**
```json
{
  "success": true,
  "data": null
}
```

**ビジネスロジック**
- `data` が `null` の場合、フロントエンドは Free（一般）プランとして扱う
- 初めてアクセスした店舗は自動的に Free プランレコードを作成しても良い

---

### 3.2 Stripe Checkout セッション作成

```
POST /api/stores/{storeId}/subscription/checkout
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**
```json
{
  "plan": "premium",
  "billingCycle": "monthly",
  "successUrl": "https://app.example.com/store-settings?subscription=success",
  "cancelUrl": "https://app.example.com/store-settings?subscription=canceled"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxxxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
  }
}
```

**実装例 (Node.js + Stripe)**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(storeId, plan, billingCycle, successUrl, cancelUrl) {
  // Premium のみ有料
  if (plan !== 'premium') {
    throw new Error('Only premium plan requires checkout');
  }

  // Price ID マッピング
  const priceIds = {
    premium: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
  };

  const priceId = priceIds[plan]?.[billingCycle];
  if (!priceId) {
    throw new Error('Invalid plan or billing cycle');
  }

  // 既存の Stripe Customer を取得または作成
  let customerId = await getOrCreateStripeCustomer(storeId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        storeId: storeId,
        plan: plan,
      },
    },
    metadata: {
      storeId: storeId,
    },
    locale: 'ja',  // 日本語UI
    allow_promotion_codes: true,  // プロモーションコード許可
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}
```

---

### 3.3 Stripe Customer Portal セッション作成

```
POST /api/stores/{storeId}/subscription/portal
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**
```json
{
  "returnUrl": "https://app.example.com/store-settings"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/xxxxx"
  }
}
```

**実装例**
```javascript
async function createPortalSession(storeId, returnUrl) {
  const subscription = await getSubscriptionByStoreId(storeId);

  if (!subscription?.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}
```

---

### 3.4 サブスクリプションキャンセル

```
POST /api/subscriptions/{subscriptionId}/cancel
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "plan": "premium",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
  }
}
```

**実装例**
```javascript
async function cancelSubscription(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);

  // Stripe で期間終了時キャンセルを設定
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // DB 更新
  await updateSubscription(subscriptionId, {
    cancelAtPeriodEnd: true,
  });

  return getSubscriptionById(subscriptionId);
}
```

---

### 3.5 キャンセル取り消し（再開）

```
POST /api/subscriptions/{subscriptionId}/resume
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "plan": "premium",
    "status": "active",
    "cancelAtPeriodEnd": false
  }
}
```

**実装例**
```javascript
async function resumeSubscription(subscriptionId) {
  const subscription = await getSubscriptionById(subscriptionId);

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await updateSubscription(subscriptionId, {
    cancelAtPeriodEnd: false,
  });

  return getSubscriptionById(subscriptionId);
}
```

---

### 3.6 支払い方法一覧取得

```
GET /api/stores/{storeId}/payment-methods
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_xxxxx",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "isDefault": true
    }
  ]
}
```

**実装例**
```javascript
async function getPaymentMethods(storeId) {
  const subscription = await getSubscriptionByStoreId(storeId);

  if (!subscription?.stripeCustomerId) {
    return [];
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: subscription.stripeCustomerId,
    type: 'card',
  });

  const customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
  const defaultPmId = customer.invoice_settings?.default_payment_method;

  return paymentMethods.data.map(pm => ({
    id: pm.id,
    type: pm.type,
    card: {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    },
    isDefault: pm.id === defaultPmId,
  }));
}
```

---

### 3.7 請求書一覧取得

```
GET /api/stores/{storeId}/invoices?limit=10
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_xxxxx",
      "subscriptionId": "sub_123",
      "amount": 500,
      "currency": "jpy",
      "status": "paid",
      "periodStart": "2024-01-01T00:00:00.000Z",
      "periodEnd": "2024-02-01T00:00:00.000Z",
      "paidAt": "2024-01-01T00:05:00.000Z",
      "invoicePdf": "https://pay.stripe.com/invoice/xxxxx/pdf",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**実装例**
```javascript
async function getInvoices(storeId, limit = 10) {
  const subscription = await getSubscriptionByStoreId(storeId);

  if (!subscription?.stripeCustomerId) {
    return [];
  }

  const invoices = await stripe.invoices.list({
    customer: subscription.stripeCustomerId,
    limit: limit,
  });

  return invoices.data.map(inv => ({
    id: inv.id,
    subscriptionId: subscription.id,
    amount: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    periodStart: new Date(inv.period_start * 1000).toISOString(),
    periodEnd: new Date(inv.period_end * 1000).toISOString(),
    paidAt: inv.status_transitions?.paid_at
      ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
      : null,
    invoicePdf: inv.invoice_pdf,
    createdAt: new Date(inv.created * 1000).toISOString(),
  }));
}
```

---

## 4. Stripe Webhook

### 4.1 エンドポイント設定

```
POST /api/webhooks/stripe
```

**必要なイベント**
- `checkout.session.completed` - 支払い完了
- `customer.subscription.created` - サブスクリプション作成
- `customer.subscription.updated` - サブスクリプション更新
- `customer.subscription.deleted` - サブスクリプション削除
- `invoice.paid` - 請求書支払い完了
- `invoice.payment_failed` - 支払い失敗

### 4.2 実装例

```javascript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
}

async function handleCheckoutComplete(session) {
  const storeId = session.metadata.storeId;
  const subscriptionId = session.subscription;

  // Stripe サブスクリプション詳細を取得
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

  // プランをメタデータから取得（premium固定）
  const plan = stripeSub.metadata.plan || 'premium';

  // DB にサブスクリプションを作成/更新
  await upsertSubscription({
    storeId: storeId,
    plan: plan,
    status: stripeSub.status,
    billingCycle: stripeSub.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly',
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: subscriptionId,
  });
}

async function handleSubscriptionUpdate(stripeSub) {
  // metadata から storeId を取得
  const storeId = stripeSub.metadata.storeId;
  if (!storeId) return;

  await updateSubscriptionByStripeId(stripeSub.id, {
    status: stripeSub.status,
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(stripeSub) {
  await updateSubscriptionByStripeId(stripeSub.id, {
    status: 'expired',
    plan: 'free',  // 一般プランに戻す
  });
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  await updateSubscriptionByStripeId(subscriptionId, {
    status: 'past_due',
  });

  // TODO: 店舗オーナーにメール通知
}
```

---

## 5. 機能制限チェック

### 5.1 給料計算機能チェック

給料計算 API で Premium プランをチェック:

```javascript
// GET /api/stores/{storeId}/salary?month=2024-01
async function getSalaryReport(storeId, month) {
  // サブスクリプション情報を取得
  const subscription = await getSubscriptionByStoreId(storeId);
  const plan = subscription?.plan || 'free';

  // Premium プランのみ利用可能
  if (plan !== 'premium') {
    return {
      success: false,
      error: '給料計算機能はPremiumプランでご利用いただけます。',
      code: 'PREMIUM_REQUIRED',
    };
  }

  // 給料計算処理...
  const salaryData = await calculateSalaryForMonth(storeId, month);

  return {
    success: true,
    data: salaryData,
  };
}
```

### 5.2 給料計算ロジック（深夜割増対応）

深夜勤務（22:00〜05:00）には、スタッフ登録時に設定した深夜時給を適用します。

**スタッフ登録時のデータ:**
```json
{
  "name": "田中太郎",
  "hourlyWage": 1200,
  "nightWage": 1500
}
```
- `hourlyWage`: 基本時給
- `nightWage`: 深夜時給（通常は基本時給 × 1.25 を推奨）

**レスポンス形式:**
```json
{
  "success": true,
  "data": [
    {
      "staffId": "staff_001",
      "staffName": "田中太郎",
      "hourlyWage": 1200,
      "nightWage": 1500,
      "totalMinutes": 480,
      "totalHours": 8.0,
      "nightMinutes": 120,
      "nightHours": 2.0,
      "baseSalary": 9600,
      "nightAllowance": 600,
      "totalSalary": 10200,
      "workDays": 5
    }
  ]
}
```

**実装例:**
```javascript
/**
 * 深夜時間（22:00-05:00）の分数を計算
 */
function calculateNightMinutes(clockIn, clockOut) {
  const start = new Date(clockIn);
  const end = new Date(clockOut);

  let nightMinutes = 0;
  let current = new Date(start);

  // 1分ずつチェック
  while (current < end) {
    const hour = current.getHours();
    // 22:00-23:59 または 00:00-04:59 が深夜時間帯
    if (hour >= 22 || hour < 5) {
      nightMinutes++;
    }
    current = new Date(current.getTime() + 60000); // +1分
  }

  return nightMinutes;
}

async function calculateSalaryForMonth(storeId, month) {
  // 対象月の出退勤記録を取得
  const attendances = await getAttendancesByMonth(storeId, month);

  // スタッフ一覧を取得
  const staffList = await getStaffByStoreId(storeId);

  const result = [];

  for (const staff of staffList) {
    const staffAttendances = attendances.filter(a => a.staffId === staff.id);

    let totalMinutes = 0;
    let nightMinutes = 0;
    let workDays = 0;

    for (const attendance of staffAttendances) {
      if (attendance.clockIn && attendance.clockOut) {
        const start = new Date(attendance.clockIn);
        const end = new Date(attendance.clockOut);
        const minutes = Math.round((end - start) / 1000 / 60);

        if (minutes > 0) {
          totalMinutes += minutes;
          nightMinutes += calculateNightMinutes(attendance.clockIn, attendance.clockOut);
          workDays++;
        }
      }
    }

    // 深夜時給（未設定の場合は基本時給×1.25で計算）
    const nightWage = staff.nightWage || Math.round(staff.hourlyWage * 1.25);

    // 基本給 = 時給 × 総勤務時間
    const baseSalary = Math.round((staff.hourlyWage * totalMinutes) / 60);

    // 深夜手当 = (深夜時給 - 基本時給) × 深夜時間
    const nightAllowance = Math.round(((nightWage - staff.hourlyWage) * nightMinutes) / 60);

    // 合計給料 = 基本給 + 深夜手当
    const totalSalary = baseSalary + nightAllowance;

    result.push({
      staffId: staff.id,
      staffName: staff.name,
      hourlyWage: staff.hourlyWage,
      nightWage,
      totalMinutes,
      totalHours: totalMinutes / 60,
      nightMinutes,
      nightHours: nightMinutes / 60,
      baseSalary,
      nightAllowance,
      totalSalary,
      workDays,
    });
  }

  return result;
}
```

### 5.3 深夜手当の計算例

**スタッフ設定:**
- 基本時給: ¥1,200
- 深夜時給: ¥1,500

**勤務時間:**
- 総勤務: 8時間
- うち深夜（22:00-05:00）: 2時間

| 項目 | 計算式 | 例 |
|------|--------|-----|
| 基本給 | 時給 × 総勤務時間 | ¥1,200 × 8h = ¥9,600 |
| 深夜手当 | (深夜時給 - 基本時給) × 深夜時間 | (¥1,500 - ¥1,200) × 2h = ¥600 |
| **合計** | 基本給 + 深夜手当 | **¥10,200** |

**注意:**
- 深夜時間帯: 22:00〜翌05:00（労働基準法第37条）
- 深夜時給は店舗で自由に設定可能（法定最低: 基本時給 × 1.25）
- 日をまたぐシフトも正しく計算される必要あり
- 深夜時給が未設定の場合は自動的に基本時給 × 1.25 で計算

---

## 6. 環境変数

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs (Stripe Dashboard で作成)
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx
STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxx
```

---

## 7. Stripe Dashboard 設定

### 7.1 商品作成
1. Stripe Dashboard → Products → Add product
2. **Premium プラン**を作成
3. 月額 500円・年額 5,000円 の Price を設定

### 7.2 Customer Portal 設定
1. Settings → Billing → Customer portal
2. 有効化する機能:
   - Update payment methods
   - View invoice history
   - Cancel subscriptions
3. Business information 設定

### 7.3 Webhook 設定
1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://api.example.com/api/webhooks/stripe`
3. イベント選択:
   - `checkout.session.completed`
   - `customer.subscription.*`
   - `invoice.paid`
   - `invoice.payment_failed`

---

## 8. テスト

### テストカード
```
成功: 4242 4242 4242 4242
失敗: 4000 0000 0000 0002
3Dセキュア: 4000 0027 6000 3184
```

### Stripe CLI でローカルテスト
```bash
# Webhook 転送
stripe listen --forward-to localhost:8000/api/webhooks/stripe

# イベントトリガー
stripe trigger checkout.session.completed
```

---

## 9. チェックリスト

- [ ] Stripe アカウント作成（本番・テスト）
- [ ] Premium 商品・価格の作成
- [ ] subscriptions テーブル作成
- [ ] API エンドポイント実装
- [ ] Webhook 実装
- [ ] Customer Portal 設定
- [ ] 給料計算 API 実装（Premium チェック付き）
- [ ] Staff テーブルに nightWage フィールド追加
- [ ] 深夜手当計算実装（22:00-05:00、staff.nightWage 使用）
- [ ] 環境変数設定
- [ ] テスト（Stripe CLI）
- [ ] 本番デプロイ

---

## 10. 参考リンク

- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Billing](https://stripe.com/docs/billing)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Webhook 署名検証](https://stripe.com/docs/webhooks/signatures)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
