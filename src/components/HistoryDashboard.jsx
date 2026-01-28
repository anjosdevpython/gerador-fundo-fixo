import React, { useState, useEffect, useMemo } from 'react';
import {
    History,
    RefreshCcw,
    Trash2,
    Loader2,
    CheckCircle2,
    FileText,
    FileArchive,
    Search,
    Filter,
    Calendar,
    User,
    Store as StoreIcon,
    X
} from 'lucide-react';

import {
    fetchRecords,
    deleteRecord,
    cleanupOldRecords,
    fetchStores,
    saveStore,
    deleteStore
} from '../lib/supabase';
import { formatCurrency, maskCurrency, parseCurrency } from '../utils/formatters';

const HistoryDashboard = () => {
    const [records, setRecords] = useState([]);
    const [stores, setStores] = useState([]);
    const [activeTab, setActiveTab] = useState('records'); // 'records' | 'stores'
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloadingZip, setIsDownloadingZip] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);

    // Store Management State
    const [isEditingStore, setIsEditingStore] = useState(null);
    const [storeForm, setStoreForm] = useState({
        nome: '',
        gerente: '',
        cpf: '',
        pix: '',
        depto: 'Loja',
        fundo_fixo: 0
    });

    // Filter Stats
    const [filters, setFilters] = useState({
        store: '',
        detentor: '',
        startDate: '',
        endDate: ''
    });

    const loadRecords = async () => {
        setIsLoading(true);
        const { data, error } = await fetchRecords();
        if (!error) setRecords(data);
        setIsLoading(false);
    };

    const loadStores = async () => {
        setIsLoading(true);
        const { data, error } = await fetchStores();
        if (!error) setStores(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        loadStores(); // Sempre carrega as lojas para o filtro
        if (activeTab === 'records') loadRecords();
    }, [activeTab]);

    // Filtering Logic
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesStore = !filters.store || record.loja === filters.store;
            const matchesDetentor = !filters.detentor || record.detentor.toLowerCase().includes(filters.detentor.toLowerCase());

            const recordDate = new Date(record.created_at).toISOString().split('T')[0];
            const matchesStartDate = !filters.startDate || recordDate >= filters.startDate;
            const matchesEndDate = !filters.endDate || recordDate <= filters.endDate;

            return matchesStore && matchesDetentor && matchesStartDate && matchesEndDate;
        });
    }, [records, filters]);

    const resetFilters = () => setFilters({ store: '', detentor: '', startDate: '', endDate: '' });

    // Store Management Handlers
    const handleSaveStore = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { data, error } = await saveStore(storeForm);
        if (!error) {
            alert(isEditingStore ? "Loja atualizada!" : "Loja cadastrada!");
            setStoreForm({ nome: '', gerente: '', cpf: '', pix: '', depto: 'Loja', fundo_fixo: 0 });
            setIsEditingStore(null);
            loadStores();
        } else {
            alert("Erro ao salvar loja: " + error.message);
        }
        setIsLoading(false);
    };

    const handleDeleteStore = async (id) => {
        if (!window.confirm("Deseja excluir esta loja permanentemente?")) return;
        setIsLoading(true);
        const { success, error } = await deleteStore(id);
        if (success) {
            alert("Loja removida!");
            loadStores();
        } else {
            alert("Erro ao excluir loja: " + error.message);
        }
        setIsLoading(false);
    };

    const startEditStore = (store) => {
        setIsEditingStore(store.id);
        setStoreForm(store);
    };

    const handleDeleteRecord = async (record) => {
        if (!window.confirm(`Deseja realmente excluir permanentemente a prestação de "${record.loja}"?`)) return;

        setIsDeleting(record.id);
        const { success, error } = await deleteRecord(record.id, record.pdf_url, record.transacoes);

        if (success) {
            setRecords(prev => prev.filter(r => r.id !== record.id));
            alert("Registro excluído com sucesso!");
        } else {
            alert("Erro ao excluir: " + (error?.message || "Erro desconhecido"));
        }
        setIsDeleting(null);
    };

    const downloadAllAttachments = async (record) => {
        setIsDownloadingZip(record.id);
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            // Download e adicionar PDF
            if (record.pdf_url) {
                const pdfResp = await fetch(record.pdf_url);
                const pdfBlob = await pdfResp.blob();
                zip.file(`RELATORIO_${record.loja}_${record.id}.pdf`, pdfBlob);
            }

            // Download e adicionar anexos
            const folder = zip.folder("comprovantes");
            const transacoes = record.transacoes || [];

            for (const t of transacoes) {
                if (t.attachments && Array.isArray(t.attachments)) {
                    for (const att of t.attachments) {
                        try {
                            const resp = await fetch(att.url);
                            const blob = await resp.blob();
                            folder.file(`item_${t.id}_${att.name}`, blob);
                        } catch (e) {
                            console.error(`Erro ao baixar anexo ${att.name}:`, e);
                        }
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `ARQUIVOS_${record.loja}_${record.id}.zip`;
            link.click();
        } catch (e) {
            console.error("Erro ao gerar ZIP de download:", e);
            alert("Erro ao baixar arquivos.");
        } finally {
            setIsDownloadingZip(null);
        }
    };

    return (
        <div className="space-y-6">
            <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-2xl">
                            <History className="text-red-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800">
                                {activeTab === 'records' ? 'Painel de Registros' : 'Gestão de Lojas'}
                            </h1>
                            <p className="text-slate-500 text-xs font-medium">
                                {activeTab === 'records'
                                    ? 'Histórico global de prestações sincronizadas no Supabase'
                                    : 'Gerencie lojas, gerentes e valores de fundo fixo'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                            <button
                                onClick={() => setActiveTab('records')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'records' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Registros
                            </button>
                            <button
                                onClick={() => setActiveTab('stores')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stores' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Lojas
                            </button>
                        </div>
                        <button
                            onClick={activeTab === 'records' ? loadRecords : loadStores}
                            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                            <RefreshCcw size={12} className={isLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {activeTab === 'records' ? (
                    <>
                        {/* Filters Section */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <Filter size={14} />
                                <h2 className="text-[10px] font-black uppercase tracking-widest">Filtros de Busca</h2>
                                {(filters.store || filters.detentor || filters.startDate || filters.endDate) && (
                                    <button onClick={resetFilters} className="ml-auto text-red-500 flex items-center gap-1 hover:underline transition-all">
                                        <X size={12} /> <span className="text-[9px] font-bold">Limpar Filtros</span>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative">
                                    <StoreIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold outline-none focus:border-red-500 transition-all appearance-none"
                                        value={filters.store}
                                        onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                                    >
                                        <option value="">Todas as Lojas</option>
                                        {stores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                    </select>
                                </div>

                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar Detentor..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={filters.detentor}
                                        onChange={(e) => setFilters({ ...filters, detentor: e.target.value })}
                                    />
                                </div>

                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        title="Data Inicial"
                                    />
                                </div>

                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        title="Data Final"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={async () => {
                                    if (window.confirm("Deseja remover todos os registros e arquivos com mais de 30 dias?")) {
                                        const { success, deletedCount } = await cleanupOldRecords(30);
                                        if (success) {
                                            alert(`${deletedCount} registros removidos com sucesso!`);
                                            loadRecords();
                                        }
                                        else alert("Erro ao executar limpeza.");
                                    }
                                }}
                                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-black transition-all"
                            >
                                <Trash2 size={12} /> Limpeza Manual ({">"} 30 dias)
                            </button>
                            {filteredRecords.length > 0 && filteredRecords.length < records.length && (
                                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                        {filteredRecords.length} {filteredRecords.length === 1 ? 'resultado' : 'resultados'} encontrados
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <form onSubmit={handleSaveStore} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                            <div className="flex items-center gap-2 mb-6">
                                <StoreIcon size={16} className="text-red-600" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                                    {isEditingStore ? 'Editar Loja' : 'Cadastrar Nova Loja'}
                                </h3>
                                {isEditingStore && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingStore(null);
                                            setStoreForm({ nome: '', gerente: '', cpf: '', pix: '', depto: 'Loja', fundo_fixo: 0 });
                                        }}
                                        className="ml-auto text-[9px] font-black uppercase text-slate-400 hover:text-red-600"
                                    >
                                        Cancelar Edição
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nome da Loja</label>
                                    <input
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={storeForm.nome}
                                        onChange={e => setStoreForm({ ...storeForm, nome: e.target.value })}
                                        placeholder="Ex: Mini | Santa | Loja 1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gerente Atual</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={storeForm.gerente}
                                        onChange={e => setStoreForm({ ...storeForm, gerente: e.target.value })}
                                        placeholder="Nome do Gerente"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Depto</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={storeForm.depto}
                                        onChange={e => setStoreForm({ ...storeForm, depto: e.target.value })}
                                        placeholder="Ex: Loja"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">CPF (Gerente)</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={storeForm.cpf}
                                        onChange={e => setStoreForm({ ...storeForm, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Chave PIX</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={storeForm.pix}
                                        onChange={e => setStoreForm({ ...storeForm, pix: e.target.value })}
                                        placeholder="E-mail, CPF ou Aleatória"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Valor do Fundo</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-red-500 transition-all"
                                        value={maskCurrency(storeForm.fundo_fixo)}
                                        onChange={e => setStoreForm({ ...storeForm, fundo_fixo: parseCurrency(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {isEditingStore ? 'Salvar Alterações' : 'Cadastrar Loja'}
                            </button>
                        </form>
                    </div>
                )}
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'records' ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b">
                                <tr>
                                    <th className="px-6 py-4">Data/Hora</th>
                                    <th className="px-6 py-4">Loja / Unidade</th>
                                    <th className="px-6 py-4">Detentor</th>
                                    <th className="px-6 py-4 text-right">Valor Total</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Arquivos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="p-16 text-center text-slate-400 italic font-medium"><Loader2 className="animate-spin mx-auto mb-2" /> Carregando registros...</td></tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr><td colSpan="6" className="p-16 text-center text-slate-400 italic font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={24} className="text-slate-200" />
                                            <span>Nenhum registro encontrado para os filtros aplicados.</span>
                                            {records.length > 0 && <button onClick={resetFilters} className="text-red-500 text-[10px] font-black uppercase hover:underline">Ver todos</button>}
                                        </div>
                                    </td></tr>
                                ) : (
                                    filteredRecords.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                                                {new Date(r.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{r.loja}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{r.detentor}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-red-900 font-mono">{formatCurrency(r.valor_utilizado)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">
                                                    <CheckCircle2 size={12} /> Supabase
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {r.pdf_url && (
                                                        <a
                                                            href={r.pdf_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Ver PDF"
                                                            className="p-2 text-slate-400 hover:text-red-600 transition-all bg-slate-50 rounded-lg"
                                                        >
                                                            <FileText size={16} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => downloadAllAttachments(r)}
                                                        disabled={isDownloadingZip === r.id}
                                                        title="Baixar todos os arquivos (ZIP)"
                                                        className="p-2 text-slate-400 hover:text-emerald-600 transition-all bg-slate-50 rounded-lg disabled:opacity-50"
                                                    >
                                                        {isDownloadingZip === r.id ? <Loader2 size={16} className="animate-spin" /> : <FileArchive size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecord(r)}
                                                        disabled={isDeleting === r.id}
                                                        title="Excluir Registro"
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-all bg-slate-50 rounded-lg disabled:opacity-50"
                                                    >
                                                        {isDeleting === r.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b">
                                <tr>
                                    <th className="px-6 py-4">Loja</th>
                                    <th className="px-6 py-4">Gerente / Depto</th>
                                    <th className="px-6 py-4">CPF / PIX</th>
                                    <th className="px-6 py-4 text-right">Fundo Fixo</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="p-16 text-center text-slate-400 italic font-medium"><Loader2 className="animate-spin mx-auto mb-2" /> Carregando lojas...</td></tr>
                                ) : stores.length === 0 ? (
                                    <tr><td colSpan="5" className="p-16 text-center text-slate-400 italic font-medium">Nenhuma loja cadastrada no banco.</td></tr>
                                ) : (
                                    stores.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-slate-800 uppercase">{s.nome}</div>
                                                <div className="text-[9px] text-slate-400 font-bold">ID: {s.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-600">{s.gerente || 'Sem gerente'}</div>
                                                <div className="text-[10px] text-slate-400">{s.depto}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-mono font-bold text-slate-500">{s.cpf || '-'}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{s.pix || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 font-mono">
                                                {formatCurrency(s.fundo_fixo)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => startEditStore(s)}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-all bg-slate-50 rounded-lg"
                                                        title="Editar"
                                                    >
                                                        <CheckCircle2 size={16} className="text-slate-300 group-hover:text-emerald-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStore(s.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-all bg-slate-50 rounded-lg"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryDashboard;
