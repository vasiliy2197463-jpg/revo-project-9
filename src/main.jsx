import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coffee,
  Gift,
  Heart,
  Leaf,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Search,
  Send,
  ShoppingBag,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { products as baseProducts } from "./data/products";
import {
  isSupabaseConfigured,
  profileFromSession,
  supabase,
} from "./lib/supabase";
import "./styles.css";
import "./quantity.css";
import "./mobile.css";
import "./admin.css";

const asset = (name) => `${import.meta.env.BASE_URL}assets/revo/${name}`;

const ADMIN_EMAILS = ["vasiliy2197463@gmail.com", "admin@revo.coffee"];
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const withAccountRole = (user) =>
  user
    ? {
        ...user,
        email: String(user.email || "").trim(),
        role: ADMIN_EMAILS.includes(normalizeEmail(user.email))
          ? "admin"
          : user.role || "customer",
      }
    : null;

const copy = {
  ru: {
    catalog: "Каталог",
    gift: "Подарочные наборы",
    combo: "Комбо",
    about: "О кофе",
    support: "Поддержка",
    search: "Найти кофе",
    heroTop: "ВАШ ПЕРСОНАЛЬНЫЙ",
    heroBig: "КОФЕ",
    heroText: "Выберите кофе, созданный под ваш вкус и способ заваривания.",
    shop: "Выбрать кофе",
    features: "Ваш кофе — ваши правила",
    best: "Любимый кофе",
    bestSub: "Подборка, с которой легко начать",
    more: "Подробнее",
    cart: "Корзина",
    fav: "Избранное",
    account: "Аккаунт",
    add: "В корзину",
    buy: "Купить сейчас",
    empty: "Здесь пока пусто",
    total: "Итого",
    checkout: "Оформить заказ",
    back: "Назад",
    reviews: "Отзывы",
    write: "Оставить отзыв",
    send: "Отправить",
    giftTitle: "Кофе в подарок",
    giftSub: "Подарочный набор, который запомнится",
    comboTitle: "Комбо-наборы",
    comboSub: "Больше вкуса в одной покупке",
    login: "Войти",
    register: "Регистрация",
    email: "Электронная почта",
    password: "Пароль",
    name: "Имя",
    logout: "Выйти",
    orders: "Мои заказы",
    admin: "Админ-панель",
    orderDone: "Заказ оформлен",
    orderText: "Спасибо! Мы уже начали собирать ваш кофе.",
    all: "Все",
    stock: "Остаток",
    save: "Сохранить",
    status: "Статус",
    customers: "Клиенты",
    messages: "Обращения",
    products: "Товары",
    lang: "EN",
  },
  en: {
    catalog: "Catalog",
    gift: "Gift sets",
    combo: "Combos",
    about: "Our coffee",
    support: "Support",
    search: "Find coffee",
    heroTop: "YOUR PERSONALIZED",
    heroBig: "COFFEE",
    heroText: "Choose coffee crafted for your taste and brewing method.",
    shop: "Choose coffee",
    features: "Your coffee, your rules",
    best: "Favorite coffee",
    bestSub: "An easy collection to start with",
    more: "Details",
    cart: "Cart",
    fav: "Favorites",
    account: "Account",
    add: "Add to cart",
    buy: "Buy now",
    empty: "Nothing here yet",
    total: "Total",
    checkout: "Checkout",
    back: "Back",
    reviews: "Reviews",
    write: "Write a review",
    send: "Send",
    giftTitle: "Coffee as a gift",
    giftSub: "A memorable gift set",
    comboTitle: "Coffee combos",
    comboSub: "More flavor in one purchase",
    login: "Sign in",
    register: "Create account",
    email: "Email",
    password: "Password",
    name: "Name",
    logout: "Sign out",
    orders: "My orders",
    admin: "Admin panel",
    orderDone: "Order placed",
    orderText: "Thank you! We are already packing your coffee.",
    all: "All",
    stock: "Stock",
    save: "Save",
    status: "Status",
    customers: "Customers",
    messages: "Messages",
    products: "Products",
    lang: "RU",
  },
};

const Store = createContext(null);
const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const threadMessages = (thread) => {
  if (Array.isArray(thread.conversation) && thread.conversation.length) {
    return thread.conversation;
  }
  const conversation = [];
  if (thread.text) {
    conversation.push({
      sender: "customer",
      text: thread.text,
      createdAt: thread.createdAt,
    });
  }
  if (thread.reply) {
    conversation.push({
      sender: "admin",
      text: thread.reply,
      createdAt: thread.repliedAt,
    });
  }
  return conversation;
};
const normalizeSearch = (value) =>
  String(value || "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .trim();
const messageKey = (message) =>
  `${message.sender}:${message.createdAt || ""}:${message.text || ""}`;
const loadSupportThreads = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("support_threads")
    .select("*, support_messages(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((thread) => ({
    id: thread.id,
    name: thread.customer_name,
    email: thread.email,
    subject: thread.subject,
    status: thread.status,
    createdAt: thread.created_at,
    conversation: (thread.support_messages || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((message) => ({
        sender: message.sender_role,
        text: message.body,
        createdAt: message.created_at,
      })),
  }));
};
const addAdminUnread = () => {
  const next = Number(localStorage.getItem("revo-admin-unread") || 0) + 1;
  localStorage.setItem("revo-admin-unread", String(next));
};
const addCustomerUnread = (email) => {
  const key = normalizeEmail(email);
  if (!key) return;
  const unread = read("revo-customer-unread", {});
  localStorage.setItem(
    "revo-customer-unread",
    JSON.stringify({ ...unread, [key]: Number(unread[key] || 0) + 1 }),
  );
  window.dispatchEvent(new Event("revo-notifications"));
};
function Provider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("revo-lang") || "ru",
  );
  const [cart, setCart] = useState(() => read("revo-cart", {}));
  const [favs, setFavs] = useState(() => read("revo-favs", []));
  const [customProducts, setCustomProducts] = useState(() =>
    read("revo-custom-products", []),
  );
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [hiddenProducts, setHiddenProducts] = useState(() =>
    read("revo-hidden-products", []),
  );
  const [user, setUserState] = useState(() =>
    isSupabaseConfigured ? null : withAccountRole(read("revo-user", null)),
  );
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [orders, setOrders] = useState(() => read("revo-orders", []));
  const [toast, setToast] = useState("");
  useEffect(() => {
    localStorage.setItem("revo-lang", lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("revo-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("revo-favs", JSON.stringify(favs));
  }, [favs]);
  useEffect(() => {
    localStorage.setItem("revo-custom-products", JSON.stringify(customProducts));
  }, [customProducts]);
  useEffect(() => {
    localStorage.setItem("revo-hidden-products", JSON.stringify(hiddenProducts));
  }, [hiddenProducts]);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem("revo-user", JSON.stringify(user));
    }
  }, [user]);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const applySession = async (session) => {
      const profile = await profileFromSession(session?.user);
      if (!active) return;
      setUserState(withAccountRole(profile));
      setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const setUser = async (nextUser) => {
    if (!nextUser && supabase) {
      await supabase.auth.signOut();
    }
    setUserState(nextUser ? withAccountRole(nextUser) : null);
  };
  useEffect(() => {
    localStorage.setItem("revo-orders", JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const loadProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("created_at");
      if (!active || !data?.length) return;
      setRemoteProducts(
        data.map((product) => ({
          id: product.id,
          image: product.image_url,
          gallery:
            Array.isArray(product.gallery) && product.gallery.length
              ? product.gallery
              : [product.image_url],
          price: Number(product.price),
          oldPrice: product.old_price ? Number(product.old_price) : undefined,
          rating: 5,
          stock: Number(product.stock),
          roast: product.category,
          title: { ru: product.title_ru, en: product.title_en },
          note: { ru: product.description_ru, en: product.description_en },
        })),
      );
    };
    loadProducts();
    const channel = supabase
      .channel("revo-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadProducts)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let active = true;
    const loadOrders = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!active || !data) return;
      setOrders(
        data.map((order) => ({
          ...order,
          id: order.order_number || order.id,
          databaseId: order.id,
          created: order.created_at,
          total: Number(order.total),
        })),
      );
    };
    loadOrders();
    const channel = supabase
      .channel(`revo-orders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  const flash = (s) => {
    setToast(s);
    setTimeout(() => setToast(""), 2200);
  };
  const add = (id, q = 1) => {
    setCart((x) => ({ ...x, [id]: (x[id] || 0) + q }));
    flash(lang === "ru" ? "Добавлено в корзину" : "Added to cart");
  };
  const toggleFav = (id) =>
    setFavs((x) => (x.includes(id) ? x.filter((v) => v !== id) : [...x, id]));
  const catalogSource = remoteProducts.length
    ? remoteProducts
    : [...baseProducts, ...customProducts];
  const products = catalogSource.filter(
    (product) => !hiddenProducts.includes(product.id),
  );
  const deleteProduct = (id) => {
    setCustomProducts((current) => current.filter((product) => product.id !== id));
    setHiddenProducts((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setFavs((current) => current.filter((productId) => productId !== id));
  };
  return (
    <Store.Provider
      value={{
        lang,
        setLang,
        t: copy[lang],
        cart,
        setCart,
        favs,
        toggleFav,
        add,
        products,
        addProduct: (product) =>
          setCustomProducts((current) => [product, ...current]),
        deleteProduct,
        user,
        setUser,
        authReady,
        backendConnected: isSupabaseConfigured,
        orders,
        setOrders,
        flash,
      }}
    >
      {children}
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
        </div>
      )}
    </Store.Provider>
  );
}
const useStore = () => useContext(Store);

function Header() {
  const { lang, setLang, t, cart, favs, user } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [supportUnread, setSupportUnread] = useState(0);
  const nav = useNavigate();
  const location = useLocation();
  const activeCatalogType = new URLSearchParams(location.search).get("type");
  useEffect(() => {
    const updateSupportUnread = () => {
      const email = normalizeEmail(
        user?.email || localStorage.getItem("revo-support-email"),
      );
      const unread = read("revo-customer-unread", {});
      setSupportUnread(Number(unread[email] || 0));
    };
    updateSupportUnread();
    window.addEventListener("storage", updateSupportUnread);
    window.addEventListener("revo-notifications", updateSupportUnread);
    return () => {
      window.removeEventListener("storage", updateSupportUnread);
      window.removeEventListener("revo-notifications", updateSupportUnread);
    };
  }, [user?.email]);
  const catalogClass = (type = null) =>
    location.pathname === "/catalog" && activeCatalogType === type
      ? "active"
      : undefined;
  const go = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/catalog?q=${encodeURIComponent(q)}`);
  };
  return (
    <>
      <header className="header">
        <Link className="logo" to="/">
          <img src={asset("raw-13.png")} alt="REVO" />
        </Link>
        <nav
          className={open ? "nav open" : "nav"}
          onClick={() => setOpen(false)}
        >
          <Link className={catalogClass()} to="/catalog">
            {t.catalog}
          </Link>
          <Link className={catalogClass("gift")} to="/catalog?type=gift">
            {t.gift}
          </Link>
          <Link className={catalogClass("combo")} to="/catalog?type=combo">
            {t.combo}
          </Link>
          <NavLink className="support-nav-link" to="/support">
            {t.support}
            {supportUnread > 0 && (
              <b className="support-unread">{supportUnread}</b>
            )}
          </NavLink>
        </nav>
        <div className="head-actions">
          <button
            className="lang"
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          >
            {t.lang}
          </button>
          <Link
            aria-label={t.fav}
            to="/favorites"
            className="icon-link desktop-action"
          >
            <Heart />
            <b>{favs.length || ""}</b>
          </Link>
          <Link
            aria-label={t.cart}
            to="/cart"
            className="icon-link desktop-action"
          >
            <ShoppingBag />
            <b>{Object.values(cart).reduce((a, b) => a + b, 0) || ""}</b>
          </Link>
          <Link
            aria-label={t.account}
            to={user ? "/account" : "/auth"}
            className="icon-link desktop-action"
          >
            <User />
          </Link>
          <button className="menu" onClick={() => setOpen((v) => !v)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <form className="mobile-search" onSubmit={go}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
        />
        <button>
          <Search />
        </button>
      </form>
    </>
  );
}
function MobileNav() {
  const { t, cart, favs, user } = useStore();
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <NavLink to="/">
        <Coffee />
        <span>REVO</span>
      </NavLink>
      <NavLink to="/catalog">
        <Search />
        <span>{t.catalog}</span>
      </NavLink>
      <NavLink to="/favorites">
        <Heart />
        <span>{t.fav}</span>
        {favs.length > 0 && <b>{favs.length}</b>}
      </NavLink>
      <NavLink to="/cart">
        <ShoppingBag />
        <span>{t.cart}</span>
        {cartCount > 0 && <b>{cartCount}</b>}
      </NavLink>
      <NavLink to={user ? "/account" : "/auth"}>
        <User />
        <span>{t.account}</span>
      </NavLink>
    </nav>
  );
}
function Layout({ children }) {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
function Footer() {
  const { t } = useStore();
  return (
    <footer>
      <img src={asset("raw-13.png")} alt="REVO" />
      <p>{t.heroText}</p>
      <div>
        <Link to="/catalog">{t.catalog}</Link>
        <Link to="/account">{t.account}</Link>
        <Link to="/support">{t.support}</Link>
      </div>
      <small>© 2026 REVO · Project №9</small>
    </footer>
  );
}

function Hero() {
  const { t } = useStore();
  return (
    <section className="hero">
      <div className="hero-copy">
        <span>{t.heroTop}</span>
        <h1>
          <em>{t.heroBig}</em>
          <br />
          REVO
        </h1>
        <p>{t.heroText}</p>
        <Link className="button" to="/catalog">
          {t.shop}
        </Link>
      </div>
      <div className="hero-photo">
        <img src={asset("raw-09.png")} alt="REVO coffee" />
      </div>
      <aside>
        <Link to="/catalog">{t.catalog}</Link>
        <Link to="/catalog?type=gift">{t.gift}</Link>
        <Link to="/catalog?type=combo">{t.combo}</Link>
        <Link to="/support">{t.support}</Link>
      </aside>
    </section>
  );
}
function AddControl({ id, large = false }) {
  const { cart, setCart, add, t } = useStore();
  const count = cart[id] || 0;
  const change = (delta) =>
    setCart((current) => {
      const next = {
        ...current,
        [id]: Math.max(0, (current[id] || 0) + delta),
      };
      if (!next[id]) delete next[id];
      return next;
    });
  if (!count)
    return (
      <button
        className={`button${large ? "" : " small"}`}
        onClick={() => add(id)}
      >
        {t.add}
      </button>
    );
  return (
    <div
      className={`add-stepper${large ? " large" : ""}`}
      aria-label={`${t.cart}: ${count}`}
    >
      <button aria-label="Уменьшить количество" onClick={() => change(-1)}>
        <Minus />
      </button>
      <strong>{count}</strong>
      <button aria-label="Увеличить количество" onClick={() => change(1)}>
        +
      </button>
    </div>
  );
}
function ProductCard({ p }) {
  const { lang, t, favs, toggleFav } = useStore();
  return (
    <article className="product-card">
      <Link className="product-img" to={`/product/${p.id}`}>
        <img src={p.image} alt={p.title[lang]} />
        {p.oldPrice && <span className="sale">SALE</span>}
      </Link>
      <div className="product-body">
        <div className="rating">
          <Star size={15} fill="currentColor" /> {p.rating}
        </div>
        <Link to={`/product/${p.id}`}>
          <h3>{p.title[lang]}</h3>
        </Link>
        <p>{p.note[lang]}</p>
        <div className="price">
          ${p.price.toFixed(2)} {p.oldPrice && <s>${p.oldPrice}</s>}
        </div>
        <div className="card-actions">
          <AddControl id={p.id} />
          <button
            className={favs.includes(p.id) ? "heart active" : "heart"}
            onClick={() => toggleFav(p.id)}
            aria-label={t.fav}
          >
            <Heart fill={favs.includes(p.id) ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
function SectionTitle({ eyebrow, title }) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}
function Home() {
  const { t, products } = useStore();
  return (
    <Layout>
      <Hero />
      <section className="features">
        <SectionTitle eyebrow="REVO" title={t.features} />
        <div className="feature-grid">
          <div>
            <Coffee />
            <h3>Свежая обжарка</h3>
            <p>Обжариваем небольшими партиями.</p>
          </div>
          <div>
            <Leaf />
            <h3>Чистый состав</h3>
            <p>Только отборное кофейное зерно.</p>
          </div>
          <div>
            <Package />
            <h3>Быстрая доставка</h3>
            <p>Бережно упаковываем каждый заказ.</p>
          </div>
          <div>
            <Gift />
            <h3>Идеальный подарок</h3>
            <p>Наборы с кофе и аксессуарами.</p>
          </div>
        </div>
      </section>
      <ProductRail
        items={products.slice(0, 6)}
        eyebrow={t.bestSub}
        title={t.best}
      />
      <GiftSection />
      <ProductRail
        items={products.filter((x) => x.roast === "combo")}
        eyebrow={t.comboSub}
        title={t.comboTitle}
      />
    </Layout>
  );
}
function ProductRail({ items, eyebrow, title }) {
  const rail = useRef(null);
  const move = (direction) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector(".product-card");
    const gap = parseFloat(getComputedStyle(el).gap) || 0;
    const step = (card?.getBoundingClientRect().width || el.clientWidth) + gap;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };
  return (
    <section className="rail-section">
      <SectionTitle eyebrow={eyebrow} title={title} />
      <div className="rail-controls">
        <button
          type="button"
          aria-label="Предыдущие товары"
          onClick={() => move(-1)}
        >
          <ArrowLeft />
        </button>
        <button
          type="button"
          aria-label="Следующие товары"
          onClick={() => move(1)}
        >
          <ArrowRight />
        </button>
      </div>
      <div className="rail" ref={rail}>
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
function GiftSection() {
  const { lang, t, add, products } = useStore();
  const p = products.find((x) => x.id === "giftset");
  return (
    <section className="gift-section">
      <div className="gift-image">
        <img src={p.image} alt={p.title[lang]} />
      </div>
      <div className="gift-copy">
        <span>${p.price.toFixed(2)}</span>
        <h2>{p.title[lang]}</h2>
        <p>{p.note[lang]}</p>
        <ul>
          <li>
            <Coffee /> 250 г кофе
          </li>
          <li>
            <Gift /> Фирменный фильтр
          </li>
          <li>
            <Package /> Подарочная упаковка
          </li>
        </ul>
        <button className="button" onClick={() => add(p.id)}>
          {t.buy}
        </button>
      </div>
    </section>
  );
}

function Catalog() {
  const { t, products } = useStore();
  const loc = useLocation();
  const navigate = useNavigate();
  const qs = new URLSearchParams(loc.search);
  const q = qs.get("q") || "";
  const type = qs.get("type");
  const query = normalizeSearch(q);
  const list = products.filter(
    (p) =>
      (!type || (type === "gift" ? p.roast === "gift" : p.roast === "combo")) &&
      normalizeSearch(
        `${p.title.ru} ${p.title.en} ${p.note.ru} ${p.note.en} ${p.roast} ${p.id}`,
      ).includes(query),
  );
  return (
    <Layout>
      <div className="page">
        <div className="page-head">
          <div>
            <span>REVO SHOP</span>
            <h1>{t.catalog}</h1>
          </div>
          <label className="catalog-search">
            <Search />
            <input
              value={q}
              onChange={(event) => {
                const next = new URLSearchParams(loc.search);
                if (event.target.value) next.set("q", event.target.value);
                else next.delete("q");
                navigate({ pathname: "/catalog", search: next.toString() }, { replace: true });
              }}
              placeholder={t.search}
            />
          </label>
        </div>
        <div className="catalog-grid">
          {list.map((p) => (
            <ProductCard p={p} key={p.id} />
          ))}
        </div>
        {!list.length && <Empty />}
      </div>
    </Layout>
  );
}
function Product() {
  const { id } = useParams();
  const { lang, t, favs, toggleFav, products, user, backendConnected, flash } = useStore();
  const nav = useNavigate();
  const p = products.find((x) => x.id === id);
  const [active, setActive] = useState(0);
  const touchStart = useRef(null);
  const [review, setReview] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState(() =>
    isSupabaseConfigured ? [] : read(`revo-reviews-${id}`, []),
  );
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const reload = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, user_id, rating, body, admin_reply, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (error) {
        flash(error.message);
        return;
      }
      if (active) {
        setReviews(
          (data || []).map((item) => ({
            id: item.id,
            userId: item.user_id,
            rating: item.rating,
            text: item.body,
            adminReply: item.admin_reply,
            date: new Date(item.created_at).toLocaleDateString(),
          })),
        );
      }
    };
    reload();
    const channel = supabase
      .channel(`revo-reviews-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `product_id=eq.${id}` }, reload)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [flash, id]);
  if (!p)
    return (
      <Layout>
        <Empty />
      </Layout>
    );
  const show = (next) =>
    setActive(
      (current) => (current + next + p.gallery.length) % p.gallery.length,
    );
  const pointerEnd = (event) => {
    if (touchStart.current === null) return;
    const distance = event.clientX - touchStart.current;
    if (Math.abs(distance) > 45) show(distance < 0 ? 1 : -1);
    touchStart.current = null;
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;
    if (backendConnected && !user?.id) {
      nav("/auth");
      return;
    }
    if (supabase) {
      const { error } = await supabase.from("reviews").upsert(
        {
          product_id: id,
          user_id: user.id,
          rating: reviewRating,
          body: review.trim(),
        },
        { onConflict: "product_id,user_id" },
      );
      if (error) {
        flash(error.message);
        return;
      }
    }
    const n = [
      {
        text: review,
        date: new Date().toLocaleDateString(),
        rating: reviewRating,
      },
      ...reviews,
    ];
    setReviews(n);
    if (!supabase) localStorage.setItem(`revo-reviews-${id}`, JSON.stringify(n));
    setReview("");
    setReviewRating(5);
  };
  return (
    <Layout>
      <div className="product-page">
        <Link to="/catalog" className="back">
          <ArrowLeft /> {t.back}
        </Link>
        <div className="product-detail">
          <div className="gallery">
            <div
              className="main-image"
              onPointerDown={(event) => {
                touchStart.current = event.clientX;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={pointerEnd}
              onPointerCancel={() => {
                touchStart.current = null;
              }}
            >
              <img
                src={p.gallery[active]}
                alt={`${p.title[lang]} ${active + 1}`}
              />
              {p.gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-arrow previous"
                    aria-label="Предыдущее фото"
                    onClick={() => show(-1)}
                  >
                    <ArrowLeft />
                  </button>
                  <button
                    type="button"
                    className="gallery-arrow next"
                    aria-label="Следующее фото"
                    onClick={() => show(1)}
                  >
                    <ArrowRight />
                  </button>
                </>
              )}
            </div>
            <div className="gallery-dots" aria-label="Фотографии товара">
              {p.gallery.map((_, i) => (
                <button
                  type="button"
                  className={active === i ? "active" : ""}
                  aria-label={`Фото ${i + 1}`}
                  onClick={() => setActive(i)}
                  key={i}
                />
              ))}
            </div>
            <div className="thumbs">
              {p.gallery.map((x, i) => (
                <button
                  type="button"
                  className={active === i ? "active" : ""}
                  onClick={() => setActive(i)}
                  key={x}
                >
                  <img src={x} alt={`${p.title[lang]}, фото ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="product-info">
            <div className="rating">
              <Star fill="currentColor" /> {p.rating} · 128{" "}
              {t.reviews.toLowerCase()}
            </div>
            <h1>{p.title[lang]}</h1>
            <div className="detail-price">${p.price.toFixed(2)}</div>
            <p>{p.note[lang]}</p>
            <div className="chips">
              <span>250 g</span>
              <span>{p.roast}</span>
              <span>
                {t.stock}: {p.stock}
              </span>
            </div>
            <div className="buy-row">
              <AddControl id={p.id} large />
              <button
                className={favs.includes(p.id) ? "heart active" : "heart"}
                onClick={() => toggleFav(p.id)}
              >
                <Heart fill={favs.includes(p.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
        <section className="reviews">
          <SectionTitle eyebrow={t.write} title={t.reviews} />
          <form onSubmit={submit}>
            <div className="review-rating" role="radiogroup" aria-label={lang === "ru" ? "Оценка товара" : "Product rating"}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={reviewRating === value}
                  aria-label={`${value} / 5`}
                  className={value <= reviewRating ? "active" : ""}
                  onClick={() => setReviewRating(value)}
                  key={value}
                >
                  <Star fill={value <= reviewRating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={t.write}
            />
            <button className="button">{t.send}</button>
          </form>
          {reviews.map((r, i) => (
            <blockquote key={i}>
              <div className="stars">{"★".repeat(r.rating)}</div>
              <p>{r.text}</p>
              <small>{r.date}</small>
              {r.adminReply && <div className="customer-reply"><b>REVO</b><p>{r.adminReply}</p></div>}
            </blockquote>
          ))}
        </section>
      </div>
    </Layout>
  );
}
function Empty() {
  const { t } = useStore();
  return (
    <div className="empty">
      <Coffee />
      <h2>{t.empty}</h2>
      <Link className="button" to="/catalog">
        {t.shop}
      </Link>
    </div>
  );
}
function Favorites() {
  const { favs, t, products } = useStore();
  const list = products.filter((p) => favs.includes(p.id));
  return (
    <Layout>
      <div className="page">
        <div className="page-head">
          <h1>{t.fav}</h1>
        </div>
        {list.length ? (
          <div className="catalog-grid">
            {list.map((p) => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </div>
    </Layout>
  );
}
function Cart() {
  const { cart, setCart, lang, t, products } = useStore();
  const nav = useNavigate();
  const list = products.filter((p) => cart[p.id]);
  const total = list.reduce((s, p) => s + p.price * cart[p.id], 0);
  const qty = (id, d) =>
    setCart((x) => {
      const n = { ...x, [id]: Math.max(0, (x[id] || 0) + d) };
      if (!n[id]) delete n[id];
      return n;
    });
  return (
    <Layout>
      <div className="page narrow">
        <div className="page-head">
          <h1>{t.cart}</h1>
        </div>
        {list.length ? (
          <>
            <div className="cart-list">
              {list.map((p) => (
                <div className="cart-item" key={p.id}>
                  <img src={p.image} />
                  <Link to={`/product/${p.id}`}>
                    <b>{p.title[lang]}</b>
                    <span>${p.price.toFixed(2)}</span>
                  </Link>
                  <div className="qty">
                    <button onClick={() => qty(p.id, -1)}>
                      <Minus />
                    </button>
                    <b>{cart[p.id]}</b>
                    <button onClick={() => qty(p.id, 1)}>+</button>
                  </div>
                  <button
                    className="trash"
                    onClick={() => qty(p.id, -cart[p.id])}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>
            <div className="summary">
              <span>{t.total}</span>
              <strong>${total.toFixed(2)}</strong>
              <button className="button" onClick={() => nav("/checkout")}>
                {t.checkout}
              </button>
            </div>
          </>
        ) : (
          <Empty />
        )}
      </div>
    </Layout>
  );
}
function Checkout() {
  const { cart, setCart, user, orders, setOrders, t, products, backendConnected } = useStore();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = products.reduce((s, p) => s + (cart[p.id] || 0) * p.price, 0);
  const submit = async (e) => {
    e.preventDefault();
    if (backendConnected && !user?.id) {
      nav("/auth");
      return;
    }
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const order = {
      id: `RV-${Date.now().toString().slice(-6)}`,
      created: new Date().toISOString(),
      items: cart,
      total,
      status: "new",
      customerName: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      address: String(data.get("address") || ""),
      comment: String(data.get("comment") || ""),
    };
    if (supabase) {
      const { data: created, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: order.customerName,
          email: order.email,
          phone: order.phone,
          address: order.address,
          comment: order.comment,
          total,
        })
        .select("id, order_number, created_at")
        .single();
      if (orderError) {
        setError(orderError.message);
        setBusy(false);
        return;
      }
      const items = products
        .filter((product) => cart[product.id])
        .map((product) => ({
          order_id: created.id,
          product_id: product.id,
          quantity: cart[product.id],
          price: product.price,
        }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) {
        await supabase.from("orders").delete().eq("id", created.id);
        setError(itemsError.message);
        setBusy(false);
        return;
      }
      order.id = created.order_number;
      order.databaseId = created.id;
      order.created = created.created_at;
    }
    setOrders([order, ...orders]);
    setCart({});
    setBusy(false);
    nav("/success");
  };
  return (
    <Layout>
      <div className="page narrow">
        <div className="page-head">
          <h1>{t.checkout}</h1>
        </div>
        <form className="form-card" onSubmit={submit}>
          <input name="name" required placeholder={t.name} defaultValue={user?.name} />
          <input
            name="email"
            required
            type="email"
            placeholder={t.email}
            defaultValue={user?.email}
          />
          <input name="phone" required type="tel" placeholder="Телефон / Phone" />
          <input name="address" required placeholder="Адрес доставки / Delivery address" />
          <textarea name="comment" placeholder="Комментарий / Comment" />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="summary inline">
            <span>{t.total}</span>
            <strong>${total.toFixed(2)}</strong>
            <button className="button" disabled={!total || busy}>
              {t.checkout}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
function Success() {
  const { t } = useStore();
  return (
    <Layout>
      <div className="empty success">
        <Check />
        <h1>{t.orderDone}</h1>
        <p>{t.orderText}</p>
        <Link className="button" to="/catalog">
          {t.shop}
        </Link>
      </div>
    </Layout>
  );
}
function Auth() {
  const { t, setUser, backendConnected } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const name = String(fd.get("name") || "Coffee lover").trim();
    setBusy(true);
    setError("");
    if (supabase) {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { name } },
            });
      if (result.error) {
        setError(result.error.message);
        setBusy(false);
        return;
      }
      if (mode === "register" && !result.data.session) {
        setError(
          t.lang === "EN"
            ? "Проверьте почту и подтвердите регистрацию."
            : "Check your email to confirm registration.",
        );
        setBusy(false);
        return;
      }
      setBusy(false);
      nav("/account");
      return;
    }
    await setUser({ name, email, role: "customer" });
    setBusy(false);
    nav("/account");
  };
  return (
    <Layout>
      <div className="auth-page">
        <div className="auth-art">
          <img src={asset("raw-10.png")} alt="REVO lifestyle" />
        </div>
        <form onSubmit={submit} className="auth-card">
          <span>REVO ACCOUNT</span>
          <h1>{mode === "login" ? t.login : t.register}</h1>
          {mode === "register" && (
            <input name="name" required placeholder={t.name} />
          )}
          <input name="email" required type="email" placeholder={t.email} />
          <input
            name="password"
            required
            type="password"
            minLength="6"
            placeholder={t.password}
          />
          <button className="button" disabled={busy}>
            {mode === "login" ? t.login : t.register}
          </button>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!backendConnected && (
            <small className="demo-note">
              {t.lang === "EN"
                ? "Демо-режим: данные сохраняются только в этом браузере."
                : "Demo mode: data is stored only in this browser."}
            </small>
          )}
          <button
            type="button"
            className="text-btn"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? t.register : t.login}
          </button>
        </form>
      </div>
    </Layout>
  );
}
function Account() {
  const { user, setUser, orders, t } = useStore();
  if (!user) return <Auth />;
  const visibleOrders =
    user.role === "admin"
      ? orders
      : orders.filter(
          (order) =>
            !order.email || normalizeEmail(order.email) === normalizeEmail(user.email),
        );
  return (
    <Layout>
      <div className="page narrow">
        <div className="profile-head">
          <div>
            <span>REVO MEMBER</span>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
          <button className="outline" onClick={() => setUser(null)}>
            {t.logout}
          </button>
        </div>
        <h2>{t.orders}</h2>
        <div className="orders">
          {visibleOrders.length ? (
            visibleOrders.map((o) => (
              <div key={o.id}>
                <b>{o.id}</b>
                <span>{new Date(o.created).toLocaleDateString()}</span>
                <strong>${o.total.toFixed(2)}</strong>
                <em>{o.status}</em>
              </div>
            ))
          ) : (
            <p>{t.empty}</p>
          )}
        </div>
        {user.role === "admin" && (
          <Link className="button" to="/admin">
            {t.admin}
          </Link>
        )}
      </div>
    </Layout>
  );
}
function Support() {
  const { user, lang, t, flash, backendConnected } = useStore();
  const [messages, setMessages] = useState(() =>
    isSupabaseConfigured ? [] : read("revo-support", []),
  );
  const [contactEmail, setContactEmail] = useState(
    () => user?.email || localStorage.getItem("revo-support-email") || "",
  );
  const ui =
    lang === "ru"
      ? {
          intro: "Напишите нам — обращение появится в админ-панели.",
          newRequest: "Новое обращение",
          responseTime: "Обычно отвечаем в течение рабочего дня",
          subject: "Тема обращения",
          message: "Опишите вопрос или проблему",
          history: "Мои обращения",
          new: "Новое",
          answered: "Отвечено",
          answer: "Ответ поддержки",
          chatPlaceholder: "Напишите сообщение в чат",
          sendToChat: "Отправить в чат",
          customer: "Вы",
          supportAgent: "Поддержка",
          deleteChat: "Удалить чат",
          confirmDeleteChat: "Удалить этот чат без возможности восстановления?",
          chatDeleted: "Чат удалён",
          newSupportMessage: "Новое сообщение от поддержки",
          sent: "Обращение отправлено",
          empty: "Вы ещё не отправляли обращений с этой почты.",
        }
      : {
          intro: "Write to us — your request will appear in the admin panel.",
          newRequest: "New request",
          responseTime: "We usually reply within one business day",
          subject: "Request subject",
          message: "Describe your question or problem",
          history: "My requests",
          new: "New",
          answered: "Answered",
          answer: "Support reply",
          chatPlaceholder: "Write a message in the chat",
          sendToChat: "Send to chat",
          customer: "You",
          supportAgent: "Support",
          deleteChat: "Delete chat",
          confirmDeleteChat: "Delete this chat permanently?",
          chatDeleted: "Chat deleted",
          newSupportMessage: "New message from support",
          sent: "Request sent",
          empty: "You have not sent any requests from this email yet.",
        };
  const messagesRef = useRef(messages);
  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let active = true;
    const reload = async () => {
      try {
        const next = await loadSupportThreads();
        if (active) setMessages(next);
      } catch (error) {
        if (active) flash(error.message);
      }
    };
    reload();
    const channel = supabase
      .channel(`revo-support-customer-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, reload)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [flash, user?.id]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    const syncMessages = (event) => {
      if (event.key !== "revo-support") return;
      const next = read("revo-support", []);
      const known = new Set(
        messagesRef.current.flatMap(threadMessages).map(messageKey),
      );
      const hasIncoming = next
        .filter(
          (thread) =>
            normalizeEmail(thread.email) === normalizeEmail(contactEmail),
        )
        .flatMap(threadMessages)
        .some(
          (message) =>
            message.sender === "admin" && !known.has(messageKey(message)),
        );
      messagesRef.current = next;
      setMessages(next);
      if (hasIncoming) {
        const email = normalizeEmail(contactEmail);
        const unread = read("revo-customer-unread", {});
        const remaining = { ...unread };
        delete remaining[email];
        localStorage.setItem("revo-customer-unread", JSON.stringify(remaining));
        window.dispatchEvent(new Event("revo-notifications"));
        flash(ui.newSupportMessage);
      }
    };
    window.addEventListener("storage", syncMessages);
    return () => window.removeEventListener("storage", syncMessages);
  }, [contactEmail, flash, ui.newSupportMessage]);
  useEffect(() => {
    const email = normalizeEmail(contactEmail);
    if (!email) return;
    const unread = read("revo-customer-unread", {});
    if (!Number(unread[email] || 0)) return;
    const next = { ...unread };
    delete next[email];
    localStorage.setItem("revo-customer-unread", JSON.stringify(next));
    window.dispatchEvent(new Event("revo-notifications"));
    flash(ui.newSupportMessage);
  }, [contactEmail, flash, ui.newSupportMessage]);
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const createdAt = new Date().toISOString();
    const text = String(fd.get("text") || "").trim();
    if (backendConnected && !user?.id) {
      flash(lang === "ru" ? "Войдите в аккаунт, чтобы написать в поддержку" : "Sign in to contact support");
      return;
    }
    const thread = {
      id: Date.now(),
      name: fd.get("name"),
      email,
      subject: fd.get("subject"),
      text,
      status: "new",
      createdAt,
      conversation: [{ sender: "customer", text, createdAt }],
    };
    if (supabase) {
      const { data: created, error: threadError } = await supabase
        .from("support_threads")
        .insert({
          user_id: user.id,
          customer_name: thread.name,
          email,
          subject: thread.subject,
        })
        .select("id, created_at")
        .single();
      if (threadError) {
        flash(threadError.message);
        return;
      }
      const { error: messageError } = await supabase.from("support_messages").insert({
        thread_id: created.id,
        sender_id: user.id,
        sender_role: "customer",
        body: text,
      });
      if (messageError) {
        await supabase.from("support_threads").delete().eq("id", created.id);
        flash(messageError.message);
        return;
      }
      thread.id = created.id;
      thread.createdAt = created.created_at;
    }
    const next = [thread, ...messages];
    setMessages(next);
    setContactEmail(email);
    if (!supabase) {
      addAdminUnread();
      localStorage.setItem("revo-support", JSON.stringify(next));
    }
    localStorage.setItem("revo-support-email", email);
    e.currentTarget.reset();
    flash(ui.sent);
  };
  const sendToChat = async (event, id) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("chatMessage") || "").trim();
    if (!text) return;
    if (supabase) {
      const { error } = await supabase.from("support_messages").insert({
        thread_id: id,
        sender_id: user.id,
        sender_role: "customer",
        body: text,
      });
      if (error) {
        flash(error.message);
        return;
      }
      await supabase
        .from("support_threads")
        .update({ status: "new", updated_at: new Date().toISOString() })
        .eq("id", id);
    }
    const next = messages.map((message) =>
      message.id === id
        ? {
            ...message,
            status: "new",
            conversation: [
              ...threadMessages(message),
              { sender: "customer", text, createdAt: new Date().toISOString() },
            ],
          }
        : message,
    );
    setMessages(next);
    if (!supabase) {
      addAdminUnread();
      localStorage.setItem("revo-support", JSON.stringify(next));
    }
    form.reset();
    flash(ui.sent);
  };
  const deleteChat = async (id) => {
    if (!window.confirm(ui.confirmDeleteChat)) return;
    if (supabase) {
      const { error } = await supabase.from("support_threads").delete().eq("id", id);
      if (error) {
        flash(error.message);
        return;
      }
    }
    const next = messages.filter((message) => message.id !== id);
    setMessages(next);
    if (!supabase) localStorage.setItem("revo-support", JSON.stringify(next));
    flash(ui.chatDeleted);
  };
  const ownMessages = messages.filter(
    (message) => normalizeEmail(message.email) === normalizeEmail(contactEmail),
  );
  return (
    <Layout>
      <div className="page narrow">
        <div className="page-head">
          <div>
            <span>REVO CARE</span>
            <h1>{t.support}</h1>
            <p>{ui.intro}</p>
          </div>
        </div>
        <form className="form-card support-form" onSubmit={submit}>
          <div className="support-form-head">
            <span className="support-form-icon"><MessageCircle /></span>
            <div>
              <h2>{ui.newRequest}</h2>
              <p>{ui.responseTime}</p>
            </div>
          </div>
          <div className="support-form-grid">
            <label>
              <span>{t.name}</span>
              <input name="name" required placeholder={t.name} defaultValue={user?.name} />
            </label>
            <label>
              <span>{t.email}</span>
              <input
                name="email"
                required
                type="email"
                placeholder={t.email}
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </label>
            <label className="support-form-wide">
              <span>{ui.subject}</span>
              <input name="subject" required placeholder={ui.subject} />
            </label>
            <label className="support-form-wide">
              <span>{ui.message}</span>
              <textarea name="text" required placeholder={ui.message} />
            </label>
          </div>
          <button className="button support-submit"><Send />{t.send}</button>
        </form>
        <section className="support-history">
          <div className="support-history-head">
            <div><span>REVO DIALOG</span><h2>{ui.history}</h2></div>
            <b>{ownMessages.length}</b>
          </div>
          {ownMessages.length ? (
            <div className="support-thread-list">
              {ownMessages.map((message) => (
                <article className="support-ticket" key={message.id}>
                  <div className="message-head">
                    <div>
                      <b>{message.subject || t.support}</b>
                      <small>
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleString(
                              lang === "ru" ? "ru-RU" : "en-US",
                            )
                          : ""}
                      </small>
                    </div>
                    <div className="ticket-actions">
                      <span
                        className={`status ${message.status === "answered" ? "answered" : "new"}`}
                      >
                        {message.status === "answered" ? ui.answered : ui.new}
                      </span>
                      <button
                        type="button"
                        className="delete-action icon-only"
                        aria-label={ui.deleteChat}
                        title={ui.deleteChat}
                        onClick={() => deleteChat(message.id)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                  <div className="support-chat">
                    {threadMessages(message).map((chatMessage, index) => (
                      <div
                        className={`chat-bubble ${chatMessage.sender}`}
                        key={`${message.id}-${index}`}
                      >
                        <b>
                          {chatMessage.sender === "admin"
                            ? ui.supportAgent
                            : ui.customer}
                        </b>
                        <p>{chatMessage.text}</p>
                        {chatMessage.createdAt && (
                          <small>
                            {new Date(chatMessage.createdAt).toLocaleString(
                              lang === "ru" ? "ru-RU" : "en-US",
                            )}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                  <form
                    className="chat-compose"
                    onSubmit={(event) => sendToChat(event, message.id)}
                  >
                    <textarea
                      name="chatMessage"
                      required
                      placeholder={ui.chatPlaceholder}
                    />
                    <button className="button small"><Send />{ui.sendToChat}</button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="support-empty"><MessageCircle /><p>{ui.empty}</p></div>
          )}
        </section>
      </div>
    </Layout>
  );
}
function Admin() {
  const { user, authReady } = useStore();
  if (!authReady) return <div className="page"><div className="empty"><Coffee /></div></div>;
  return user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/auth" replace />;
}
function AdminDashboard() {
  const {
    user,
    lang,
    t,
    orders,
    setOrders,
    flash,
    products,
    addProduct,
    deleteProduct,
  } = useStore();
  const ui =
    lang === "ru"
      ? {
          overview: "Обзор",
          store: "Открыть магазин",
          revenue: "Выручка",
          newOrders: "Новые заказы",
          orderSummary: "Состояние заказов",
          new: "Новый",
          work: "В работе",
          done: "Завершён",
          answered: "Отвечено",
          reply: "Ответить",
          replyPlaceholder: "Напишите ответ клиенту",
          sendReply: "Отправить ответ",
          customer: "Клиент",
          supportAgent: "Поддержка",
          saved: "Изменения сохранены",
          stockSaved: "Остаток сохранён",
          replySaved: "Ответ сохранён",
          reviews: "Отзывы",
          deleteReview: "Удалить отзыв",
          reviewDeleted: "Отзыв удалён",
          createProduct: "Создать товар",
          newProduct: "Новый товар",
          titleRu: "Название на русском",
          titleEn: "Название на английском",
          descriptionRu: "Описание на русском",
          descriptionEn: "Описание на английском",
          imageUrl: "Ссылка на изображение",
          imageFile: "Или загрузите фото",
          imageTooLarge: "Изображение должно быть меньше 1,5 МБ",
          category: "Категория",
          price: "Цена",
          productCreated: "Товар создан и добавлен в каталог",
          deleteProduct: "Удалить товар",
          deleteOrder: "Удалить заказ",
          deleteChat: "Удалить чат",
          confirmDeleteProduct: "Удалить этот товар из каталога?",
          confirmDeleteOrder: "Удалить этот заказ?",
          confirmDeleteChat: "Удалить этот чат без возможности восстановления?",
          productDeleted: "Товар удалён",
          orderDeleted: "Заказ удалён",
          chatDeleted: "Чат удалён",
          newCustomerMessage: "Новое сообщение от клиента",
          noData: "Данных пока нет",
        }
      : {
          overview: "Overview",
          store: "Open store",
          revenue: "Revenue",
          newOrders: "New orders",
          orderSummary: "Order status",
          new: "New",
          work: "In progress",
          done: "Completed",
          answered: "Answered",
          reply: "Reply",
          replyPlaceholder: "Write a reply to the customer",
          sendReply: "Send reply",
          customer: "Customer",
          supportAgent: "Support",
          saved: "Changes saved",
          stockSaved: "Stock saved",
          replySaved: "Reply saved",
          reviews: "Reviews",
          deleteReview: "Delete review",
          reviewDeleted: "Review deleted",
          createProduct: "Create product",
          newProduct: "New product",
          titleRu: "Russian title",
          titleEn: "English title",
          descriptionRu: "Russian description",
          descriptionEn: "English description",
          imageUrl: "Image URL",
          imageFile: "Or upload a photo",
          imageTooLarge: "The image must be smaller than 1.5 MB",
          category: "Category",
          price: "Price",
          productCreated: "Product created and added to the catalog",
          deleteProduct: "Delete product",
          deleteOrder: "Delete order",
          deleteChat: "Delete chat",
          confirmDeleteProduct: "Delete this product from the catalog?",
          confirmDeleteOrder: "Delete this order?",
          confirmDeleteChat: "Delete this chat permanently?",
          productDeleted: "Product deleted",
          orderDeleted: "Order deleted",
          chatDeleted: "Chat deleted",
          newCustomerMessage: "New customer message",
          noData: "No data yet",
        };
  const [tab, setTab] = useState("overview");
  const defaultStock = Object.fromEntries(products.map((p) => [p.id, p.stock]));
  const [stock, setStock] = useState(() => read("revo-stock", defaultStock));
  const [messages, setMessages] = useState(() =>
    isSupabaseConfigured ? [] : read("revo-support", []),
  );
  const [drafts, setDrafts] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewVersion, setReviewVersion] = useState(0);
  const [remoteReviews, setRemoteReviews] = useState([]);
  const adminTabsRef = useRef(null);
  useEffect(() => {
    const tabsElement = adminTabsRef.current;
    if (!tabsElement) return undefined;
    const scrollWithMouse = (event) => {
      if (tabsElement.scrollWidth <= tabsElement.clientWidth) return;
      const distance =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (!distance) return;
      const multiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 28
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? tabsElement.clientWidth
            : 1;
      event.preventDefault();
      tabsElement.scrollLeft += distance * multiplier;
    };
    tabsElement.addEventListener("wheel", scrollWithMouse, { passive: false });
    return () => tabsElement.removeEventListener("wheel", scrollWithMouse);
  }, []);
  const adminMessagesRef = useRef(messages);
  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let active = true;
    const reload = async () => {
      try {
        const next = await loadSupportThreads();
        if (active) setMessages(next);
      } catch (error) {
        if (active) flash(error.message);
      }
    };
    reload();
    const channel = supabase
      .channel("revo-support-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_threads" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, reload)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [flash, user?.id]);
  useEffect(() => {
    adminMessagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    const syncMessages = (event) => {
      if (event.key !== "revo-support") return;
      const next = read("revo-support", []);
      const known = new Set(
        adminMessagesRef.current.flatMap(threadMessages).map(messageKey),
      );
      const hasIncoming = next
        .flatMap(threadMessages)
        .some(
          (message) =>
            message.sender === "customer" && !known.has(messageKey(message)),
        );
      adminMessagesRef.current = next;
      setMessages(next);
      if (hasIncoming) {
        localStorage.setItem("revo-admin-unread", "0");
        flash(ui.newCustomerMessage);
      }
    };
    window.addEventListener("storage", syncMessages);
    return () => window.removeEventListener("storage", syncMessages);
  }, [flash, ui.newCustomerMessage]);
  useEffect(() => {
    const unread = Number(localStorage.getItem("revo-admin-unread") || 0);
    if (!unread) return;
    localStorage.setItem("revo-admin-unread", "0");
    flash(ui.newCustomerMessage);
  }, [flash, ui.newCustomerMessage]);
  useEffect(() => {
    if (!supabase || !user?.id) return undefined;
    let active = true;
    const reload = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, product_id, rating, body, admin_reply, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        flash(error.message);
        return;
      }
      if (active) setRemoteReviews(data || []);
    };
    reload();
    const channel = supabase
      .channel("revo-reviews-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, reload)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [flash, user?.id]);
  const reviews = supabase
    ? remoteReviews
        .map((review) => ({
          id: review.id,
          rating: review.rating,
          text: review.body,
          adminReply: review.admin_reply,
          date: new Date(review.created_at).toLocaleDateString(),
          product: products.find((product) => product.id === review.product_id),
        }))
        .filter((review) => review.product)
    : products.flatMap((product) =>
        read(`revo-reviews-${product.id}`, []).map((review, reviewIndex) => ({
          ...review,
          product,
          reviewIndex,
        })),
      );
  const totalStock = Object.values(stock).reduce(
    (a, b) => a + Number(b || 0),
    0,
  );
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  const saveStock = async (id) => {
    const clean = { ...stock, [id]: Math.max(0, Number(stock[id]) || 0) };
    if (supabase) {
      const { error } = await supabase
        .from("products")
        .update({ stock: clean[id], updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        flash(error.message);
        return;
      }
    }
    setStock(clean);
    localStorage.setItem("revo-stock", JSON.stringify(clean));
    flash(ui.stockSaved);
  };
  const createProduct = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("imageFile");
    if (file instanceof File && file.size > 1_500_000) {
      flash(ui.imageTooLarge);
      return;
    }
    let image = String(data.get("image") || "").trim();
    if (file instanceof File && file.size) {
      image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    image ||= asset("raw-03.png");
    const product = {
      id: `custom-${Date.now()}`,
      image,
      gallery: [image],
      price: Math.max(0, Number(data.get("price")) || 0),
      rating: 5,
      stock: Math.max(0, Number(data.get("stock")) || 0),
      roast: data.get("category") || "medium",
      title: {
        ru: String(data.get("titleRu") || "").trim(),
        en: String(data.get("titleEn") || "").trim(),
      },
      note: {
        ru: String(data.get("descriptionRu") || "").trim(),
        en: String(data.get("descriptionEn") || "").trim(),
      },
    };
    if (supabase) {
      const { error } = await supabase.from("products").insert({
        id: product.id,
        title_ru: product.title.ru,
        title_en: product.title.en,
        description_ru: product.note.ru,
        description_en: product.note.en,
        category: product.roast,
        price: product.price,
        stock: product.stock,
        image_url: product.image,
        gallery: product.gallery,
      });
      if (error) {
        flash(error.message);
        return;
      }
    }
    addProduct(product);
    const nextStock = { ...stock, [product.id]: product.stock };
    setStock(nextStock);
    localStorage.setItem("revo-stock", JSON.stringify(nextStock));
    form.reset();
    flash(ui.productCreated);
  };
  const updateOrder = async (id, status) => {
    const order = orders.find((item) => item.id === id);
    if (supabase && order?.databaseId) {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", order.databaseId);
      if (error) {
        flash(error.message);
        return;
      }
    }
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    flash(ui.saved);
  };
  const sendReply = async (id) => {
    const text = (drafts[id] || "").trim();
    if (!text) return;
    const createdAt = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase.from("support_messages").insert({
        thread_id: id,
        sender_id: user.id,
        sender_role: "admin",
        body: text,
      });
      if (error) {
        flash(error.message);
        return;
      }
      await supabase
        .from("support_threads")
        .update({ status: "answered", updated_at: createdAt })
        .eq("id", id);
    }
    const next = messages.map((m) =>
      m.id === id
        ? {
            ...m,
            reply: text,
            status: "answered",
            repliedAt: createdAt,
            conversation: [
              ...threadMessages(m),
              { sender: "admin", text, createdAt },
            ],
          }
        : m,
    );
    setMessages(next);
    if (!supabase) {
      addCustomerUnread(messages.find((message) => message.id === id)?.email);
      localStorage.setItem("revo-support", JSON.stringify(next));
    }
    setDrafts((current) => ({ ...current, [id]: "" }));
    flash(ui.replySaved);
  };
  const removeProduct = async (id) => {
    if (!window.confirm(ui.confirmDeleteProduct)) return;
    if (supabase) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        flash(error.message);
        return;
      }
    }
    deleteProduct(id);
    const nextStock = { ...stock };
    delete nextStock[id];
    setStock(nextStock);
    localStorage.setItem("revo-stock", JSON.stringify(nextStock));
    localStorage.removeItem(`revo-reviews-${id}`);
    flash(ui.productDeleted);
  };
  const removeOrder = async (id) => {
    if (!window.confirm(ui.confirmDeleteOrder)) return;
    const order = orders.find((item) => item.id === id);
    if (supabase && order?.databaseId) {
      const { error } = await supabase.from("orders").delete().eq("id", order.databaseId);
      if (error) {
        flash(error.message);
        return;
      }
    }
    setOrders(orders.filter((order) => order.id !== id));
    flash(ui.orderDeleted);
  };
  const removeChat = async (id) => {
    if (!window.confirm(ui.confirmDeleteChat)) return;
    if (supabase) {
      const { error } = await supabase.from("support_threads").delete().eq("id", id);
      if (error) {
        flash(error.message);
        return;
      }
    }
    const next = messages.filter((message) => message.id !== id);
    setMessages(next);
    if (!supabase) localStorage.setItem("revo-support", JSON.stringify(next));
    setDrafts((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
    flash(ui.chatDeleted);
  };
  const deleteReview = async (productId, reviewIndex, databaseId) => {
    if (supabase && databaseId) {
      const { error } = await supabase.from("reviews").delete().eq("id", databaseId);
      if (error) {
        flash(error.message);
        return;
      }
      setRemoteReviews((current) => current.filter((review) => review.id !== databaseId));
      flash(ui.reviewDeleted);
      return;
    }
    const key = `revo-reviews-${productId}`;
    const next = read(key, []).filter((_, index) => index !== reviewIndex);
    localStorage.setItem(key, JSON.stringify(next));
    setReviewVersion((version) => version + 1);
    flash(ui.reviewDeleted);
  };
  const replyToReview = async (review) => {
    const key = review.id || `${review.product.id}-${review.reviewIndex}`;
    const text = String(reviewDrafts[key] || "").trim();
    if (!text) return;
    if (supabase && review.id) {
      const { error } = await supabase
        .from("reviews")
        .update({ admin_reply: text })
        .eq("id", review.id);
      if (error) {
        flash(error.message);
        return;
      }
      setRemoteReviews((current) =>
        current.map((item) =>
          item.id === review.id ? { ...item, admin_reply: text } : item,
        ),
      );
    } else {
      const storageKey = `revo-reviews-${review.product.id}`;
      const next = read(storageKey, []).map((item, index) =>
        index === review.reviewIndex ? { ...item, adminReply: text } : item,
      );
      localStorage.setItem(storageKey, JSON.stringify(next));
      setReviewVersion((version) => version + 1);
    }
    setReviewDrafts((current) => ({ ...current, [key]: "" }));
    flash(ui.replySaved);
  };
  void reviewVersion;
  const tabs = [
    ["overview", ui.overview],
    ["products", t.products],
    ["orders", t.orders],
    ["messages", t.messages],
    ["reviews", ui.reviews],
  ];
  return (
    <Layout>
      <div className="admin">
        <div className="admin-top">
          <div>
            <span>REVO CONTROL</span>
            <h1>{t.admin}</h1>
          </div>
          <Link className="outline" to="/">
            {ui.store}
          </Link>
        </div>
        <div className="admin-tabs" ref={adminTabsRef}>
          {tabs.map((x) => (
            <button
              type="button"
              className={tab === x[0] ? "active" : ""}
              onClick={() => setTab(x[0])}
              key={x[0]}
            >
              {x[1]}
              {x[0] === "orders" && newOrders > 0 ? <b>{newOrders}</b> : null}
              {x[0] === "messages" &&
              messages.filter((m) => m.status !== "answered").length > 0 ? (
                <b>{messages.filter((m) => m.status !== "answered").length}</b>
              ) : null}
              {x[0] === "reviews" && reviews.length > 0 ? (
                <b>{reviews.length}</b>
              ) : null}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <>
            <div className="stats">
              <div>
                <span>{t.products}</span>
                <b>{products.length}</b>
              </div>
              <div>
                <span>{t.stock}</span>
                <b>{totalStock}</b>
              </div>
              <div>
                <span>{ui.newOrders}</span>
                <b>{newOrders}</b>
              </div>
              <div>
                <span>{ui.revenue}</span>
                <b>${revenue.toFixed(2)}</b>
              </div>
            </div>
            <div className="admin-block order-summary">
              <div>
                <h2>{ui.orderSummary}</h2>
                <p>REVO Dashboard</p>
              </div>
              <div>
                <span>
                  {ui.new}
                  <b>{orders.filter((o) => o.status === "new").length}</b>
                </span>
                <span>
                  {ui.work}
                  <b>{orders.filter((o) => o.status === "work").length}</b>
                </span>
                <span>
                  {ui.done}
                  <b>{orders.filter((o) => o.status === "done").length}</b>
                </span>
              </div>
            </div>
          </>
        )}
        {tab === "products" && (
          <div className="product-admin">
            <form className="admin-block create-product" onSubmit={createProduct}>
              <div className="create-product-head">
                <div>
                  <span>REVO CATALOG</span>
                  <h2>{ui.newProduct}</h2>
                </div>
                <button className="button" type="submit">
                  {ui.createProduct}
                </button>
              </div>
              <div className="create-product-fields">
                <input name="titleRu" required placeholder={ui.titleRu} />
                <input name="titleEn" required placeholder={ui.titleEn} />
                <textarea
                  name="descriptionRu"
                  required
                  placeholder={ui.descriptionRu}
                />
                <textarea
                  name="descriptionEn"
                  required
                  placeholder={ui.descriptionEn}
                />
                <input name="price" required min="0" step="0.01" type="number" placeholder={ui.price} />
                <input name="stock" required min="0" step="1" type="number" placeholder={t.stock} />
                <select name="category" aria-label={ui.category} defaultValue="medium">
                  <option value="medium">Medium</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="gift">Gift</option>
                  <option value="combo">Combo</option>
                </select>
                <input name="image" type="url" placeholder={ui.imageUrl} />
                <label className="product-file">
                  <span>{ui.imageFile}</span>
                  <input name="imageFile" type="file" accept="image/*" />
                </label>
              </div>
            </form>
            <div className="stock-list">
              {products.map((p) => (
                <div key={p.id}>
                  <img src={p.image} alt="" />
                  <div className="stock-name">
                    <b>{p.title[lang]}</b>
                    <small>${p.price.toFixed(2)}</small>
                  </div>
                  <label>
                    {t.stock}
                    <input
                      min="0"
                      type="number"
                      value={stock[p.id] ?? 0}
                      onChange={(e) =>
                        setStock({ ...stock, [p.id]: e.target.value })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button small"
                    onClick={() => saveStock(p.id)}
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    className="delete-action icon-only"
                    aria-label={ui.deleteProduct}
                    title={ui.deleteProduct}
                    onClick={() => removeProduct(p.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "orders" && (
          <div className="admin-block admin-list">
            {orders.length ? (
              orders.map((o) => (
                <div className="admin-row order-row" key={o.id}>
                  <div>
                    <b>{o.id}</b>
                    <small>
                      {new Date(o.created).toLocaleDateString(
                        lang === "ru" ? "ru-RU" : "en-US",
                      )}
                    </small>
                  </div>
                  <span>${Number(o.total).toFixed(2)}</span>
                  <select
                    aria-label={t.status}
                    value={o.status}
                    onChange={(e) => updateOrder(o.id, e.target.value)}
                  >
                    <option value="new">{ui.new}</option>
                    <option value="work">{ui.work}</option>
                    <option value="done">{ui.done}</option>
                  </select>
                  <button
                    type="button"
                    className="delete-action icon-only"
                    aria-label={ui.deleteOrder}
                    title={ui.deleteOrder}
                    onClick={() => removeOrder(o.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))
            ) : (
              <p>{ui.noData}</p>
            )}
          </div>
        )}
        {tab === "messages" && (
          <div className="admin-block admin-list">
            {messages.length ? (
              messages.map((m) => (
                <div className="message support-message" key={m.id}>
                  <div className="message-head">
                    <b>{m.name}</b>
                    <div className="ticket-actions">
                      <span
                        className={`status ${m.status === "answered" ? "answered" : "new"}`}
                      >
                        {m.status === "answered" ? ui.answered : ui.new}
                      </span>
                      <button
                        type="button"
                        className="delete-action icon-only"
                        aria-label={ui.deleteChat}
                        title={ui.deleteChat}
                        onClick={() => removeChat(m.id)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                  {m.subject && <h3>{m.subject}</h3>}
                  {m.createdAt && (
                    <small>
                      {new Date(m.createdAt).toLocaleString(
                        lang === "ru" ? "ru-RU" : "en-US",
                      )}
                    </small>
                  )}
                  <div className="support-chat admin-chat">
                    {threadMessages(m).map((chatMessage, index) => (
                      <div
                        className={`chat-bubble ${chatMessage.sender}`}
                        key={`${m.id}-${index}`}
                      >
                        <b>
                          {chatMessage.sender === "admin"
                            ? ui.supportAgent
                            : ui.customer}
                        </b>
                        <p>{chatMessage.text}</p>
                        {chatMessage.createdAt && (
                          <small>
                            {new Date(chatMessage.createdAt).toLocaleString(
                              lang === "ru" ? "ru-RU" : "en-US",
                            )}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="reply-box">
                    <textarea
                      value={drafts[m.id] || ""}
                      onChange={(e) =>
                        setDrafts({ ...drafts, [m.id]: e.target.value })
                      }
                      placeholder={ui.replyPlaceholder}
                    />
                    <button
                      type="button"
                      className="button small"
                      disabled={!(drafts[m.id] || "").trim()}
                      onClick={() => sendReply(m.id)}
                    >
                      {ui.sendReply}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>{ui.noData}</p>
            )}
          </div>
        )}
        {tab === "reviews" && (
          <div className="admin-block admin-list">
            {reviews.length ? (
              reviews.map((review) => (
                <article
                  className="admin-review"
                  key={`${review.product.id}-${review.reviewIndex}`}
                >
                  <img src={review.product.image} alt="" />
                  <div className="admin-review-copy">
                    <b>{review.product.title[lang]}</b>
                    <div className="stars">
                      {"★".repeat(Number(review.rating) || 5)}
                    </div>
                    <p>{review.text}</p>
                    <small>{review.date}</small>
                    {review.adminReply && (
                      <div className="saved-reply"><b>REVO</b><p>{review.adminReply}</p></div>
                    )}
                    <div className="reply-box review-reply-box">
                      <textarea
                        value={reviewDrafts[review.id || `${review.product.id}-${review.reviewIndex}`] || ""}
                        onChange={(event) =>
                          setReviewDrafts({
                            ...reviewDrafts,
                            [review.id || `${review.product.id}-${review.reviewIndex}`]: event.target.value,
                          })
                        }
                        placeholder={ui.replyPlaceholder}
                      />
                      <button type="button" className="button small" onClick={() => replyToReview(review)}>
                        {ui.sendReply}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="delete-review"
                    aria-label={ui.deleteReview}
                    onClick={() =>
                      deleteReview(review.product.id, review.reviewIndex, review.id)
                    }
                  >
                    <Trash2 />
                    <span>{ui.deleteReview}</span>
                  </button>
                </article>
              ))
            ) : (
              <p>{ui.noData}</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/account" element={<Account />} />
      <Route path="/orders" element={<Account />} />
      <Route path="/support" element={<Support />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
const rootElement = document.getElementById("root");
const reactRoot = rootElement.__revoRoot || ReactDOM.createRoot(rootElement);
rootElement.__revoRoot = reactRoot;
reactRoot.render(
  <React.StrictMode>
    <HashRouter>
      <Provider>
        <App />
      </Provider>
    </HashRouter>
  </React.StrictMode>,
);
