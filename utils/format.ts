/**
 * Formats a number with the 'k' suffix if it's greater than or equal to 1000.
 * Example: 4560 -> 4.6k
 */
export const formatK = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '0';
    
    let num: number;
    if (typeof value === 'string') {
        // Handle currency strings like "R$ 4.802,00" or plain numbers as strings
        const clean = value.replace(/[R\$\s\.]/g, '').replace(',', '.');
        num = parseFloat(clean);
    } else {
        num = value;
    }

    if (isNaN(num)) return String(value);

    if (num >= 1000) {
        // Round to 1 decimal place and add 'k'
        // Using Math.round(val * 10) / 10 to get 4.6 from 4.560
        const formatted = (Math.round(num / 100) / 10).toFixed(1).replace(/\.0$/, '');
        return `${formatted}k`;
    }

    return num.toString();
};

/**
 * Formats a currency value with the 'k' suffix if it's >= 1000.
 * Example: "R$ 4.560,00" -> "R$ 4.6k"
 */
export const formatCurrencyK = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return 'R$ 0';
    
    let num: number;
    if (typeof value === 'string') {
        const clean = value.replace(/[R\$\s\.]/g, '').replace(',', '.');
        num = parseFloat(clean);
    } else {
        num = value;
    }

    if (isNaN(num)) return String(value);

    if (num >= 1000) {
        const formatted = (Math.round(num / 100) / 10).toFixed(1).replace(/\.0$/, '');
        return `R$ ${formatted}k`;
    }

    // Fallback to pt-BR currency format for smaller values
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2 
    }).format(num);
};
