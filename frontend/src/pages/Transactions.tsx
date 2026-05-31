import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { graphqlRequest } from "../api/client";
import { Category, Transaction, TransactionType } from "../types";
import { resolveCategoryAccent, resolveCategoryIconPath } from "../utils/categoryVisual";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const PAGE_SIZE = 10;

function formatPeriodLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const month = d.toLocaleDateString("pt-BR", { month: "long" });
  const cap = month.charAt(0).toUpperCase() + month.slice(1);
  return `${cap} / ${y}`;
}

function monthKeyFromDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatBRLAmountInput(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

function parseBRLAmount(s: string): number {
  const raw = s
    .trim()
    .replace(/^\s*R\$\s*/i, "")
    .replace(/\s/g, "");
  if (!raw) return NaN;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function formatIntPartBRL(wholeDigits: string): string {
  if (!wholeDigits) return "0";
  const noLeading = wholeDigits.replace(/^0+(?=\d)/, "");
  const core = noLeading === "" ? "0" : noLeading;
  return core.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatBRLAmountWhileTyping(input: string): string {
  const s0 = input.replace(/^\s*R\$\s*/i, "").trim();
  if (s0 === "") return "";

  const s = s0.replace(/\./g, "");
  const commaIndex = s.indexOf(",");
  const hasComma = commaIndex !== -1;
  const wholeRaw = (hasComma ? s.slice(0, commaIndex) : s).replace(/\D/g, "");
  const fracRaw = hasComma ? s.slice(commaIndex + 1).replace(/\D/g, "").slice(0, 2) : "";

  if (hasComma && !wholeRaw && !fracRaw) {
    return "0,";
  }

  if (!hasComma) {
    if (!wholeRaw) return "";
    return formatIntPartBRL(wholeRaw);
  }

  const wholeFormatted = wholeRaw ? formatIntPartBRL(wholeRaw) : "0";
  const endsWithComma = commaIndex === s.length - 1;
  if (fracRaw === "" && endsWithComma) {
    return `${wholeFormatted},`;
  }
  return `${wholeFormatted},${fracRaw}`;
}

type TransactionsLocationState = { openCreateTransaction?: boolean };

export default function Transactions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | TransactionType>("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState<TransactionType>("EXPENSE");
  const [formCategoryId, setFormCategoryId] = useState("");

  const loadData = useCallback(async () => {
    const data = await graphqlRequest<{
      transactions: Transaction[];
      categories: Category[];
    }>(
      `
        query TransactionsData {
          transactions {
            id
            description
            amount
            date
            type
            categoryId
            category { id name iconKey colorKey }
          }
          categories {
            id
            name
            iconKey
            colorKey
          }
        }
      `
    );
    setTransactions(data.transactions);
    setCategories(data.categories);
  }, []);

  useEffect(() => {
    loadData().catch((err) => setError((err as Error).message));
  }, [loadData]);

  useEffect(() => {
    if (!modalOpen) return;
    loadData().catch((err) => setError((err as Error).message));
  }, [modalOpen, loadData]);

  const periodOptions = useMemo(() => {
    const keys = new Set<string>();
    transactions.forEach((t) => keys.add(monthKeyFromDate(t.date)));
    keys.add(monthKeyFromDate(new Date().toISOString()));
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => t.description.toLowerCase().includes(q));
    }
    if (filterType) {
      list = list.filter((t) => t.type === filterType);
    }
    if (filterCategoryId) {
      list = list.filter(
        (t) => t.categoryId === filterCategoryId || t.category?.id === filterCategoryId
      );
    }
    if (filterPeriod) {
      list = list.filter((t) => monthKeyFromDate(t.date) === filterPeriod);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterType, filterCategoryId, filterPeriod]);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = totalResults === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, totalResults);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterCategoryId, filterPeriod]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreate = useCallback(() => {
    setModalMode("create");
    setEditingId(null);
    setFormDescription("");
    setFormAmount("0,00");
    setFormDate("");
    setFormType("EXPENSE");
    setFormCategoryId("");
    setError(null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const st = location.state as TransactionsLocationState | null;
    if (!st?.openCreateTransaction) return;
    let cancelled = false;
    (async () => {
      try {
        await loadData();
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
      if (cancelled) return;
      openCreate();
      navigate(location.pathname, { replace: true, state: null });
    })();
    return () => {
      cancelled = true;
    };
  }, [location.state, location.pathname, navigate, openCreate, loadData]);

  const openEdit = (t: Transaction) => {
    setModalMode("edit");
    setEditingId(t.id);
    setFormDescription(t.description);
    setFormAmount(formatBRLAmountInput(Number(t.amount)));
    const d = new Date(t.date);
    setFormDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    setFormType(t.type);
    setFormCategoryId(t.categoryId || t.category?.id || "");
    setError(null);
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const handleSubmitModal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!formDate.trim()) {
      setError("Selecione a data.");
      return;
    }
    const amountNum = parseBRLAmount(formAmount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError("Informe um valor válido.");
      return;
    }
    const dateIso = new Date(`${formDate}T12:00:00`).toISOString();
    const data = {
      description: formDescription.trim(),
      amount: amountNum,
      date: dateIso,
      type: formType,
      categoryId: formCategoryId
    };
    if (!formCategoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    try {
      if (modalMode === "create") {
        await graphqlRequest(
          `
            mutation CreateTransaction($data: TransactionInput!) {
              createTransaction(data: $data) { id }
            }
          `,
          { data }
        );
      } else if (editingId) {
        await graphqlRequest(
          `
            mutation UpdateTransaction($id: String!, $data: TransactionInput!) {
              updateTransaction(id: $id, data: $data) { id }
            }
          `,
          { id: editingId, data }
        );
      }
      closeModal();
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir esta transação?")) return;
    setError(null);
    try {
      await graphqlRequest(
        `
          mutation DeleteTransaction($id: String!) {
            deleteTransaction(id: $id)
          }
        `,
        { id }
      );
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="transactions-page">
      <header className="transactions-page__header">
        <div>
          <h1 className="transactions-page__title">Transações</h1>
          <p className="transactions-page__subtitle">
            Gerencie todas as suas transações financeiras
          </p>
        </div>
        <button type="button" className="transactions-page__new-btn" onClick={openCreate}>
          + Nova transação
        </button>
      </header>

      {error && !modalOpen && <p className="error transactions-page__error">{error}</p>}

      <section className="transactions-filters">
        <div className="transactions-filters__grid">
          <label className="transaction-filter-label">
            <span className="transaction-filter-label__text">Buscar</span>
            <div className="transaction-filter-input-wrap">
              <span className="transaction-filter-input-wrap__icon transaction-filter-input-wrap__icon--search" aria-hidden="true" />
              <input
                className="transaction-filter-input"
                type="search"
                placeholder="Buscar por descrição"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
          </label>
          <label className="transaction-filter-label">
            <span className="transaction-filter-label__text">Tipo</span>
            <select
              className="transaction-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "" | TransactionType)}
            >
              <option value="">Todos</option>
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
            </select>
          </label>
          <label className="transaction-filter-label">
            <span className="transaction-filter-label__text">Categoria</span>
            <select
              className="transaction-filter-select"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="transaction-filter-label">
            <span className="transaction-filter-label__text">Período</span>
            <select
              className="transaction-filter-select"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="">Todos</option>
              {periodOptions.map((ym) => (
                <option key={ym} value={ym}>
                  {formatPeriodLabel(ym)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="transactions-table-card">
        <div className="transactions-table__scroll">
          <div className="transactions-table">
            <div className="transactions-table__row transactions-table__row--head">
              <span>Descrição</span>
              <span>Data</span>
              <span>Categoria</span>
              <span>Tipo</span>
              <span>Valor</span>
              <span className="transactions-table__actions-head">Ações</span>
            </div>
            {paginated.map((t) => {
              const cat = t.category;
              const catName = cat?.name ?? "—";
              const accent = cat
                ? resolveCategoryAccent(cat)
                : resolveCategoryAccent({ name: catName, type: t.type });
              const iconPath = cat
                ? resolveCategoryIconPath(cat)
                : resolveCategoryIconPath({ name: catName, type: t.type });
              const dateStr = new Date(t.date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit"
              });
              return (
                <div className="transactions-table__row" key={t.id}>
                  <div className="transaction-cell-desc">
                      <div
                        className={`transaction-cell-desc__icon transaction-cell-desc__icon--${accent}`}
                        style={{ "--transaction-icon": `url("${iconPath}")` } as CSSProperties}
                      >
                        <span className="transaction-cell-desc__glyph" aria-hidden="true" />
                      </div>
                      <span className="transaction-cell-desc__text">{t.description}</span>
                    </div>
                    <span className="transaction-cell-date">{dateStr}</span>
                    <span className={`tag tag--${accent} transaction-cell-tag`}>{catName}</span>
                    <div className="transaction-cell-type">
                      <span
                        className={
                          t.type === "INCOME"
                            ? "transaction-type-badge transaction-type-badge--income"
                            : "transaction-type-badge transaction-type-badge--expense"
                        }
                      >
                        <span
                          className={
                            t.type === "INCOME"
                              ? "transaction-type-badge__icon transaction-type-badge__icon--up"
                              : "transaction-type-badge__icon transaction-type-badge__icon--down"
                          }
                          aria-hidden="true"
                        />
                        {t.type === "INCOME" ? "Entrada" : "Saída"}
                      </span>
                    </div>
                    <span className="transaction-cell-value">
                      {t.type === "INCOME" ? "+ " : "- "}
                      {currency.format(t.amount)}
                    </span>
                    <div className="transaction-cell-actions">
                      <button
                        type="button"
                        className="transaction-row-action transaction-row-action--delete"
                        aria-label="Excluir"
                        onClick={() => handleDelete(t.id)}
                      />
                      <button
                        type="button"
                        className="transaction-row-action transaction-row-action--edit"
                        aria-label="Editar"
                        onClick={() => openEdit(t)}
                      />
                    </div>
                </div>
              );
            })}
            {!paginated.length && (
              <p className="transactions-table__empty muted">Nenhuma transação encontrada.</p>
            )}
          </div>
        </div>

        {totalResults > 0 && (
              <footer className="transactions-pagination">
            <span className="transactions-pagination__info">
              {pageStart} a {pageEnd} | {totalResults} resultados
            </span>
            <div className="transactions-pagination__controls">
              <button
                type="button"
                    className="transaction-page-btn"
                disabled={safePage <= 1}
                aria-label="Página anterior"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                      className={`transaction-page-btn transaction-page-btn--num${n === safePage ? " is-active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                    className="transaction-page-btn"
                disabled={safePage >= totalPages}
                aria-label="Próxima página"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </footer>
        )}
      </section>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal category-modal transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="category-modal__header">
              <div>
                <h2 id="transaction-modal-title" className="category-modal__title">
                  {modalMode === "create" ? "Nova transação" : "Editar transação"}
                </h2>
                <p className="category-modal__subtitle">
                  {modalMode === "create"
                    ? "Registre sua despesa ou receita"
                    : "Atualize os dados desta transação"}
                </p>
              </div>
              <button
                type="button"
                className="category-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              />
            </header>

            {error && <p className="error category-modal__error">{error}</p>}

            <form className="category-modal__form transaction-modal__form" onSubmit={handleSubmitModal}>
              <div className="transaction-modal-kind" role="group" aria-label="Tipo de transação">
                <button
                  type="button"
                  className={`transaction-modal-kind__btn transaction-modal-kind__btn--expense${formType === "EXPENSE" ? " is-selected" : ""}`}
                  onClick={() => setFormType("EXPENSE")}
                >
                  <span className="transaction-modal-kind__icon transaction-modal-kind__icon--down" aria-hidden="true" />
                  Despesa
                </button>
                <button
                  type="button"
                  className={`transaction-modal-kind__btn transaction-modal-kind__btn--income${formType === "INCOME" ? " is-selected" : ""}`}
                  onClick={() => setFormType("INCOME")}
                >
                  <span className="transaction-modal-kind__icon transaction-modal-kind__icon--up" aria-hidden="true" />
                  Receita
                </button>
              </div>

              <label className="category-modal__field">
                <span className="category-modal__label">Descrição</span>
                <input
                  className="category-modal__input"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex. Almoço no restaurante"
                  required
                  autoComplete="off"
                />
              </label>

              <div className="transaction-modal-row2">
                <label className="category-modal__field transaction-modal-field--date">
                  <span className="category-modal__label">Data</span>
                  <div className={`transaction-modal-date-wrap${!formDate ? " is-empty" : ""}`}>
                    <input
                      className="category-modal__input transaction-modal-date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      type="date"
                      required
                    />
                  </div>
                </label>
                <label className="category-modal__field transaction-modal-field--money">
                  <span className="category-modal__label">Valor</span>
                  <div className="transaction-modal-money">
                    <span className="transaction-modal-money__prefix" aria-hidden="true">
                      R$
                    </span>
                    <input
                      className="transaction-modal-money__input"
                      inputMode="decimal"
                      value={formAmount}
                      onChange={(e) => setFormAmount(formatBRLAmountWhileTyping(e.target.value))}
                      onBlur={() => {
                        const n = parseBRLAmount(formAmount || "0");
                        if (Number.isFinite(n)) {
                          setFormAmount(formatBRLAmountInput(n));
                        }
                      }}
                      autoComplete="off"
                      required
                    />
                  </div>
                </label>
              </div>

              <label className="category-modal__field">
                <span className="category-modal__label">Categoria</span>
                <select
                  className="category-modal__input transaction-modal-select"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="category-modal__submit">
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
