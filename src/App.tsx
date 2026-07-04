import { useEffect, useMemo, useState } from 'react';
import { Plus, List } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Chamado, Ministerio, Status } from './lib/types';
import { MinisterioCard } from './components/MinisterioCard';
import { NovoChamadoModal } from './components/NovoChamadoModal';
import { ChamadosList } from './components/ChamadosList';

const STATUS_INICIAL: Status = 'Pendente';

type ViewMode = 'dashboard' | 'lista';

export default function App() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ministerioFiltro, setMinisterioFiltro] = useState<Ministerio | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');

  /* =========================
     CARREGAMENTO INICIAL
  ========================== */
  useEffect(() => {
    loadChamados();
  }, []);

  /* =========================
     FUNÇÕES DE DADOS
  ========================== */
  const loadChamados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChamados(data ?? []);
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
      alert('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChamado = async (data: {
    ministerio: Ministerio;
    descricao: string;
    solicitante: string;
  }) => {
    try {
      const { error } = await supabase
        .from('chamados')
        .insert([{ ...data, status: STATUS_INICIAL }]);

      if (error) throw error;

      await loadChamados(); // 🔥 atualiza a lista
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao criar chamado:', err);
      alert('Erro ao criar chamado');
    }
  };

  const handleUpdateStatus = async (id: string, status: Status) => {
    try {
      const { error } = await supabase
        .from('chamados')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await loadChamados(); // 🔥 atualiza a lista
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status');
    }
  };

  /* =========================
     MEMOS / FILTROS
  ========================== */
  const chamadosFiltrados = useMemo(() => {
    if (!ministerioFiltro) return chamados;
    return chamados.filter(c => c.ministerio === ministerioFiltro);
  }, [chamados, ministerioFiltro]);

  const getTotalPorMinisterio = (ministerio: Ministerio) =>
    chamados.filter(c => c.ministerio === ministerio).length;

  const getPendentesPorMinisterio = (ministerio: Ministerio) =>
    chamados.filter(
      c => c.ministerio === ministerio && c.status === 'Pendente'
    ).length;

  /* =========================
     LOADING
  ========================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Sistema de Chamados
              </h1>
              <p className="text-gray-600">
                Gerencie solicitações dos ministérios
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setView(view === 'dashboard' ? 'lista' : 'dashboard')
                }
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm"
              >
                <List className="w-5 h-5" />
                {view === 'dashboard' ? 'Ver Lista' : 'Ver Dashboard'}
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-5 h-5" />
                Novo Chamado
              </button>
            </div>
          </div>

          {ministerioFiltro && (
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border">
              <span className="text-gray-600">Filtrando por:</span>
              <strong>{ministerioFiltro}</strong>
              <button
                onClick={() => setMinisterioFiltro(null)}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </header>

        {view === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(['Comunicação', 'Recepção', 'Ornamentação'] as Ministerio[]).map(
                m => (
                  <MinisterioCard
                    key={m}
                    ministerio={m}
                    totalChamados={getTotalPorMinisterio(m)}
                    pendentes={getPendentesPorMinisterio(m)}
                    onClick={() => {
                      setMinisterioFiltro(m);
                      setView('lista');
                    }}
                  />
                )
              )}
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Chamados Recentes</h2>
              <ChamadosList
                chamados={chamados.slice(0, 5)}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">
              Todos os Chamados {ministerioFiltro && `- ${ministerioFiltro}`}
            </h2>
            <ChamadosList
              chamados={chamadosFiltrados}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}
      </div>

      {showModal && (
        <NovoChamadoModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateChamado}
          ministerioSelecionado={ministerioFiltro ?? undefined}
        />
      )}
    </div>
  );
}
const { data, error } = await supabase
  .from('chamados')
  .select('*')

console.log(data, error)
