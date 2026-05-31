import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent
} from "react";
import { graphqlRequest } from "../api/client";
import { Category } from "../types";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  type CategoryAccent,
  isCategoryAccent,
  resolveCategoryAccent,
  resolveCategoryIconPath
} from "../utils/categoryVisual";

type ModalMode = "create" | "edit";

interface FormState {
  name: string;
  description: string;
  iconKey: string;
  colorKey: CategoryAccent;
}

function defaultForm(): FormState {
  return {
    name: "",
    description: "",
    iconKey: "briefcase-business",
    colorKey: "green"
  };
}

function formFromCategory(category: Category): FormState {
  return {
    name: category.name,
    description: category.description?.trim() ?? "",
    iconKey: category.iconKey?.trim() || "briefcase-business",
    colorKey: isCategoryAccent(category.colorKey)
      ? category.colorKey
      : resolveCategoryAccent(category)
  };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalTransactionCount, setTotalTransactionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const loadCategories = async () => {
    const data = await graphqlRequest<{
      categories: Category[];
      transactions: { id: string }[];
    }>(
      `
        query CategoriesPage {
          categories {
            id
            name
            description
            iconKey
            colorKey
            transactionCount
          }
          transactions {
            id
          }
        }
      `
    );
    setCategories(data.categories);
    setTotalTransactionCount(data.transactions.length);
  };

  useEffect(() => {
    loadCategories().catch((err) => setError((err as Error).message));
  }, []);

  const mostUsed = useMemo(() => {
    if (!categories.length) return null;
    const sorted = [...categories].sort(
      (a, b) =>
        (b.transactionCount ?? 0) - (a.transactionCount ?? 0) || a.name.localeCompare(b.name, "pt-BR")
    );
    const top = sorted[0];
    if ((top.transactionCount ?? 0) < 1) return null;
    return top;
  }, [categories]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setForm(defaultForm());
    setError(null);
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(defaultForm());
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setModalMode("edit");
    setEditingId(category.id);
    setForm(formFromCategory(category));
    setError(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      iconKey: form.iconKey || null,
      colorKey: form.colorKey || null
    };

    try {
      if (modalMode === "create") {
        await graphqlRequest<{ createCategory: Category }>(
          `
            mutation CreateCategory($data: CategoryInput!) {
              createCategory(data: $data) {
                id
              }
            }
          `,
          { data }
        );
      } else if (editingId) {
        await graphqlRequest<{ updateCategory: Category }>(
          `
            mutation UpdateCategory($id: String!, $data: CategoryInput!) {
              updateCategory(id: $id, data: $data) {
                id
              }
            }
          `,
          { id: editingId, data }
        );
      }
      closeModal();
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm("Remover esta categoria?")) return;
    setError(null);
    try {
      await graphqlRequest<{ deleteCategory: boolean }>(
        `
          mutation DeleteCategory($id: String!) {
            deleteCategory(id: $id)
          }
        `,
        { id: categoryId }
      );
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="categories-page">
      <header className="categories-page__header">
        <div>
          <h1 className="categories-page__title">Categorias</h1>
          <p className="categories-page__subtitle muted">Organize suas transações por categorias</p>
        </div>
        <button className="categories-page__new-btn" type="button" onClick={openCreate}>
          + Nova categoria
        </button>
      </header>

      {error && !modalOpen && <p className="error categories-page__error">{error}</p>}

      <section className="categories-summary">
        <article className="categories-summary-card">
          <span className="categories-summary-card__icon categories-summary-card__icon--tag" aria-hidden="true" />
          <div className="categories-summary-card__content">
            <strong className="categories-summary-card__stat">{categories.length}</strong>
            <span className="categories-summary-card__caption">Total de categorias</span>
          </div>
        </article>
        <article className="categories-summary-card">
          <span className="categories-summary-card__icon categories-summary-card__icon--transactions" aria-hidden="true" />
          <div className="categories-summary-card__content">
            <strong className="categories-summary-card__stat">{totalTransactionCount}</strong>
            <span className="categories-summary-card__caption">Total de transações</span>
           </div>
        </article>
        <article className="categories-summary-card">
          {mostUsed ? (
            <>
              <span
                className={`categories-summary-card__icon categories-summary-card__icon--glyph categories-summary-card__icon--${resolveCategoryAccent(mostUsed)}`}
                style={
                  {
                    "--cat-summary-icon": `url("${resolveCategoryIconPath(mostUsed)}")`
                  } as CSSProperties
                }
                aria-hidden="true"
              />
               <div className="categories-summary-card__content">
                <strong className="categories-summary-card__stat categories-summary-card__stat--title">
                    {mostUsed.name}
                  </strong>
                  <span className="categories-summary-card__caption">Categoria mais utilizada</span>
                </div>
            </>
          ) : (
            <>
              <span
                className="categories-summary-card__icon categories-summary-card__icon--glyph categories-summary-card__icon--blue"
                style={
                  { "--cat-summary-icon": `url("/assets/Icon/utensils.svg")` } as CSSProperties
                }
                aria-hidden="true"
              />
              <strong className="categories-summary-card__stat categories-summary-card__stat--title">—</strong>
              <span className="categories-summary-card__caption">Categoria mais utilizada</span>
            </>
          )}
        </article>
      </section>

      <div className="categories-grid">
        {categories.map((category) => {
          const accent = resolveCategoryAccent(category);
          const iconPath = resolveCategoryIconPath(category);
          const n = category.transactionCount ?? 0;
          const itemsLabel = n === 1 ? "1 item" : `${n} itens`;
          return (
            <article className="category-card" key={category.id}>
              <header className="category-card__top">
                <div
                  className={`category-card__icon-box category-card__icon-box--${accent}`}
                  style={{ "--cat-card-icon": `url("${iconPath}")` } as CSSProperties}
                >
                  <span className="category-card__icon-glyph" aria-hidden="true" />
                </div>
                <div className="category-card__actions">
                  <button
                    type="button"
                    className="category-card__action category-card__action--delete"
                    aria-label={`Excluir ${category.name}`}
                    onClick={() => handleDelete(category.id)}
                  />
                  <button
                    type="button"
                    className="category-card__action category-card__action--edit"
                    aria-label={`Editar ${category.name}`}
                    onClick={() => openEdit(category)}
                  />
                </div>
              </header>
              <h2 className="category-card__name">{category.name}</h2>
              <p className="category-card__desc">
                {category.description?.trim() || "Adicione uma descrição ao editar esta categoria."}
              </p>
              <footer className="category-card__footer">
                <span className={`tag tag--${accent}`}>{category.name}</span>
                <span className="category-card__items">{itemsLabel}</span>
              </footer>
            </article>
          );
        })}
        {!categories.length && <p className="muted categories-grid__empty">Nenhuma categoria cadastrada.</p>}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal category-modal category-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="category-modal__header">
              <div>
                <h2 id="category-modal-title" className="category-modal__title">
                  {modalMode === "create" ? "Nova categoria" : "Editar categoria"}
                </h2>
                <p className="category-modal__subtitle">Organize suas transações com categorias</p>
              </div>
              <button
                type="button"
                className="category-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              />
            </header>

            {error && <p className="error category-modal__error">{error}</p>}

            <form className="category-modal__form" onSubmit={handleSubmit}>
              <label className="category-modal__field">
                <span className="category-modal__label">Título</span>
                <input
                  className="category-modal__input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Alimentação"
                  required
                  autoComplete="off"
                />
              </label>

              <label className="category-modal__field">
                <span className="category-modal__label">Descrição</span>
                <input
                  className="category-modal__input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição da categoria"
                  autoComplete="off"
                />
                <span className="category-modal__optional-hint">Opcional</span>
              </label>

              <div className="category-modal__field">
                <span className="category-modal__label">Ícone</span>
                <div className="category-modal__icon-grid">
                  {CATEGORY_ICON_OPTIONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`category-modal__icon-option${form.iconKey === key ? " is-selected" : ""}`}
                      aria-label={`Ícone ${key}`}
                      onClick={() => setForm((f) => ({ ...f, iconKey: key }))}
                    >
                      <span
                        className="category-modal__icon-preview"
                        style={
                          { "--modal-icon": `url("/assets/Icon/${key}.svg")` } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="category-modal__field">
                <span className="category-modal__label">Cor</span>
                <div className="category-modal__colors">
                  {CATEGORY_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`category-modal__color-swatch${form.colorKey === color ? ` is-selected-border--${color}` : ""}`}
                      aria-label={`Cor ${color}`}
                      onClick={() => setForm((f) => ({ ...f, colorKey: color }))}
                    >
                      <span
                        className={`category-modal__color-fill category-modal__color-fill--${color}`}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

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
