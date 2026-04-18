import { useState } from 'react';
import { Trash2, FileText, MessageSquare } from 'lucide-react';
import { useArticles, useDailyPhrases } from '../hooks/useSupabaseData';

export function ContentPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'phrases'>('articles');
  const { articles, loading: articlesLoading, deleteArticle, updateArticle } = useArticles();
  const { phrases, loading: phrasesLoading, deletePhrase, updatePhrase } = useDailyPhrases();

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    try {
      await updateArticle(id, { is_published: !currentlyPublished });
    } catch (e) {
      console.error('Error toggling article:', e);
    }
  };

  const handleTogglePhrase = async (id: string, currentlyActive: boolean) => {
    try {
      await updatePhrase(id, { is_active: !currentlyActive });
    } catch (e) {
      console.error('Error toggling phrase:', e);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    try {
      await deleteArticle(id);
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  };

  const handleDeletePhrase = async (id: string) => {
    if (!confirm('¿Eliminar esta frase?')) return;
    try {
      await deletePhrase(id);
    } catch (e) {
      console.error('Error deleting phrase:', e);
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contenido</h1>
          <p className="text-text-secondary mt-1">Gestión de artículos y frases del día</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'articles'
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          Artículos ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('phrases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'phrases'
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Frases ({phrases.length})
        </button>
      </div>

      {activeTab === 'articles' ? (
        articlesLoading ? (
          <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando artículos...</div>
        ) : articles.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Sin artículos aún</div>
        ) : (
          <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Título</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Categoría</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Lectura</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{article.title}</p>
                      {article.subtitle && (
                        <p className="text-xs text-text-tertiary mt-0.5">{article.subtitle}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-card px-3 py-1 rounded-full text-text-secondary">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(article.id, article.is_published)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer ${
                          article.is_published
                            ? 'bg-accent/15 text-accent'
                            : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {article.is_published ? 'Publicado' : 'Borrador'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{article.reading_time_minutes} min</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-2 hover:bg-card rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-error/60" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : phrasesLoading ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando frases...</div>
      ) : phrases.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Sin frases aún</div>
      ) : (
        <div className="space-y-3">
          {phrases.map((phrase) => (
            <div
              key={phrase.id}
              className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary italic">"{phrase.phrase}"</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-card px-3 py-1 rounded-full text-text-secondary">
                    {phrase.category}
                  </span>
                  <button
                    onClick={() => handleTogglePhrase(phrase.id, phrase.is_active)}
                    className={`text-xs font-medium cursor-pointer ${phrase.is_active ? 'text-accent' : 'text-text-tertiary'}`}
                  >
                    {phrase.is_active ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDeletePhrase(phrase.id)}
                  className="p-2 hover:bg-card rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-error/60" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
