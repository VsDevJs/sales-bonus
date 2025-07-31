/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { // purchase товар из массива с чеком;
    const discount = 1 - (purchase.discount / 100); // Остаток суммы без скидки;
    return purchase.sale_price * purchase.quantity * discount; // Из массива чеков продаж. Считаем без учета скидки;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index == 0) {
        return profit * 0.15;
    }
    else if (index == 1 || index == 2) {
        return profit * 0.1; 
    } else if (index == total - 1) {
        return 0;
    } else { // Для всех остальных
        return profit * 0.05;
    }
    // @TODO: Расчет бонуса от позиции в рейтинге
}
/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    if (!data || (!Array.isArray(data.sellers) || data.sellers.length === 0)
        || (!Array.isArray(data.products) || data.products.length === 0)
        || (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0))
            throw new Error('Чего-то не хватает');

    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

        const { calculateRevenue, calculateBonus } = options;

    // Проверяем переменные

    if (!calculateRevenue && typeof calculateRevenue !== "function" || !calculateBonus && typeof calculateBonus !== "function") {
        throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((result, seller) => ({
        ...result,
        [seller.id]: seller,
    }), {});

    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек

        const seller = sellerIndex[record.seller_id]; // Продавец
    
        // Увеличить количество продаж
        seller.sales_count++;

        // Увеличить общую сумму всех продаж
        
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Взяли товар из объекта productIndex;

            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity; // Себестоимость закупки;

            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue

            const revenue = calculateRevenue(item, product);
            
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;

            seller.profit += profit;
            // Увеличить общую накопленную прибыль (profit) у продавца  

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => {
        return b.profit - a.profit;
    });

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index, arr) => {
        seller.bonus = calculateBonusByProfit(index, arr.length, seller); // Считаем бонус
        seller.products_sold = Object.entries(seller.products_sold).map(([sku,quantity])=>{ return {sku,quantity}}).sort((a,b)=>{
            return b.quantity - a.quantity;
        }).slice(0,10);
    });
    console.log(sellerStats);
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +(seller.revenue.toFixed(2)),
        profit: +(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: seller.products_sold,
        bonus: +(seller.bonus.toFixed(2))
    })); 
    // @TODO: Подготовка итоговой коллекции с нужными полями
}