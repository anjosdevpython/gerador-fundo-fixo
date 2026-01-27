import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  Calculator,
  User,
  Store,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  FileText,
  X,
  Loader2,
  Download,
  RefreshCcw,
  Eye,
  FileArchive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

const App = () => {
  // --- Estados da Aplicação ---
  const initialHeader = {
    detentor: 'HUANDERSON MAIA CORREIA',
    cpf: '938.941.552-72',
    loja: 'JOINVILLE – 208',
    depto: 'Financeiro',
    gerente: '',
    chavePix: 'hmc12maia@gmail.com',
    fundoDisponibilizado: 300.00,
    dataPrestacao: new Date().toISOString().split('T')[0]
  };

  const [headerData, setHeaderData] = useState(initialHeader);
  const [transactions, setTransactions] = useState([
    { id: 1, data: '2025-01-06', motivo: 'LIMPEZA DA FRENTE DA LOJA', fornecedor: 'PRESTADOR LOCAL', nf: '', valor: 50.00, attachments: [] },
  ]);

  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // --- Persistence (Load) ---
  useEffect(() => {
    const savedHeader = localStorage.getItem('fundo_header');
    const savedTransactions = localStorage.getItem('fundo_transactions');

    if (savedHeader) setHeaderData(JSON.parse(savedHeader));
    if (savedTransactions) {
      const data = JSON.parse(savedTransactions);
      setTransactions(data.map(t => ({ ...t, attachments: [] })));
    }
  }, []);

  // --- Persistence (Save) ---
  useEffect(() => {
    localStorage.setItem('fundo_header', JSON.stringify(headerData));
  }, [headerData]);

  useEffect(() => {
    const txToSave = transactions.map(({ attachments, ...rest }) => rest);
    localStorage.setItem('fundo_transactions', JSON.stringify(txToSave));
  }, [transactions]);

  // --- Lógica de Cálculos ---
  const totals = useMemo(() => {
    const utilizado = transactions.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const saldo = headerData.fundoDisponibilizado - utilizado;
    return { utilizado, saldo };
  }, [transactions, headerData.fundoDisponibilizado]);

  // --- Handlers de Transação ---
  const addTransaction = () => {
    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    setTransactions([...transactions, {
      id: newId,
      data: new Date().toISOString().split('T')[0],
      motivo: '',
      fornecedor: '',
      nf: '',
      valor: 0,
      attachments: []
    }]);
  };

  const updateTransaction = (id, field, value) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTransaction = (id) => {
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const resetForm = () => {
    if (window.confirm("Deseja limpar todos os dados do formulário? Isso não pode ser desfeito.")) {
      setHeaderData(initialHeader);
      setTransactions([]);
      localStorage.clear();
    }
  };

  // --- Gestão de Anexos ---
  const handleFileChange = (e, transactionId) => {
    const files = Array.from(e.target.files);
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        return { ...t, attachments: [...t.attachments, ...files] };
      }
      return t;
    }));
  };

  const removeAttachment = (tId, fileIndex) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === tId) {
        const newAttachments = [...t.attachments];
        newAttachments.splice(fileIndex, 1);
        return { ...t, attachments: newAttachments };
      }
      return t;
    }));
  };

  const openPreview = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    } else {
      alert("Pré-visualização disponível apenas para imagens.");
    }
  };

  // --- Geração de ZIP (Relatório + Anexos) ---
  const generateZipPackage = async () => {
    if (transactions.length === 0) {
      alert("Adicione pelo menos um lançamento.");
      return;
    }

    setIsProcessingZip(true);
    try {
      const zip = new JSZip();

      // 1. Gerar o JSON do Relatório
      const reportData = {
        cabecalho: headerData,
        financeiro: {
          disponivel: headerData.fundoDisponibilizado,
          utilizado: totals.utilizado,
          saldo: totals.saldo
        },
        lancamentos: transactions.map(t => ({
          ...t,
          attachments: t.attachments.map(f => f.name)
        }))
      };

      zip.file("relatorio_prestacao.json", JSON.stringify(reportData, null, 2));

      // 2. Adicionar Anexos em pasta dedicada
      const attachmentsFolder = zip.folder("comprovantes");

      for (const [idx, t] of transactions.entries()) {
        for (const [fIdx, file] of t.attachments.entries()) {
          const cleanMotivo = t.motivo.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sem_motivo';
          const fileName = `item_${idx + 1}_${cleanMotivo}_${fIdx}_${file.name}`;
          attachmentsFolder.file(fileName, file);
        }
      }

      // 3. Gerar e baixar o ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `PRESTACAO_${headerData.loja.replace(/[^a-z0-9]/gi, '_')}_${headerData.dataPrestacao}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Erro ao gerar ZIP:", error);
      alert("Erro ao gerar o pacote ZIP. Verifique o console.");
    } finally {
      setIsProcessingZip(false);
    }
  };

  const handleHeaderChange = (e) => {
    let { name, value } = e.target;

    // Máscara Simples para CPF
    if (name === 'cpf') {
      value = value.replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
    }

    setHeaderData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <FileArchive className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Prestação de Contas</h1>
              <p className="text-slate-500 font-medium text-sm">Controle de Fundo Fixo Profissional</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetForm}
              className="group flex items-center gap-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold px-4 py-2.5 rounded-xl transition-all text-sm shadow-sm"
            >
              <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> Reiniciar
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm shadow-md"
            >
              <Printer size={18} /> Gerar PDF
            </button>
            <button
              onClick={generateZipPackage}
              disabled={isProcessingZip}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 text-sm"
            >
              {isProcessingZip ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              Exportar Pacote ZIP
            </button>
          </div>
        </header>

        {/* DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
          <StatCard
            label="Fundo Disponibilizado"
            value={formatCurrency(headerData.fundoDisponibilizado)}
            icon={<Calculator className="text-indigo-600" />}
            trend="Total Alocado"
          />
          <StatCard
            label="Total Utilizado"
            value={formatCurrency(totals.utilizado)}
            icon={<AlertCircle className="text-amber-600" />}
            trend={`${Math.round((totals.utilizado / headerData.fundoDisponibilizado) * 100) || 0}% consumido`}
            trendColor={totals.utilizado > headerData.fundoDisponibilizado ? "text-red-500" : "text-amber-500"}
          />
          <StatCard
            label="Saldo Remanescente"
            value={formatCurrency(totals.saldo)}
            icon={<CheckCircle2 className="text-emerald-600" />}
            colorClass={totals.saldo < 0 ? "text-red-700 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}
            trend={totals.saldo < 0 ? "Excedente" : "Disponível"}
          />
        </div>

        {/* INFO GERAIS */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:border">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <User size={16} />
            <h2 className="text-xs font-black uppercase tracking-widest">Informações do Detentor</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InputField label="Detentor" name="detentor" value={headerData.detentor} onChange={handleHeaderChange} placeholder="Nome Completo" />
            <InputField label="CPF" name="cpf" value={headerData.cpf} onChange={handleHeaderChange} placeholder="000.000.000-00" />
            <InputField label="Loja / Unidade" name="loja" value={headerData.loja} onChange={handleHeaderChange} icon={<Store size={14} />} />
            <InputField label="Data Prestação" name="dataPrestacao" type="date" value={headerData.dataPrestacao} onChange={handleHeaderChange} icon={<Calendar size={14} />} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Chave PIX (Reembolso)" name="chavePix" value={headerData.chavePix} onChange={handleHeaderChange} icon={<CreditCard size={14} />} />
            <InputField label="Departamento" name="depto" value={headerData.depto} onChange={handleHeaderChange} />
            <InputField label="Ajustar Fundo (R$)" name="fundoDisponibilizado" type="number" value={headerData.fundoDisponibilizado} onChange={handleHeaderChange} />
          </div>
        </section>

        {/* TABELA DE DESPESAS */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border">
          <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
              <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">Detalhamento de Gastos</h2>
            </div>
            <button onClick={addTransaction} className="print:hidden flex items-center gap-2 text-xs bg-indigo-600 text-white font-black px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
              <Plus size={16} /> NOVO LANÇAMENTO
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 text-[11px] uppercase font-black border-b border-slate-100">
                  <th className="px-6 py-4 w-36">Data</th>
                  <th className="px-6 py-4">Descrição e Fornecedor</th>
                  <th className="px-6 py-4 w-28 text-center">Nº Doc</th>
                  <th className="px-6 py-4 w-40 text-right">Valor</th>
                  <th className="px-6 py-4 w-64 print:hidden">Comprovantes</th>
                  <th className="px-6 py-4 w-12 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">Nenhuma despesa lançada.</td>
                  </tr>
                )}
                <AnimatePresence>
                  {transactions.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4 align-top">
                        <input type="date" value={item.data} onChange={(e) => updateTransaction(item.id, 'data', e.target.value)} className="w-full text-xs font-bold outline-none bg-transparent text-slate-600 focus:text-indigo-600" />
                      </td>
                      <td className="px-6 py-4 align-top">
                        <input type="text" placeholder="Qual o motivo do gasto?" value={item.motivo} onChange={(e) => updateTransaction(item.id, 'motivo', e.target.value.toUpperCase())} className="w-full text-sm font-bold outline-none bg-transparent mb-1 text-slate-800 placeholder:text-slate-300 focus:text-indigo-600" />
                        <input type="text" placeholder="Nome do Fornecedor / Empresa" value={item.fornecedor} onChange={(e) => updateTransaction(item.id, 'fornecedor', e.target.value)} className="w-full text-[11px] text-slate-400 font-medium outline-none bg-transparent focus:text-slate-600 uppercase" />
                      </td>
                      <td className="px-6 py-4 align-top text-center">
                        <input type="text" placeholder="000" value={item.nf} onChange={(e) => updateTransaction(item.id, 'nf', e.target.value)} className="w-full text-xs text-center font-bold outline-none bg-transparent text-slate-500 focus:text-indigo-600" />
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1 font-mono font-black text-indigo-900 bg-indigo-50/50 px-3 py-1 rounded-lg">
                          <span className="text-[10px] opacity-50">R$</span>
                          <input type="number" step="0.01" value={item.valor} onChange={(e) => updateTransaction(item.id, 'valor', e.target.value)} className="w-20 text-right outline-none bg-transparent" />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top print:hidden">
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-[10px] font-black text-white bg-indigo-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer w-fit px-3 py-1.5 rounded-lg shadow-sm">
                            <Paperclip size={12} /> ANEXAR
                            <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, item.id)} />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {item.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-[10px] pl-2 pr-1 py-1 rounded-md text-slate-700 group/file">
                                <FileText size={12} className="text-indigo-400" />
                                <span className="truncate max-w-[100px] font-bold">{file.name}</span>
                                <div className="flex items-center gap-0.5 ml-1">
                                  <button onClick={() => openPreview(file)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <Eye size={12} />
                                  </button>
                                  <button onClick={() => removeAttachment(item.id, idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-right print:hidden">
                        <button onClick={() => removeTransaction(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-black border-t-2 border-slate-200">
                  <td colSpan="3" className="px-6 py-6 text-right text-slate-400 text-[11px] uppercase tracking-widest">Total Acumulado</td>
                  <td className="px-6 py-6 text-right text-xl font-mono text-indigo-900">{formatCurrency(totals.utilizado)}</td>
                  <td colSpan="2" className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* MODAL PREVIEW */}
        {previewImage && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all z-10">
                <X size={24} />
              </button>
              <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain" />
            </div>
          </div>
        )}

        {/* FOOTER IMPRESSÃO */}
        <section className="hidden print:block mt-20">
          <div className="grid grid-cols-2 gap-20 px-10">
            <div className="border-t-2 border-slate-900 pt-4 text-center">
              <p className="font-black uppercase text-xs tracking-widest text-slate-900">{headerData.detentor}</p>
              <p className="text-[10px] text-slate-500 font-medium italic mt-1">Assinatura do Detentor</p>
              <p className="text-[9px] text-slate-400 mt-0.5">CPF: {headerData.cpf}</p>
            </div>
            <div className="border-t-2 border-slate-900 pt-4 text-center">
              <p className="font-black uppercase text-xs tracking-widest text-slate-900">Financeiro / Gerência</p>
              <p className="text-[10px] text-slate-500 font-medium italic mt-1">Aprovado em: ____ / ____ / ________</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Visto / Carimbo</p>
            </div>
          </div>
          <div className="mt-20 text-center text-[9px] text-slate-300">
            Relatório gerado digitalmente em {new Date().toLocaleString('pt-BR')}
          </div>
        </section>

      </div>
    </div>
  );
};

// --- Componentes Atômicos ---

const StatCard = ({ label, value, icon, trend, trendColor = "text-slate-400", colorClass = "bg-white text-slate-900" }) => (
  <div className={`${colorClass} border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:translate-y-[-2px] relative overflow-hidden group`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 shadow-sm">{icon}</div>
      <div className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${trendColor} bg-slate-50 group-hover:bg-white`}>{trend}</div>
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{label}</p>
      <p className="text-3xl font-black tracking-tight font-mono">{value}</p>
    </div>
    {/* Subtle decorative circle */}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
  </div>
);

const InputField = ({ label, icon, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-2 ml-1 tracking-widest">
      {icon} {label}
    </label>
    <div className="relative">
      <input
        {...props}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
      />
    </div>
  </div>
);

export default App;
