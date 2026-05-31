import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { graphqlRequest } from "../api/client";
import { Summary, Transaction } from "../types";
import { resolveCategoryAccent, resolveCategoryIconPath } from "../utils/categoryVisual";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const txCountByCategoryKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transactions) {
      const key = `${t.categoryId}-${t.type}`;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [transactions]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await graphqlRequest<{
          summary: Summary;
          transactions: Transaction[];
        }>(
          `
            query DashboardData {
              summary {
                income
                expense
                balance
                byCategory {
                  categoryId
                  categoryName
                  type
                  total
                  colorKey
                  iconKey
                }
              }
              transactions {
                id
                description
                amount
                date
                type
                category { id name iconKey colorKey }
              }
            }
          `
        );
        setSummary(data.summary);
        setTransactions(data.transactions);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    load();
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h2>Dashboard</h2>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="dashboard-stats">
        <div className="dashboard-card">
          <div className="card-title">
            <span className="total-balance-icon" aria-hidden="true" />
            <span>Saldo total</span>
          </div>
          <strong>{summary ? currency.format(summary.balance) : "-"}</strong>
        </div>
        <div className="dashboard-card">
          <div className="card-title">
            <span className="income-stat-icon" aria-hidden="true" />
            <span>Receitas do mês</span>
          </div>
          <strong className="income">{summary ? currency.format(summary.income) : "-"}</strong>
        </div>
        <div className="dashboard-card">
          <div className="card-title">
            <span className="expense-stat-icon" aria-hidden="true" />
            <span>Despesas do mês</span>
          </div>
          <strong className="expense">{summary ? currency.format(summary.expense) : "-"}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-list-card">
          <header className="section-header">
            <span>Transações recentes</span>
            <button className="link-button" type="button" onClick={() => navigate("/transactions")}>
              Ver todas <span className="link-button-chevron" aria-hidden="true" />
            </button>
          </header>
          <div className="transaction-list">
            {recentTransactions.map((transaction) => {
              const cat = transaction.category;
              const catName = cat?.name ?? "Categoria";
              const accent = cat
                ? resolveCategoryAccent(cat)
                : resolveCategoryAccent({ name: catName, type: transaction.type });
              const iconPath = cat
                ? resolveCategoryIconPath(cat)
                : resolveCategoryIconPath({ name: catName, type: transaction.type });
              return (
                <div className="transaction-item" key={transaction.id}>
                  <div
                    className={`transaction-icon transaction-icon--${accent}`}
                    style={{ "--transaction-icon": `url("${iconPath}")` } as CSSProperties}
                  >
                    <span className="transaction-icon-glyph" aria-hidden="true" />
                  </div>
                  <div className="transaction-info">
                    <strong>{transaction.description}</strong>
                    <span>{new Date(transaction.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <span className={`tag tag--${accent}`}>{catName}</span>
                  <div className="transaction-item__amount">
                    <span className="transaction-value">
                      {transaction.type === "INCOME" ? "+ " : "- "}
                      {currency.format(transaction.amount)}
                    </span>
                    <span
                      className={
                        transaction.type === "INCOME"
                          ? "transaction-trend-icon transaction-trend-icon--income"
                          : "transaction-trend-icon transaction-trend-icon--expense"
                      }
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
            {!recentTransactions.length && <p className="muted transaction-list-empty">Nenhuma transação encontrada.</p>}
          </div>
          <button
            className="link-button add-button"
            type="button"
            onClick={() => navigate("/transactions", { state: { openCreateTransaction: true } })}
          >
            <span className="link-button-plus" aria-hidden="true" />
            Nova transação
          </button>
        </div>

        <div className="dashboard-list-card">
          <header className="section-header">
            <span>Categorias</span>
            <button className="link-button" type="button" onClick={() => navigate("/categories")}>
              Gerenciar <span className="link-button-chevron" aria-hidden="true" />
            </button>
          </header>
          <div className="category-list">
            {summary?.byCategory.map((item) => {
              const accent = resolveCategoryAccent({
                name: item.categoryName,
                type: item.type,
                colorKey: item.colorKey
              });
              const key = `${item.categoryId}-${item.type}`;
              const count = txCountByCategoryKey.get(key) ?? 0;
              const countLabel = count === 1 ? "1 item" : `${count} itens`;
              return (
                <div className="category-item" key={key}>
                  <span className={`tag tag--${accent}`}>{item.categoryName}</span>
                  <span className="category-item__count">{countLabel}</span>
                  <span className="category-item__total">{currency.format(item.total)}</span>
                </div>
              );
            })}
            {!summary?.byCategory.length && <p className="muted category-list-empty">Sem dados de categorias.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
