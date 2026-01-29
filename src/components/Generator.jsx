import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Printer,
    Calculator,
    User,
    AlertCircle,
    CheckCircle2,
    Paperclip,
    FileText,
    X,
    Loader2,
    Download,
    RefreshCcw,
    Send
} from 'lucide-react';
import { supabase, cleanupOldRecords, fetchStores } from '../lib/supabase';
import { StatCard, InputField } from './Atomic';
import { formatCurrency, parseCurrency, maskCurrency } from '../utils/formatters';
import { validatePixKey } from '../utils/pixValidator';

const Generator = ({ onSaveRecord }) => {
    const initialHeader = {
        detentor: '',
        cpf: '',
        loja: '',
        depto: 'Loja',
        chavePix: '',
        fundoDisponibilizado: 0,
        dataPrestacao: new Date().toISOString().split('T')[0]
    };

    const [headerData, setHeaderData] = useState(initialHeader);
    const [transactions, setTransactions] = useState([]);
    const [stores, setStores] = useState([]);
    const [isProcessingZip, setIsProcessingZip] = useState(false);
    const [isSyncingSharePoint, setIsSyncingSharePoint] = useState(false);
    const [pixValidation, setPixValidation] = useState({ valid: true, message: '' });

    useEffect(() => {
        const loadStores = async () => {
            const { data } = await fetchStores();
            if (data) setStores(data);
        };
        loadStores();
    }, []);

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

    // Validação em tempo real do PIX
    useEffect(() => {
        if (headerData.chavePix) {
            const validation = validatePixKey(headerData.chavePix);
            setPixValidation(validation);
        } else {
            setPixValidation({ valid: false, message: 'Chave PIX é obrigatória' });
        }
    }, [headerData.chavePix]);

    const totals = useMemo(() => {
        const utilizado = transactions.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
        const saldo = headerData.fundoDisponibilizado - utilizado;
        return { utilizado, saldo };
    }, [transactions, headerData.fundoDisponibilizado]);



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

        // Validação do PIX
        if (!pixValidation.valid) {
            alert(`Chave PIX inválida: ${pixValidation.message}`);
            return false;
        }

        return true;
    };

    const generatePDFReport = async () => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const element = document.getElementById('print-area');
            if (!element) throw new Error("Área de impressão não encontrada");

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                windowWidth: 1200,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('print-area');
                    if (clonedElement) {
                        clonedElement.style.width = '1200px';
                        clonedElement.style.padding = '40px';
                    }

                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i];
                        const style = window.getComputedStyle(el);
                        if (style.color.includes('ok')) el.style.color = '#334155';
                        if (style.backgroundColor.includes('ok')) el.style.backgroundColor = '#ffffff';
                        if (style.borderColor.includes('ok')) el.style.borderColor = '#e2e8f0';
                        if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                            el.style.border = '1px solid #e2e8f0';
                            el.style.backgroundColor = '#f8fafc';
                        }
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let finalWidth = imgWidth;
            let finalHeight = imgHeight;
            if (finalHeight > pdfHeight - 20) {
                finalHeight = pdfHeight - 20;
                finalWidth = (canvas.width * finalHeight) / canvas.height;
            }
            const xPos = (pdfWidth - finalWidth) / 2;
            const yPos = 10;
            pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
            return pdf.output('blob');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            throw error;
        }
    };

    const handleSupabaseSync = async () => {
        if (!validateHeader()) return;
        setIsSyncingSharePoint(true);
        try { await cleanupOldRecords(120); } catch (e) { console.warn('Falha na limpeza automática:', e); }

        setTimeout(async () => {
            try {
                const sanitizeFileName = (name) => name.replace(/[|&;$%@"<>()+,]/g, "_").replace(/\s+/g, "_");
                const pdfBlob = await generatePDFReport();
                const timestamp = Date.now();
                const safeLojaName = sanitizeFileName(headerData.loja);
                const pdfFileName = `relatorios/PRESTACAO_${safeLojaName}_${headerData.dataPrestacao}_${timestamp}.pdf`;

                let { error: pdfError } = await supabase.storage.from('prestacoes').upload(pdfFileName, pdfBlob);
                if (pdfError) throw new Error(`Erro ao enviar PDF: ${pdfError.message}`);

                const { data: { publicUrl: pdfUrl } } = supabase.storage.from('prestacoes').getPublicUrl(pdfFileName);

                const attachmentUrls = [];
                for (const t of transactions) {
                    const tAttachments = [];
                    for (const file of t.attachments) {
                        const fileName = `anexos/${timestamp}_${t.id}_${file.name}`;
                        const { error: uploadError } = await supabase.storage.from('prestacoes').upload(fileName, file);
                        if (!uploadError) {
                            const { data: { publicUrl } } = supabase.storage.from('prestacoes').getPublicUrl(fileName);
                            tAttachments.push({ name: file.name, url: publicUrl });
                        }
                    }
                    attachmentUrls.push({ transactionId: t.id, files: tAttachments });
                }

                const { data: recordData, error: dbError } = await supabase.from('prestacoes').insert([{
                    loja: headerData.loja,
                    detentor: headerData.detentor,
                    cpf: headerData.cpf,
                    chave_pix: headerData.chavePix,
                    depto: headerData.depto,
                    valor_fundo: headerData.fundoDisponibilizado,
                    valor_utilizado: totals.utilizado,
                    saldo: totals.saldo,
                    data_prestacao: headerData.dataPrestacao,
                    pdf_url: pdfUrl,
                    transacoes: transactions.map(t => ({
                        ...t,
                        attachments: attachmentUrls.find(a => a.transactionId === t.id)?.files || []
                    }))
                }]).select();

                if (dbError) throw new Error(`Erro ao salvar no banco: ${dbError.message}`);

                onSaveRecord({
                    id: recordData[0].id,
                    header: headerData,
                    total: totals.utilizado,
                    timestamp: new Date().toLocaleString('pt-BR'),
                    status: 'Synced',
                    pdfUrl: pdfUrl
                });
                alert("Prestação salva com sucesso no Banco de Dados!");

                setHeaderData(prev => ({
                    ...initialHeader,
                    loja: prev.loja,
                    detentor: prev.detentor,
                    cpf: prev.cpf,
                    depto: prev.depto,
                    fundoDisponibilizado: prev.fundoDisponibilizado
                }));
                setTransactions([]);
                localStorage.removeItem('fundo_transactions');
            } catch (e) {
                console.error("Erro crítico na sincronização:", e);
                alert("Erro ao salvar: " + (e.message || "Erro desconhecido"));
            } finally {
                setIsSyncingSharePoint(false);
            }
        }, 100);
    };

    const generateZipPackage = async () => {
        if (!validateHeader()) return;
        setIsProcessingZip(true);
        try {
            const JSZip = (await import('jszip')).default;
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
                    <button
                        onClick={handleSupabaseSync}
                        disabled={isSyncingSharePoint}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all font-sans disabled:opacity-50"
                    >
                        {isSyncingSharePoint ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Send size={14} />
                        )}
                        {"Salvar no Banco"}
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
                        <InputField label="Detentor" name="detentor" required readOnly value={headerData.detentor} placeholder="Selecione uma loja..." />
                        <InputField label="CPF" name="cpf" required readOnly value={headerData.cpf} placeholder="Selecione uma loja..." />
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Loja</label>
                            <select
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-slate-900 transition-all group-hover:bg-white"
                                value={headerData.loja}
                                onChange={(e) => {
                                    const selectedStoreName = e.target.value;
                                    const s = stores.find(x => x.nome === selectedStoreName);

                                    if (s) {
                                        setHeaderData({
                                            ...headerData,
                                            loja: selectedStoreName,
                                            detentor: (s.gerente || '').toUpperCase(),
                                            cpf: s.cpf || '',
                                            chavePix: s.pix || '',
                                            depto: s.depto || 'Loja',
                                            fundoDisponibilizado: Number(s.fundo_fixo) || 0
                                        });
                                    } else {
                                        setHeaderData({ ...headerData, loja: selectedStoreName });
                                    }
                                }}>
                                <option value="">Selecione...</option>
                                {stores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                            </select>
                        </div>
                        <InputField label="Data" name="dataPrestacao" type="date" value={headerData.dataPrestacao} onChange={(e) => setHeaderData({ ...headerData, dataPrestacao: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                                Chave PIX
                                {headerData.chavePix && (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${pixValidation.valid
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}>
                                        {pixValidation.valid ? `✓ ${pixValidation.type}` : '✗ Inválida'}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                name="chavePix"
                                required
                                value={headerData.chavePix}
                                onChange={(e) => setHeaderData({ ...headerData, chavePix: e.target.value })}
                                placeholder="CPF, Email, Telefone ou Chave Aleatória"
                                className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none transition-all group-hover:bg-white ${!headerData.chavePix
                                        ? 'border-slate-100'
                                        : pixValidation.valid
                                            ? 'border-emerald-200 focus:border-emerald-500'
                                            : 'border-red-200 focus:border-red-500'
                                    }`}
                            />
                            {headerData.chavePix && !pixValidation.valid && (
                                <p className="text-[10px] text-red-600 font-medium pl-1">
                                    {pixValidation.message}
                                </p>
                            )}
                        </div>
                        <InputField label="Depto" name="depto" required readOnly value={headerData.depto} placeholder="Selecione uma loja..." />
                        <InputField
                            label="Valor Fundo"
                            name="fundoDisponibilizado"
                            required
                            readOnly
                            type="text"
                            value={maskCurrency(headerData.fundoDisponibilizado)}
                        />
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
                                            <input
                                                type="text"
                                                value={maskCurrency(t.valor)}
                                                onChange={(e) => updateTransaction(t.id, 'valor', parseCurrency(e.target.value))}
                                                className="w-full bg-transparent outline-none"
                                            />
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
        </div >
    );
};

export default Generator;
