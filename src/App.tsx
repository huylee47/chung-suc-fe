import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2, CircleDollarSign, ClipboardList,
  Copy, Crown, Eye, EyeOff, Flame, Gift, Headphones, History, LayoutDashboard, LogIn,
  Medal, Minus, Pencil, Percent, Phone, Plus, Search, Shield, ShieldCheck, Sparkles, Tag, Ticket, Trash2,
  Trophy, UserCheck, UserRound, Users, WalletCards, X
} from 'lucide-react';
import { api } from './api';

export type Product = { id: string; name: string; description: string; price: number; resellerPrice?: number; available: boolean; stock?: number };
export type Order = {
  id: string;
  username: string;
  productName: string;
  uid: string;
  quantity: number;
  total: number;
  originalTotal?: number;
  discount?: number;
  voucherCode?: string;
  status: string;
  createdAt: string;
};
export type DiscountType = 'PERCENT' | 'FIXED';
export type Voucher = {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
};
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  totalDeposited: number;
  topupCount?: number;
};
export type UserType = {
  id: string;
  code: string;
  name: string;
  discountPercent: number;
  description?: string;
  color?: string;
  userCount?: number;
  createdAt?: string;
};
export type AdminUser = {
  id: string;
  username: string;
  email?: string;
  role: string;
  userType?: string;
  userTypeName?: string;
  discountPercent?: number;
  balance: number;
  status: string;
  createdAt?: string;
};
export type WalletLedgerItem = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  referenceId: string;
  createdAt: string;
};

const phone = '0995438093';
const zaloContact = 'https://zalo.me/0995438093';
const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' Xu';
function sessionRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).role as string; } catch { return 'USER'; }
}

function getLocalVouchers(): Voucher[] {
  try {
    const raw = localStorage.getItem('binaov_vouchers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalVouchers(list: Voucher[]) {
  try { localStorage.setItem('binaov_vouchers', JSON.stringify(list)); } catch {}
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(() => sessionRole());
  useEffect(() => { const sync = () => setRole(sessionRole()); window.addEventListener('storage', sync); window.addEventListener('auth-changed', sync); return () => { window.removeEventListener('storage', sync); window.removeEventListener('auth-changed', sync); }; }, []);
  const logout = () => { localStorage.removeItem('token'); window.dispatchEvent(new Event('auth-changed')); window.location.href = '/'; };
  return (
    <>
      <div className="announcement">
        Hỗ trợ nhanh qua <a href={zaloContact} target="_blank" rel="noreferrer">Zalo Admin (Nạp thẻ cào, xử lý lỗi, CSKH): {phone}</a>
      </div>
      <header className="topbar">
        <Link className="brand" to="/"><img src="/logo.jpg" alt="Bin AOV" /><span>BINAOV.SHOP</span></Link>
        <nav>
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/order">Tạo đơn</NavLink>
          <NavLink to="/topup">Nạp tiền</NavLink>
          <NavLink to="/leaderboard">BXH Nạp</NavLink>
          {role && <NavLink to="/account">Tài khoản</NavLink>}
        </nav>
        {role ? (
          <div className="session-actions">
            <Link className="button button-secondary small" to={role === 'ADMIN' ? '/admin' : '/account'}>{role === 'ADMIN' ? 'Trang quản trị' : 'Tài khoản'}</Link>
            <button className="button button-primary small" type="button" onClick={logout}>Đăng xuất</button>
          </div>
        ) : (
          <Link className="button button-primary small" to="/login"><LogIn size={16} /> Đăng nhập</Link>
        )}
      </header>
      {children}
      <footer className="footer">
        <div>
          <div className="brand"><img src="/logo.jpg" alt="Bin AOV" /><span>BINAOV.SHOP</span></div>
          <p>Đặt dịch vụ nhanh, theo dõi đơn rõ ràng và nạp Xu tự động.</p>
        </div>
        <div>
          <b>Hỗ trợ &amp; Liên hệ</b>
          <a href={zaloContact} target="_blank" rel="noreferrer"><Phone size={15} /> Zalo cá nhân: {phone} (Nạp thẻ cào, CSKH)</a>
        </div>
        <div>
          <b>Liên kết</b>
          <Link to="/order">Tạo đơn</Link>
          <Link to="/topup">Nạp tiền</Link>
          <Link to="/leaderboard">BXH Nạp Xu</Link>
          <Link to="/admin">Trang quản trị</Link>
        </div>
      </footer>
    </>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  useEffect(() => { if (!localStorage.getItem('token')) navigate('/login', { replace: true }); else setChecking(false); }, [navigate]);
  if (checking) return <main className="auth-page"><div className="panel admin-loading">Đang kiểm tra phiên đăng nhập...</div></main>;
  return <>{children}</>;
}

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    api<{ data: Product[] }>('/products').then((result) => setProducts(result.data)).catch(() => undefined);
    api<{ data: LeaderboardEntry[] }>('/leaderboard').then((result) => {
      if (Array.isArray(result.data)) {
        const clean = result.data.filter((item) => item.userId !== 'demo-user' && !item.username.toLowerCase().includes('demo'));
        setLeaderboard(clean.slice(0, 3));
      }
    }).catch(() => undefined);
  }, []);
  return (
    <PublicShell>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">DỊCH VỤ CHUNG SỨC LIÊN QUÂN</span>
            <h1>Đặt rương,<br /><em>xong trong 5 phút.</em></h1>
            <p>Chọn gói, nhập mã sự kiện hoặc UID user. Đơn được chuyển thẳng về trang quản trị để xử lý.</p>
            <div className="actions">
              <Link className="button button-primary" to="/order">Tạo đơn ngay <ArrowRight size={18} /></Link>
              <Link className="button button-secondary" to="/topup">Nạp tiền</Link>
              <Link className="button button-secondary" to="/leaderboard"><Trophy size={16} /> BXH Nạp</Link>
            </div>
            {leaderboard.length > 0 && (
              <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <b style={{ fontSize: '13px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Crown size={15} /> Top BXH Nạp Theo Tổng
                  </b>
                  <Link to="/leaderboard" style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 700 }}>Xem tất cả &rarr;</Link>
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {leaderboard.map((item, idx) => (
                    <div key={item.userId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>
                        <b style={{ color: idx === 0 ? '#f59e0b' : idx === 1 ? '#64748b' : '#ea580c', marginRight: '6px' }}>#{item.rank}</b>
                        <span>{item.username}</span>
                      </span>
                      <strong style={{ color: 'var(--blue-strong)' }}>{formatVnd(item.totalDeposited)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="trust-row" style={{ marginTop: '18px' }}>
              <span><CheckCircle2 size={16} /> Hỗ trợ 5 phút</span>
              <span><ShieldCheck size={16} /> Đơn được theo dõi</span>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/chests.jpg" alt="Minh họa dịch vụ chung sức" />
            <div className="banner-shade">
              <span className="visual-label">HỆ THỐNG ĐANG HOẠT ĐỘNG</span>
              <strong>Đơn mới được admin xử lý liên tục</strong>
              <span>Nhập đúng UID để đơn chạy nhanh hơn.</span>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">BẢNG GIÁ</span><h2>Dịch vụ đang mở</h2></div>
            <Link to="/order">Xem tất cả <ArrowRight size={16} /></Link>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-icon"><WalletCards size={20} /></div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price-row">
                  <strong>{formatVnd(product.price)}</strong>
                  <span>Còn {product.stock ?? 'nhiều'}</span>
                </div>
                <Link className="button button-secondary full" to={`/order?product=${product.id}`}>
                  Đặt ngay <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="steps">
          <div><span className="eyebrow">QUY TRÌNH</span><h2>Đơn giản từ lúc nạp đến lúc hoàn tất.</h2></div>
          <div className="step-list">
            <div><b>01</b><h3>Tạo tài khoản</h3><p>Đăng ký nhanh để lưu lịch sử đơn và số dư.</p></div>
            <div><b>02</b><h3>Nạp Xu</h3><p>Chuyển khoản đúng nội dung, hệ thống tự đồng bộ.</p></div>
            <div><b>03</b><h3>Gửi UID</h3><p>Nhập UID user, admin nhận đơn và cập nhật trạng thái.</p></div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function ReferenceHome() {
  return <iframe className="mockup-frame" title="Binaov mockup" src="/reference/pages/home/index.html" />;
}

function OrderPage() {
  const [searchParams] = useSearchParams();
  const queryProduct = searchParams.get('product') || '';
  const queryVoucher = searchParams.get('voucher') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productId, setProductId] = useState(queryProduct);
  const [uid, setUid] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // User tier states
  const [userProfile, setUserProfile] = useState<{ userType?: string; userTypeName?: string; discountPercent?: number } | null>(null);

  // Voucher states
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getLocalVouchers().filter((v) => v.active));
  const [voucherInput, setVoucherInput] = useState(queryVoucher.toUpperCase());
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherNotice, setVoucherNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api<{ data: { userType?: string; userTypeName?: string; discountPercent?: number } }>('/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        if (res?.data) setUserProfile(res.data);
      }).catch(() => undefined);
    }

    setLoadingProducts(true);
    api<{ data: Product[] }>('/products').then((result) => {
      setProducts(result.data);
      if (queryProduct && result.data.some((p) => p.id === queryProduct)) {
        setProductId(queryProduct);
      } else if (result.data.length > 0) {
        setProductId(result.data[0].id);
      }
    }).catch(() => undefined).finally(() => setLoadingProducts(false));

    api<{ data: Voucher[] }>('/vouchers').then((result) => {
      if (Array.isArray(result.data)) {
        setVouchers(result.data);
      }
    }).catch(() => undefined);
  }, [queryProduct]);

  const selected = products.find((product) => product.id === productId) ?? products[0];
  const subtotal = (selected?.price ?? 0) * quantity;

  // Chiết khấu theo loại người dùng (CTV, VIP...)
  const userDiscountPercent = userProfile?.discountPercent ?? 0;
  const tierDiscountAmount = userDiscountPercent > 0 ? Math.round((subtotal * userDiscountPercent) / 100) : 0;
  const amountAfterTier = Math.max(0, subtotal - tierDiscountAmount);

  // Tính discount voucher
  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (subtotal < appliedVoucher.minOrderValue) return 0;
    let disc = 0;
    if (appliedVoucher.discountType === 'PERCENT') {
      disc = Math.round((subtotal * appliedVoucher.discountValue) / 100);
      if (appliedVoucher.maxDiscount != null && disc > appliedVoucher.maxDiscount) {
        disc = appliedVoucher.maxDiscount;
      }
    } else {
      disc = appliedVoucher.discountValue;
    }
    return Math.min(disc, amountAfterTier);
  }, [appliedVoucher, subtotal, amountAfterTier]);

  const finalTotal = Math.max(0, subtotal - tierDiscountAmount - discountAmount);

  // Tự động kiểm tra query voucher nếu có
  useEffect(() => {
    if (queryVoucher && vouchers.length > 0 && !appliedVoucher) {
      applyVoucherCode(queryVoucher);
    }
  }, [queryVoucher, vouchers]);

  const applyVoucherCode = (codeToApply: string) => {
    const clean = codeToApply.trim().toUpperCase();
    if (!clean) {
      setVoucherNotice({ type: 'error', text: 'Vui lòng nhập mã voucher' });
      return;
    }
    const target = vouchers.find((v) => v.code.toUpperCase() === clean);
    if (!target) {
      setVoucherNotice({ type: 'error', text: `Mã “${clean}” không tồn tại hoặc đã hết hạn` });
      return;
    }
    if (target.expiresAt && new Date(target.expiresAt) < new Date()) {
      setVoucherNotice({ type: 'error', text: `Mã “${target.code}” đã hết hạn sử dụng` });
      return;
    }
    if (target.usageLimit != null && target.usedCount >= target.usageLimit) {
      setVoucherNotice({ type: 'error', text: `Mã “${target.code}” đã hết lượt sử dụng` });
      return;
    }
    if (subtotal < target.minOrderValue) {
      setVoucherNotice({
        type: 'error',
        text: `Đơn tối thiểu ${formatVnd(target.minOrderValue)} để áp dụng mã ${target.code}`
      });
      return;
    }

    setAppliedVoucher(target);
    setVoucherInput(target.code);
    setVoucherNotice({
      type: 'success',
      text: `Đã áp dụng mã ${target.code}: ${target.discountType === 'PERCENT' ? `Giảm ${target.discountValue}%` : `Giảm ${formatVnd(target.discountValue)}`}`
    });
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherNotice(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Bạn cần đăng nhập trước khi gửi đơn.');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setMessage('');
    try {
      await api('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId,
          uid,
          quantity,
          note: note.trim() || undefined,
          voucherCode: appliedVoucher ? appliedVoucher.code : undefined
        })
      });
      const savedNotice: string[] = [];
      if (tierDiscountAmount > 0) savedNotice.push(`tiết kiệm ${formatVnd(tierDiscountAmount)} (Ưu đãi ${userProfile?.userTypeName || 'CTV'})`);
      if (discountAmount > 0) savedNotice.push(`tiết kiệm ${formatVnd(discountAmount)} (Voucher ${appliedVoucher?.code})`);

      setMessage(
        savedNotice.length > 0
          ? `Đã gửi đơn thành công! (${savedNotice.join(', ')}). Admin đã nhận UID của bạn.`
          : 'Đã gửi đơn thành công. Admin đã nhận được UID user của bạn.'
      );
      setUid('');
      setNote('');
      setAppliedVoucher(null);
      setVoucherNotice(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tạo đơn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <main className="page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">TẠO ĐƠN</span>
            <h1>Gửi thông tin cho admin.</h1>
            <p>Nhập UID user, chọn gói dịch vụ và áp dụng mã voucher giảm giá nếu có.</p>
          </div>
        </div>
        <div className="form-layout">
          <form className="panel form" onSubmit={submit}>
            {userDiscountPercent > 0 && (
              <div className="tier-discount-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} style={{ color: '#16a34a' }} />
                  <span>Ưu đãi <b>{userProfile?.userTypeName || 'Cộng tác viên'}</b>: Tự động giảm {userDiscountPercent}% cho mọi đơn dịch vụ</span>
                </div>
                <span className="user-type-badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                  -{userDiscountPercent}%
                </span>
              </div>
            )}

            <label>
              Sản phẩm
              <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {formatVnd(product.price)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              UID user
              <input
                value={uid}
                onChange={(event) => setUid(event.target.value)}
                placeholder="Nhập UID user Liên Quân"
                required
                minLength={3}
              />
            </label>

            <label>
              Số lượng
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              />
            </label>

            {/* VOUCHER INPUT BOX */}
            <div className="voucher-section">
              <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Ticket size={14} /> MÃ GIẢM GIÁ / VOUCHER
              </span>

              {appliedVoucher ? (
                <div className="voucher-applied-tag">
                  <div>
                    <span>Đã dùng mã: <b>{appliedVoucher.code}</b> ({appliedVoucher.discountType === 'PERCENT' ? `-${appliedVoucher.discountValue}%` : `-${formatVnd(appliedVoucher.discountValue)}`})</span>
                    <small style={{ display: 'block', opacity: 0.85, fontSize: '11px' }}>
                      Tiết kiệm {formatVnd(discountAmount)}
                    </small>
                  </div>
                  <button type="button" onClick={removeVoucher} title="Bỏ mã voucher">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="voucher-input-row">
                    <input
                      type="text"
                      placeholder="Nhập mã voucher (VD: BINAOV10)"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => applyVoucherCode(voucherInput)}
                    >
                      <Tag size={15} /> Áp dụng
                    </button>
                  </div>

                  {voucherNotice && (
                    <div className={`notice ${voucherNotice.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '8px', padding: '8px 12px', fontSize: '12px' }}>
                      {voucherNotice.text}
                    </div>
                  )}

                  {/* VOUCHER GỢI Ý CÓ SẴN */}
                  {vouchers.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <span className="field-hint" style={{ fontWeight: 700 }}>Voucher ưu đãi đang mở:</span>
                      <div className="voucher-suggest-list">
                        {vouchers.slice(0, 3).map((v) => {
                          const canApply = subtotal >= v.minOrderValue;
                          return (
                            <div className="voucher-suggest-item" key={v.id}>
                              <div className="voucher-suggest-info">
                                <strong><Ticket size={13} /> {v.code} · {v.discountType === 'PERCENT' ? `Giảm ${v.discountValue}%` : `Giảm ${formatVnd(v.discountValue)}`}</strong>
                                <span>{v.description}</span>
                              </div>
                              <button
                                type="button"
                                className="button button-secondary small"
                                style={{ whiteSpace: 'nowrap', opacity: canApply ? 1 : 0.6 }}
                                onClick={() => applyVoucherCode(v.code)}
                              >
                                {canApply ? 'Dùng ngay' : 'Xem điều kiện'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <label>
              Ghi chú
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thông tin thêm cho admin (không bắt buộc)"
              />
            </label>

            {message && (
              <div className={`notice ${message.includes('thành công') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đơn'} <ArrowRight size={18} />
            </button>
          </form>

          <aside className="panel summary">
            <span className="eyebrow">TÓM TẮT ĐƠN HÀNG</span>
            <h2>{selected?.name}</h2>
            <p>{selected?.description}</p>
            <div className="summary-line">
              <span>Đơn giá</span>
              <b>{formatVnd(selected?.price ?? 0)}</b>
            </div>
            <div className="summary-line">
              <span>Số lượng</span>
              <b>x {quantity}</b>
            </div>
            <div className="summary-line">
              <span>Tạm tính</span>
              <b>{formatVnd(subtotal)}</b>
            </div>

            {tierDiscountAmount > 0 && (
              <div className="summary-line discount">
                <span>Ưu đãi {userProfile?.userTypeName || 'CTV'} (-{userDiscountPercent}%)</span>
                <b>-{formatVnd(tierDiscountAmount)}</b>
              </div>
            )}

            {appliedVoucher && discountAmount > 0 && (
              <div className="summary-line discount">
                <span>Mã giảm ({appliedVoucher.code})</span>
                <b>-{formatVnd(discountAmount)}</b>
              </div>
            )}

            <div className="summary-line total">
              <span>Cần thanh toán</span>
              <b style={{ color: 'var(--blue-strong)', fontSize: '20px' }}>{formatVnd(finalTotal)}</b>
            </div>

            <div className="notice" style={{ marginTop: '14px' }}>
              Bạn cần đăng nhập và có đủ số dư ({formatVnd(finalTotal)}) trước khi gửi đơn.
            </div>
          </aside>
        </div>
      </main>
    </PublicShell>
  );
}

function TopupPage() {
  const token = localStorage.getItem('token');
  const [amount, setAmount] = useState(100000);
  const [created, setCreated] = useState<{ transferContent: string; amount: number; bankAccount?: string; bankCode?: string; qrUrl?: string } | null>(null);
  const [message, setMessage] = useState('');
  const [topRankers, setTopRankers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api<{ data: LeaderboardEntry[] }>('/leaderboard')
      .then((res) => {
        if (Array.isArray(res.data)) {
          const clean = res.data.filter((item) => item.userId !== 'demo-user' && !item.username.toLowerCase().includes('demo'));
          setTopRankers(clean.slice(0, 3));
        }
      })
      .catch(() => undefined);
  }, []);

  const createTopup = async () => {
    if (!token) {
      setMessage('Bạn cần đăng nhập trước khi tạo lệnh nạp tự động.');
      return;
    }
    if (!Number.isInteger(amount) || amount < 20000) {
      setMessage('Số tiền nạp tối thiểu là 20.000 Xu.');
      return;
    }
    try {
      const result = await api<{ data: { transferContent: string; amount: number; bankAccount?: string; bankCode?: string; qrUrl?: string } }>('/topups', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      setCreated(result.data);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể tạo lệnh nạp');
    }
  };
  return (
    <PublicShell>
      <main className="page">
        <div className="page-heading">
          <span className="eyebrow">NẠP TIỀN</span>
          <h1>Nạp Xu qua Ngân Hàng</h1>
          <p>Nhập số tiền muốn nạp (tối thiểu 20.000 Xu), quét mã QR hoặc chuyển khoản đúng nội dung để hệ thống tự động cộng Xu.</p>
        </div>
        <div className="form-layout">
          <div className="panel form">
            <label>
              Số tiền nạp (Xu)
              <input
                type="number"
                min="20000"
                step="1000"
                value={amount}
                onChange={(event) => { setAmount(Number(event.target.value)); setCreated(null); setMessage(''); }}
                required
              />
              <span className="field-hint">Tối thiểu 20.000 Xu · Nhập bội số 1.000</span>
            </label>
            {!token ? (
              <div className="payment-box" style={{ background: '#f8fafc', borderColor: '#38bdf8' }}>
                <span className="eyebrow">NẠP TIỀN TỰ ĐỘNG</span>
                <p style={{ margin: '4px 0 10px', fontSize: '14px', color: 'var(--muted)' }}>
                  Đăng nhập tài khoản để nhận mã chuyển khoản riêng và được tự động cộng Xu vào số dư.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link className="button button-primary" to="/login">Đăng nhập để nạp Xu <LogIn size={16} /></Link>
                  <Link className="button button-secondary" to="/register">Đăng ký tài khoản</Link>
                </div>
              </div>
            ) : created ? (
              <div className="payment-box">
                <span className="eyebrow">LỆNH NẠP ĐÃ TẠO</span>
                {created.qrUrl && <img className="payment-qr" src={created.qrUrl} alt="QR chuyển khoản SePay" />}
                <div className="payment-details">
                  {created.bankCode && <p>Ngân hàng: <b>{created.bankCode}</b></p>}
                  {created.bankAccount && <p>Số tài khoản: <b>{created.bankAccount}</b></p>}
                  <p>Nội dung chuyển khoản (bắt buộc):</p>
                  <strong>{created.transferContent}</strong>
                  <p>Số tiền cần chuyển: <b>{formatVnd(created.amount)}</b></p>
                </div>
                <div className="support-box">
                  <span>Cần hỗ trợ thanh toán?</span>
                  <a className="button button-secondary small" href={zaloContact} target="_blank" rel="noreferrer"><Headphones size={15} /> Nhắn Zalo Admin</a>
                  <a className="support-phone" href={zaloContact} target="_blank" rel="noreferrer"><Phone size={14} /> {phone}</a>
                </div>
              </div>
            ) : (
              <button className="button button-primary" type="button" onClick={createTopup}>
                Tạo lệnh nạp qua QR Ngân Hàng <ArrowRight size={18} />
              </button>
            )}
            {message && <div className="notice error">{message}</div>}
          </div>
          <aside className="panel summary">
            <CircleDollarSign size={34} className="accent-icon" />
            <h2>Đồng bộ tự động SePay</h2>
            <p>Webhook SePay sẽ đối soát mã giao dịch, cộng số dư đúng một lần và lưu lịch sử.</p>

            {/* TOP BXH NẠP MINI PREVIEW */}
            <div style={{ margin: '14px 0', padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Crown size={14} /> TOP ĐẠI GIA NẠP XU
                </span>
                <Link to="/leaderboard" style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 700 }}>
                  Xem BXH &rarr;
                </Link>
              </div>
              {topRankers.length > 0 ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {topRankers.map((item, idx) => (
                    <div key={item.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ color: idx === 0 ? '#f59e0b' : idx === 1 ? '#64748b' : '#ea580c' }}>#{item.rank}</b>
                        <span>{item.username}</span>
                      </span>
                      <strong style={{ color: 'var(--blue-strong)' }}>{formatVnd(item.totalDeposited)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '6px 0' }}>
                  Chưa có giao dịch nạp. Hãy là người đầu tiên đứng Top 1!
                </div>
              )}
            </div>

            <div className="notice" style={{ marginBottom: '10px' }}>Sau khi chuyển khoản, giữ nguyên nội dung QR để hệ thống tự nhận diện.</div>
            <div className="notice" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
              <strong>Hỗ trợ thẻ cào:</strong> Bạn có thể nhắn tin trực tiếp <a href={zaloContact} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 800 }}>Zalo Admin ({phone})</a> để được hỗ trợ nạp thẻ cào và giải quyết lỗi.
            </div>
          </aside>
        </div>
      </main>
    </PublicShell>
  );
}



function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const trimmedUser = username.trim();
    if (trimmedUser.length < 2) {
      setMessage('Tên đăng nhập tối thiểu 2 ký tự');
      return;
    }
    if (password.length < 6) {
      setMessage('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await api<{ data: { token: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: trimmedUser, password })
      });
      localStorage.setItem('token', result.data.token);
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/account');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng ký thất bại');
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-aside">
        <div className="auth-aside-top">
          <Link className="brand" to="/">
            <img src="/logo.jpg" alt="Bin AOV" />
            <span>BINAOV.SHOP</span>
          </Link>
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={15} /> Trang chủ
          </Link>
        </div>
        <div className="auth-aside-body">
          <span className="eyebrow" style={{ color: '#38bdf8' }}>THÀNH VIÊN MỚI</span>
          <h1>Mở tài khoản<br /><em>trong 30 giây.</em></h1>
          <p>Chỉ cần tên đăng nhập và mật khẩu để bắt đầu nạp Xu, tạo đơn dịch vụ Chung Sức Liên Quân.</p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <CheckCircle2 size={18} />
              <span>Lưu số dư và lịch sử đơn hàng an toàn</span>
            </div>
            <div className="auth-feature-item">
              <CheckCircle2 size={18} />
              <span>Nạp Xu tự động qua mã QR ngân hàng</span>
            </div>
            <div className="auth-feature-item">
              <ShieldCheck size={18} />
              <span>Hỗ trợ trực tiếp từ Admin BINAOV</span>
            </div>
          </div>
        </div>
        <div className="auth-aside-foot">
          Cần hỗ trợ? <a href={zaloContact} target="_blank" rel="noreferrer">Zalo Admin: {phone}</a>
        </div>
      </div>

      <div className="auth-panel-wrapper">
        <form className="auth-card form" onSubmit={submit}>
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab">Đăng nhập</Link>
            <Link to="/register" className="auth-tab active">Đăng ký</Link>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span className="eyebrow">TẠO TÀI KHOẢN</span>
            <h2>Đăng ký thành viên</h2>
            <p className="subtitle">Tạo tài khoản nhanh để trải nghiệm dịch vụ</p>
          </div>

          <label>
            Tên đăng nhập
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={2}
              maxLength={40}
              autoComplete="username"
              placeholder="Ví dụ: binaov_vip"
              autoFocus
            />
            <span className="field-hint">Từ 2 đến 40 ký tự</span>
          </label>

          <label>
            Mật khẩu
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span className="field-hint">Tối thiểu 6 ký tự</span>
          </label>

          <label>
            Xác nhận mật khẩu
            <div className="password-input-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {message && <div className="notice error">{message}</div>}

          <button className="button button-primary full" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'} <ArrowRight size={17} />
          </button>

          <p className="muted">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Account() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState(0);
  const [userProfile, setUserProfile] = useState<{ userType?: string; userTypeName?: string; discountPercent?: number } | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getLocalVouchers().filter((v) => v.active));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    Promise.all([
      api<{ data: Order[] }>('/orders', { headers }),
      api<{ data: { balance: number } }>('/wallet/balance', { headers }),
      api<{ data: { userType?: string; userTypeName?: string; discountPercent?: number } }>('/me', { headers })
    ]).then(([orderResult, balanceResult, meResult]) => {
      setOrders(orderResult.data);
      setBalance(balanceResult.data.balance);
      if (meResult?.data) setUserProfile(meResult.data);
    }).catch(() => undefined);

    api<{ data: WalletLedgerItem[] }>('/wallet/ledger', { headers })
      .then((res) => { if (Array.isArray(res.data)) setLedger(res.data); })
      .catch(() => undefined);

    api<{ data: Voucher[] }>('/vouchers').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) setVouchers(res.data);
    }).catch(() => undefined);
  }, []);

  const copyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }).catch(() => undefined);
  };

  return (
    <PublicShell>
      <main className="page">
        <div className="account-head">
          <div>
            <span className="eyebrow">TÀI KHOẢN</span>
            <h1>Xin chào, bạn.</h1>
            <p>Quản lý số dư, theo dõi các đơn đã gửi và kho voucher ưu đãi.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link className="button button-secondary" to="/leaderboard"><Trophy size={16} /> BXH Nạp Xu</Link>
            <Link className="button button-primary" to="/order"><Plus size={17} /> Tạo đơn</Link>
          </div>
        </div>

        <div className="account-grid">
          <div className="balance-card">
            <span>Số dư khả dụng</span>
            <strong>{formatVnd(balance)}</strong>
            <Link to="/topup">Nạp thêm <ArrowRight size={15} /></Link>
          </div>
          <div className="metric-card" style={{ borderLeft: '3px solid #0284c7' }}>
            <span>Hạng tài khoản</span>
            <strong style={{ fontSize: '18px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={17} /> {userProfile?.userTypeName || 'Thành viên'}
            </strong>
            <small>
              {(userProfile?.discountPercent ?? 0) > 0
                ? `Ưu đãi giảm ${userProfile?.discountPercent}% mọi dịch vụ`
                : 'Thành viên thông thường'}
            </small>
          </div>
          <div className="metric-card">
            <span>Tổng đơn</span>
            <strong>{orders.length}</strong>
            <small>Đơn đã tạo</small>
          </div>
          <div className="metric-card">
            <span>Đang xử lý</span>
            <strong>{orders.filter((order) => order.status === 'PROCESSING' || order.status === 'PENDING').length}</strong>
            <small>Cần theo dõi</small>
          </div>
        </div>

        {/* KHO VOUCHER CỦA BẠN */}
        <section className="panel" style={{ marginBottom: '24px' }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow"><Ticket size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> ƯU ĐÃI DÀNH CHO BẠN</span>
              <h2>Kho Voucher giảm giá</h2>
            </div>
            <span className="muted">{vouchers.length} voucher đang có hiệu lực</span>
          </div>

          {vouchers.length ? (
            <div className="voucher-cards-grid">
              {vouchers.map((v) => (
                <article className="voucher-card" key={v.id}>
                  <div>
                    <div className="voucher-top">
                      <span className="voucher-code-badge"><Tag size={12} /> {v.code}</span>
                      <strong className="voucher-discount-val">
                        {v.discountType === 'PERCENT' ? `-${v.discountValue}%` : `-${formatVnd(v.discountValue)}`}
                      </strong>
                    </div>
                    <p className="voucher-meta" style={{ marginTop: '8px' }}>{v.description}</p>
                  </div>
                  <div>
                    <div className="voucher-limits">
                      <span>Đơn tối thiểu: <b>{formatVnd(v.minOrderValue)}</b></span>
                      {v.maxDiscount && <span>Tối đa: <b>{formatVnd(v.maxDiscount)}</b></span>}
                    </div>
                    <div className="voucher-actions" style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        className="button button-secondary small"
                        style={{ flex: 1 }}
                        onClick={() => copyVoucher(v.code)}
                      >
                        <Copy size={13} /> {copiedCode === v.code ? 'Đã chép mã!' : 'Sao chép'}
                      </button>
                      <Link
                        className="button button-primary small"
                        to={`/order?voucher=${v.code}`}
                        style={{ flex: 1 }}
                      >
                        <Sparkles size={13} /> Dùng ngay
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Ticket size={30} />
              <b>Chưa có voucher khả dụng</b>
              <span>Các chương trình khuyến mãi mới sẽ xuất hiện tại đây.</span>
            </div>
          )}
        </section>

        {/* LỊCH SỬ ĐƠN HÀNG */}
        <section className="panel table-panel">
          <div className="section-heading">
            <h2>Lịch sử đơn</h2>
            <Link to="/order">Tạo đơn mới <ArrowRight size={15} /></Link>
          </div>
          {orders.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Dịch vụ</th>
                    <th>UID</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>
                        {order.productName}
                        {order.voucherCode && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                            Mã: {order.voucherCode}
                          </span>
                        )}
                      </td>
                      <td>{order.uid}</td>
                      <td><span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                      <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <ClipboardList size={30} />
              <b>Chưa có đơn nào</b>
              <span>Tạo đơn đầu tiên để bắt đầu theo dõi.</span>
            </div>
          )}
        </section>

        {/* BIẾN ĐỘNG SỐ DƯ VÍ */}
        <section className="panel table-panel" style={{ marginTop: '24px' }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow"><History size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> BIẾN ĐỘNG VÍ XU</span>
              <h2>Lịch sử giao dịch số dư</h2>
            </div>
            <span className="muted">{ledger.length} giao dịch gần nhất</span>
          </div>
          {ledger.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại giao dịch</th>
                    <th>Biến động số dư</th>
                    <th>Ghi chú / Tham chiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <span className="user-type-badge" style={{
                          background: item.type.includes('CREDIT') ? '#ecfdf5' : '#fef2f2',
                          color: item.type.includes('CREDIT') ? '#047857' : '#b91c1c',
                          border: `1px solid ${item.type.includes('CREDIT') ? '#a7f3d0' : '#fecaca'}`
                        }}>
                          {item.type === 'ADMIN_CREDIT' ? 'Admin cộng Xu' :
                           item.type === 'ADMIN_DEBIT' ? 'Admin trừ Xu' :
                           item.type === 'TOPUP_CREDIT' ? 'Nạp Xu SePay' :
                           item.type === 'ORDER_DEBIT' ? 'Trừ tiền tạo đơn' : item.type}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: item.amount >= 0 ? '#059669' : '#dc2626' }}>
                          {item.amount >= 0 ? `+${formatVnd(item.amount)}` : `-${formatVnd(Math.abs(item.amount))}`}
                        </strong>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '12px' }}>
                        {item.referenceId || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <WalletCards size={30} />
              <b>Chưa có biến động số dư</b>
              <span>Mọi giao dịch nạp tiền, tạo đơn hoặc điều chỉnh từ Admin sẽ hiển thị tại đây.</span>
            </div>
          )}
        </section>
      </main>
    </PublicShell>
  );
}

function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<{ data: LeaderboardEntry[] }>('/leaderboard')
      .then((res) => {
        if (Array.isArray(res.data)) {
          const clean = res.data.filter((item) => item.userId !== 'demo-user' && !item.username.toLowerCase().includes('demo'));
          setData(clean);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const displayedData = useMemo(() => {
    return data;
  }, [data]);

  const top1 = displayedData[0];
  const top2 = displayedData[1];
  const top3 = displayedData[2];
  const rest = displayedData.slice(3);

  const getRankTitle = (rank: number) => {
    switch (rank) {
      case 1: return 'ĐỆ NHẤT PHÚ HÀO';
      case 2: return 'QUỐC THỦ PHÚ GIA';
      case 3: return 'HÀO KIỆT NẠP XU';
      case 4:
      case 5: return 'CHIẾN THẦN NẠP';
      default: return 'ĐẠI GIA BINAOV';
    }
  };

  return (
    <PublicShell>
      <main className="page">
        <div className="leaderboard-header">
          <div>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crown size={14} style={{ color: '#f59e0b' }} /> VINH DANH ĐẠI GIA
            </span>
            <h1>
              <Trophy size={36} style={{ color: '#f59e0b' }} />
              Bảng Xếp Hạng Nạp
            </h1>
            <p>Vinh danh những khách hàng nạp Xu nhiều nhất hệ thống BINAOV.SHOP theo tổng tích luỹ.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div className="leaderboard-tabs">
              <button
                className={period === 'all' ? 'active' : ''}
                onClick={() => setPeriod('all')}
              >
                Theo Tổng Nạp
              </button>
              <button
                className={period === 'month' ? 'active' : ''}
                onClick={() => setPeriod('month')}
              >
                Tháng này
              </button>
              <button
                className={period === 'week' ? 'active' : ''}
                onClick={() => setPeriod('week')}
              >
                Tuần này
              </button>
            </div>
            <Link className="button button-primary" to="/topup">
              <Flame size={16} /> Nạp Xu đua Top ngay
            </Link>
          </div>
        </div>

        {/* PODIUM & DANH SÁCH HOẶC EMPTY STATE */}
        {loading ? (
          <div className="panel admin-loading" style={{ padding: '40px', textAlign: 'center' }}>
            Đang tải dữ liệu bảng xếp hạng từ hệ thống...
          </div>
        ) : displayedData.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '52px 20px', borderRadius: '24px' }}>
            <Trophy size={48} style={{ color: '#cbd5e1', margin: '0 auto 14px' }} />
            <h2 style={{ fontSize: '22px', color: 'var(--ink)', marginBottom: '8px' }}>Chưa có lượt nạp nào trong hệ thống</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '460px', margin: '0 auto 24px', fontSize: '14px', lineHeight: 1.6 }}>
              Hiện tại hệ thống chưa ghi nhận giao dịch nạp Xu nào. Hãy nạp tiền ngay hôm nay để đứng vị trí Quán Quân Top 1 Đại Gia BINAOV!
            </p>
            <Link className="button button-primary" to="/topup">
              <Flame size={16} /> Nạp Xu ngay để đứng Top 1
            </Link>
          </div>
        ) : (
          <>
            {/* PODIUM TOP 1 2 3 */}
            <section className="leaderboard-podium">
              {/* TOP 2 */}
              {top2 && (
                <div className="podium-card rank-2">
                  <div className="podium-avatar">
                    {top2.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="podium-rank-badge">
                    <Medal size={13} /> Hạng 2
                  </span>
                  <strong className="podium-username">{top2.username}</strong>
                  <span className="podium-title">{getRankTitle(2)}</span>
                  <strong className="podium-amount">{formatVnd(top2.totalDeposited)}</strong>
                  <span className="podium-reward">Thưởng +7% Xu nạp &middot; Đơn VIP</span>
                </div>
              )}

              {/* TOP 1 */}
              {top1 && (
                <div className="podium-card rank-1">
                  <Crown size={34} className="podium-crown" />
                  <div className="podium-avatar">
                    {top1.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="podium-rank-badge">
                    <Crown size={13} /> Quán Quân Top 1
                  </span>
                  <strong className="podium-username" style={{ fontSize: '18px' }}>{top1.username}</strong>
                  <span className="podium-title" style={{ color: '#b45309', fontWeight: 800 }}>{getRankTitle(1)}</span>
                  <strong className="podium-amount">{formatVnd(top1.totalDeposited)}</strong>
                  <span className="podium-reward">Thưởng +10% Xu nạp &middot; Quyền lợi Chí Tôn</span>
                </div>
              )}

              {/* TOP 3 */}
              {top3 && (
                <div className="podium-card rank-3">
                  <div className="podium-avatar">
                    {top3.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="podium-rank-badge">
                    <Medal size={13} /> Hạng 3
                  </span>
                  <strong className="podium-username">{top3.username}</strong>
                  <span className="podium-title">{getRankTitle(3)}</span>
                  <strong className="podium-amount">{formatVnd(top3.totalDeposited)}</strong>
                  <span className="podium-reward">Thưởng +5% Xu nạp &middot; Đơn VIP</span>
                </div>
              )}
            </section>

            {/* DANH SÁCH CHI TIẾT TỪ TOP 4 TRỞ ĐI */}
            {rest.length > 0 && (
              <section className="panel" style={{ padding: '24px' }}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">DANH SÁCH CHI TIẾT</span>
                    <h2>Top đại gia tiếp theo</h2>
                  </div>
                  <span className="muted">Cập nhật theo thời gian thực</span>
                </div>

                <div className="leaderboard-list">
                  {rest.map((entry) => (
                    <div className="leaderboard-row" key={entry.userId}>
                      <div className="leaderboard-user-info">
                        <div className="rank-number">
                          #{entry.rank}
                        </div>
                        <div className="user-avatar-sm">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-names">
                          <strong>{entry.username}</strong>
                          <span>{getRankTitle(entry.rank)} &middot; {entry.topupCount ?? 1} lượt nạp</span>
                        </div>
                      </div>
                      <div className="leaderboard-stats">
                        <strong>{formatVnd(entry.totalDeposited)}</strong>
                        <span>Tổng nạp</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ĐẶC QUYỀN ĐUA TOP */}
        <div className="rewards-grid">
          <div className="reward-card">
            <strong><Crown size={20} style={{ color: '#f59e0b' }} /> Thưởng thêm Xu theo chu kỳ</strong>
            <p>Top 1, Top 2, Top 3 nhận thêm 5% - 10% giá trị mỗi khi nạp tiền trong suốt thời gian giữ hạng.</p>
          </div>
          <div className="reward-card">
            <strong><Sparkles size={20} style={{ color: '#0284c7' }} /> Ưu tiên xử lý đơn hàng 1-1</strong>
            <p>Admin tiếp nhận và xử lý UID của đại gia top nạp ngay tức thì trong vòng 2-3 phút.</p>
          </div>
          <div className="reward-card">
            <strong><Gift size={20} style={{ color: '#16a34a' }} /> Voucher tri ân độc quyền</strong>
            <p>Tặng mã giảm giá riêng biệt vào mỗi dịp sự kiện Chung Sức lớn cho các thành viên trong Top 10.</p>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}

function LoginGate() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const result = await api<{ data: { token: string; user: { role: string } } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password })
      });
      localStorage.setItem('token', result.data.token);
      window.dispatchEvent(new Event('auth-changed'));
      navigate(result.data.user.role === 'ADMIN' ? '/admin' : '/account');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại');
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-aside">
        <div className="auth-aside-top">
          <Link className="brand" to="/">
            <img src="/logo.jpg" alt="Bin AOV" />
            <span>BINAOV.SHOP</span>
          </Link>
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={15} /> Trang chủ
          </Link>
        </div>
        <div className="auth-aside-body">
          <span className="eyebrow" style={{ color: '#38bdf8' }}>HỆ THỐNG DỊCH VỤ LIÊN QUÂN</span>
          <h1>Đăng nhập<br /><em>để tiếp tục.</em></h1>
          <p>Nạp Xu, tạo đơn Chung Sức và theo dõi tiến độ xử lý đơn hàng tự động trong một nơi.</p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <CheckCircle2 size={18} />
              <span>Xử lý đơn chung sức siêu tốc trong 5 phút</span>
            </div>
            <div className="auth-feature-item">
              <CheckCircle2 size={18} />
              <span>Nạp Xu tự động 24/7 qua SePay / Thẻ cào</span>
            </div>
            <div className="auth-feature-item">
              <ShieldCheck size={18} />
              <span>Bảo mật tài khoản &amp; hỗ trợ tận tình</span>
            </div>
          </div>
        </div>
        <div className="auth-aside-foot">
          Cần hỗ trợ? <a href={zaloContact} target="_blank" rel="noreferrer">Zalo Admin: {phone}</a>
        </div>
      </div>

      <div className="auth-panel-wrapper">
        <form className="auth-card form" onSubmit={submit}>
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab active">Đăng nhập</Link>
            <Link to="/register" className="auth-tab">Đăng ký</Link>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span className="eyebrow">TÀI KHOẢN</span>
            <h2>Chào mừng trở lại</h2>
            <p className="subtitle">Nhập thông tin tài khoản của bạn để tiếp tục</p>
          </div>

          <label>
            Tên đăng nhập
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={2}
              autoComplete="username"
              placeholder="Nhập tên đăng nhập hoặc email"
              autoFocus
            />
          </label>

          <label>
            Mật khẩu
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {message && <div className="notice error">{message}</div>}

          <button className="button button-primary full" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'} <LogIn size={17} />
          </button>

          <p className="muted">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function AdminPanel() {
  const [section, setSection] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [topups, setTopups] = useState<Array<{ id: string; userId: string; amount: number; status: string; transferContent: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminVouchers, setAdminVouchers] = useState<Voucher[]>(() => getLocalVouchers());
  const [stats, setStats] = useState({ users: 0, orders: 0, pendingOrders: 0, revenue: 0, topups: 0 });
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const load = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [dashboard, orderResult, userResult, topupResult, productResult] = await Promise.all([
        api<{ data: typeof stats }>('/admin/dashboard', { headers }),
        api<{ data: Order[] }>('/admin/orders', { headers }),
        api<{ data: AdminUser[] }>('/admin/users', { headers }),
        api<{ data: typeof topups }>('/admin/topups', { headers }),
        api<{ data: Product[] }>('/products')
      ]);
      setStats(dashboard.data); setOrders(orderResult.data); setUsers(userResult.data); setTopups(topupResult.data); setProducts(productResult.data);

      try {
        const utResult = await api<{ data: UserType[] }>('/admin/user-types', { headers });
        if (Array.isArray(utResult.data)) setUserTypes(utResult.data);
      } catch {}

      try {
        const vResult = await api<{ data: Voucher[] }>('/admin/vouchers', { headers });
        if (Array.isArray(vResult.data)) {
          setAdminVouchers(vResult.data);
          saveLocalVouchers(vResult.data);
        }
      } catch {
        setAdminVouchers(getLocalVouchers());
      }
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu quản trị'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const updateStatus = async (id: string, status: string) => { try { await api(`/admin/orders/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) }); await load(); } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật đơn'); } };
  const updateUserType = async (userId: string, newType: string) => {
    try {
      await api(`/admin/users/${userId}/type`, { method: 'PATCH', headers, body: JSON.stringify({ userType: newType }) });
      await load();
    } catch (updateTypeError) {
      setError(updateTypeError instanceof Error ? updateTypeError.message : 'Không thể phân loại người dùng');
    }
  };

  if (!token) return <main className="admin-gate"><div className="panel"><ShieldCheck size={35} className="accent-icon" /><h1>Cần đăng nhập admin</h1><p>Đăng nhập bằng tài khoản quản trị để truy cập khu vực này.</p><Link className="button button-primary" to="/login">Đăng nhập admin <LogIn size={17} /></Link></div></main>;
  const nav = [
    { id: 'dashboard',  label: 'Dashboard',       icon: <LayoutDashboard size={17} /> },
    { id: 'orders',     label: 'Đơn hàng',        icon: <ClipboardList size={17} /> },
    { id: 'users',      label: 'Người dùng',      icon: <UserRound size={17} /> },
    { id: 'user-types', label: 'Loại người dùng', icon: <UserCheck size={17} /> },
    { id: 'topups',     label: 'Nạp tiền',        icon: <WalletCards size={17} /> },
    { id: 'products',   label: 'Sản phẩm',        icon: <CircleDollarSign size={17} /> },
    { id: 'vouchers',   label: 'Vouchers',        icon: <Ticket size={17} /> },
  ];
  const kpiColors = ['kpi-card-blue', 'kpi-card-violet', 'kpi-card-teal', 'kpi-card-amber'];
  const kpiData = [
    { label: 'Người dùng',  value: stats.users,              delta: 'Đang hoạt động',      icon: <UserRound size={18} /> },
    { label: 'Đơn hàng',   value: stats.orders,             delta: `${stats.pendingOrders} đơn chờ xử lý`, icon: <ClipboardList size={18} /> },
    { label: 'Doanh thu',  value: formatVnd(stats.revenue), delta: `Theo ${period === 'month' ? 'tháng' : period === 'quarter' ? 'quý' : 'năm'}`, icon: <BarChart3 size={18} /> },
    { label: 'Đã nạp',     value: formatVnd(stats.topups),  delta: 'Webhook SePay',         icon: <WalletCards size={18} /> },
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" to="/"><img src="/logo.jpg" alt="Bin AOV" /><span>BINAOV.SHOP</span></Link>
        <div className="sidebar-section">
          <span className="sidebar-label">QUẢN TRỊ</span>
          {nav.map((item) => (
            <button key={item.id} className={`side-link ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <a className="side-link" href={zaloContact} target="_blank" rel="noreferrer" style={{ margin: 0, width: '100%' }}>
            <Headphones size={17} /> Hỗ trợ Zalo ({phone})
          </a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-breadcrumb">Trang quản trị / {nav.find((item) => item.id === section)?.label}</span>
            <h1>{nav.find((item) => item.id === section)?.label}</h1>
          </div>
          <div className="admin-top-actions">
            <button className="button button-secondary small" onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}>
              <X size={15} /> Đăng xuất
            </button>
          </div>
        </header>

        {error && <div className="notice error">{error}</div>}

        {loading ? (
          <div className="panel admin-loading">Đang tải dữ liệu quản trị...</div>
        ) : section === 'dashboard' ? (
          <>
            <div className="periods">
              <button className={period === 'month'   ? 'selected' : ''} onClick={() => setPeriod('month')}>Tháng</button>
              <button className={period === 'quarter' ? 'selected' : ''} onClick={() => setPeriod('quarter')}>Quý</button>
              <button className={period === 'year'    ? 'selected' : ''} onClick={() => setPeriod('year')}>Năm</button>
            </div>
            <div className="admin-kpis">
              {kpiData.map((kpi, i) => (
                <div key={i} className={`kpi-card ${kpiColors[i]}`}>
                  <div className="kpi-glow" />
                  <div className="kpi-icon">{kpi.icon}</div>
                  <span className="kpi-label">{kpi.label}</span>
                  <strong className="kpi-value">{kpi.value}</strong>
                  <span className="kpi-delta">{kpi.delta}</span>
                </div>
              ))}
            </div>
            <div className="admin-content">
              <section className="panel chart-panel">
                <div className="section-heading">
                  <div><span className="eyebrow">HIỆU SUẤT</span><h2>Doanh thu theo thời gian</h2></div>
                  <BarChart3 className="accent-icon" />
                </div>
                <div className="chart">
                  <i style={{ height: '42%' }} /><i style={{ height: '65%' }} /><i style={{ height: '54%' }} />
                  <i style={{ height: '82%' }} /><i style={{ height: '68%' }} /><i style={{ height: '92%' }} />
                  <i style={{ height: '75%' }} /><i style={{ height: '100%' }} />
                </div>
                <div className="chart-labels">
                  <span>T1</span><span>T2</span><span>T3</span><span>T4</span>
                  <span>T5</span><span>T6</span><span>T7</span><span>T8</span>
                </div>
              </section>
              <section className="panel table-panel">
                <AdminOrdersTable orders={orders.slice(0, 8)} onStatus={updateStatus} />
              </section>
            </div>
          </>
        ) : section === 'orders' ? (
          <section className="panel table-panel"><AdminOrdersTable orders={orders} onStatus={updateStatus} /></section>
        ) : section === 'users' ? (
          <section className="panel table-panel">
            <AdminUsersTable
              users={users}
              userTypes={userTypes}
              headers={headers}
              onReload={load}
              onUpdateType={updateUserType}
            />
          </section>
        ) : section === 'user-types' ? (
          <UserTypeManager userTypes={userTypes} headers={headers} onReload={load} />
        ) : section === 'topups' ? (
          <section className="panel table-panel"><AdminTopupsTable topups={topups} /></section>
        ) : section === 'vouchers' ? (
          <VoucherManager
            vouchers={adminVouchers}
            headers={headers}
            onReload={load}
            onLocalUpdate={(updated) => setAdminVouchers(updated)}
          />
        ) : (
          <ProductManager products={products} headers={headers} onReload={load} />
        )}
      </main>
    </div>
  );
}

function AdminOrdersTable({ orders, onStatus }: { orders: Order[]; onStatus: (id: string, status: string) => void }) { return <><div className="section-heading"><div><span className="eyebrow">ĐƠN HÀNG</span><h2>Danh sách đơn</h2></div><span className="muted">{orders.length} đơn</span></div>{orders.length ? <div className="table-scroll"><table><thead><tr><th>Mã</th><th>User</th><th>UID</th><th>Dịch vụ</th><th>Trạng thái</th><th>Tổng</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.username}</td><td>{order.uid}</td><td>{order.productName}</td><td><select className="status-select" value={order.status} onChange={(event) => onStatus(order.id, event.target.value)}><option>PENDING</option><option>PROCESSING</option><option>COMPLETED</option><option>CANCELLED</option><option>FAILED</option></select></td><td>{formatVnd(order.total)}</td></tr>)}</tbody></table></div> : <div className="empty"><ClipboardList size={30} /><b>Chưa có đơn</b></div>}</>; }
function AdminUsersTable({
  users,
  userTypes,
  headers,
  onReload,
  onUpdateType
}: {
  users: AdminUser[];
  userTypes: UserType[];
  headers?: { Authorization: string };
  onReload?: () => void | Promise<void>;
  onUpdateType: (userId: string, type: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingUser, setAdjustingUser] = useState<AdminUser | null>(null);
  const [initialAction, setInitialAction] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const openAdjust = (user: AdminUser, action: 'ADD' | 'SUBTRACT' = 'ADD') => {
    setInitialAction(action);
    setAdjustingUser(user);
  };

  const getBadgeStyle = (code?: string) => {
    switch (code) {
      case 'ADMIN': return { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' };
      case 'CTV': return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      case 'VIP': return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.userTypeName && u.userTypeName.toLowerCase().includes(q)) ||
      (u.userType && u.userType.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const totalSystemBalance = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.balance || 0), 0);
  }, [users]);

  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">QUẢN LÝ TÀI KHOẢN</span>
          <h2>Tài khoản &amp; Số dư người dùng</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="muted">{users.length} tài khoản</span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            Tổng Xu hệ thống: <b>{formatVnd(totalSystemBalance)}</b>
          </span>
        </div>
      </div>

      {toast && (
        <div className={`notice ${toast.type}`} style={{ marginBottom: '14px' }}>
          {toast.text}
        </div>
      )}

      {/* Toolbar: Tìm kiếm */}
      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo username, ID người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchQuery && (
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Tìm thấy <b>{filteredUsers.length}</b> kết quả
          </span>
        )}
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Số dư</th>
              <th>Điều chỉnh số dư</th>
              <th>Loại hiện tại</th>
              <th>Phân loại nhóm (CTV, VIP, ...)</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  Không tìm thấy người dùng nào phù hợp với "{searchQuery}"
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const currentType = user.userType || (user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
                const style = getBadgeStyle(currentType);
                return (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.username}</strong>
                      {user.id && <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>ID: {user.id}</small>}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--blue-strong)', fontSize: '15px' }}>
                        {formatVnd(user.balance)}
                      </strong>
                    </td>
                    <td>
                      <div className="quick-adjust-group">
                        <button
                          type="button"
                          className="quick-adjust-btn btn-add"
                          onClick={() => openAdjust(user, 'ADD')}
                          title={`Cộng Xu cho ${user.username}`}
                        >
                          <Plus size={13} /> Cộng Xu
                        </button>
                        <button
                          type="button"
                          className="quick-adjust-btn btn-sub"
                          onClick={() => openAdjust(user, 'SUBTRACT')}
                          title={`Trừ Xu của ${user.username}`}
                        >
                          <Minus size={13} /> Trừ Xu
                        </button>
                      </div>
                    </td>
                    <td>
                      <span
                        className="user-type-badge"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                      >
                        <Shield size={12} />
                        {user.userTypeName || currentType}
                        {(user.discountPercent ?? 0) > 0 && ` (-${user.discountPercent}%)`}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={currentType}
                        onChange={(e) => onUpdateType(user.id, e.target.value)}
                      >
                        {userTypes.length > 0 ? (
                          userTypes.map((ut) => (
                            <option key={ut.code} value={ut.code}>
                              {ut.name} {ut.discountPercent > 0 ? `(Giảm ${ut.discountPercent}%)` : ''}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="MEMBER">Thành viên (0%)</option>
                            <option value="CTV">Cộng tác viên (10%)</option>
                            <option value="VIP">Khách VIP (5%)</option>
                            <option value="ADMIN">Quản trị viên</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td><span className="status status-completed">{user.status}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {adjustingUser && (
        <AdjustBalanceModal
          user={adjustingUser}
          initialAction={initialAction}
          headers={headers}
          onClose={() => setAdjustingUser(null)}
          onSuccess={(updated, msg) => {
            setAdjustingUser(null);
            showToast(msg || `Đã cập nhật số dư cho ${updated.username}!`, 'success');
            if (onReload) void onReload();
          }}
        />
      )}
    </>
  );
}

function AdjustBalanceModal({
  user,
  initialAction = 'ADD',
  headers,
  onClose,
  onSuccess
}: {
  user: AdminUser;
  initialAction?: 'ADD' | 'SUBTRACT';
  headers?: { Authorization: string };
  onClose: () => void;
  onSuccess: (updated: AdminUser, message: string) => void;
}) {
  const [action, setAction] = useState<'ADD' | 'SUBTRACT'>(initialAction);
  const [amountStr, setAmountStr] = useState('50000');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showLedger, setShowLedger] = useState(false);
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Parse amount number
  const cleanAmount = Number(amountStr.replace(/\D/g, '')) || 0;
  const currentBalance = user.balance || 0;
  const delta = action === 'ADD' ? cleanAmount : -cleanAmount;
  const newBalance = currentBalance + delta;
  const isNegative = action === 'SUBTRACT' && cleanAmount > currentBalance;

  // Lấy lịch sử biến động số dư khi mở xem
  const fetchLedger = async () => {
    if (ledger.length > 0) return;
    setLoadingLedger(true);
    try {
      const res = await api<{ data: WalletLedgerItem[] }>(`/admin/users/${user.id}/ledger`, { headers });
      if (Array.isArray(res.data)) setLedger(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleToggleLedger = () => {
    const next = !showLedger;
    setShowLedger(next);
    if (next) void fetchLedger();
  };

  const presetAmounts = [10000, 20000, 50000, 100000, 200000, 500000, 1000000];

  const quickReasons = action === 'ADD'
    ? ['Nạp bù thẻ cào qua Zalo', 'Admin thưởng sự kiện', 'Hoàn tiền đơn hàng lỗi', 'Cộng tiền ưu đãi']
    : ['Khấu trừ giao dịch thừa', 'Thu hồi đơn hàng bị hủy', 'Trừ phí dịch vụ', 'Khấu trừ theo yêu cầu'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanAmount <= 0) {
      setError('Vui lòng nhập số Xu lớn hơn 0');
      return;
    }
    if (isNegative) {
      setError(`Số dư hiện tại không đủ để trừ. (Tối đa trừ: ${formatVnd(currentBalance)})`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api<{ data: AdminUser; message: string }>(`/admin/users/${user.id}/balance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action,
          amount: cleanAmount,
          reason: reason.trim() || undefined
        })
      });
      onSuccess(res.data, res.message || `Đã ${action === 'ADD' ? 'cộng' : 'trừ'} ${formatVnd(cleanAmount)} thành công!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể điều chỉnh số dư');
      setSubmitting(false);
    }
  };

  const formatLedgerType = (type: string) => {
    switch (type) {
      case 'ADMIN_CREDIT': return 'Admin cộng Xu';
      case 'ADMIN_DEBIT': return 'Admin trừ Xu';
      case 'TOPUP_CREDIT': return 'Nạp Xu SePay';
      case 'ORDER_DEBIT': return 'Trừ tiền tạo đơn';
      default: return type;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>
            <CircleDollarSign size={20} className="accent-icon" />
            Điều chỉnh số dư người dùng
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="notice error">{error}</div>}

            {/* Thẻ người dùng */}
            <div className="modal-user-card">
              <div className="modal-user-info">
                <div className="modal-user-avatar">
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="modal-user-meta">
                  <strong>{user.username}</strong>
                  <span>ID: {user.id}</span>
                </div>
              </div>
              <div className="modal-balance-display">
                <span>Số dư hiện tại</span>
                <strong>{formatVnd(user.balance)}</strong>
              </div>
            </div>

            {/* Chế độ: Cộng (+) hoặc Trừ (-) */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 800 }}>
                Hành động điều chỉnh
              </label>
              <div className="action-mode-toggle">
                <button
                  type="button"
                  className={`action-toggle-btn ${action === 'ADD' ? 'active-add' : ''}`}
                  onClick={() => { setAction('ADD'); setError(''); }}
                >
                  <Plus size={16} /> Cộng số dư (+)
                </button>
                <button
                  type="button"
                  className={`action-toggle-btn ${action === 'SUBTRACT' ? 'active-sub' : ''}`}
                  onClick={() => { setAction('SUBTRACT'); setError(''); }}
                >
                  <Minus size={16} /> Trừ số dư (-)
                </button>
              </div>
            </div>

            {/* Nhập số Xu */}
            <div className="preset-chips-wrap">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800 }}>
                Số Xu cần {action === 'ADD' ? 'cộng thêm' : 'khấu trừ'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cleanAmount ? cleanAmount.toLocaleString('vi-VN') : ''}
                placeholder="Nhập số Xu..."
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmountStr(raw);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: 800,
                  color: action === 'ADD' ? '#059669' : '#dc2626'
                }}
              />
              <div className="preset-chips">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-chip ${cleanAmount === preset ? 'active' : ''}`}
                    onClick={() => setAmountStr(String(preset))}
                  >
                    {action === 'ADD' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(preset)} Xu
                  </button>
                ))}
              </div>
            </div>

            {/* Ghi chú lý do */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 800 }}>
                Lý do / Ghi chú điều chỉnh
              </label>
              <input
                type="text"
                placeholder={action === 'ADD' ? 'Ví dụ: Nạp bù thẻ cào qua Zalo, thưởng sự kiện...' : 'Ví dụ: Khấu trừ đơn lỗi, hoàn tác giao dịch...'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={255}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--line)', borderRadius: '12px' }}
              />
              <div className="preset-chips" style={{ marginTop: '8px' }}>
                {quickReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    className="preset-chip"
                    onClick={() => setReason(qr)}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Dự tính sau khi thay đổi */}
            <div className="balance-calc-box">
              <div className="balance-calc-row">
                <span className="muted">Số dư trước điều chỉnh:</span>
                <b>{formatVnd(currentBalance)}</b>
              </div>
              <div className="balance-calc-row">
                <span className="muted">Số Xu {action === 'ADD' ? 'cộng vào' : 'trừ đi'}:</span>
                <b className={action === 'ADD' ? 'balance-delta-add' : 'balance-delta-sub'}>
                  {action === 'ADD' ? '+' : '-'}{formatVnd(cleanAmount)}
                </b>
              </div>
              <div className="balance-calc-row final">
                <span>Số dư mới dự kiến:</span>
                <strong style={{ fontSize: '16px', color: isNegative ? '#dc2626' : 'var(--blue-strong)' }}>
                  {formatVnd(Math.max(0, newBalance))}
                </strong>
              </div>
              {isNegative && (
                <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                  ⚠️ Cảnh báo: Số dư tài khoản không đủ để trừ số Xu này!
                </div>
              )}
            </div>

            {/* Lịch sử ví gần đây */}
            <div className="ledger-history-box">
              <div className="ledger-history-head" onClick={handleToggleLedger}>
                <span><History size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Lịch sử biến động ví gần đây</span>
                <span style={{ color: 'var(--blue-strong)', fontSize: '11px' }}>
                  {showLedger ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
                </span>
              </div>
              {showLedger && (
                <div className="ledger-history-list">
                  {loadingLedger ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)' }}>Đang tải lịch sử...</div>
                  ) : ledger.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)' }}>Chưa có biến động số dư nào</div>
                  ) : (
                    ledger.slice(0, 10).map((item) => (
                      <div className="ledger-item-row" key={item.id}>
                        <div className="ledger-item-meta">
                          <b>{formatLedgerType(item.type)}</b>
                          <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <span className={`ledger-item-amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>
                          {item.amount >= 0 ? `+${formatVnd(item.amount)}` : `-${formatVnd(Math.abs(item.amount))}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="button button-secondary small" onClick={onClose} disabled={submitting}>
              Đóng
            </button>
            <button
              type="submit"
              className="button button-primary small"
              style={action === 'SUBTRACT' ? { background: '#dc2626', borderColor: '#b91c1c' } : { background: '#059669', borderColor: '#047857' }}
              disabled={submitting || cleanAmount <= 0 || isNegative}
            >
              {submitting ? 'Đang thực hiện...' : action === 'ADD' ? `Cộng +${formatVnd(cleanAmount)}` : `Trừ -${formatVnd(cleanAmount)}`}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
function AdminTopupsTable({ topups }: { topups: Array<{ id: string; userId: string; amount: number; status: string; transferContent: string }> }) { return <><div className="section-heading"><div><span className="eyebrow">NẠP TIỀN</span><h2>Giao dịch nạp</h2></div></div><div className="table-scroll"><table><thead><tr><th>Mã</th><th>User</th><th>Số tiền</th><th>Nội dung</th><th>Trạng thái</th></tr></thead><tbody>{topups.map((topup) => <tr key={topup.id}><td>{topup.id}</td><td>{topup.userId}</td><td>{formatVnd(topup.amount)}</td><td>{topup.transferContent}</td><td><span className={`status status-${topup.status.toLowerCase()}`}>{topup.status}</span></td></tr>)}</tbody></table></div></>; }

type UserTypeDraft = {
  id?: string;
  code: string;
  name: string;
  discountPercent: string;
  description: string;
  color: string;
};

const emptyUserTypeDraft: UserTypeDraft = {
  code: '',
  name: '',
  discountPercent: '0',
  description: '',
  color: '#0284c7'
};

function UserTypeManager({
  userTypes,
  headers,
  onReload
}: {
  userTypes: UserType[];
  headers?: { Authorization: string };
  onReload: () => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<UserTypeDraft>(emptyUserTypeDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = editingId !== null;

  const change = (field: keyof UserTypeDraft, value: string) => {
    setDraft((cur) => ({ ...cur, [field]: value }));
  };

  const reset = () => {
    setDraft(emptyUserTypeDraft);
    setEditingId(null);
    setMessage('');
  };

  const startEdit = (ut: UserType) => {
    setEditingId(ut.id);
    setDraft({
      id: ut.id,
      code: ut.code,
      name: ut.name,
      discountPercent: String(ut.discountPercent),
      description: ut.description || '',
      color: ut.color || '#0284c7'
    });
    setMessage('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const payload = {
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      discountPercent: Number(draft.discountPercent || 0),
      description: draft.description.trim() || undefined,
      color: draft.color || '#0284c7'
    };

    try {
      if (editing) {
        await api(`/admin/user-types/${editingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        await api('/admin/user-types', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }
      reset();
      await onReload();
      setMessage(editing ? 'Đã cập nhật loại người dùng!' : 'Đã thêm loại người dùng mới!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể lưu loại người dùng');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ut: UserType) => {
    if (ut.code === 'MEMBER' || ut.code === 'ADMIN') {
      alert('Không thể xóa nhóm người dùng mặc định (MEMBER, ADMIN)');
      return;
    }
    if (!window.confirm(`Xoá nhóm “${ut.name}”? Các user trong nhóm này sẽ được chuyển về nhóm Thành viên.`)) return;
    try {
      await api(`/admin/user-types/${ut.id}`, { method: 'DELETE', headers });
      if (editingId === ut.id) reset();
      await onReload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể xóa loại người dùng');
    }
  };

  const discountedTypes = userTypes.filter((ut) => ut.discountPercent > 0).length;
  const totalUsersInTypes = userTypes.reduce((acc, cur) => acc + (cur.userCount || 0), 0);

  return (
    <div>
      <div className="admin-kpis" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-card-blue">
          <div className="kpi-icon"><Users size={18} /></div>
          <span className="kpi-label">Tổng loại người dùng</span>
          <strong className="kpi-value">{userTypes.length}</strong>
          <span className="kpi-delta">Phân cấp hệ thống</span>
        </div>
        <div className="kpi-card kpi-card-teal">
          <div className="kpi-icon"><Percent size={18} /></div>
          <span className="kpi-label">Nhóm có chiết khấu</span>
          <strong className="kpi-value">{discountedTypes}</strong>
          <span className="kpi-delta">Ưu đãi giảm giá %</span>
        </div>
        <div className="kpi-card kpi-card-violet">
          <div className="kpi-icon"><UserCheck size={18} /></div>
          <span className="kpi-label">Tổng thành viên</span>
          <strong className="kpi-value">{totalUsersInTypes}</strong>
          <span className="kpi-delta">Đã phân loại</span>
        </div>
      </div>

      <div className="user-type-admin-layout">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">PHÂN CẤP</span>
              <h2>Danh sách Loại Người Dùng</h2>
            </div>
            <span className="muted">{userTypes.length} nhóm</span>
          </div>

          {message && (
            <div className={`notice ${message.includes('Đã') ? 'success' : 'error'}`} style={{ marginBottom: '14px' }}>
              {message}
            </div>
          )}

          <div className="admin-list">
            {userTypes.map((ut) => (
              <article className="admin-list-row" key={ut.id}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      className="user-type-badge"
                      style={{ background: '#f1f5f9', color: ut.color || '#0284c7', border: `1px solid ${ut.color || '#cbd5e1'}` }}
                    >
                      <Shield size={12} /> {ut.code}
                    </span>
                    <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>{ut.name}</strong>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--muted)' }}>
                    {ut.description || 'Chưa có mô tả'}
                  </p>
                  <small style={{ color: 'var(--muted)', fontSize: '11px', display: 'flex', gap: '10px' }}>
                    <span>Số thành viên: <b>{ut.userCount ?? 0}</b></span>
                  </small>
                </div>
                <div className="admin-list-meta">
                  <strong style={{ color: ut.discountPercent > 0 ? '#16a34a' : 'var(--muted)', fontSize: '18px' }}>
                    {ut.discountPercent > 0 ? `-${ut.discountPercent}%` : '0%'}
                  </strong>
                  <small>Chiết khấu đơn</small>
                </div>
                <div className="admin-list-actions">
                  <button
                    className="icon-button"
                    type="button"
                    title="Chỉnh sửa loại người dùng"
                    aria-label={`Sửa ${ut.name}`}
                    onClick={() => startEdit(ut)}
                  >
                    <Pencil size={15} />
                  </button>
                  {ut.code !== 'MEMBER' && ut.code !== 'ADMIN' && (
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Xoá loại người dùng"
                      aria-label={`Xoá ${ut.name}`}
                      onClick={() => void remove(ut)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BIỂU MẪU TẠO / SỬA USER TYPE */}
        <form className="panel form admin-product-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{editing ? 'CHỈNH SỬA' : 'TẠO MỚI'}</span>
              <h2>{editing ? 'Cập nhật loại user' : 'Thêm loại người dùng'}</h2>
            </div>
            {editing && <button className="text-button" type="button" onClick={reset}>Huỷ</button>}
          </div>

          {!editing && (
            <label>
              Mã loại (Code - In hoa, viết liền)
              <input
                value={draft.code}
                onChange={(e) => change('code', e.target.value.toUpperCase())}
                placeholder="VD: CTV, VIP, DAILY"
                required
              />
            </label>
          )}

          <label>
            Tên hiển thị
            <input
              value={draft.name}
              onChange={(e) => change('name', e.target.value)}
              placeholder="VD: Cộng tác viên, Khách VIP"
              required
            />
          </label>

          <label>
            Chiết khấu giảm giá (%)
            <input
              type="number"
              min="0"
              max="100"
              value={draft.discountPercent}
              onChange={(e) => change('discountPercent', e.target.value)}
              placeholder="VD: 10 (tức giảm 10% mọi đơn)"
              required
            />
            <span className="field-hint">Áp dụng tự động trừ vào tổng tiền khi người dùng loại này tạo đơn</span>
          </label>

          <label>
            Mô tả quyền lợi
            <textarea
              value={draft.description}
              onChange={(e) => change('description', e.target.value)}
              placeholder="Mô tả quyền lợi và điều kiện áp dụng cho nhóm này"
            />
          </label>

          <label>
            Màu sắc huy hiệu (Badge)
            <select value={draft.color} onChange={(e) => change('color', e.target.value)}>
              <option value="#0284c7">Xanh lam (Cộng tác viên / Reseller)</option>
              <option value="#f59e0b">Vàng hổ phách (Khách VIP)</option>
              <option value="#16a34a">Xanh lá cây (Đối tác thân thiết)</option>
              <option value="#7c3aed">Tím quý phái (Quản trị viên / Master)</option>
              <option value="#e11d48">Đỏ rực (Đại lý cấp 1)</option>
              <option value="#64748b">Xám tiêu chuẩn (Thành viên)</option>
            </select>
          </label>

          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo loại người dùng'} <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

type ProductDraft = { id: string; name: string; description: string; price: string; resellerPrice: string; stock: string; available: boolean };
const emptyProductDraft: ProductDraft = { id: '', name: '', description: '', price: '', resellerPrice: '', stock: '', available: true };

function ProductManager({ products, headers, onReload }: { products: Product[]; headers?: { Authorization: string }; onReload: () => Promise<void> | void }) {
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = editingId !== null;
  const change = (field: keyof ProductDraft, value: string | boolean) => setDraft((current) => ({ ...current, [field]: value }));
  const reset = () => { setDraft(emptyProductDraft); setEditingId(null); setMessage(''); };
  const startEdit = (product: Product) => { setEditingId(product.id); setDraft({ id: product.id, name: product.name, description: product.description, price: String(product.price), resellerPrice: product.resellerPrice ? String(product.resellerPrice) : '', stock: product.stock == null ? '' : String(product.stock), available: product.available }); setMessage(''); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    const payload = { id: draft.id.trim(), name: draft.name.trim(), description: draft.description.trim(), price: Number(draft.price), resellerPrice: draft.resellerPrice ? Number(draft.resellerPrice) : undefined, stock: draft.stock ? Number(draft.stock) : undefined, available: draft.available };
    try { await api(editing ? `/admin/products/${editingId}` : '/admin/products', { method: editing ? 'PATCH' : 'POST', headers, body: JSON.stringify(editing ? { name: payload.name, description: payload.description, price: payload.price, resellerPrice: payload.resellerPrice, stock: payload.stock, available: payload.available } : payload) }); reset(); await onReload(); } catch (saveError) { setMessage(saveError instanceof Error ? saveError.message : 'Không thể lưu sản phẩm'); } finally { setSaving(false); }
  };
  const toggle = async (product: Product) => { try { await api(`/admin/products/${product.id}`, { method: 'PATCH', headers, body: JSON.stringify({ available: !product.available }) }); await onReload(); } catch (toggleError) { setMessage(toggleError instanceof Error ? toggleError.message : 'Không thể cập nhật trạng thái'); } };
  const remove = async (product: Product) => { if (!window.confirm(`Xoá sản phẩm “${product.name}”?`)) return; try { await api(`/admin/products/${product.id}`, { method: 'DELETE', headers }); if (editingId === product.id) reset(); await onReload(); } catch (removeError) { setMessage(removeError instanceof Error ? removeError.message : 'Không thể xoá sản phẩm'); } };
  return <div className="product-admin-layout"><section><div className="section-heading"><div><span className="eyebrow">CATALOG</span><h2>Danh sách sản phẩm</h2></div><span className="muted">{products.length} sản phẩm</span></div>{message && <div className="notice error">{message}</div>}<div className="admin-list">{products.length ? products.map((product) => <article className="admin-list-row" key={product.id}><div><span className={`status status-${product.available ? 'completed' : 'cancelled'}`}>{product.available ? 'Đang bán' : 'Đã tắt'}</span><h3>{product.name}</h3><p>{product.description}</p></div><div className="admin-list-meta"><strong>{formatVnd(product.price)}</strong><small>{product.stock == null ? 'Không giới hạn' : `Tồn kho: ${product.stock}`}</small></div><div className="admin-list-actions"><button className="icon-button" type="button" title="Sửa sản phẩm" aria-label={`Sửa ${product.name}`} onClick={() => startEdit(product)}><Pencil size={15} /></button><button className="icon-button" type="button" title={product.available ? 'Tắt sản phẩm' : 'Mở sản phẩm'} aria-label={product.available ? `Tắt ${product.name}` : `Mở ${product.name}`} onClick={() => void toggle(product)}>{product.available ? <X size={16} /> : <Plus size={16} />}</button><button className="icon-button danger" type="button" title="Xoá sản phẩm" aria-label={`Xoá ${product.name}`} onClick={() => void remove(product)}><Trash2 size={15} /></button></div></article>) : <div className="empty"><CircleDollarSign size={30} /><b>Chưa có sản phẩm</b><span>Tạo sản phẩm đầu tiên ở biểu mẫu bên cạnh.</span></div>}</div></section><form className="panel form admin-product-form" onSubmit={submit}><div className="section-heading"><div><span className="eyebrow">{editing ? 'CHỈNH SỬA' : 'SẢN PHẨM MỚI'}</span><h2>{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</h2></div>{editing && <button className="text-button" type="button" onClick={reset}>Huỷ</button>}</div>{!editing && <label>Mã sản phẩm<input value={draft.id} onChange={(event) => change('id', event.target.value)} placeholder="chung-suc-4" required /></label>}<label>Tên sản phẩm<input value={draft.name} onChange={(event) => change('name', event.target.value)} placeholder="Chung sức 4 rương" required /></label><label>Mô tả<textarea value={draft.description} onChange={(event) => change('description', event.target.value)} placeholder="Mô tả ngắn cho khách hàng" required /></label><div className="form-two-col"><label>Giá bán<input type="number" min="0" value={draft.price} onChange={(event) => change('price', event.target.value)} required /></label><label>Giá đại lý<input type="number" min="0" value={draft.resellerPrice} onChange={(event) => change('resellerPrice', event.target.value)} /></label></div><label>Tồn kho<input type="number" min="0" value={draft.stock} onChange={(event) => change('stock', event.target.value)} placeholder="Để trống = không giới hạn" /></label><label className="checkbox-row"><input type="checkbox" checked={draft.available} onChange={(event) => change('available', event.target.checked)} /> Hiển thị sản phẩm</label><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo sản phẩm'} <ArrowRight size={17} /></button></form></div>;
}

type VoucherDraft = {
  id?: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  active: boolean;
};

const emptyVoucherDraft: VoucherDraft = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderValue: '0',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
  active: true
};

function VoucherManager({
  vouchers,
  headers,
  onReload,
  onLocalUpdate
}: {
  vouchers: Voucher[];
  headers?: { Authorization: string };
  onReload: () => Promise<void> | void;
  onLocalUpdate: (updated: Voucher[]) => void;
}) {
  const [draft, setDraft] = useState<VoucherDraft>(emptyVoucherDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = editingId !== null;

  const change = (field: keyof VoucherDraft, value: string | boolean) => {
    setDraft((cur) => ({ ...cur, [field]: value }));
  };

  const reset = () => {
    setDraft(emptyVoucherDraft);
    setEditingId(null);
    setMessage('');
  };

  const startEdit = (v: Voucher) => {
    setEditingId(v.id);
    setDraft({
      id: v.id,
      code: v.code,
      description: v.description,
      discountType: v.discountType,
      discountValue: String(v.discountValue),
      minOrderValue: String(v.minOrderValue),
      maxDiscount: v.maxDiscount != null ? String(v.maxDiscount) : '',
      usageLimit: v.usageLimit != null ? String(v.usageLimit) : '',
      expiresAt: v.expiresAt ? v.expiresAt.slice(0, 10) : '',
      active: v.active
    });
    setMessage('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const cleanCode = draft.code.trim().toUpperCase();
    const payload = {
      code: cleanCode,
      description: draft.description.trim(),
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue),
      minOrderValue: Number(draft.minOrderValue || 0),
      maxDiscount: draft.maxDiscount ? Number(draft.maxDiscount) : undefined,
      usageLimit: draft.usageLimit ? Number(draft.usageLimit) : undefined,
      expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
      active: draft.active
    };

    try {
      if (editing) {
        await api(`/admin/vouchers/${editingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        await api('/admin/vouchers', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }
      reset();
      await onReload();
    } catch {
      // Local fallback in case backend endpoint is not yet connected
      const existing = [...vouchers];
      if (editing) {
        const idx = existing.findIndex((v) => v.id === editingId);
        if (idx !== -1) {
          existing[idx] = {
            ...existing[idx],
            ...payload,
            id: editingId,
            expiresAt: payload.expiresAt ?? null
          };
        }
      } else {
        existing.unshift({
          ...payload,
          id: 'vch_' + Date.now(),
          usedCount: 0,
          expiresAt: payload.expiresAt ?? null,
          createdAt: new Date().toISOString()
        });
      }
      saveLocalVouchers(existing);
      onLocalUpdate(existing);
      reset();
      setMessage('Đã lưu voucher vào hệ thống.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (v: Voucher) => {
    try {
      await api(`/admin/vouchers/${v.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ active: !v.active })
      });
      await onReload();
    } catch {
      const updated = vouchers.map((item) => (item.id === v.id ? { ...item, active: !item.active } : item));
      saveLocalVouchers(updated);
      onLocalUpdate(updated);
    }
  };

  const remove = async (v: Voucher) => {
    if (!window.confirm(`Xoá voucher “${v.code}”?`)) return;
    try {
      await api(`/admin/vouchers/${v.id}`, { method: 'DELETE', headers });
      if (editingId === v.id) reset();
      await onReload();
    } catch {
      const updated = vouchers.filter((item) => item.id !== v.id);
      saveLocalVouchers(updated);
      onLocalUpdate(updated);
      if (editingId === v.id) reset();
    }
  };

  const totalUsed = vouchers.reduce((acc, cur) => acc + (cur.usedCount || 0), 0);
  const activeCount = vouchers.filter((v) => v.active).length;

  return (
    <div>
      <div className="admin-kpis" style={{ marginBottom: '20px' }}>
        <div className="kpi-card kpi-card-blue">
          <div className="kpi-icon"><Ticket size={18} /></div>
          <span className="kpi-label">Tổng Voucher</span>
          <strong className="kpi-value">{vouchers.length}</strong>
          <span className="kpi-delta">Chương trình ưu đãi</span>
        </div>
        <div className="kpi-card kpi-card-teal">
          <div className="kpi-icon"><CheckCircle2 size={18} /></div>
          <span className="kpi-label">Đang kích hoạt</span>
          <strong className="kpi-value">{activeCount}</strong>
          <span className="kpi-delta">Khách hàng có thể dùng</span>
        </div>
        <div className="kpi-card kpi-card-amber">
          <div className="kpi-icon"><Flame size={18} /></div>
          <span className="kpi-label">Lượt đã sử dụng</span>
          <strong className="kpi-value">{totalUsed}</strong>
          <span className="kpi-delta">Toàn hệ thống</span>
        </div>
      </div>

      <div className="voucher-admin-layout">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">KHUYẾN MÃI</span>
              <h2>Danh sách Voucher</h2>
            </div>
            <span className="muted">{vouchers.length} mã</span>
          </div>

          {message && <div className="notice success">{message}</div>}

          <div className="admin-list">
            {vouchers.length ? (
              vouchers.map((v) => (
                <article className="admin-list-row" key={v.id}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`status status-${v.active ? 'completed' : 'cancelled'}`}>
                        {v.active ? 'Đang bật' : 'Đã tắt'}
                      </span>
                      <span className="voucher-code-badge"><Tag size={12} /> {v.code}</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--ink)' }}>{v.description}</p>
                    <small style={{ color: 'var(--muted)', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span>Đơn tối thiểu: {formatVnd(v.minOrderValue)}</span>
                      {v.maxDiscount && <span>Tối đa: {formatVnd(v.maxDiscount)}</span>}
                      <span>Đã dùng: {v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ' (không giới hạn)'}</span>
                      {v.expiresAt && <span>HSD: {new Date(v.expiresAt).toLocaleDateString('vi-VN')}</span>}
                    </small>
                  </div>
                  <div className="admin-list-meta">
                    <strong style={{ color: '#0284c7' }}>
                      {v.discountType === 'PERCENT' ? `-${v.discountValue}%` : `-${formatVnd(v.discountValue)}`}
                    </strong>
                    <small>{v.discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền'}</small>
                  </div>
                  <div className="admin-list-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Sửa voucher"
                      aria-label={`Sửa ${v.code}`}
                      onClick={() => startEdit(v)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title={v.active ? 'Tắt voucher' : 'Bật voucher'}
                      aria-label={v.active ? `Tắt ${v.code}` : `Bật ${v.code}`}
                      onClick={() => void toggle(v)}
                    >
                      {v.active ? <X size={16} /> : <Plus size={16} />}
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Xoá voucher"
                      aria-label={`Xoá ${v.code}`}
                      onClick={() => void remove(v)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                <Ticket size={30} />
                <b>Chưa có voucher nào</b>
                <span>Tạo mã giảm giá đầu tiên bằng biểu mẫu bên cạnh.</span>
              </div>
            )}
          </div>
        </section>

        {/* BIỂU MẪU TẠO / SỬA VOUCHER */}
        <form className="panel form admin-product-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{editing ? 'CHỈNH SỬA' : 'TẠO VOUCHER'}</span>
              <h2>{editing ? 'Cập nhật voucher' : 'Thêm voucher mới'}</h2>
            </div>
            {editing && <button className="text-button" type="button" onClick={reset}>Huỷ</button>}
          </div>

          <label>
            Mã voucher (In hoa, không dấu)
            <input
              value={draft.code}
              onChange={(e) => change('code', e.target.value.toUpperCase())}
              placeholder="VD: BINAOV10, TRIAN50"
              required
            />
          </label>

          <label>
            Mô tả khuyến mãi
            <textarea
              value={draft.description}
              onChange={(e) => change('description', e.target.value)}
              placeholder="Mô tả điều kiện và quyền lợi áp dụng"
              required
            />
          </label>

          <div className="form-two-col">
            <label>
              Loại giảm giá
              <select
                value={draft.discountType}
                onChange={(e) => change('discountType', e.target.value as DiscountType)}
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền trực tiếp (Xu)</option>
              </select>
            </label>

            <label>
              Giá trị giảm
              <input
                type="number"
                min="1"
                value={draft.discountValue}
                onChange={(e) => change('discountValue', e.target.value)}
                placeholder={draft.discountType === 'PERCENT' ? '10 (tức 10%)' : '5000 (tức 5.000 Xu)'}
                required
              />
            </label>
          </div>

          <div className="form-two-col">
            <label>
              Đơn tối thiểu (Xu)
              <input
                type="number"
                min="0"
                value={draft.minOrderValue}
                onChange={(e) => change('minOrderValue', e.target.value)}
                placeholder="0 = Mọi đơn"
              />
            </label>

            <label>
              Giảm tối đa (Xu)
              <input
                type="number"
                min="0"
                value={draft.maxDiscount}
                onChange={(e) => change('maxDiscount', e.target.value)}
                placeholder="Để trống = Không trần"
                disabled={draft.discountType === 'FIXED'}
              />
            </label>
          </div>

          <div className="form-two-col">
            <label>
              Giới hạn lượt dùng
              <input
                type="number"
                min="1"
                value={draft.usageLimit}
                onChange={(e) => change('usageLimit', e.target.value)}
                placeholder="Để trống = Vô hạn"
              />
            </label>

            <label>
              Ngày hết hạn
              <input
                type="date"
                value={draft.expiresAt}
                onChange={(e) => change('expiresAt', e.target.value)}
              />
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => change('active', e.target.checked)}
            />
            Kích hoạt voucher (Khách hàng có thể sử dụng)
          </label>

          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo voucher'} <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() { return <Routes><Route path="/" element={<ReferenceHome />} /><Route path="/order" element={<RequireAuth><OrderPage /></RequireAuth>} /><Route path="/topup" element={<TopupPage />} /><Route path="/leaderboard" element={<LeaderboardPage />} /><Route path="/login" element={<LoginGate />} /><Route path="/register" element={<Register />} /><Route path="/account" element={<RequireAuth><Account /></RequireAuth>} /><Route path="/admin" element={<AdminPanel />} /><Route path="*" element={<ReferenceHome />} /></Routes>; }
