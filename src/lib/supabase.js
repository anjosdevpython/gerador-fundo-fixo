import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing in .env file')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

/**
 * Deleta registros e arquivos mais antigos que o limite de dias especificado.
 * @param {number} daysThreshold - Número de dias para manter os registros.
 */
export const cleanupOldRecords = async (daysThreshold = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
        const cutoffString = cutoffDate.toISOString().split('T')[0];

        console.log(`Iniciando limpeza de registros anteriores a ${cutoffString}...`);

        // 1. Buscar registros para deletar
        const { data: records, error: fetchError } = await supabase
            .from('prestacoes')
            .select('id, pdf_url, transacoes')
            .lt('data_prestacao', cutoffString);

        if (fetchError) throw fetchError;
        if (!records || records.length === 0) {
            console.log('Nenhum registro antigo encontrado para limpeza.');
            return { success: true, deletedCount: 0 };
        }

        // 2. Coletar caminhos de arquivos para deletar do Storage
        const filesToDelete = [];
        records.forEach(r => {
            // Extrair caminho do PDF
            if (r.pdf_url) {
                const path = r.pdf_url.split('/storage/v1/object/public/prestacoes/')[1];
                if (path) filesToDelete.push(path);
            }
            // Extrair caminhos dos anexos
            if (r.transacoes && Array.isArray(r.transacoes)) {
                r.transacoes.forEach(t => {
                    if (t.attachments && Array.isArray(t.attachments)) {
                        t.attachments.forEach(att => {
                            if (att.url) {
                                const attPath = att.url.split('/storage/v1/object/public/prestacoes/')[1];
                                if (attPath) filesToDelete.push(attPath);
                            }
                        });
                    }
                });
            }
        });

        // 3. Deletar arquivos do Storage
        if (filesToDelete.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('prestacoes')
                .remove(filesToDelete);
            if (storageError) console.error('Erro ao deletar arquivos:', storageError);
        }

        // 4. Deletar registros do Banco de Dados
        const { error: deleteError } = await supabase
            .from('prestacoes')
            .delete()
            .in('id', records.map(r => r.id));

        if (deleteError) throw deleteError;

        console.log(`Limpeza concluída! ${records.length} registros e ${filesToDelete.length} arquivos removidos.`);
        return { success: true, deletedCount: records.length };
    } catch (error) {
        console.error('Falha na limpeza automática:', error);
        return { success: false, error };
    }
};

/**
 * Busca todos os registros de prestações do banco de dados.
 */
export const fetchRecords = async () => {
    try {
        const { data, error } = await supabase
            .from('prestacoes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        return { data: null, error };
    }
};

/**
 * Deleta um único registro e seus arquivos associados.
 */
export const deleteRecord = async (recordId, pdfUrl, transacoes) => {
    try {
        // 1. Coletar caminhos de arquivos para deletar do Storage
        const filesToDelete = [];

        // Extrair caminho do PDF
        if (pdfUrl) {
            const path = pdfUrl.split('/storage/v1/object/public/prestacoes/')[1];
            if (path) filesToDelete.push(path);
        }

        // Extrair caminhos dos anexos
        if (transacoes && Array.isArray(transacoes)) {
            transacoes.forEach(t => {
                if (t.attachments && Array.isArray(t.attachments)) {
                    t.attachments.forEach(att => {
                        if (att.url) {
                            const attPath = att.url.split('/storage/v1/object/public/prestacoes/')[1];
                            if (attPath) filesToDelete.push(attPath);
                        }
                    });
                }
            });
        }

        // 2. Deletar arquivos do Storage
        if (filesToDelete.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('prestacoes')
                .remove(filesToDelete);
            if (storageError) console.error('Erro ao deletar arquivos do registro:', storageError);
        }

        // 3. Deletar registro do Banco de Dados
        const { error: deleteError } = await supabase
            .from('prestacoes')
            .delete()
            .eq('id', recordId);

        if (deleteError) throw deleteError;

        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir registro:', error);
        return { success: false, error };
    }
};

/**
 * Busca todas as lojas cadastradas.
 */
export const fetchStores = async () => {
    try {
        const { data, error } = await supabase
            .from('lojas')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erro ao buscar lojas:', error);
        return { data: null, error };
    }
};

/**
 * Salva ou atualiza uma loja.
 */
export const saveStore = async (storeData) => {
    try {
        const { data, error } = await supabase
            .from('lojas')
            .upsert([storeData])
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erro ao salvar loja:', error);
        return { data: null, error };
    }
};

/**
 * Deleta uma loja.
 */
export const deleteStore = async (storeId) => {
    try {
        const { error } = await supabase
            .from('lojas')
            .delete()
            .eq('id', storeId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir loja:', error);
        return { success: false, error };
    }
};
