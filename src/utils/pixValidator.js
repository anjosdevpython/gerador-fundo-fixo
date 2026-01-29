/**
 * Validador de Chaves PIX
 * Suporta: CPF, CNPJ, Email, Telefone e Chave Aleatória
 */

// Remove caracteres não numéricos
const onlyNumbers = (str) => str.replace(/\D/g, '');

// Valida CPF
const isValidCPF = (cpf) => {
    const cleaned = onlyNumbers(cpf);
    if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

    return true;
};

// Valida CNPJ
const isValidCNPJ = (cnpj) => {
    const cleaned = onlyNumbers(cnpj);
    if (cleaned.length !== 14 || /^(\d)\1{13}$/.test(cleaned)) return false;

    let length = cleaned.length - 2;
    let numbers = cleaned.substring(0, length);
    const digits = cleaned.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleaned.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
};

// Valida Email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 77;
};

// Valida Telefone (+55 DDD 9XXXX-XXXX)
const isValidPhone = (phone) => {
    const cleaned = onlyNumbers(phone);
    // Aceita com ou sem +55
    if (cleaned.length === 11) {
        // Formato: DDD + 9XXXX-XXXX
        return /^[1-9]{2}9[0-9]{8}$/.test(cleaned);
    }
    if (cleaned.length === 13) {
        // Formato: +55 + DDD + 9XXXX-XXXX
        return /^55[1-9]{2}9[0-9]{8}$/.test(cleaned);
    }
    return false;
};

// Valida Chave Aleatória (EVP - formato UUID)
const isValidRandomKey = (key) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(key);
};

/**
 * Valida qualquer tipo de chave PIX
 * @param {string} pix - Chave PIX a ser validada
 * @returns {Object} { valid: boolean, type: string, message: string }
 */
export const validatePixKey = (pix) => {
    if (!pix || typeof pix !== 'string') {
        return { valid: false, type: null, message: 'Chave PIX é obrigatória' };
    }

    const trimmed = pix.trim();

    if (trimmed.length === 0) {
        return { valid: false, type: null, message: 'Chave PIX não pode estar vazia' };
    }

    // Tenta validar CPF
    if (isValidCPF(trimmed)) {
        return { valid: true, type: 'CPF', message: 'CPF válido' };
    }

    // Tenta validar CNPJ
    if (isValidCNPJ(trimmed)) {
        return { valid: true, type: 'CNPJ', message: 'CNPJ válido' };
    }

    // Tenta validar Email
    if (isValidEmail(trimmed)) {
        return { valid: true, type: 'Email', message: 'Email válido' };
    }

    // Tenta validar Telefone
    if (isValidPhone(trimmed)) {
        return { valid: true, type: 'Telefone', message: 'Telefone válido' };
    }

    // Tenta validar Chave Aleatória
    if (isValidRandomKey(trimmed)) {
        return { valid: true, type: 'Chave Aleatória', message: 'Chave aleatória válida' };
    }

    return {
        valid: false,
        type: null,
        message: 'Chave PIX inválida. Use CPF, CNPJ, Email, Telefone ou Chave Aleatória.'
    };
};

/**
 * Formata a chave PIX para exibição
 * @param {string} pix - Chave PIX
 * @returns {string} Chave formatada
 */
export const formatPixKey = (pix) => {
    const validation = validatePixKey(pix);

    if (!validation.valid) return pix;

    const cleaned = onlyNumbers(pix);

    switch (validation.type) {
        case 'CPF':
            // 000.000.000-00
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

        case 'CNPJ':
            // 00.000.000/0000-00
            return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

        case 'Telefone':
            // +55 (00) 90000-0000
            if (cleaned.length === 13) {
                return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
            }
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

        default:
            return pix;
    }
};
