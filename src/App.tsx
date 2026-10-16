import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, CircleDollarSign, ClipboardList, Headphones, LayoutDashboard, LogIn, Menu, Pencil, Phone, Plus, ShieldCheck, Trash2, UserRound, WalletCards, X } from 'lucide-react';
import { api } from './api';

type Product = { id: string; name: string; description: string; price: number; resellerPrice?: number; available: boolean; stock?: number };
type Order = { id: string; username: string; productName: string; uid: string; quantity: number; total: number; status: string; createdAt: string };
const phone = '0995438093';
const zalo = 'https://zalo.me/g/togvaj3kpf1ik1bpaa6w';
const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' Xu';
function sessionRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).role as string; } catch { return 'USER'; }
}
const mockProducts: Product[] = [
  { id: 'chung-suc-1', name: 'Chung sức 1 rương', description: '1 rương SS, nhập mã sự kiện.', price: 30000, resellerPrice: 25000, available: true, stock: 99 },
  { id: 'chung-suc-2', name: 'Chung sức 2 rương', description: '2 rương SS + S+, nhập mã sự kiện.', price: 45000, resellerPrice: 35000, available: true, stock: 99 },
  { id: 'chung-suc-full', name: 'Chung sức full 3 rương', description: 'Full 3 rương Chung Sức.', price: 60000, resellerPrice: 50000, available: true, stock: 99 },
  { id: 'acc-clone', name: 'Acc clone level 12', description: 'Acc clone bao full khi còn hàng.', price: 1000, resellerPrice: 800, available: true, stock: 12 }
];

function PublicShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(() => sessionRole());
  useEffect(() => { const sync = () => setRole(sessionRole()); window.addEventListener('storage', sync); window.addEventListener('auth-changed', sync); return () => { window.removeEventListener('storage', sync); window.removeEventListener('auth-changed', sync); }; }, []);
  const logout = () => { localStorage.removeItem('token'); window.dispatchEvent(new Event('auth-changed')); window.location.href = '/'; };
  return <><div className="announcement">Hỗ trợ nhanh qua Zalo · 0995438093</div><header className="topbar"><Link className="brand" to="/"><img src="/logo.jpg" alt="Chungsucliqi" /><span>CHUNGSUCLIQI</span></Link><nav><NavLink to="/">Trang chủ</NavLink><NavLink to="/order">Tạo đơn</NavLink><NavLink to="/topup">Nạp tiền</NavLink>{role && <NavLink to="/account">Tài khoản</NavLink>}</nav>{role ? <div className="session-actions"><Link className="button button-secondary small" to={role === 'ADMIN' ? '/admin' : '/account'}>{role === 'ADMIN' ? 'Trang quản trị' : 'Tài khoản'}</Link><button className="button button-primary small" type="button" onClick={logout}>Đăng xuất</button></div> : <Link className="button button-primary small" to="/login"><LogIn size={16} /> Đăng nhập</Link>}<button className="mobile-menu" aria-label="Mở menu"><Menu size={20} /></button></header>{children}<footer className="footer"><div><div className="brand"><img src="/logo.jpg" alt="Chungsucliqi" /><span>CHUNGSUCLIQI</span></div><p>Đặt dịch vụ nhanh, theo dõi đơn rõ ràng và nạp Xu tự động.</p></div><div><b>Hỗ trợ</b><a href={`tel:${phone}`}><Phone size={15} /> {phone}</a><a href={zalo} target="_blank" rel="noreferrer"><Headphones size={15} /> Zalo Box</a></div><div><b>Liên kết</b><Link to="/order">Tạo đơn</Link><Link to="/topup">Nạp tiền</Link><Link to="/admin">Trang quản trị</Link></div></footer></>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  useEffect(() => { if (!localStorage.getItem('token')) navigate('/login', { replace: true }); else setChecking(false); }, [navigate]);
  if (checking) return <main className="auth-page"><div className="panel admin-loading">Đang kiểm tra phiên đăng nhập...</div></main>;
  return <>{children}</>;
}

function Home() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  useEffect(() => { api<{ data: Product[] }>('/products').then((result) => setProducts(result.data)).catch(() => undefined); }, []);
  return <PublicShell><main><section className="hero"><div className="hero-copy"><span className="eyebrow">DỊCH VỤ CHUNG SỨC LIÊN QUÂN</span><h1>Đặt rương,<br /><em>xong trong 5 phút.</em></h1><p>Chọn gói, nhập mã sự kiện hoặc UID user. Đơn được chuyển thẳng về trang quản trị để xử lý.</p><div className="actions"><Link className="button button-primary" to="/order">Tạo đơn ngay <ArrowRight size={18} /></Link><Link className="button button-secondary" to="/topup">Nạp tiền</Link></div><div className="trust-row"><span><CheckCircle2 size={16} /> Hỗ trợ 5 phút</span><span><ShieldCheck size={16} /> Đơn được theo dõi</span></div></div><div className="hero-visual"><img src="/chests.jpg" alt="Minh họa dịch vụ chung sức" /><div className="banner-shade"><span className="visual-label">HỆ THỐNG ĐANG HOẠT ĐỘNG</span><strong>Đơn mới được admin xử lý liên tục</strong><span>Nhập đúng UID để đơn chạy nhanh hơn.</span></div></div></section><section className="section"><div className="section-heading"><div><span className="eyebrow">BẢNG GIÁ</span><h2>Dịch vụ đang mở</h2></div><Link to="/order">Xem tất cả <ArrowRight size={16} /></Link></div><div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className="product-icon"><WalletCards size={20} /></div><h3>{product.name}</h3><p>{product.description}</p><div className="price-row"><strong>{formatVnd(product.price)}</strong><span>Còn {product.stock ?? 'nhiều'}</span></div><Link className="button button-secondary full" to={`/order?product=${product.id}`}>Đặt ngay <ArrowRight size={16} /></Link></article>)}</div></section><section className="steps"><div><span className="eyebrow">QUY TRÌNH</span><h2>Đơn giản từ lúc nạp đến lúc hoàn tất.</h2></div><div className="step-list"><div><b>01</b><h3>Tạo tài khoản</h3><p>Đăng ký nhanh để lưu lịch sử đơn và số dư.</p></div><div><b>02</b><h3>Nạp Xu</h3><p>Chuyển khoản đúng nội dung, hệ thống tự đồng bộ.</p></div><div><b>03</b><h3>Gửi UID</h3><p>Nhập UID user, admin nhận đơn và cập nhật trạng thái.</p></div></div></section></main></PublicShell>;
}

function ReferenceHome() {
  return <iframe className="mockup-frame" title="Chungsucliqi mockup" src="/reference/pages/home/index.html" />;
}

function OrderPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts); const [productId, setProductId] = useState('chung-suc-1'); const [uid, setUid] = useState(''); const [quantity, setQuantity] = useState(1); const [message, setMessage] = useState('');
  useEffect(() => { api<{ data: Product[] }>('/products').then((result) => setProducts(result.data)).catch(() => undefined); }, []);
  const selected = products.find((product) => product.id === productId) ?? products[0];
  const submit = async (event: React.FormEvent) => { event.preventDefault(); const token = localStorage.getItem('token'); if (!token) { setMessage('Bạn cần đăng nhập trước khi gửi đơn.'); return; } try { await api('/orders', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId, uid, quantity }) }); setMessage('Đã gửi đơn thành công. Admin đã nhận được UID user của bạn.'); setUid(''); } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể tạo đơn'); } };
  return <PublicShell><main className="page"><div className="page-heading"><div><span className="eyebrow">TẠO ĐƠN</span><h1>Gửi thông tin cho admin.</h1><p>Nhập UID user và chọn gói dịch vụ. Đơn sẽ xuất hiện trong trang quản trị sau khi gửi.</p></div></div><div className="form-layout"><form className="panel form" onSubmit={submit}><label>Sản phẩm<select value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatVnd(product.price)}</option>)}</select></label><label>UID user<input value={uid} onChange={(event) => setUid(event.target.value)} placeholder="Nhập UID user" required minLength={3} /></label><label>Số lượng<input type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label><label>Ghi chú<textarea placeholder="Thông tin thêm cho admin (không bắt buộc)" /></label>{message && <div className="notice success">{message}</div>}<button className="button button-primary" type="submit">Gửi đơn <ArrowRight size={18} /></button></form><aside className="panel summary"><span className="eyebrow">TÓM TẮT</span><h2>{selected?.name}</h2><p>{selected?.description}</p><div className="summary-line"><span>Đơn giá</span><b>{formatVnd(selected?.price ?? 0)}</b></div><div className="summary-line total"><span>Tạm tính</span><b>{formatVnd((selected?.price ?? 0) * quantity)}</b></div><div className="notice">Bạn cần đăng nhập và có đủ số dư trước khi gửi đơn.</div></aside></div></main></PublicShell>;
}

function TopupPage() { const [amount, setAmount] = useState(100000); const [created, setCreated] = useState<{ transferContent: string; amount: number; bankAccount?: string; bankCode?: string; qrUrl?: string } | null>(null); const [message, setMessage] = useState(''); const createTopup = async () => { const token = localStorage.getItem('token'); if (!token) { setMessage('Bạn cần đăng nhập trước khi tạo lệnh nạp.'); return; } if (!Number.isInteger(amount) || amount < 20000) { setMessage('Số tiền nạp tối thiểu là 20.000 Xu.'); return; } try { const result = await api<{ data: { transferContent: string; amount: number; bankAccount?: string; bankCode?: string; qrUrl?: string } }>('/topups', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount }) }); setCreated(result.data); setMessage(''); } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể tạo lệnh nạp'); } }; return <PublicShell><main className="page"><div className="page-heading"><span className="eyebrow">NẠP TIỀN</span><h1>Nạp Xu, đồng bộ tự động.</h1><p>Nhập số tiền muốn nạp, tối thiểu 20.000 Xu, sau đó quét QR để chuyển khoản.</p></div><div className="form-layout"><div className="panel form"><label>Số tiền nạp (Xu)<input type="number" min="20000" step="1000" value={amount} onChange={(event) => { setAmount(Number(event.target.value)); setCreated(null); setMessage(''); }} required /><span className="field-hint">Tối thiểu 20.000 Xu · Nhập bội số 1.000</span></label>{created ? <div className="payment-box"><span className="eyebrow">LỆNH NẠP ĐÃ TẠO</span>{created.qrUrl && <img className="payment-qr" src={created.qrUrl} alt="QR chuyển khoản SePay" />}<div className="payment-details">{created.bankCode && <p>Ngân hàng: <b>{created.bankCode}</b></p>}{created.bankAccount && <p>Số tài khoản: <b>{created.bankAccount}</b></p>}<p>Nội dung chuyển khoản:</p><strong>{created.transferContent}</strong><p>Số tiền cần chuyển: <b>{formatVnd(created.amount)}</b></p></div><div className="support-box"><span>Cần hỗ trợ thanh toán?</span><a className="button button-secondary small" href={zalo} target="_blank" rel="noreferrer"><Headphones size={15} /> Nhắn Zalo</a><a className="support-phone" href={`tel:${phone}`}><Phone size={14} /> {phone}</a></div></div> : <button className="button button-primary" type="button" onClick={createTopup}>Tạo lệnh nạp <ArrowRight size={18} /></button>}{message && <div className="notice error">{message}</div>}</div><aside className="panel summary"><CircleDollarSign size={34} className="accent-icon" /><h2>Đồng bộ theo lệnh nạp</h2><p>Webhook SePay sẽ đối soát mã giao dịch, cộng số dư đúng một lần và lưu lịch sử.</p><div className="notice">Sau khi chuyển khoản, giữ nguyên nội dung QR để hệ thống tự nhận diện.</div></aside></div></main></PublicShell>; }

function Login() { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const navigate = useNavigate(); const submit = async (event: React.FormEvent) => { event.preventDefault(); try { const result = await api<{ data: { token: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('token', result.data.token); navigate('/account'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại'); } }; return <main className="auth-page"><div className="auth-aside"><Link className="brand" to="/"><span className="brand-mark">CS</span><span>CHUNGSUCLIQI</span></Link><h1>Đăng nhập<br /><em>để tiếp tục.</em></h1><p>Nạp Xu, tạo đơn và theo dõi trạng thái trong một nơi.</p></div><form className="auth-card form" onSubmit={submit}><span className="eyebrow">TÀI KHOẢN</span><h2>Chào mừng trở lại</h2><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="email@example.com" /></label><label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Nhập mật khẩu" /></label>{message && <div className="notice error">{message}</div>}<button className="button button-primary" type="submit">Đăng nhập <LogIn size={17} /></button><p className="muted">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p></form></main>; }

function Register() { const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const navigate = useNavigate(); const submit = async (event: React.FormEvent) => { event.preventDefault(); try { const result = await api<{ data: { token: string } }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }); localStorage.setItem('token', result.data.token); window.dispatchEvent(new Event('auth-changed')); navigate('/account'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Đăng ký thất bại'); } }; return <main className="auth-page"><div className="auth-aside"><Link className="brand" to="/"><img src="/logo.jpg" alt="Bin AOV" /><span>CHUNGSUCLIQI</span></Link><h1>Mở tài khoản<br /><em>để bắt đầu.</em></h1><p>Chỉ cần tên đăng nhập và mật khẩu để bắt đầu nạp Xu, tạo đơn.</p></div><form className="auth-card form" onSubmit={submit}><span className="eyebrow">TẠO TÀI KHOẢN</span><h2>Đăng ký</h2><label>Tên đăng nhập<input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={2} maxLength={40} autoComplete="username" placeholder="Ví dụ: bin_aov" /></label><label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" /></label>{message && <div className="notice error">{message}</div>}<button className="button button-primary" type="submit">Tạo tài khoản <ArrowRight size={17} /></button><p className="muted">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></form></main>; }

function Account() { const [orders, setOrders] = useState<Order[]>([]); const [balance, setBalance] = useState(0); useEffect(() => { const token = localStorage.getItem('token'); const headers = token ? { Authorization: `Bearer ${token}` } : undefined; Promise.all([api<{ data: Order[] }>('/orders', { headers }), api<{ data: { balance: number } }>('/wallet/balance', { headers })]).then(([orderResult, balanceResult]) => { setOrders(orderResult.data); setBalance(balanceResult.data.balance); }).catch(() => undefined); }, []); return <PublicShell><main className="page"><div className="account-head"><div><span className="eyebrow">TÀI KHOẢN</span><h1>Xin chào, bạn.</h1><p>Quản lý số dư và theo dõi các đơn đã gửi.</p></div><Link className="button button-primary" to="/order"><Plus size={17} /> Tạo đơn</Link></div><div className="account-grid"><div className="balance-card"><span>Số dư khả dụng</span><strong>{formatVnd(balance)}</strong><Link to="/topup">Nạp thêm <ArrowRight size={15} /></Link></div><div className="metric-card"><span>Tổng đơn</span><strong>{orders.length}</strong><small>Đơn đã tạo</small></div><div className="metric-card"><span>Đang xử lý</span><strong>{orders.filter((order) => order.status === 'PROCESSING' || order.status === 'PENDING').length}</strong><small>Cần theo dõi</small></div></div><section className="panel table-panel"><div className="section-heading"><h2>Lịch sử đơn</h2><Link to="/order">Tạo đơn mới <ArrowRight size={15} /></Link></div>{orders.length ? <div className="table-scroll"><table><thead><tr><th>Mã đơn</th><th>Dịch vụ</th><th>UID</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.productName}</td><td>{order.uid}</td><td><span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></td><td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td></tr>)}</tbody></table></div> : <div className="empty"><ClipboardList size={30} /><b>Chưa có đơn nào</b><span>Tạo đơn đầu tiên để bắt đầu theo dõi.</span></div>}</section></main></PublicShell>; }

function Admin() { const [orders, setOrders] = useState<Order[]>([]); const [period, setPeriod] = useState('month'); const [stats, setStats] = useState({ users: 0, orders: 0, pendingOrders: 0, revenue: 0, topups: 0 }); useEffect(() => { const token = localStorage.getItem('token'); const headers = token ? { Authorization: `Bearer ${token}` } : undefined; Promise.all([api<{ data: Order[] }>('/admin/orders', { headers }), api<{ data: typeof stats }>('/admin/dashboard', { headers })]).then(([orderResult, statResult]) => { setOrders(orderResult.data); setStats(statResult.data); }).catch(() => undefined); }, []); return <div className="admin-layout"><aside className="admin-sidebar"><Link className="brand" to="/"><span className="brand-mark">CS</span><span>CHUNGSUCLIQI</span></Link><span className="sidebar-label">TỔNG QUAN</span><NavLink className="side-link active" to="/admin"><LayoutDashboard size={17} /> Dashboard</NavLink><NavLink className="side-link" to="/admin"><ClipboardList size={17} /> Đơn hàng</NavLink><NavLink className="side-link" to="/admin"><UserRound size={17} /> Người dùng</NavLink><NavLink className="side-link" to="/admin"><WalletCards size={17} /> Nạp tiền</NavLink><span className="sidebar-label">HỆ THỐNG</span><a className="side-link" href={zalo}><Headphones size={17} /> Hỗ trợ Zalo</a></aside><main className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">TRANG QUẢN TRỊ</span><h1>Dashboard</h1></div><Link className="button button-secondary small" to="/"><X size={16} /> Thoát admin</Link></header><div className="periods"><button className={period === 'month' ? 'selected' : ''} onClick={() => setPeriod('month')}>Tháng</button><button className={period === 'quarter' ? 'selected' : ''} onClick={() => setPeriod('quarter')}>Quý</button><button className={period === 'year' ? 'selected' : ''} onClick={() => setPeriod('year')}>Năm</button></div><div className="admin-kpis"><div><span>Người dùng</span><strong>{stats.users}</strong><small>+12% kỳ trước</small></div><div><span>Đơn hàng</span><strong>{stats.orders}</strong><small>{stats.pendingOrders} đơn chờ xử lý</small></div><div><span>Doanh thu</span><strong>{formatVnd(stats.revenue)}</strong><small>Theo {period === 'month' ? 'tháng' : period === 'quarter' ? 'quý' : 'năm'}</small></div><div><span>Đã nạp</span><strong>{formatVnd(stats.topups)}</strong><small>Webhook SePay</small></div></div><div className="admin-content"><section className="panel chart-panel"><div className="section-heading"><div><span className="eyebrow">HIỆU SUẤT</span><h2>Doanh thu theo thời gian</h2></div><BarChart3 className="accent-icon" /></div><div className="chart"><i style={{ height: '42%' }} /><i style={{ height: '65%' }} /><i style={{ height: '54%' }} /><i style={{ height: '82%' }} /><i style={{ height: '68%' }} /><i style={{ height: '92%' }} /><i style={{ height: '75%' }} /><i style={{ height: '100%' }} /></div><div className="chart-labels"><span>T1</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>T8</span></div></section><section className="panel table-panel"><div className="section-heading"><div><span className="eyebrow">MỚI NHẤT</span><h2>Đơn cần xử lý</h2></div><Link to="/admin">Xem tất cả <ArrowRight size={15} /></Link></div>{orders.length ? <div className="table-scroll"><table><thead><tr><th>Mã</th><th>User</th><th>UID</th><th>Trạng thái</th><th>Tổng</th></tr></thead><tbody>{orders.slice(0, 8).map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.username}</td><td>{order.uid}</td><td><span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></td><td>{formatVnd(order.total)}</td></tr>)}</tbody></table></div> : <div className="empty"><ClipboardList size={30} /><b>Chưa có đơn mới</b><span>Đơn tạo bằng UID sẽ hiện tại đây.</span></div>}</section></div></main></div>; }

function LoginGate() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await api<{ data: { token: string; user: { role: string } } }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      localStorage.setItem('token', result.data.token); window.dispatchEvent(new Event('auth-changed'));
      navigate(result.data.user.role === 'ADMIN' ? '/admin' : '/account');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại'); }
  };
  return <main className="auth-page"><div className="auth-aside"><Link className="brand" to="/"><img src="/logo.jpg" alt="Bin AOV" /><span>CHUNGSUCLIQI</span></Link><h1>Đăng nhập<br /><em>để tiếp tục.</em></h1><p>Nạp Xu, tạo đơn và theo dõi trạng thái trong một nơi.</p></div><form className="auth-card form" onSubmit={submit}><span className="eyebrow">TÀI KHOẢN</span><h2>Chào mừng trở lại</h2><label>Tên đăng nhập<input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={2} autoComplete="username" placeholder="Tên đăng nhập" /></label><label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Nhập mật khẩu" /></label>{message && <div className="notice error">{message}</div>}<button className="button button-primary" type="submit">Đăng nhập <LogIn size={17} /></button><p className="muted">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p></form></main>;
}

function AdminPanel() {
  const [section, setSection] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; username: string; balance: number; status: string }>>([]);
  const [topups, setTopups] = useState<Array<{ id: string; userId: string; amount: number; status: string; transferContent: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
        api<{ data: typeof users }>('/admin/users', { headers }),
        api<{ data: typeof topups }>('/admin/topups', { headers }),
        api<{ data: Product[] }>('/products')
      ]);
      setStats(dashboard.data); setOrders(orderResult.data); setUsers(userResult.data); setTopups(topupResult.data); setProducts(productResult.data);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu quản trị'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const updateStatus = async (id: string, status: string) => { try { await api(`/admin/orders/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) }); await load(); } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật đơn'); } };
  if (!token) return <main className="admin-gate"><div className="panel"><ShieldCheck size={35} className="accent-icon" /><h1>Cần đăng nhập admin</h1><p>Đăng nhập bằng tài khoản quản trị để truy cập khu vực này.</p><Link className="button button-primary" to="/login">Đăng nhập admin <LogIn size={17} /></Link></div></main>;
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { id: 'orders',    label: 'Đơn hàng',  icon: <ClipboardList size={17} /> },
    { id: 'users',     label: 'Người dùng',icon: <UserRound size={17} /> },
    { id: 'topups',    label: 'Nạp tiền',  icon: <WalletCards size={17} /> },
    { id: 'products',  label: 'Sản phẩm',  icon: <CircleDollarSign size={17} /> },
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
        <Link className="brand" to="/"><img src="/logo.jpg" alt="Chungsucliqi" /><span>CHUNGSUCLIQI</span></Link>
        <div className="sidebar-section">
          <span className="sidebar-label">QUẢN TRỊ</span>
          {nav.map((item) => (
            <button key={item.id} className={`side-link ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <a className="side-link" href={zalo} style={{ margin: 0, width: '100%' }}>
            <Headphones size={17} /> Hỗ trợ Zalo
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
          <section className="panel table-panel"><AdminUsersTable users={users} /></section>
        ) : section === 'topups' ? (
          <section className="panel table-panel"><AdminTopupsTable topups={topups} /></section>
        ) : (
          <ProductManager products={products} headers={headers} onReload={load} />
        )}
      </main>
    </div>
  );
}

function AdminOrdersTable({ orders, onStatus }: { orders: Order[]; onStatus: (id: string, status: string) => void }) { return <><div className="section-heading"><div><span className="eyebrow">ĐƠN HÀNG</span><h2>Danh sách đơn</h2></div><span className="muted">{orders.length} đơn</span></div>{orders.length ? <div className="table-scroll"><table><thead><tr><th>Mã</th><th>User</th><th>UID</th><th>Dịch vụ</th><th>Trạng thái</th><th>Tổng</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{order.username}</td><td>{order.uid}</td><td>{order.productName}</td><td><select className="status-select" value={order.status} onChange={(event) => onStatus(order.id, event.target.value)}><option>PENDING</option><option>PROCESSING</option><option>COMPLETED</option><option>CANCELLED</option><option>FAILED</option></select></td><td>{formatVnd(order.total)}</td></tr>)}</tbody></table></div> : <div className="empty"><ClipboardList size={30} /><b>Chưa có đơn</b></div>}</>; }
function AdminUsersTable({ users }: { users: Array<{ id: string; username: string; balance: number; status: string }> }) { return <><div className="section-heading"><div><span className="eyebrow">NGƯỜI DÙNG</span><h2>Tài khoản user</h2></div></div><div className="table-scroll"><table><thead><tr><th>User</th><th>Số dư</th><th>Trạng thái</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.username}</td><td>{formatVnd(user.balance)}</td><td><span className="status status-completed">{user.status}</span></td></tr>)}</tbody></table></div></>; }
function AdminTopupsTable({ topups }: { topups: Array<{ id: string; userId: string; amount: number; status: string; transferContent: string }> }) { return <><div className="section-heading"><div><span className="eyebrow">NẠP TIỀN</span><h2>Giao dịch nạp</h2></div></div><div className="table-scroll"><table><thead><tr><th>Mã</th><th>User</th><th>Số tiền</th><th>Nội dung</th><th>Trạng thái</th></tr></thead><tbody>{topups.map((topup) => <tr key={topup.id}><td>{topup.id}</td><td>{topup.userId}</td><td>{formatVnd(topup.amount)}</td><td>{topup.transferContent}</td><td><span className={`status status-${topup.status.toLowerCase()}`}>{topup.status}</span></td></tr>)}</tbody></table></div></>; }

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

export default function App() { return <Routes><Route path="/" element={<ReferenceHome />} /><Route path="/order" element={<RequireAuth><OrderPage /></RequireAuth>} /><Route path="/topup" element={<RequireAuth><TopupPage /></RequireAuth>} /><Route path="/login" element={<LoginGate />} /><Route path="/register" element={<Register />} /><Route path="/account" element={<RequireAuth><Account /></RequireAuth>} /><Route path="/admin" element={<AdminPanel />} /><Route path="*" element={<ReferenceHome />} /></Routes>; }
