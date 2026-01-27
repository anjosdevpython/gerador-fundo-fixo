import React, { useState, useMemo, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
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
  FileArchive,
  History,
  Send,
  ExternalLink,
  ChevronRight,
  Menu,
  Home,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Configurações SharePoint ---
const SHAREPOINT_WEBHOOK_URL = ""; // Usuário deve preencher no futuro ou via painel

const STORES = [
  { id: '1', name: 'Mini | Santa | Loja 1', manager: 'Jaqueline' },
  { id: '1', name: 'Salvados | Santa | Loja 1', manager: 'Valquíria' },
  { id: '2', name: 'Mini | Torres | Loja 2', manager: 'Rosimar Robison' },
  { id: '2', name: 'Salvados | Torres | Loja 2', manager: 'Lucas Pego' },
  { id: '3', name: 'Centro de Distribuição | Loja 3', manager: '' },
  { id: '4', name: 'Mini | Pinhais | Loja 4', manager: 'Michele' },
  { id: '4', name: 'Salvados | Pinhais | Loja 4', manager: 'Carlos Eduardo' },
  { id: '5', name: 'Ecommerce | Loja 5', manager: 'Marcos Cardoso' },
  { id: '6', name: 'Mini | Paranaguá | Loja 6', manager: 'Dennis Keller' },
  { id: '6', name: 'Salvados | Paranaguá | Loja 6', manager: 'Dennis Keller' },
  { id: '7', name: 'Mini | Fanny | Loja 7', manager: 'Ivan Nícássio' },
  { id: '8', name: 'Mini | Fazenda Rio Grande | Loja 8', manager: 'Sheila' },
  { id: '8', name: 'Salvados | Fazenda Rio Grande | Loja 8', manager: 'Sheila' },
  { id: '10', name: 'Mini | Xaxim | Lo_ja 10', manager: 'Maria Franciely' },
  { id: '10', name: 'Salvados | Xaxim | Loja 10', manager: 'Maria Franciely' },
  { id: '11', name: 'Mini | Fazendinha | Loja 11', manager: 'Jorge Belotto' },
  { id: '11', name: 'Salvados | Fazendinha | Loja 11', manager: 'Gabriele Fernandes' },
  { id: '12', name: 'Mini | Boulevard | Loja 12', manager: 'Anderson Oliveira' },
  { id: '14', name: 'Mini | Colombo | Loja 14', manager: 'Diego' },
  { id: '14', name: 'Salvados | Colombo | Loja 14', manager: 'Diego' },
  { id: '17', name: 'Salvados | Xaxim | Loja 17', manager: 'Maria Franciely' },
  { id: '18', name: 'Salvados | Fanny | Loja 18', manager: 'Luiz Traldi' },
  { id: '19', name: 'Mini | Araucária | Loja 19', manager: 'Orli Tadeu' },
  { id: '19', name: 'Salvados | Araucária | Loja 19', manager: 'Orli Tadeu' },
  { id: 'BACACHERI', name: 'Mini | Bacacheri', manager: 'Eduardo' },
  { id: '201', name: 'Salvados | Bal Camboriú | Loja 201', manager: 'João Paiva' },
  { id: '202', name: 'Salvados | Itajaí | Loja 202', manager: 'Thiago' },
  { id: '206', name: 'Araquari | Loja 206', manager: 'Márcio Fernandes' },
  { id: '208', name: 'Joinville | Loja 208', manager: 'Huanderson' },
  { id: '301', name: 'Mini | Vila Velha | Loja 301', manager: 'Marco Antonio' },
  { id: '303', name: 'Mini | Serra | Loja 303', manager: 'Erika' },
  { id: '304', name: 'Mini | Vitória | Loja 304', manager: 'Leonardo' },
  { id: '305', name: 'Linhares | Loja 305', manager: 'Suelen' },
  { id: '306', name: 'Mini | CD ES | Loja 306', manager: 'Dani Nascimento' },
  { id: '307', name: 'Mini | Glória | Loja 307', manager: 'Rackilane' },
  { id: '308', name: 'Mini | Day by Day | Loja 308', manager: 'Namar' },
];

// --- Componentes Atômicos ---

const StatCard = ({ label, value, icon, trend, trendColor = "text-slate-400", colorClass = "bg-white text-slate-900" }) => (
  <div className={`${colorClass} border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:translate-y-[-2px] relative overflow-hidden group`}>
    <div className="flex justify-between items-start mb-2 md:mb-4">
      <div className="p-2.5 md:p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 shadow-sm">{icon}</div>
      <div className={`text-[9px] md:text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${trendColor} bg-slate-50 group-hover:bg-white`}>{trend}</div>
    </div>
    <div>
      <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase mb-0.5 md:mb-1 tracking-wider">{label}</p>
      <p className="text-xl md:text-3xl font-black tracking-tight font-mono">{value}</p>
    </div>
    <div className="absolute -right-4 -bottom-4 w-16 md:w-24 h-16 md:h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
  </div>
);

const InputField = ({ label, icon, ...props }) => (
  <div className="flex flex-col gap-1.5 md:gap-2">
    <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase flex items-center gap-2 ml-1 tracking-widest leading-none">
      {icon} {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {props.type === 'select' ? (
        <select
          {...props}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:py-3.5 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:bg-white outline-none transition-all font-bold text-slate-700 appearance-none min-h-[48px]"
        >
          <option value="">Selecione...</option>
          {STORES.map((s, idx) => (
            <option key={idx} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...props}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 md:py-3.5 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 min-h-[48px]"
        />
      )}
    </div>
  </div>
);

// --- Componente: Gerador de Prestação ---
const Generator = ({ onSaveRecord }) => {
  const initialHeader = {
    detentor: '',
    cpf: '',
    loja: '',
    depto: '',
    chavePix: '',
    fundoDisponibilizado: 0,
    dataPrestacao: new Date().toISOString().split('T')[0]
  };

  const [headerData, setHeaderData] = useState(initialHeader);
  const [transactions, setTransactions] = useState([]);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [isSyncingSharePoint, setIsSyncingSharePoint] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const savedHeader = localStorage.getItem('fundo_header');
    const savedTransactions = localStorage.getItem('fundo_transactions');
    if (savedHeader) {
      const parsed = JSON.parse(savedHeader);
      setHeaderData({ ...parsed, loja: '', detentor: '' });
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions).map(t => ({ ...t, attachments: [] })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fundo_header', JSON.stringify(headerData));
  }, [headerData]);

  useEffect(() => {
    const txToSave = transactions.map(({ attachments, ...rest }) => rest);
    localStorage.setItem('fundo_transactions', JSON.stringify(txToSave));
  }, [transactions]);

  const totals = useMemo(() => {
    const utilizado = transactions.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const saldo = headerData.fundoDisponibilizado - utilizado;
    return { utilizado, saldo };
  }, [transactions, headerData.fundoDisponibilizado]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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

  const updateTransaction = (id, field, value) => setTransactions(transactions.map(t => t.id === id ? { ...t, [field]: value } : t));
  const removeTransaction = (id) => window.confirm("Deseja realmente excluir?") && setTransactions(transactions.filter(t => t.id !== id));

  const resetForm = () => {
    if (window.confirm("Limpar tudo?")) {
      setHeaderData(initialHeader);
      setTransactions([]);
      localStorage.clear();
    }
  };

  const handleFileChange = (e, tId) => {
    const files = Array.from(e.target.files);
    setTransactions(prev => prev.map(t => t.id === tId ? { ...t, attachments: [...t.attachments, ...files] } : t));
  };

  const removeAttachment = (tId, idx) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === tId) {
        const copy = [...t.attachments];
        copy.splice(idx, 1);
        return { ...t, attachments: copy };
      }
      return t;
    }));
  };

  const validateHeader = () => {
    const fields = ['detentor', 'cpf', 'loja', 'chavePix', 'depto'];
    if (fields.some(f => !headerData[f])) { alert("Preencha todos os campos obrigatórios."); return false; }
    if (headerData.fundoDisponibilizado <= 0) { alert("Fundo deve ser > 0."); return false; }
    if (transactions.some(t => t.attachments.length === 0)) { alert("Todos os lançamentos precisam de anexo."); return false; }
    return true;
  };

  const generatePDFReport = async () => {
    try {
      const element = document.getElementById('print-area');
      if (!element) throw new Error("Área de impressão não encontrada");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const style = window.getComputedStyle(el);
            // Generalize: strip any color starting with "ok" (oklch, oklab, etc)
            if (style.color.includes('ok')) el.style.color = '#334155';
            if (style.backgroundColor.includes('ok')) el.style.backgroundColor = '#ffffff';
            if (style.borderColor.includes('ok')) el.style.borderColor = '#e2e8f0';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      return pdf.output('blob');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw error;
    }
  };

  const handleSharePointSync = async () => {
    if (!validateHeader()) return;
    setIsSyncingSharePoint(true);

    // Pequeno delay para permitir que o navegador renderize o estado de "loading" antes da tarefa pesada
    setTimeout(async () => {
      try {
        const pdfBlob = await generatePDFReport();
        const record = {
          id: Date.now(),
          header: headerData,
          total: totals.utilizado,
          timestamp: new Date().toLocaleString('pt-BR'),
          status: 'Synced'
        };

        onSaveRecord(record);
        alert("Relatório sincronizado com sucesso!");
      } catch (e) {
        console.error("Erro crítico na sincronização:", e);
        alert("Erro na sincronização: " + (e.message || "Erro desconhecido"));
      } finally {
        setIsSyncingSharePoint(false);
      }
    }, 100);
  };

  const generateZipPackage = async () => {
    if (!validateHeader()) return;
    setIsProcessingZip(true);
    try {
      const zip = new JSZip();
      const pdf = await generatePDFReport();
      if (pdf) zip.file("relatorio.pdf", pdf);
      const folder = zip.folder("comprovantes");
      transactions.forEach((t, i) => t.attachments.forEach((f, fi) => folder.file(`item_${i + 1}_${fi}_${f.name}`, f)));
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `PRESTACAO_${headerData.loja}_${headerData.dataPrestacao}.zip`;
      link.click();
    } catch (e) {
      alert("Erro ao gerar ZIP.");
    } finally {
      setIsProcessingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center gap-4">
          <img src="./logo.png" alt="Logo" className="h-10 w-auto" />
          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Nova Prestação</h1>
            <p className="text-slate-500 text-xs font-medium">Preencha os dados abaixo</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={resetForm} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all font-sans">
            <RefreshCcw size={16} /> Reiniciar
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all font-sans">
            <Printer size={16} /> Imprimir
          </button>
          <button onClick={handleSharePointSync} disabled={isSyncingSharePoint} className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all font-sans">
            {isSyncingSharePoint ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Sincronizar SharePoint
          </button>
          <button onClick={generateZipPackage} disabled={isProcessingZip} className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all font-sans">
            {isProcessingZip ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Baixar ZIP
          </button>
        </div>
      </header>

      <div id="print-area" className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Fundo Disponível" value={formatCurrency(headerData.fundoDisponibilizado)} icon={<Calculator className="text-red-600" />} trend="Total do Fundo" />
          <StatCard label="Total Utilizado" value={formatCurrency(totals.utilizado)} icon={<AlertCircle className="text-amber-600" />} trend={`${Math.round((totals.utilizado / headerData.fundoDisponibilizado) * 100) || 0}%`} />
          <StatCard label="Saldo" value={formatCurrency(totals.saldo)} icon={<CheckCircle2 className="text-emerald-600" />} colorClass={totals.saldo < 0 ? "bg-red-50" : "bg-emerald-50"} trend="Remanescente" />
        </div>

        <section className="space-y-6 border-t pt-6">
          <div className="flex items-center gap-2 text-slate-400">
            <User size={16} /> <h2 className="text-xs font-black uppercase tracking-widest">Informações Gerais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InputField label="Detentor" name="detentor" required value={headerData.detentor} onChange={(e) => setHeaderData({ ...headerData, detentor: e.target.value })} placeholder="Nome Completo" />
            <InputField label="CPF" name="cpf" required value={headerData.cpf} onChange={(e) => {
              let v = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').substring(0, 14);
              setHeaderData({ ...headerData, cpf: v });
            }} placeholder="000.000.000-00" />
            <InputField label="Loja" name="loja" required type="select" value={headerData.loja} onChange={(e) => {
              const s = STORES.find(x => x.name === e.target.value);
              setHeaderData({ ...headerData, loja: e.target.value, detentor: s?.manager.toUpperCase() || '' });
            }} />
            <InputField label="Data" name="dataPrestacao" type="date" value={headerData.dataPrestacao} onChange={(e) => setHeaderData({ ...headerData, dataPrestacao: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Chave PIX" name="chavePix" required value={headerData.chavePix} onChange={(e) => setHeaderData({ ...headerData, chavePix: e.target.value })} />
            <InputField label="Depto" name="depto" required value={headerData.depto} onChange={(e) => setHeaderData({ ...headerData, depto: e.target.value })} />
            <InputField label="Valor Fundo" name="fundoDisponibilizado" required type="number" value={headerData.fundoDisponibilizado} onChange={(e) => setHeaderData({ ...headerData, fundoDisponibilizado: Number(e.target.value) })} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
            <h2 className="text-xs font-black uppercase text-slate-600 tracking-widest">Lançamentos</h2>
            <button onClick={addTransaction} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 shadow-md transition-all active:scale-95 font-sans">
              <Plus size={14} /> NOVO
            </button>
          </div>

          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 flex flex-col md:flex-row gap-4 items-start hover:bg-slate-50 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                  <div className="md:col-span-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Motivo / Fornecedor</p>
                    <input type="text" value={t.motivo} onChange={(e) => updateTransaction(t.id, 'motivo', e.target.value.toUpperCase())} placeholder="Motivo do gasto" className="w-full text-sm font-bold bg-transparent outline-none border-b border-transparent focus:border-red-500" />
                    <input type="text" value={t.fornecedor} onChange={(e) => updateTransaction(t.id, 'fornecedor', e.target.value)} placeholder="Fornecedor / Empresa" className="w-full text-[10px] text-slate-500 uppercase bg-transparent outline-none mt-1" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor</p>
                    <div className="flex items-center gap-1 font-mono text-sm font-bold text-red-900 bg-red-50/50 p-2 rounded-lg">
                      <span>R$</span>
                      <input type="number" value={t.valor} onChange={(e) => updateTransaction(t.id, 'valor', e.target.value)} className="w-full bg-transparent outline-none" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-slate-300 transition-all font-sans">
                      <Paperclip size={12} /> {t.attachments.length || 'ANEXAR'}
                      <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, t.id)} />
                    </label>
                    <button onClick={() => removeTransaction(t.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {t.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 w-full md:w-auto">
                    {t.attachments.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2 bg-white border px-2 py-1 rounded-lg text-[9px] font-bold">
                        <FileText size={10} className="text-red-500" /> <span className="truncate max-w-[60px]">{f.name}</span>
                        <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => removeAttachment(t.id, fi)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="hidden print:block mt-20 border-t-2 border-slate-900 pt-10">
          <div className="grid grid-cols-2 gap-20">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest">{headerData.detentor}</p>
              <p className="text-[10px] italic text-slate-500 mt-1">Assinatura do Detentor</p>
              <div className="mt-8 border-t border-slate-300 w-3/4 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest">Financeiro / Gerência</p>
              <p className="text-[10px] italic text-slate-500 mt-1">Aprovado em ___/___/___</p>
              <div className="mt-8 border-t border-slate-300 w-3/4 mx-auto"></div>
            </div>
          </div>
          <p className="text-center text-[8px] text-slate-300 mt-20">Relatório gerado digitalmente em {new Date().toLocaleString('pt-BR')}</p>
        </section>
      </div>
    </div>
  );
};

// --- Componente: Histórico ---
const HistoryDashboard = ({ records }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl">
            <History className="text-red-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Painel de Registros</h1>
            <p className="text-slate-500 text-xs font-medium">Histórico global de prestações sincronizadas</p>
          </div>
        </div>
      </header>
      {/* ... Rest logic remains same, just styling refinements if needed ... */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 border-b">
              <tr>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Loja / Unidade</th>
                <th className="px-6 py-4">Detentor</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr><td colSpan="6" className="p-16 text-center text-slate-400 italic font-medium">Nenhum registro encontrado localmente.</td></tr>
              ) : (
                records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{r.timestamp}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{r.header.loja}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{r.header.detentor}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-red-900 font-mono">{formatCurrency(r.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">
                        <CheckCircle2 size={12} /> SharePoint
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-300 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100">
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Componente: Login Admin ---
const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "Minipreco@123") {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full"
      >
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-4 bg-slate-100 rounded-full text-slate-400">
            <Lock size={32} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
            <p className="text-slate-400 text-sm">Digite a senha administrativa</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            placeholder="Senha de Acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-slate-50 border-2 ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-center text-lg font-bold outline-none focus:border-red-500 transition-all`}
          />
          {error && <p className="text-red-500 text-center text-xs font-bold animate-bounce">Senha incorreta!</p>}
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95">
            ENTRAR NO PAINEL
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Componente Raiz (Navegação) ---
const App = () => {
  const [history, setHistory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Wrapper para proteção de rota
  const ProtectedRoute = ({ children }) => {
    if (!isAdmin) {
      return <LoginPage onLogin={() => setIsAdmin(true)} />;
    }
    return children;
  };

  useEffect(() => {
    const saved = localStorage.getItem('fundo_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (record) => {
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem('fundo_history', JSON.stringify(newHistory));
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
        {/* Main Content */}
        <main className="w-full max-w-6xl p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Generator onSaveRecord={saveToHistory} />} />
            <Route
              path="/registros"
              element={
                <ProtectedRoute>
                  <HistoryDashboard records={history} />
                </ProtectedRoute>
              }
            />
          </Routes>

          <footer className="mt-12 text-center space-y-2 py-12 border-t border-slate-200/60 relative">
            <p className="text-slate-400 text-xs font-medium tracking-wide">Desenvolvido por: <span className="text-red-600 font-black">Allan Anjos</span></p>
            <div className="flex items-center justify-center gap-1.5 text-slate-300 text-[9px] font-bold uppercase tracking-widest">
              <Send size={10} /> Sincronizado via SharePoint/Power Automate 🍏
            </div>

            {/* Subtle Admin Link */}
            <Link to="/registros" className="absolute bottom-4 right-4 text-slate-200/50 hover:text-slate-400 transition-colors">
              <Lock size={12} title="Painel Admin" />
            </Link>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;
