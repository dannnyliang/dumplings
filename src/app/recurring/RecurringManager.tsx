'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CategoryAvatar from '@/components/ui/CategoryAvatar'
import Icon from '@/components/ui/Icon'
import type { Category, RecurringTransaction } from '@/types/database'

interface RecurringManagerProps {
  initialRecurring: RecurringTransaction[]
  categories: Pick<Category, 'id' | 'name'>[]
  userId: string
}

const TODAY = new Date().toISOString().split('T')[0]

const FREQ_LABEL: Record<string, string> = {
  monthly: '每月',
  weekly: '每週',
}

export default function RecurringManager({ initialRecurring, categories, userId }: RecurringManagerProps) {
  const router = useRouter()
  const [recurring, setRecurring] = useState(initialRecurring)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)

  const [type, setType] = useState<'expense' | 'topup'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [paidBy, setPaidBy] = useState<'shared' | 'self'>('shared')
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) { setError('請輸入有效金額'); return }

    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('recurring_transactions')
      .insert({
        amount: parsedAmount,
        type,
        category_id: type === 'expense' ? categoryId || null : null,
        note: note.trim() || null,
        paid_by: type === 'expense' && paidBy === 'self' ? userId : 'shared',
        frequency,
        day_of_month: frequency === 'monthly' ? Number(dayOfMonth) : null,
        created_by: userId,
      })
      .select('*, category:categories(id, name)')
      .single()

    if (insertError || !data) {
      setError('新增失敗')
    } else {
      setRecurring((prev) => [data as RecurringTransaction, ...prev])
      setShowForm(false)
      setAmount('')
      setNote('')
    }
    setSubmitting(false)
  }

  async function triggerNow(item: RecurringTransaction) {
    setTriggering(item.id)
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        amount: item.amount,
        type: item.type,
        category_id: item.category_id,
        date: TODAY,
        note: item.note,
        paid_by: item.paid_by,
        created_by: userId,
      })

    if (insertError) {
      setError('記帳失敗')
    } else {
      router.refresh()
    }
    setTriggering(null)
  }

  async function deactivate(item: RecurringTransaction) {
    if (!confirm(`確定要停用「${item.category?.name ?? '此定期'}」？`)) return
    const supabase = createClient()
    await supabase
      .from('recurring_transactions')
      .update({ is_active: false })
      .eq('id', item.id)
    setRecurring((prev) => prev.filter((r) => r.id !== item.id))
  }

  const monthlyTotal = recurring
    .filter((r) => r.frequency === 'monthly' && r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const S = {
    input: {
      border: '1px solid var(--dmp-border-strong)',
      borderRadius: 14,
      padding: '10px 14px',
      fontSize: 14,
      color: 'var(--dmp-text)',
      backgroundColor: 'var(--dmp-surface)',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    select: {
      border: '1px solid var(--dmp-border-strong)',
      borderRadius: 14,
      padding: '10px 14px',
      fontSize: 14,
      color: 'var(--dmp-text)',
      backgroundColor: 'var(--dmp-surface)',
      outline: 'none',
      appearance: 'none' as const,
      width: '100%',
    },
  }

  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--dmp-bg)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--dmp-bg)',
        borderBottom: '1px solid var(--dmp-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: 'var(--dmp-text-muted)', display: 'flex' }}>
            <Icon name="back" size={22} />
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0 }}>定期</h1>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: showForm ? 'var(--dmp-text-muted)' : 'var(--dmp-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {showForm ? '取消' : <><Icon name="plus" size={18} strokeWidth={2} />新增</>}
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <p style={{ fontSize: 12, color: '#B83B3B' }}>{error}</p>}

        {monthlyTotal > 0 && (
          <div style={{ backgroundColor: 'var(--dmp-accent-soft)', borderRadius: 20, padding: '14px 18px', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 11, color: 'var(--dmp-accent-text)', fontWeight: 500, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.6 }}>每月固定支出</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--dmp-accent-text)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
              NT$ {monthlyTotal.toLocaleString('zh-TW')}
            </p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleAdd} style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: 16, boxShadow: 'var(--dmp-shadow-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dmp-text)', margin: 0 }}>新增定期模板</p>

            <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--dmp-border-strong)', backgroundColor: 'var(--dmp-surface-alt)' }}>
              {(['expense', 'topup'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} style={{
                  flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  backgroundColor: type === t ? 'var(--dmp-accent)' : 'transparent',
                  color: type === t ? '#FFFFFF' : 'var(--dmp-text-muted)',
                }}>
                  {t === 'expense' ? '支出' : '入帳'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--dmp-border-strong)', borderRadius: 14, paddingLeft: 14, backgroundColor: 'var(--dmp-surface)' }}>
              <span style={{ fontSize: 13, color: 'var(--dmp-text-muted)', marginRight: 4 }}>NT$</span>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required
                style={{ flex: 1, padding: '10px 14px 10px 0', fontSize: 14, color: 'var(--dmp-text)', border: 'none', outline: 'none', background: 'transparent' }} />
            </div>

            {type === 'expense' && (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={S.select}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as 'monthly' | 'weekly')} style={{ ...S.select }}>
                <option value="monthly">每月</option>
                <option value="weekly">每週</option>
              </select>
              {frequency === 'monthly' && (
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--dmp-border-strong)', borderRadius: 14, padding: '0 12px', gap: 4, backgroundColor: 'var(--dmp-surface)' }}>
                  <input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
                    style={{ width: 36, padding: '10px 0', fontSize: 14, color: 'var(--dmp-text)', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} />
                  <span style={{ fontSize: 12, color: 'var(--dmp-text-muted)' }}>日</span>
                </div>
              )}
            </div>

            {type === 'expense' && (
              <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--dmp-border-strong)', backgroundColor: 'var(--dmp-surface-alt)' }}>
                {(['shared', 'self'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPaidBy(p)} style={{
                    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                    backgroundColor: paidBy === p ? 'var(--dmp-accent-soft)' : 'transparent',
                    color: paidBy === p ? 'var(--dmp-accent-text)' : 'var(--dmp-text-muted)',
                  }}>
                    {p === 'shared' ? '共同帳戶' : '我先墊付'}
                  </button>
                ))}
              </div>
            )}

            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="備註（選填）" style={S.input} />

            <button type="submit" disabled={submitting} style={{
              backgroundColor: 'var(--dmp-accent)', color: '#FFFFFF', border: 'none', borderRadius: 14,
              padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
            }}>
              {submitting ? '新增中...' : '新增定期模板'}
            </button>
          </form>
        )}

        {recurring.length === 0 ? (
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, padding: '32px 16px', textAlign: 'center', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔄</p>
            <p style={{ fontSize: 13, color: 'var(--dmp-text-muted)' }}>還沒有定期交易，點右上角新增</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--dmp-shadow-soft)' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {recurring.map((item, idx) => (
                <li key={item.id} style={{ padding: '12px 16px', borderTop: idx > 0 ? '1px solid var(--dmp-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CategoryAvatar categoryName={item.category?.name ?? null} size={38} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--dmp-text)', margin: 0 }}>
                          {item.category?.name ?? (item.type === 'topup' ? '入帳' : '支出')}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--dmp-text-muted)', margin: '2px 0 0' }}>
                          {FREQ_LABEL[item.frequency]}
                          {item.frequency === 'monthly' && item.day_of_month ? ` ${item.day_of_month} 日` : ''}
                          {item.note ? ` · ${item.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: item.type === 'topup' ? 'var(--dmp-income)' : 'var(--dmp-expense)', margin: 0, fontFamily: '"SF Mono", ui-monospace, monospace' }}>
                        {item.type === 'topup' ? '+' : '-'}NT$ {Number(item.amount).toLocaleString('zh-TW')}
                      </p>
                      <button onClick={() => deactivate(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dmp-text-muted)', display: 'flex', padding: 4 }}
                        aria-label="停用">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => triggerNow(item)} disabled={triggering === item.id}
                      style={{
                        width: '100%', backgroundColor: 'var(--dmp-accent-soft)', color: 'var(--dmp-accent-text)',
                        border: 'none', borderRadius: 10, padding: '7px 0', fontSize: 13, fontWeight: 500,
                        cursor: triggering === item.id ? 'not-allowed' : 'pointer', opacity: triggering === item.id ? 0.6 : 1,
                      }}>
                      {triggering === item.id ? '記帳中...' : '今天記一筆'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
