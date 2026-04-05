import { useContext, useMemo } from "react";
import { ProductContext } from "../context/ProductContext";
import { OrderContext } from "../context/OrderContext";
import { useLanguage } from "../context/LanguageContext";
import "./MarketingDashboard.css";

function MarketingDashboard() {
  const { products } = useContext(ProductContext);
  const { orders } = useContext(OrderContext);
  const { t } = useLanguage();

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total || 0), 0),
    [orders]
  );

  const totalItemsSold = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum +
          (order.items?.reduce((itemsSum, item) => itemsSum + (item.qty || 0), 0) ||
            0),
        0
      ),
    [orders]
  );

  const customerStats = useMemo(() => {
    const customerOrders = {};

    orders.forEach((order) => {
      if (!order.username) {
        return;
      }

      customerOrders[order.username] =
        (customerOrders[order.username] || 0) + 1;
    });

    const customers = Object.keys(customerOrders);
    const uniqueCustomers = customers.length;
    const repeatCustomers = customers.filter(
      (username) => customerOrders[username] > 1
    ).length;
    const newCustomers = uniqueCustomers - repeatCustomers;
    const avgOrdersPerCustomer =
      uniqueCustomers > 0 ? orders.length / uniqueCustomers : 0;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const topCustomers = Object.entries(customerOrders)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      uniqueCustomers,
      repeatCustomers,
      newCustomers,
      avgOrdersPerCustomer,
      avgOrderValue,
      topCustomers,
    };
  }, [orders, totalRevenue]);

  const demandStats = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        map[item.id] = {
          ...(map[item.id] || {
            id: item.id,
            name: item.name,
            qty: 0,
            revenue: 0,
          }),
          qty: (map[item.id]?.qty || 0) + (item.qty || 0),
          revenue:
            (map[item.id]?.revenue || 0) +
            (Number(item.price) || 0) * (item.qty || 0),
        };
      });
    });

    const ranked = Object.values(map).sort((a, b) => b.qty - a.qty);
    const topQty = ranked[0]?.qty || 0;

    const withDemandLevel = ranked.map((product) => {
      const ratio = topQty > 0 ? product.qty / topQty : 0;
      let demand = "Low";

      if (ratio >= 0.7) {
        demand = t("marketing.high");
      } else if (ratio >= 0.35) {
        demand = t("marketing.medium");
      }

      return { ...product, demand };
    });

    return {
      trendingProduct: withDemandLevel[0] || null,
      rankedProducts: withDemandLevel.slice(0, 6),
    };
  }, [orders, t]);

  const engagement = useMemo(() => {
    const activeProducts = products.length;
    const activeCustomers = customerStats.uniqueCustomers;
    const ordersCount = orders.length;
    const avgItemsPerOrder =
      ordersCount > 0 ? totalItemsSold / ordersCount : 0;

    const conversionProxy =
      activeCustomers > 0 ? (ordersCount / activeCustomers) * 100 : 0;

    let engagementLevel = t("marketing.low");
    if (ordersCount >= 10 && avgItemsPerOrder >= 2) {
      engagementLevel = t("marketing.high");
    } else if (ordersCount >= 4) {
      engagementLevel = t("marketing.medium");
    }

    return {
      activeProducts,
      activeCustomers,
      avgItemsPerOrder,
      conversionProxy,
      engagementLevel,
    };
  }, [
    products.length,
    customerStats.uniqueCustomers,
    orders.length,
    totalItemsSold,
    t,
  ]);

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const buildShareText = (product, platform) => {
    const translatedName = t(`products.${product.name}`, product.name);
    const base = t("marketing.shareTextBase").replace("{productName}", translatedName).replace("{price}", product.price);
    const cta = t("marketing.shareTextCTA");
    const hashtags = t("marketing.shareTextHashtags");

    if (platform === "whatsapp") {
      return `${base}\n${cta}\n${hashtags}`;
    }

    if (platform === "instagram") {
      return `${base} ${hashtags}`;
    }

    return `${base} ${cta} ${hashtags}`;
  };

  const shareProduct = async (product, platform) => {
    const text = buildShareText(product, platform);

    if (navigator.share) {
      await navigator.share({
        title: t(`products.${product.name}`, product.name),
        text,
        url: "https://globalthreads.com/shop",
      });
      return;
    }

    await navigator.clipboard.writeText(text);
    alert(`${t("marketing.campaignCopied")} ${platform.toUpperCase()} 📣`);
  };

  return (
    <div className="marketing-page">
      <h1 className="marketing-title">📢 {t("marketing.title")}</h1>

      <div className="marketing-section">
        <h2>{t("marketing.promoteTitle")}</h2>
        <p>{t("marketing.promoteDesc")}</p>

        <div className="marketing-product-grid">
          {products.map((product) => (
            <div key={product.id} className="marketing-product-card">
              <img
                src={product.image}
                alt={product.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x300?text=Product";
                }}
              />
              <h3>{t(`products.${product.name}`, product.name)}</h3>
              <p>{formatMoney(product.price)}</p>
              <div className="marketing-share-actions">
                <button onClick={() => shareProduct(product, "whatsapp")}>{t("marketing.whatsapp")}</button>
                <button onClick={() => shareProduct(product, "instagram")}>{t("marketing.instagram")}</button>
                <button onClick={() => shareProduct(product, "facebook")}>{t("marketing.facebook")}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="marketing-section">
        <h2>{t("marketing.analyzeTitle")}</h2>

        <div className="marketing-stats-grid">
          <div className="marketing-stat-card">
            <h3>{customerStats.uniqueCustomers}</h3>
            <p>{t("marketing.uniqueCustomers")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{customerStats.newCustomers}</h3>
            <p>{t("marketing.newCustomers")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{customerStats.repeatCustomers}</h3>
            <p>{t("marketing.repeatCustomers")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{customerStats.avgOrdersPerCustomer.toFixed(1)}</h3>
            <p>{t("marketing.avgOrdersCustomer")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{formatMoney(customerStats.avgOrderValue)}</h3>
            <p>{t("marketing.averageOrderValue")}</p>
          </div>
        </div>

        <div className="marketing-list-card">
          <h3>{t("marketing.topCustomers")}</h3>
          {customerStats.topCustomers.length === 0 ? (
            <p>{t("marketing.noCustomerHistory")}</p>
          ) : (
            customerStats.topCustomers.map(([username, orderCount]) => (
              <div key={username} className="marketing-list-row">
                <span>{username}</span>
                <strong>{orderCount} {t("marketing.ordersSuffix")}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="marketing-section">
        <h2>{t("marketing.trendsTitle")}</h2>

        <div className="marketing-stats-grid">
          <div className="marketing-stat-card">
            <h3>{formatMoney(totalRevenue)}</h3>
            <p>{t("marketing.totalRevenue")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{orders.length}</h3>
            <p>{t("marketing.totalOrders")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{totalItemsSold}</h3>
            <p>{t("marketing.itemsSold")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{t(`products.${demandStats.trendingProduct?.name}`, demandStats.trendingProduct?.name) || t("marketing.na")}</h3>
            <p>{t("marketing.trendingProduct")}</p>
          </div>
        </div>

        <div className="marketing-list-card">
          <h3>{t("marketing.demandByProduct")}</h3>
          {demandStats.rankedProducts.length === 0 ? (
            <p>{t("marketing.noDemandData")}</p>
          ) : (
            demandStats.rankedProducts.map((product) => (
              <div key={product.id} className="marketing-list-row">
                <span>{t(`products.${product.name}`, product.name)}</span>
                <strong>
                  {product.qty} {t("marketing.soldSuffix")} • {product.demand} {t("marketing.demandSuffix")}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="marketing-section">
        <h2>{t("marketing.engagementTitle")}</h2>

        <div className="marketing-stats-grid">
          <div className="marketing-stat-card">
            <h3>{engagement.activeProducts}</h3>
            <p>{t("marketing.activeProducts")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{engagement.activeCustomers}</h3>
            <p>{t("marketing.engagedCustomers")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{engagement.avgItemsPerOrder.toFixed(1)}</h3>
            <p>{t("marketing.avgItemsOrder")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{engagement.conversionProxy.toFixed(0)}%</h3>
            <p>{t("marketing.orderConversion")}</p>
          </div>
          <div className="marketing-stat-card">
            <h3>{engagement.engagementLevel}</h3>
            <p>{t("marketing.engagementLevel")}</p>
          </div>
        </div>

        <div className="marketing-list-card">
          <h3>{t("marketing.recommendedActions")}</h3>
          <div className="marketing-list-row">
            <span>{t("marketing.boostDemand")}</span>
            <strong>{demandStats.rankedProducts.length > 0 ? t("marketing.priority") : t("marketing.pending")}</strong>
          </div>
          <div className="marketing-list-row">
            <span>{t("marketing.retentionCampaign")}</span>
            <strong>{customerStats.repeatCustomers > 0 ? t("marketing.ready") : t("marketing.buildBase")}</strong>
          </div>
          <div className="marketing-list-row">
            <span>{t("marketing.lowDemandDiscovery")}</span>
            <strong>{demandStats.rankedProducts.length > 2 ? t("marketing.needed") : t("marketing.notYet")}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketingDashboard;
