/**
 * Utilitários de formatação para o padrão brasileiro (PT-BR)
 */

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue ? parseFloat(cleanValue) / 100 : 0;
};

export const maskCurrency = (value) => {
    const amount = typeof value === 'string' ? parseCurrency(value) : value;
    return formatCurrency(amount);
};
